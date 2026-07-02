-- Fix Reports page load errors
-- Run this FULL file in Supabase Dashboard -> SQL Editor
-- (Same as reports_backend_setup.sql with security_invoker = true + grants)

alter table public.invoice_items
  add column if not exists product_id uuid references public.products(id) on delete set null;

create or replace view public.reports_summary
with (security_invoker = true)
as
select
  coalesce(sum(total), 0)::numeric(12, 2) as total_revenue,
  count(*)::integer as transactions,
  coalesce((select count(*) from public.clients where created_at >= date_trunc('month', current_date)), 0)::integer as new_clients,
  case
    when count(*) = 0 then 0
    else round((coalesce(sum(total), 0) / count(*))::numeric, 2)
  end as avg_order
from public.invoices
where invoice_date >= current_date - interval '30 days';

create or replace view public.reports_revenue_today
with (security_invoker = true)
as
select
  to_char(hours.hour_value, 'HH12 AM') as date,
  coalesce(sum(inv.total), 0)::numeric(12, 2) as revenue
from generate_series(
  date_trunc('day', now()) + interval '9 hours',
  date_trunc('day', now()) + interval '19 hours',
  interval '2 hours'
) as hours(hour_value)
left join public.invoices inv
  on inv.created_at >= hours.hour_value
 and inv.created_at < hours.hour_value + interval '2 hours'
 and inv.invoice_date = current_date
group by hours.hour_value
order by hours.hour_value;

create or replace view public.reports_revenue_week
with (security_invoker = true)
as
select
  to_char(days.day, 'Dy') as date,
  coalesce(sum(inv.total), 0)::numeric(12, 2) as revenue
from generate_series(current_date - interval '6 days', current_date, interval '1 day') as days(day)
left join public.invoices inv on inv.invoice_date = days.day::date
group by days.day
order by days.day;

create or replace view public.reports_revenue_month
with (security_invoker = true)
as
select
  to_char(days.day, 'Mon DD') as date,
  coalesce(sum(inv.total), 0)::numeric(12, 2) as revenue
from generate_series(
  date_trunc('month', current_date)::date,
  current_date,
  interval '5 days'
) as days(day)
left join public.invoices inv
  on inv.invoice_date >= days.day::date
 and inv.invoice_date < (days.day + interval '5 days')::date
group by days.day
order by days.day;

create or replace view public.reports_revenue_custom
with (security_invoker = true)
as
select
  to_char(months.month_value, 'Mon YYYY') as date,
  coalesce(sum(inv.total), 0)::numeric(12, 2) as revenue
from generate_series(
  date_trunc('month', current_date) - interval '5 months',
  date_trunc('month', current_date),
  interval '1 month'
) as months(month_value)
left join public.invoices inv
  on inv.invoice_date >= months.month_value::date
 and inv.invoice_date < (months.month_value + interval '1 month')::date
group by months.month_value
order by months.month_value;

create or replace view public.reports_category_sales
with (security_invoker = true)
as
select
  coalesce(prod.category, 'Others') as category,
  coalesce(sum(ii.quantity * ii.price), 0)::numeric(12, 2) as sales
from public.invoice_items ii
join public.invoices inv on inv.id = ii.invoice_id
left join public.products prod on prod.id = ii.product_id
where inv.invoice_date >= current_date - interval '30 days'
group by coalesce(prod.category, 'Others')
order by sales desc
limit 8;

create or replace view public.reports_client_growth
with (security_invoker = true)
as
select
  to_char(months.month_value, 'Mon') as month,
  (
    select count(*)
    from public.clients c
    where c.created_at < months.month_value + interval '1 month'
  )::integer as clients
from generate_series(
  date_trunc('month', current_date) - interval '4 months',
  date_trunc('month', current_date),
  interval '1 month'
) as months(month_value)
order by months.month_value;

create or replace view public.reports_payment_methods
with (security_invoker = true)
as
with method_totals as (
  select
    coalesce(payment_method, 'Credit') as name,
    coalesce(sum(coalesce(paid_amount, total)), 0)::numeric(12, 2) as amount
  from public.invoices
  where invoice_date >= current_date - interval '30 days'
  group by coalesce(payment_method, 'Credit')
),
grand_total as (
  select nullif(sum(amount), 0) as total_amount from method_totals
)
select
  name,
  round((amount / grand_total.total_amount) * 100, 1) as value,
  amount
from method_totals
cross join grand_total
where grand_total.total_amount is not null
order by amount desc;

create or replace view public.reports_top_products
with (security_invoker = true)
as
select
  ii.name as product,
  coalesce(sum(ii.quantity * ii.price), 0)::numeric(12, 2) as revenue,
  coalesce(sum(ii.quantity), 0)::integer as units
from public.invoice_items ii
join public.invoices inv on inv.id = ii.invoice_id
where inv.invoice_date >= current_date - interval '30 days'
group by ii.name
order by revenue desc
limit 5;

create or replace view public.reports_top_clients
with (security_invoker = true)
as
select
  c.name as client,
  c.total_spent as total_spent,
  count(inv.id)::integer as visits
from public.clients c
left join public.invoices inv on inv.client_id = c.id
group by c.id, c.name, c.total_spent
order by c.total_spent desc
limit 5;

revoke all on public.reports_summary from anon;
grant select on public.reports_summary to authenticated;
revoke all on public.reports_revenue_today from anon;
grant select on public.reports_revenue_today to authenticated;
revoke all on public.reports_revenue_week from anon;
grant select on public.reports_revenue_week to authenticated;
revoke all on public.reports_revenue_month from anon;
grant select on public.reports_revenue_month to authenticated;
revoke all on public.reports_revenue_custom from anon;
grant select on public.reports_revenue_custom to authenticated;
revoke all on public.reports_category_sales from anon;
grant select on public.reports_category_sales to authenticated;
revoke all on public.reports_client_growth from anon;
grant select on public.reports_client_growth to authenticated;
revoke all on public.reports_payment_methods from anon;
grant select on public.reports_payment_methods to authenticated;
revoke all on public.reports_top_products from anon;
grant select on public.reports_top_products to authenticated;
revoke all on public.reports_top_clients from anon;
grant select on public.reports_top_clients to authenticated;

