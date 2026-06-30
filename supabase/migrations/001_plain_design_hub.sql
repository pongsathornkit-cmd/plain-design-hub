create extension if not exists pgcrypto;

create table if not exists public.products (
  id text primary key,
  sku text not null unique,
  name text not null,
  category text not null check (category in ('metal', 'wood', 'aluminium')),
  ktw_price numeric(12, 2) not null default 0,
  order_quantity integer not null default 0 check (order_quantity >= 0),
  source_image_url text,
  source_url text,
  status text not null default 'not_started'
    check (status in ('not_started', 'designing', 'review', 'approved', 'factory_ready')),
  notes text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_assets (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  sku text not null,
  asset_group text not null
    check (asset_group in ('product_images', 'packaging_images', 'factory_files')),
  file_name text not null,
  file_path text not null unique,
  file_size bigint not null default 0,
  mime_type text not null default 'application/octet-stream',
  public_url text not null,
  uploaded_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit)
values ('design-assets', 'design-assets', true, 52428800)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

alter table public.products enable row level security;
alter table public.product_assets enable row level security;

drop policy if exists "anon can read products" on public.products;
create policy "anon can read products"
on public.products
for select
to anon
using (true);

drop policy if exists "anon can insert products" on public.products;
create policy "anon can insert products"
on public.products
for insert
to anon
with check (true);

drop policy if exists "anon can update products" on public.products;
create policy "anon can update products"
on public.products
for update
to anon
using (true)
with check (true);

drop policy if exists "anon can read product assets" on public.product_assets;
create policy "anon can read product assets"
on public.product_assets
for select
to anon
using (true);

drop policy if exists "anon can insert product assets" on public.product_assets;
create policy "anon can insert product assets"
on public.product_assets
for insert
to anon
with check (true);

drop policy if exists "anon can delete product assets" on public.product_assets;
create policy "anon can delete product assets"
on public.product_assets
for delete
to anon
using (true);

drop policy if exists "anon can read design assets" on storage.objects;
create policy "anon can read design assets"
on storage.objects
for select
to anon
using (bucket_id = 'design-assets');

drop policy if exists "anon can upload design assets" on storage.objects;
create policy "anon can upload design assets"
on storage.objects
for insert
to anon
with check (bucket_id = 'design-assets');

drop policy if exists "anon can update design assets" on storage.objects;
create policy "anon can update design assets"
on storage.objects
for update
to anon
using (bucket_id = 'design-assets')
with check (bucket_id = 'design-assets');

drop policy if exists "anon can delete design assets" on storage.objects;
create policy "anon can delete design assets"
on storage.objects
for delete
to anon
using (bucket_id = 'design-assets');

grant usage on schema public to anon;
grant select, insert, update on public.products to anon;
grant select, insert, delete on public.product_assets to anon;

insert into public.products
  (id, sku, name, category, ktw_price, order_quantity, source_image_url, source_url, status, notes, sort_order)
values
  ('P525-1310', 'P525-1310', 'ใบเลื่อยตัดเหล็ก 4” (105 MM) X 24T', 'metal', 203.36, 1000, 'https://shop.ktw.co.th:443/ktw/th/THB/medias/sys_master/SAP-L01/SAP-L01/hd9/h1b/10106866532382/-POLO-ACCESSORIES-P525-1310-1.jpg', 'https://shop.ktw.co.th/p/P525-1310', 'designing', 'เริ่มจากภาพสินค้า KTW แล้วเปลี่ยนแบรนด์/สีเป็น PLAIN', 1),
  ('P525-1320', 'P525-1320', 'ใบเลื่อยตัดเหล็ก 7” (185 MM) X 36T', 'metal', 546.12, 1500, 'https://shop.ktw.co.th:443/ktw/th/THB/medias/sys_master/SAP-L01/SAP-L01/hf7/h9a/10106861027358/-POLO-ACCESSORIES-P525-1320-1.jpg', 'https://shop.ktw.co.th/p/P525-1320', 'review', '', 2),
  ('P525-1330', 'P525-1330', 'ใบเลื่อยตัดเหล็ก 10”(254 MM) X 60T', 'metal', 1336.60, 1200, 'https://shop.ktw.co.th:443/ktw/th/THB/medias/sys_master/SAP-L01/SAP-L01/h6f/h3d/10106900414494/-POLO-ACCESSORIES-P525-1330-1.jpg', 'https://shop.ktw.co.th/p/P525-1330', 'not_started', 'รวมจำนวนจากหลายบรรทัดสั่งซื้อที่ใช้ SKU เดียวกัน', 3),
  ('P525-1340', 'P525-1340', 'ใบเลื่อยตัดเหล็ก 12”(305 MM) X 60T', 'metal', 1705.60, 500, 'https://shop.ktw.co.th:443/ktw/th/THB/medias/sys_master/SAP-L01/SAP-L01/h3b/h0b/10106855981086/-POLO-ACCESSORIES-P525-1340-1.jpg', 'https://shop.ktw.co.th/p/P525-1340', 'not_started', '', 4),
  ('P525-1520', 'P525-1520', 'CERMET-7 ใบเลื่อยวงเดือนตัดเหล็ก 7"X36T', 'metal', 394.42, 200, 'https://shop.ktw.co.th:443/ktw/th/THB/medias/sys_master/SAP-L01/SAP-L01/hd9/hb3/10106889863198/-POLO-ACCESSORIES-P525-1520-1.jpg', 'https://shop.ktw.co.th/p/P525-1520', 'not_started', '', 5),
  ('P525-1510', 'P525-1510', 'CERMET-4 ใบเลื่อยวงเดือนตัดเหล็ก 4"X24T', 'metal', 170.56, 200, 'https://shop.ktw.co.th:443/ktw/th/THB/medias/sys_master/SAP-L01/SAP-L01/h96/h7a/10106875707422/-POLO-ACCESSORIES-P525-1510-1.jpg', 'https://shop.ktw.co.th/p/P525-1510', 'not_started', '', 6),
  ('P525-1540', 'P525-1540', 'CERMET-12ใบเลื่อยวงเดือนตัดเหล็ก 12"X60T', 'metal', 1230.00, 200, 'https://shop.ktw.co.th:443/ktw/th/THB/medias/sys_master/SAP-L01/SAP-L01/h20/h8e/10106901331998/-POLO-ACCESSORIES-P525-1540-1.jpg', 'https://shop.ktw.co.th/p/P525-1540', 'not_started', '', 7),
  ('P525-1530', 'P525-1530', 'CERMET-10 ใบเลื่อยวงเดือนตัดเหล็ก10"X60T', 'metal', 959.40, 200, 'https://shop.ktw.co.th:443/ktw/th/THB/medias/sys_master/SAP-L01/SAP-L01/h14/haa/10106879377438/-POLO-ACCESSORIES-P525-1530-1.jpg', 'https://shop.ktw.co.th/p/P525-1530', 'not_started', '', 8),
  ('P525-1550', 'P525-1550', 'CERMET-14ใบเลื่อยวงเดือนตัดเหล็ก 14"X66T', 'metal', 1426.80, 200, 'https://shop.ktw.co.th/medias/sys_master/SAP-ZL1/SAP-ZL1/h0c/h84/10066088689694/-POLO-P525-1550-Nprice.jpg', 'https://shop.ktw.co.th/p/P525-1550', 'not_started', '', 9),
  ('P525-1040', 'P525-1040', 'ใบเลื่อยวงเดือน 7" (184 MM) X 24T', 'wood', 220.58, 1200, 'https://shop.ktw.co.th:443/ktw/th/THB/medias/sys_master/SAP-L01/SAP-L01/he4/hdb/10106853228574/-POLO-ACCESSORIES-P525-1040-1.jpg', 'https://shop.ktw.co.th/p/P525-1040', 'approved', 'รวมจำนวนจากรายการเดิม 1,000 และรายการเพิ่ม 200', 10),
  ('P525-1060', 'P525-1060', 'ใบเลื่อยวงเดือน 7" (184 MM) X 40T', 'wood', 252.56, 1200, 'https://shop.ktw.co.th:443/ktw/th/THB/medias/sys_master/SAP-L01/SAP-L01/h48/h51/10106893074462/-POLO-ACCESSORIES-P525-1060-1.jpg', 'https://shop.ktw.co.th/p/P525-1060', 'factory_ready', '', 11),
  ('P525-1030', 'P525-1030', 'ใบเลื่อยวงเดือน 4” (110 MM) X 40T', 'wood', 145.14, 200, 'https://shop.ktw.co.th:443/ktw/th/THB/medias/sys_master/SAP-L01/SAP-L01/h6e/h36/10106870202398/-POLO-ACCESSORIES-P525-1030-1.jpg', 'https://shop.ktw.co.th/p/P525-1030', 'not_started', '', 12),
  ('P525-1050', 'P525-1050', 'ใบเลื่อยวงเดือน 7" (184 MM) X 30T', 'wood', 233.70, 200, 'https://shop.ktw.co.th:443/ktw/th/THB/medias/sys_master/SAP-L01/SAP-L01/h06/h26/10106848182302/-POLO-ACCESSORIES-P525-1050-1.jpg', 'https://shop.ktw.co.th/p/P525-1050', 'not_started', '', 13),
  ('P525-1070', 'P525-1070', 'ใบเลื่อยวงเดือน 7" (184 MM) X 60T', 'wood', 279.62, 200, 'https://shop.ktw.co.th:443/ktw/th/THB/medias/sys_master/SAP-L01/SAP-L01/h23/h74/10106899955742/-POLO-ACCESSORIES-P525-1070-1.jpg', 'https://shop.ktw.co.th/p/P525-1070', 'not_started', '', 14),
  ('P525-1080', 'P525-1080', 'ใบเลื่อยวงเดือน 9" (230 MM) X 24T', 'wood', 363.26, 200, 'https://shop.ktw.co.th:443/ktw/th/THB/medias/sys_master/SAP-L01/SAP-L01/hd4/hdb/10106873872414/-POLO-ACCESSORIES-P525-1080-1.jpg', 'https://shop.ktw.co.th/p/P525-1080', 'not_started', '', 15),
  ('P525-1010', 'P525-1010', 'ใบเลื่อยวงเดือน 4” (110 MM) X 24T', 'wood', 119.72, 200, 'https://shop.ktw.co.th:443/ktw/th/THB/medias/sys_master/SAP-L01/SAP-L01/he7/h12/10106806698014/-POLO-ACCESSORIES-P525-1010-1.jpg', 'https://shop.ktw.co.th/p/P525-1010', 'not_started', '', 16),
  ('P525-1120', 'P525-1120', 'ใบเลื่อยวงเดือน 10" (250 MM) X 30T', 'wood', 425.58, 200, 'https://shop.ktw.co.th:443/ktw/th/THB/medias/sys_master/SAP-L01/SAP-L01/h10/hcf/10108501131294/-POLO-ACCESSORIES-P525-1120-1.jpg', 'https://shop.ktw.co.th/p/P525-1120', 'not_started', '', 17),
  ('P525-1110', 'P525-1110', 'ใบเลื่อยวงเดือน 10" (250 MM) X 24T', 'wood', 414.10, 200, 'https://shop.ktw.co.th:443/ktw/th/THB/medias/sys_master/SAP-L01/SAP-L01/h24/h45/10108503883806/-POLO-ACCESSORIES-P525-1110-1.jpg', 'https://shop.ktw.co.th/p/P525-1110', 'not_started', '', 18),
  ('P525-1090', 'P525-1090', 'ใบเลื่อยวงเดือน 9" (230 MM) X 30T', 'wood', 378.84, 200, 'https://shop.ktw.co.th:443/ktw/th/THB/medias/sys_master/SAP-L01/SAP-L01/h5e/h00/10106865614878/-POLO-ACCESSORIES-P525-1090-1.jpg', 'https://shop.ktw.co.th/p/P525-1090', 'not_started', '', 19),
  ('P525-1020', 'P525-1020', 'ใบเลื่อยวงเดือน 4” (110 MM) X 30T', 'wood', 126.28, 200, 'https://shop.ktw.co.th:443/ktw/th/THB/medias/sys_master/SAP-L01/SAP-L01/h31/h05/10106787201054/-POLO-ACCESSORIES-P525-1020-1.jpg', 'https://shop.ktw.co.th/p/P525-1020', 'not_started', '', 20),
  ('P525-1130', 'P525-1130', 'ใบเลื่อยวงเดือน 10" (250 MM) X 40T', 'wood', 449.36, 200, 'https://shop.ktw.co.th:443/ktw/th/THB/medias/sys_master/SAP-L01/SAP-L01/hf9/h60/10106747125790/-POLO-ACCESSORIES-P525-1130-1.jpg', 'https://shop.ktw.co.th/p/P525-1130', 'not_started', '', 21),
  ('P525-1220', 'P525-1220', 'ใบเลื่อยตัดอลูมีเนียม 10" X 120T', 'aluminium', 819.18, 200, 'https://shop.ktw.co.th:443/ktw/th/THB/medias/sys_master/SAP-L01/SAP-L01/h79/h6c/10106857816094/-POLO-ACCESSORIES-P525-1220-1.jpg', 'https://shop.ktw.co.th/p/P525-1220', 'not_started', '', 22),
  ('P525-1210', 'P525-1210', 'ใบเลื่อยตัดอลูมีเนียม 10" X 100T', 'aluminium', 770.80, 200, 'https://shop.ktw.co.th:443/ktw/th/THB/medias/sys_master/SAP-L01/SAP-L01/h2e/had/10106870661150/-POLO-ACCESSORIES-P525-1210-1.jpg', 'https://shop.ktw.co.th/p/P525-1210', 'not_started', '', 23)
on conflict (sku) do update
set name = excluded.name,
    category = excluded.category,
    ktw_price = excluded.ktw_price,
    order_quantity = excluded.order_quantity,
    source_image_url = excluded.source_image_url,
    source_url = excluded.source_url,
    sort_order = excluded.sort_order;
