-- Inventory page backend setup for Skin Spectrum
-- Run this AFTER:
-- 1) supabase/migrations/202606130001_initial_schema.sql
-- 2) supabase/seed.sql
-- 3) supabase/login_backend_setup.sql
-- 4) supabase/clients_backend_setup.sql
-- 5) supabase/pos_backend_setup.sql
-- 6) supabase/billing_backend_setup.sql

alter table public.products
  add column if not exists code text,
  add column if not exists name text not null default '',
  add column if not exists category text not null default 'General',
  add column if not exists description text not null default '',
  add column if not exists cost_price numeric(12, 2) not null default 0,
  add column if not exists sell_price numeric(12, 2) not null default 0,
  add column if not exists stock integer not null default 0,
  add column if not exists min_stock integer not null default 10,
  add column if not exists unit text not null default 'Bottle',
  add column if not exists expiry date,
  add column if not exists status public.record_status not null default 'Active',
  add column if not exists image text not null default '';

do $$
begin
  alter table public.products
    add constraint products_price_valid_check
    check (cost_price <= sell_price);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.products
    add constraint products_expiry_not_past_check
    check (expiry is null or expiry >= current_date);
exception
  when duplicate_object then null;
end $$;

update public.products
set code = 'SKU-' || lpad(row_number_text.row_number_value, 3, '0')
from (
  select id, row_number() over (order by created_at, id)::text as row_number_value
  from public.products
  where code is null or code = ''
) as row_number_text
where public.products.id = row_number_text.id;

create unique index if not exists products_code_unique_idx on public.products (code);
create index if not exists products_name_idx on public.products (lower(name));
create index if not exists products_status_idx on public.products (status);
create index if not exists products_expiry_idx on public.products (expiry);
create index if not exists products_created_at_idx on public.products (created_at desc);

alter table public.products enable row level security;

drop policy if exists "authenticated staff can manage products" on public.products;
drop policy if exists "inventory can read products" on public.products;
drop policy if exists "inventory can insert products" on public.products;
drop policy if exists "inventory can update products" on public.products;
drop policy if exists "inventory can delete products" on public.products;

create policy "inventory can read products" on public.products
  for select to anon, authenticated
  using (true);

create policy "inventory can insert products" on public.products
  for insert to anon, authenticated
  with check (true);

create policy "inventory can update products" on public.products
  for update to anon, authenticated
  using (true)
  with check (true);

create policy "inventory can delete products" on public.products
  for delete to anon, authenticated
  using (true);

create or replace view public.inventory_products
with (security_invoker = true)
as
select
  id,
  code,
  name,
  category,
  description,
  cost_price,
  sell_price,
  stock,
  min_stock,
  unit,
  expiry,
  status,
  image,
  created_at,
  updated_at,
  case
    when unit = 'Service' or min_stock >= 999 then 'Available'
    when stock <= 0 then 'Out of Stock'
    when stock <= min_stock then 'Low Stock'
    else 'In Stock'
  end as stock_status,
  case
    when expiry is null then 'No Expiry'
    when expiry < current_date then 'Expired'
    when expiry <= current_date + 60 then 'Near Expiry'
    else 'Valid'
  end as expiry_status
from public.products
order by created_at desc;

create or replace view public.inventory_alerts
with (security_invoker = true)
as
select *
from public.inventory_products
where stock_status in ('Out of Stock', 'Low Stock')
   or expiry_status in ('Expired', 'Near Expiry')
order by
  case
    when stock_status = 'Out of Stock' then 1
    when expiry_status = 'Expired' then 2
    when stock_status = 'Low Stock' then 3
    when expiry_status = 'Near Expiry' then 4
    else 5
  end,
  name asc;
