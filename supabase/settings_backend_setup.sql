-- Settings page backend setup for Skin Spectrum
-- Covers all Settings tabs:
-- Clinic Info, Tax & Billing, Notifications, User Accounts, Bill Person, Security
-- Run this AFTER all previous setup files.

create extension if not exists pgcrypto;

alter table public.clinic_settings
  add column if not exists logo_url text,
  add column if not exists payment_methods jsonb not null default '{"cash":true,"card":true,"transfer":true,"mobile":true,"credit":true}'::jsonb,
  add column if not exists notification_settings jsonb not null default '{}'::jsonb,
  add column if not exists security_settings jsonb not null default '{"timeout":"30","forceChange":true}'::jsonb;

create or replace view public.settings_clinic
with (security_invoker = true)
as
select
  id,
  name,
  phone,
  email,
  address,
  website,
  logo_url,
  tax_rate,
  currency,
  payment_methods,
  notification_settings,
  security_settings,
  created_at,
  updated_at
from public.clinic_settings
order by created_at asc
limit 1;

create or replace view public.settings_staff_profiles
with (security_invoker = true)
as
select
  id,
  name,
  email,
  role,
  status,
  password_changed_at,
  created_at,
  updated_at
from public.staff_profiles
order by created_at asc;

create or replace view public.settings_bill_persons
with (security_invoker = true)
as
select
  id,
  name,
  status,
  created_at,
  updated_at
from public.bill_persons
order by created_at asc;

alter table public.bill_persons enable row level security;

drop policy if exists "authenticated staff can manage bill persons" on public.bill_persons;
drop policy if exists "settings can read bill persons" on public.bill_persons;
drop policy if exists "settings can insert bill persons" on public.bill_persons;
drop policy if exists "settings can update bill persons" on public.bill_persons;
drop policy if exists "settings can delete bill persons" on public.bill_persons;

create policy "settings can read bill persons" on public.bill_persons
  for select to anon, authenticated
  using (true);

create policy "settings can insert bill persons" on public.bill_persons
  for insert to anon, authenticated
  with check (true);

create policy "settings can update bill persons" on public.bill_persons
  for update to anon, authenticated
  using (true)
  with check (true);

create policy "settings can delete bill persons" on public.bill_persons
  for delete to anon, authenticated
  using (true);

create or replace function public.upsert_bill_person(
  person_id uuid,
  person_name text,
  person_password text,
  person_status public.record_status
)
returns setof public.bill_persons
language plpgsql
security definer
set search_path = public
as $$
declare
  saved_person public.bill_persons;
begin
  if person_id is null then
    insert into public.bill_persons (name, password_hash, status)
    values (
      person_name,
      crypt(coalesce(nullif(person_password, ''), 'bill1234'), gen_salt('bf')),
      person_status
    )
    returning * into saved_person;
  else
    update public.bill_persons
    set
      name = person_name,
      status = person_status,
      password_hash = case
        when person_password is null or person_password = '' then password_hash
        else crypt(person_password, gen_salt('bf'))
      end
    where id = person_id
    returning * into saved_person;
  end if;

  return next saved_person;
end;
$$;

create or replace function public.verify_bill_person(
  person_id uuid,
  person_password text
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bill_persons
    where id = person_id
      and status = 'Active'
      and password_hash = crypt(person_password, password_hash)
  );
$$;

grant execute on function public.upsert_bill_person(uuid, text, text, public.record_status) to anon, authenticated;
grant execute on function public.verify_bill_person(uuid, text) to anon, authenticated;
