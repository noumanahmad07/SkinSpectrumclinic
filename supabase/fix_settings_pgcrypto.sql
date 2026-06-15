-- Fix: function crypt(text, text) does not exist
-- Run this in Supabase SQL Editor if settings_backend_setup.sql failed on verify_bill_person.
-- Cause: pgcrypto lives in the "extensions" schema on Supabase, not "public".

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

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

create or replace function public.upsert_bill_person(
  person_id uuid,
  person_name text,
  person_password text,
  person_status public.record_status
)
returns setof public.bill_persons
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  saved_person public.bill_persons;
begin
  if person_id is null then
    insert into public.bill_persons (name, password_hash, status)
    values (
      person_name,
      extensions.crypt(coalesce(nullif(person_password, ''), 'bill1234'), extensions.gen_salt('bf')),
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
        else extensions.crypt(person_password, extensions.gen_salt('bf'))
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
set search_path = public, extensions
as $$
  select exists (
    select 1
    from public.bill_persons
    where id = person_id
      and status = 'Active'
      and password_hash = extensions.crypt(person_password, password_hash)
  );
$$;

grant execute on function public.upsert_bill_person(uuid, text, text, public.record_status) to anon, authenticated;
grant execute on function public.verify_bill_person(uuid, text) to anon, authenticated;
