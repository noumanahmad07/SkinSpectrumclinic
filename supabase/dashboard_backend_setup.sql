-- Dashboard backend setup for Skin Spectrum
-- Run this AFTER:
-- 1) supabase/migrations/202606130001_initial_schema.sql
-- 2) supabase/seed.sql
-- 3) supabase/login_backend_setup.sql

create or replace view public.dashboard_summary
with (security_invoker = true)
as
select
  coalesce((select sum(total) from public.invoices where invoice_date = current_date), 0)::numeric(12, 2) as today_revenue,
  coalesce((select count(*) from public.clients), 0)::integer as total_clients,
  coalesce((select count(*) from public.invoices where status = 'Credit'), 0)::integer as pending_invoices,
  coalesce((select sum(coalesce(credit_amount, 0)) from public.invoices where status = 'Credit'), 0)::numeric(12, 2) as pending_invoice_amount,
  coalesce((
    select sum(ii.quantity)
    from public.invoice_items ii
    join public.invoices inv on inv.id = ii.invoice_id
    where inv.invoice_date = current_date
  ), 0)::integer as products_sold,
  coalesce((select count(*) from public.products where stock <= min_stock), 0)::integer as stock_alerts,
  coalesce((select count(*) from public.clients where appointment_date = current_date), 0)::integer as appointments_today;

create or replace view public.dashboard_revenue_trend
with (security_invoker = true)
as
select
  to_char(days.day, 'Dy') as day,
  days.day as revenue_date,
  coalesce(sum(inv.total), 0)::numeric(12, 2) as revenue
from generate_series(current_date - interval '6 days', current_date, interval '1 day') as days(day)
left join public.invoices inv on inv.invoice_date = days.day::date
group by days.day
order by days.day;

create or replace view public.dashboard_top_products
with (security_invoker = true)
as
with product_totals as (
  select
    ii.name,
    sum(ii.quantity)::integer as units
  from public.invoice_items ii
  join public.invoices inv on inv.id = ii.invoice_id
  where inv.invoice_date >= current_date - interval '30 days'
  group by ii.name
),
grand_total as (
  select nullif(sum(units), 0) as total_units from product_totals
)
select
  product_totals.name,
  product_totals.units,
  round((product_totals.units::numeric / grand_total.total_units::numeric) * 100, 1) as value
from product_totals
cross join grand_total
order by product_totals.units desc
limit 5;

create or replace view public.dashboard_recent_invoices
with (security_invoker = true)
as
select
  id,
  client_name as client,
  invoice_date as date,
  amount,
  status
from public.invoices
order by invoice_date desc, created_at desc
limit 5;

create or replace view public.dashboard_low_stock
with (security_invoker = true)
as
select
  name as product,
  stock as current,
  min_stock as minimum,
  category
from public.products
where stock <= min_stock
order by stock asc, name asc
limit 8;

create or replace view public.dashboard_today_appointments
with (security_invoker = true)
as
select
  id,
  name,
  phone,
  email,
  skin_type,
  total_spent,
  concerns,
  allergies,
  notes,
  follow_up_days,
  follow_up_date,
  appointment_date,
  appointment_time
from public.clients
where appointment_date = current_date
order by appointment_time asc nulls last;

create or replace view public.dashboard_upcoming_appointments
with (security_invoker = true)
as
select
  id,
  name,
  phone,
  email,
  skin_type,
  total_spent,
  concerns,
  allergies,
  notes,
  follow_up_days,
  follow_up_date,
  appointment_date,
  appointment_time
from public.clients
where appointment_date is not null
  and appointment_time is not null
  and (appointment_date + appointment_time) between now() and now() + interval '1 hour'
order by appointment_date asc, appointment_time asc;

create or replace view public.dashboard_due_followups
with (security_invoker = true)
as
select
  id,
  name,
  phone,
  email,
  skin_type,
  total_spent,
  concerns,
  allergies,
  notes,
  follow_up_days,
  follow_up_date,
  appointment_date,
  appointment_time
from public.clients
where follow_up_date between current_date and current_date + interval '1 day'
order by follow_up_date asc;
