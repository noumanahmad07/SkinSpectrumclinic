-- POS page backend setup for Skin Spectrum
-- Run this AFTER:
-- 1) supabase/migrations/202606130001_initial_schema.sql
-- 2) supabase/seed.sql
-- 3) supabase/login_backend_setup.sql
-- 4) supabase/clients_backend_setup.sql

alter table public.invoice_items
  add column if not exists product_id uuid references public.products(id) on delete set null;

alter table public.invoice_items
  add column if not exists discount numeric(5, 2) not null default 0;

grant select, insert, update, delete on public.invoices to authenticated;
grant select, insert, update, delete on public.invoice_items to authenticated;

create index if not exists invoices_status_idx on public.invoices (status);
create index if not exists invoices_payment_method_idx on public.invoices (payment_method);
create index if not exists invoice_items_product_id_idx on public.invoice_items (product_id);

create or replace view public.pos_products
with (security_invoker = true)
as
select
  id,
  code,
  name,
  category,
  sell_price as price,
  stock,
  min_stock,
  unit,
  expiry,
  status,
  image
from public.products
order by category asc, name asc;

create or replace view public.pos_clients
with (security_invoker = true)
as
select
  id,
  name,
  phone,
  total_spent,
  last_visit,
  appointment_date,
  appointment_time
from public.clients
order by name asc;

create or replace view public.pos_recent_sales
with (security_invoker = true)
as
select
  inv.id,
  inv.client_name,
  inv.invoice_date,
  inv.total,
  inv.status,
  inv.payment_method,
  inv.created_at
from public.invoices inv
order by inv.created_at desc
limit 20;

create or replace function public.decrease_product_stock(
  product_id uuid,
  quantity_sold integer
)
returns void
language plpgsql
security invoker
as $$
begin
  if product_id is null or quantity_sold is null or quantity_sold <= 0 then
    return;
  end if;

  update public.products
  set stock = greatest(stock - quantity_sold, 0)
  where id = product_id
    and unit <> 'Service';
end;
$$;

notify pgrst, 'reload schema';
