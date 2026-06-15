-- Complete notifications fix (run once in Supabase SQL Editor)
-- Removes system/setup messages, creates dismissals table, and refreshes the view.

delete from public.notifications where category = 'System';

create table if not exists public.notification_dismissals (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references auth.users(id) on delete cascade,
  notification_key text not null,
  dismissed_at timestamptz not null default now(),
  unique (staff_id, notification_key)
);

create index if not exists notification_dismissals_staff_idx
  on public.notification_dismissals (staff_id, dismissed_at desc);

alter table public.notification_dismissals enable row level security;

drop policy if exists "staff manage own notification dismissals" on public.notification_dismissals;
create policy "staff manage own notification dismissals" on public.notification_dismissals
  for all to authenticated
  using (staff_id = auth.uid())
  with check (staff_id = auth.uid());

create or replace function public.dismiss_notification(notification_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.notification_dismissals (staff_id, notification_key)
  values (auth.uid(), notification_key)
  on conflict (staff_id, notification_key) do update
    set dismissed_at = now();
end;
$$;

grant execute on function public.dismiss_notification(text) to authenticated;

create or replace view public.notifications_center
with (security_invoker = false)
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
where category <> 'System'
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

grant select on public.notifications_center to anon, authenticated;
grant select, insert, update, delete on public.notification_dismissals to authenticated;
