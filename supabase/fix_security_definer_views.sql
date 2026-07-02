-- Fix Supabase Database Advisor "Security Definer View" findings.
--
-- Run this in Supabase Dashboard -> SQL Editor.
-- It converts report and notification views to security invoker views so reads
-- use the signed-in staff user's permissions/RLS context instead of the view owner.

alter view public.notifications_center set (security_invoker = true);

alter view public.reports_summary set (security_invoker = true);
alter view public.reports_revenue_today set (security_invoker = true);
alter view public.reports_revenue_week set (security_invoker = true);
alter view public.reports_revenue_month set (security_invoker = true);
alter view public.reports_revenue_custom set (security_invoker = true);
alter view public.reports_category_sales set (security_invoker = true);
alter view public.reports_client_growth set (security_invoker = true);
alter view public.reports_payment_methods set (security_invoker = true);
alter view public.reports_top_products set (security_invoker = true);
alter view public.reports_top_clients set (security_invoker = true);

revoke all on public.notifications_center from anon;
revoke all on public.reports_summary from anon;
revoke all on public.reports_revenue_today from anon;
revoke all on public.reports_revenue_week from anon;
revoke all on public.reports_revenue_month from anon;
revoke all on public.reports_revenue_custom from anon;
revoke all on public.reports_category_sales from anon;
revoke all on public.reports_client_growth from anon;
revoke all on public.reports_payment_methods from anon;
revoke all on public.reports_top_products from anon;
revoke all on public.reports_top_clients from anon;

grant select on public.notifications_center to authenticated;
grant select on public.reports_summary to authenticated;
grant select on public.reports_revenue_today to authenticated;
grant select on public.reports_revenue_week to authenticated;
grant select on public.reports_revenue_month to authenticated;
grant select on public.reports_revenue_custom to authenticated;
grant select on public.reports_category_sales to authenticated;
grant select on public.reports_client_growth to authenticated;
grant select on public.reports_payment_methods to authenticated;
grant select on public.reports_top_products to authenticated;
grant select on public.reports_top_clients to authenticated;

notify pgrst, 'reload schema';

select
  n.nspname as schema_name,
  c.relname as view_name,
  c.reloptions
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'v'
  and c.relname in (
    'notifications_center',
    'reports_summary',
    'reports_revenue_today',
    'reports_revenue_week',
    'reports_revenue_month',
    'reports_revenue_custom',
    'reports_category_sales',
    'reports_client_growth',
    'reports_payment_methods',
    'reports_top_products',
    'reports_top_clients'
  )
order by c.relname;
