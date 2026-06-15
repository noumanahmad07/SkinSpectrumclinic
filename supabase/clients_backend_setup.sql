-- Clients page backend setup for Skin Spectrum
-- Run this AFTER:
-- 1) supabase/migrations/202606130001_initial_schema.sql
-- 2) supabase/seed.sql
-- 3) supabase/login_backend_setup.sql
--
-- Clients are added from the app (Clients -> Add New Client), not seeded here.

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
