-- Clients page backend setup for Skin Spectrum
-- Run this AFTER:
-- 1) supabase/migrations/202606130001_initial_schema.sql
-- 2) supabase/seed.sql
-- 3) supabase/login_backend_setup.sql

create index if not exists clients_name_lower_idx on public.clients (lower(name));
create index if not exists clients_phone_idx on public.clients (phone);
create index if not exists clients_skin_type_idx on public.clients (skin_type);
create index if not exists clients_created_at_idx on public.clients (created_at desc);

create or replace view public.clients_page_list
with (security_invoker = true)
as
select
  id,
  name,
  phone,
  email,
  skin_type,
  last_visit,
  total_spent,
  concerns,
  allergies,
  notes,
  follow_up_days,
  follow_up_date,
  appointment_date,
  appointment_time,
  created_at,
  updated_at,
  case
    when appointment_date is not null and appointment_time is not null
      then appointment_date + appointment_time
    else null
  end as appointment_at
from public.clients
order by created_at desc;

insert into public.clients (
  name,
  phone,
  email,
  skin_type,
  last_visit,
  total_spent,
  concerns,
  allergies,
  notes,
  follow_up_days,
  follow_up_date,
  appointment_date,
  appointment_time
)
select *
from (
  values
    ('Emma Wilson', '+1 (555) 123-4567', 'emma.w@example.com', 'Dry', '2026-05-20'::date, 2450::numeric, array['Fine Lines', 'Dehydration'], 'None', 'Prefers fragrance-free products', 7, current_date + 1, current_date, '10:30'::time),
    ('Sarah Johnson', '+1 (555) 234-5678', 'sarah.j@example.com', 'Oily', '2026-05-22'::date, 1820::numeric, array['Acne', 'Large Pores'], 'Benzoyl Peroxide', 'Regular client since 2024', 14, current_date + 7, current_date + 2, '14:00'::time),
    ('Michael Brown', '+1 (555) 345-6789', 'michael.b@example.com', 'Normal', '2026-05-18'::date, 980::numeric, array['Prevention'], 'None', '', null, null, null, null),
    ('Jessica Davis', '+1 (555) 456-7890', 'jessica.d@example.com', 'Combination', '2026-05-25'::date, 3200::numeric, array['Pigmentation', 'Uneven Tone'], 'Vitamin C', 'VIP client - prefers appointments after 5 PM', 30, current_date + 14, current_date, '17:30'::time)
) as sample_clients (
  name,
  phone,
  email,
  skin_type,
  last_visit,
  total_spent,
  concerns,
  allergies,
  notes,
  follow_up_days,
  follow_up_date,
  appointment_date,
  appointment_time
)
where not exists (
  select 1
  from public.clients existing
  where existing.phone = sample_clients.phone
);
