-- Notifications page backend setup for Skin Spectrum
-- Run this AFTER all previous setup files.

create index if not exists notifications_category_idx on public.notifications (category);
create index if not exists notifications_created_at_idx on public.notifications (created_at desc);

create or replace view public.notifications_center
with (security_invoker = true)
as
select
  id::text as id,
  title,
  message,
  category,
  status,
  created_at,
  case
    when category in ('Inventory', 'Appointments') and status = 'Unread' then 'High'
    when category = 'Billing' and status = 'Unread' then 'Medium'
    else 'Normal'
  end as priority
from public.notifications
union all
select
  ('appointment-' || id::text) as id,
  (name || ' appointment today') as title,
  ('Appointment scheduled at ' || coalesce(to_char(appointment_time, 'HH12:MI AM'), 'time not set') || '. Phone: ' || phone) as message,
  'Appointments' as category,
  'Unread' as status,
  coalesce(appointment_date::timestamptz, now()) as created_at,
  'High' as priority
from public.clients
where appointment_date = current_date
union all
select
  ('followup-' || id::text) as id,
  ('Follow up: ' || name) as title,
  ('Follow-up is due on ' || to_char(follow_up_date, 'Mon DD, YYYY') || '. Phone: ' || phone) as message,
  'Appointments' as category,
  'Unread' as status,
  coalesce(follow_up_date::timestamptz, now()) as created_at,
  'Medium' as priority
from public.clients
where follow_up_date between current_date and current_date + 1
union all
select
  ('stock-' || id::text) as id,
  ('Low stock: ' || name) as title,
  ('Current quantity is ' || stock || '. Minimum stock level is ' || min_stock || '.') as message,
  'Inventory' as category,
  'Unread' as status,
  now() as created_at,
  case when stock <= 0 then 'High' else 'Medium' end as priority
from public.products
where unit <> 'Service' and stock <= min_stock
union all
select
  ('credit-' || id) as id,
  ('Pending invoice: ' || id) as title,
  (client_name || ' has pending credit of PKR ' || coalesce(credit_amount, total, 0) || '.') as message,
  'Billing' as category,
  'Unread' as status,
  created_at,
  'Medium' as priority
from public.invoices
where status = 'Credit'
order by created_at desc;
