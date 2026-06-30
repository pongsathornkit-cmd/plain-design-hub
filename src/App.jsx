import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Box,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  ExternalLink,
  Factory,
  FileArchive,
  FileImage,
  Filter,
  ImagePlus,
  Layers3,
  Loader2,
  PackageOpen,
  PencilRuler,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { ASSET_GROUPS, CATEGORY_OPTIONS, STATUS_OPTIONS } from "./data/products";
import { isSupabaseConfigured } from "./lib/supabaseClient";
import { deleteAsset, loadProducts, updateProduct, uploadProductFiles } from "./services/designRepository";

const statusById = Object.fromEntries(STATUS_OPTIONS.map((status) => [status.id, status]));
const categoryById = Object.fromEntries(CATEGORY_OPTIONS.map((category) => [category.id, category]));

function formatCurrency(value) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatNumber(value) {
  return new Intl.NumberFormat("th-TH").format(value || 0);
}

function formatFileSize(value) {
  if (!value) return "0 KB";
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(asset) {
  return asset.mimeType?.startsWith("image/");
}

function getAssets(product, groupId) {
  return (product?.assets || []).filter((asset) => asset.group === groupId);
}

function getCompletion(product) {
  const completed = ASSET_GROUPS.filter((group) => getAssets(product, group.id).length > 0).length;
  return {
    completed,
    total: ASSET_GROUPS.length,
    percent: Math.round((completed / ASSET_GROUPS.length) * 100),
  };
}

function App() {
  const [products, setProducts] = useState([]);
  const [selectedSku, setSelectedSku] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refreshProducts(nextSku = selectedSku) {
    setLoading(true);
    setError("");
    try {
      const loaded = await loadProducts();
      setProducts(loaded);
      setSelectedSku(nextSku || loaded[0]?.sku || "");
    } catch (loadError) {
      setError(loadError.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshProducts("");
  }, []);

  const selectedProduct = useMemo(
    () => products.find((product) => product.sku === selectedSku) || products[0],
    [products, selectedSku],
  );

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((product) => {
      const text = `${product.sku} ${product.name}`.toLowerCase();
      const matchesQuery = !normalized || text.includes(normalized);
      const matchesCategory = category === "all" || product.category === category;
      const matchesStatus = status === "all" || product.status === status;
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [category, products, query, status]);

  const stats = useMemo(() => {
    const totalQuantity = products.reduce((sum, product) => sum + product.orderQuantity, 0);
    const totalValue = products.reduce((sum, product) => sum + product.orderQuantity * product.ktwPrice, 0);
    const factoryReady = products.filter((product) => product.status === "factory_ready").length;
    const missingFiles = products.filter((product) => getCompletion(product).completed < ASSET_GROUPS.length).length;
    return { totalQuantity, totalValue, factoryReady, missingFiles };
  }, [products]);

  async function updateSelectedProduct(updates) {
    if (!selectedProduct) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updateProduct(selectedProduct.id, updates);
      setProducts((current) =>
        current.map((product) =>
          product.id === selectedProduct.id ? { ...product, ...updates, updatedAt: updated.updatedAt } : product,
        ),
      );
      setMessage("บันทึกแล้ว");
    } catch (updateError) {
      setError(updateError.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
      window.setTimeout(() => setMessage(""), 1600);
    }
  }

  async function handleFiles(product, groupId, files) {
    if (!product || !files?.length) return;
    setSaving(true);
    setError("");
    try {
      const uploaded = await uploadProductFiles(product, groupId, files);
      setProducts((current) =>
        current.map((item) =>
          item.id === product.id ? { ...item, assets: [...uploaded, ...(item.assets || [])] } : item,
        ),
      );
      setMessage(`อัปโหลด ${uploaded.length} ไฟล์แล้ว`);
    } catch (uploadError) {
      setError(uploadError.message || "อัปโหลดไม่สำเร็จ");
    } finally {
      setSaving(false);
      window.setTimeout(() => setMessage(""), 1800);
    }
  }

  async function handleDeleteAsset(asset) {
    setSaving(true);
    setError("");
    try {
      await deleteAsset(asset);
      setProducts((current) =>
        current.map((product) => ({
          ...product,
          assets: (product.assets || []).filter((item) => item.id !== asset.id),
        })),
      );
      setMessage("ลบไฟล์แล้ว");
    } catch (deleteError) {
      setError(deleteError.message || "ลบไฟล์ไม่สำเร็จ");
    } finally {
      setSaving(false);
      window.setTimeout(() => setMessage(""), 1600);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">P</div>
          <div>
            <strong>PLAIN</strong>
            <span>Design Hub</span>
          </div>
        </div>
        <nav className="side-nav" aria-label="เมนูหลัก">
          <a className="active" href="#products">
            <ClipboardList size={18} />
            รายการสินค้า
          </a>
          <a href="#design">
            <PencilRuler size={18} />
            งานออกแบบ
          </a>
          <a href="#factory">
            <Factory size={18} />
            ไฟล์โรงงาน
          </a>
          <a href="#summary">
            <Layers3 size={18} />
            สรุปสถานะ
          </a>
        </nav>
        <div className="source-note">
          <span>แหล่งข้อมูล</span>
          <strong>KTW SKU + ราคา + รูปสินค้า</strong>
          <p>จำนวนสั่งซื้อรวม SKU ซ้ำแล้ว เพื่อให้ออกแบบหนึ่งครั้งต่อสินค้า</p>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <h1>งานรีดีไซน์สินค้า PLAIN</h1>
            <p>ติดตามสถานะ อัปโหลดไฟล์ออกแบบ และรวมชุดไฟล์พร้อมส่งโรงงาน</p>
          </div>
          <div className="topbar-actions">
            <button className="ghost-button" type="button" onClick={() => refreshProducts()}>
              <RefreshCw size={17} />
              รีเฟรช
            </button>
            <button className="primary-button" type="button">
              <Plus size={17} />
              เพิ่มสินค้า
            </button>
          </div>
        </header>

        {!isSupabaseConfigured && (
          <div className="mode-banner">
            <Archive size={18} />
            ตอนนี้เป็นโหมด Demo ในเครื่อง หากต้องการบันทึกจริงให้นำ SQL ใน `supabase/migrations` ไปรัน แล้วใส่ Supabase URL/Key ใน `.env`
          </div>
        )}

        {(message || error) && (
          <div className={error ? "toast error" : "toast"}>
            {error ? error : message}
          </div>
        )}

        <section className="stats-grid" id="summary">
          <StatCard icon={PackageOpen} label="SKU ที่ต้องออกแบบ" value={`${products.length} รายการ`} />
          <StatCard icon={Box} label="จำนวนสั่งซื้อรวม" value={`${formatNumber(stats.totalQuantity)} ใบ`} />
          <StatCard icon={CheckCircle2} label="พร้อมส่งโรงงาน" value={`${stats.factoryReady} SKU`} />
          <StatCard icon={FileArchive} label="ยังขาดไฟล์บางส่วน" value={`${stats.missingFiles} SKU`} />
          <StatCard icon={ClipboardList} label="มูลค่าตามราคา KTW" value={formatCurrency(stats.totalValue)} wide />
        </section>

        <section className="controls" id="products">
          <label className="search-box">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหา SKU หรือชื่อสินค้า"
            />
          </label>
          <FilterSelect icon={Filter} label="หมวด" value={category} onChange={setCategory}>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect icon={ChevronDown} label="สถานะ" value={status} onChange={setStatus}>
            <option value="all">ทุกสถานะ</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </FilterSelect>
        </section>

        <section className="main-grid">
          <div className="product-panel">
            <div className="section-heading">
              <div>
                <h2>รายการสินค้า</h2>
                <span>{filteredProducts.length} จาก {products.length} SKU</span>
              </div>
              {loading && <Loader2 className="spin" size={20} />}
            </div>
            <ProductTable
              products={filteredProducts}
              selectedSku={selectedProduct?.sku}
              onSelect={setSelectedSku}
            />
          </div>

          <DetailPanel
            product={selectedProduct}
            saving={saving}
            onStatusChange={(nextStatus) => updateSelectedProduct({ status: nextStatus })}
            onNotesChange={(notes) => updateSelectedProduct({ notes })}
            onFiles={handleFiles}
            onDeleteAsset={handleDeleteAsset}
          />
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, wide = false }) {
  return (
    <article className={wide ? "stat-card wide" : "stat-card"}>
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function FilterSelect({ icon: Icon, label, value, onChange, children }) {
  return (
    <label className="filter-select">
      <Icon size={16} />
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

function ProductTable({ products, selectedSku, onSelect }) {
  if (!products.length) {
    return (
      <div className="empty-state">
        <Search size={28} />
        <p>ไม่พบสินค้าที่ตรงกับตัวกรอง</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="product-table">
        <thead>
          <tr>
            <th>สินค้า</th>
            <th>ราคา KTW</th>
            <th>จำนวนสั่งซื้อ</th>
            <th>สถานะ</th>
            <th>ไฟล์</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const completion = getCompletion(product);
            return (
              <tr
                className={product.sku === selectedSku ? "selected" : ""}
                key={product.sku}
                onClick={() => onSelect(product.sku)}
              >
                <td>
                  <div className="product-cell">
                    <img src={product.sourceImageUrl} alt={product.name} loading="lazy" />
                    <div>
                      <strong>{product.sku}</strong>
                      <span>{product.name}</span>
                      <em>{categoryById[product.category]?.label}</em>
                    </div>
                  </div>
                </td>
                <td>{formatCurrency(product.ktwPrice)}</td>
                <td>{formatNumber(product.orderQuantity)} ใบ</td>
                <td><StatusBadge status={product.status} /></td>
                <td>
                  <div className="completion">
                    <span style={{ width: `${completion.percent}%` }} />
                  </div>
                  <small>{completion.completed}/{completion.total}</small>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }) {
  const meta = statusById[status] || statusById.not_started;
  return <span className={`status-badge ${meta.tone}`}>{meta.label}</span>;
}

function DetailPanel({ product, saving, onStatusChange, onNotesChange, onFiles, onDeleteAsset }) {
  const [draftNotes, setDraftNotes] = useState(product?.notes || "");

  useEffect(() => {
    setDraftNotes(product?.notes || "");
  }, [product?.id, product?.notes]);

  if (!product) {
    return (
      <aside className="detail-panel empty-detail">
        <PackageOpen size={34} />
        <p>เลือกสินค้าเพื่อดูรายละเอียดงานออกแบบ</p>
      </aside>
    );
  }

  return (
    <aside className="detail-panel" id="design">
      <div className="detail-header">
        <div>
          <span>{product.sku}</span>
          <h2>{product.name}</h2>
        </div>
        {saving && <Loader2 className="spin" size={19} />}
      </div>

      <div className="source-card">
        <img src={product.sourceImageUrl} alt={product.name} />
        <div>
          <span>ราคา KTW</span>
          <strong>{formatCurrency(product.ktwPrice)}</strong>
          <small>จำนวนสั่งซื้อ {formatNumber(product.orderQuantity)} ใบ</small>
          <a href={product.sourceUrl} target="_blank" rel="noreferrer">
            เปิดหน้า KTW
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      <label className="field">
        <span>สถานะงาน</span>
        <select value={product.status} onChange={(event) => onStatusChange(event.target.value)}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>หมายเหตุสำหรับทีม/โรงงาน</span>
        <textarea
          value={draftNotes}
          onChange={(event) => setDraftNotes(event.target.value)}
          rows={4}
          placeholder="เช่น สีที่ต้องใช้ จุดที่ต้องเปลี่ยน ขนาดกล่อง หรือข้อควรระวัง"
        />
      </label>
      <button className="ghost-button save-note" type="button" onClick={() => onNotesChange(draftNotes)}>
        บันทึกหมายเหตุ
      </button>

      <div className="upload-stack" id="factory">
        {ASSET_GROUPS.map((group) => (
          <UploadGroup
            key={group.id}
            group={group}
            product={product}
            assets={getAssets(product, group.id)}
            onFiles={(files) => onFiles(product, group.id, files)}
            onDeleteAsset={onDeleteAsset}
          />
        ))}
      </div>
    </aside>
  );
}

function UploadGroup({ group, assets, onFiles, onDeleteAsset }) {
  const inputId = `${group.id}-input`;

  return (
    <section className="upload-group">
      <div className="upload-title">
        <div>
          <strong>{group.label}</strong>
          <span>{group.description}</span>
        </div>
        <label className="mini-upload" htmlFor={inputId}>
          <ImagePlus size={15} />
          เพิ่มไฟล์
        </label>
      </div>

      <label className="drop-zone" htmlFor={inputId}>
        <UploadCloud size={22} />
        <span>ลากไฟล์มาวาง หรือเลือกหลายไฟล์</span>
        <small>{assets.length ? `${assets.length} ไฟล์แล้ว` : "ยังไม่มีไฟล์"}</small>
      </label>
      <input
        id={inputId}
        type="file"
        multiple
        accept={group.accept}
        onChange={(event) => {
          onFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {!!assets.length && (
        <div className="asset-list">
          {assets.map((asset) => (
            <div className="asset-chip" key={asset.id}>
              {isImage(asset) ? (
                <img src={asset.publicUrl} alt={asset.fileName} />
              ) : (
                <span className="file-icon"><FileImage size={17} /></span>
              )}
              <div>
                <a href={asset.publicUrl} target="_blank" rel="noreferrer">{asset.fileName}</a>
                <small>{formatFileSize(asset.fileSize)}</small>
              </div>
              <button type="button" onClick={() => onDeleteAsset(asset)} aria-label={`ลบ ${asset.fileName}`}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default App;
