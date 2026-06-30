import { STORAGE_BUCKET, isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { createInitialProducts, seedProducts } from "../data/products";

const LOCAL_PRODUCTS_KEY = "plain-design-hub-products-v1";
const LOCAL_ASSETS_KEY = "plain-design-hub-assets-v1";

function readLocal(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function safeFileName(fileName) {
  return fileName
    .normalize("NFKD")
    .replace(/[^\w.\-\u0E00-\u0E7F]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function dbProductToApp(row, assets = []) {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    category: row.category,
    ktwPrice: Number(row.ktw_price || 0),
    orderQuantity: Number(row.order_quantity || 0),
    sourceImageUrl: row.source_image_url,
    sourceUrl: row.source_url,
    status: row.status,
    notes: row.notes || "",
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
    assets,
  };
}

function dbAssetToApp(row) {
  return {
    id: row.id,
    productId: row.product_id,
    sku: row.sku,
    group: row.asset_group,
    fileName: row.file_name,
    filePath: row.file_path,
    fileSize: Number(row.file_size || 0),
    mimeType: row.mime_type || "application/octet-stream",
    publicUrl: row.public_url,
    uploadedAt: row.uploaded_at,
  };
}

function seedToDbProduct(product, index) {
  return {
    id: product.sku,
    sku: product.sku,
    name: product.name,
    category: product.category,
    ktw_price: product.ktwPrice,
    order_quantity: product.orderQuantity,
    source_image_url: product.sourceImageUrl,
    source_url: product.sourceUrl,
    status: product.status,
    notes: product.notes || "",
    sort_order: index + 1,
  };
}

async function ensureSupabaseSeeded() {
  const { count, error } = await supabase.from("products").select("id", { count: "exact", head: true });
  if (error) throw error;
  if (count && count > 0) return;

  const { error: upsertError } = await supabase
    .from("products")
    .upsert(seedProducts.map(seedToDbProduct), { onConflict: "sku" });
  if (upsertError) throw upsertError;
}

export async function loadProducts() {
  if (!isSupabaseConfigured) {
    const storedProducts = readLocal(LOCAL_PRODUCTS_KEY, []);
    const products = Array.isArray(storedProducts) && storedProducts.length ? storedProducts : createInitialProducts();
    const assets = readLocal(LOCAL_ASSETS_KEY, []);
    return products.map((product) => ({
      ...product,
      assets: assets.filter((asset) => asset.sku === product.sku),
    }));
  }

  await ensureSupabaseSeeded();

  const [{ data: productRows, error: productError }, { data: assetRows, error: assetError }] = await Promise.all([
    supabase.from("products").select("*").order("sort_order", { ascending: true }),
    supabase.from("product_assets").select("*").order("uploaded_at", { ascending: false }),
  ]);

  if (productError) throw productError;
  if (assetError) throw assetError;

  const assets = (assetRows || []).map(dbAssetToApp);
  return (productRows || []).map((row) =>
    dbProductToApp(
      row,
      assets.filter((asset) => asset.productId === row.id),
    ),
  );
}

export async function updateProduct(productId, updates) {
  const now = new Date().toISOString();

  if (!isSupabaseConfigured) {
    const products = readLocal(LOCAL_PRODUCTS_KEY, createInitialProducts());
    const nextProducts = products.map((product) =>
      product.id === productId ? { ...product, ...updates, updatedAt: now } : product,
    );
    writeLocal(LOCAL_PRODUCTS_KEY, nextProducts);
    return nextProducts.find((product) => product.id === productId);
  }

  const payload = {};
  if (updates.status) payload.status = updates.status;
  if (Object.prototype.hasOwnProperty.call(updates, "notes")) payload.notes = updates.notes;

  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", productId)
    .select("*")
    .single();

  if (error) throw error;
  return dbProductToApp(data);
}

export async function uploadProductFiles(product, assetGroup, files) {
  const fileList = Array.from(files || []);
  if (!fileList.length) return [];

  if (!isSupabaseConfigured) {
    const assets = readLocal(LOCAL_ASSETS_KEY, []);
    const created = fileList.map((file) => ({
      id: crypto.randomUUID(),
      productId: product.id,
      sku: product.sku,
      group: assetGroup,
      fileName: file.name,
      filePath: `local-demo/${product.sku}/${assetGroup}/${file.name}`,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      publicUrl: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
    }));
    writeLocal(LOCAL_ASSETS_KEY, [...created, ...assets]);
    return created;
  }

  const uploaded = [];

  for (const file of fileList) {
    const timestamp = Date.now();
    const cleanName = safeFileName(file.name) || `file-${timestamp}`;
    const filePath = `${product.sku}/${assetGroup}/${timestamp}-${cleanName}`;
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

    const { data, error: insertError } = await supabase
      .from("product_assets")
      .insert({
        product_id: product.id,
        sku: product.sku,
        asset_group: assetGroup,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type || "application/octet-stream",
        public_url: publicData.publicUrl,
      })
      .select("*")
      .single();

    if (insertError) throw insertError;
    uploaded.push(dbAssetToApp(data));
  }

  return uploaded;
}

export async function deleteAsset(asset) {
  if (!isSupabaseConfigured) {
    const assets = readLocal(LOCAL_ASSETS_KEY, []);
    writeLocal(
      LOCAL_ASSETS_KEY,
      assets.filter((item) => item.id !== asset.id),
    );
    return;
  }

  const { error: storageError } = await supabase.storage.from(STORAGE_BUCKET).remove([asset.filePath]);
  if (storageError) throw storageError;

  const { error: tableError } = await supabase.from("product_assets").delete().eq("id", asset.id);
  if (tableError) throw tableError;
}
