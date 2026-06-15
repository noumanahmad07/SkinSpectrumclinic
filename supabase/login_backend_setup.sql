-- Login backend setup for Skin Spectrum
-- Run this AFTER:
-- 1) supabase/migrations/202606130001_initial_schema.sql
-- 2) supabase/seed.sql
--
-- This file does not create Supabase Auth users with passwords.
-- Create users from Supabase Dashboard -> Authentication -> Users.
-- When you create a user, this trigger creates the matching public.staff_profiles row.

create or replace function public.create_staff_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_name text;
  profile_role public.staff_role;
begin
  if new.email is null or lower(new.email) not like '%@skinspectrum.com' then
    return new;
  end if;

  profile_name := coalesce(
    nullif(new.raw_user_meta_data->>'name', ''),
    split_part(new.email, '@', 1)
  );

  profile_role := case new.raw_user_meta_data->>'role'
    when 'Admin' then 'Admin'::public.staff_role
    when 'Manager' then 'Manager'::public.staff_role
    else 'Staff'::public.staff_role
  end;

  insert into public.staff_profiles (
    id,
    name,
    email,
    role,
    status,
    password_changed_at
  ) values (
    new.id,
    profile_name,
    lower(new.email),
    profile_role,
    'Active',
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists create_staff_profile_after_auth_signup on auth.users;

create trigger create_staff_profile_after_auth_signup
after insert on auth.users
for each row
execute function public.create_staff_profile_for_auth_user();

-- Backfill profiles for staff users that already exist in Supabase Auth.
insert into public.staff_profiles (
  id,
  name,
  email,
  role,
  status,
  password_changed_at
)
select
  users.id,
  coalesce(
    nullif(users.raw_user_meta_data->>'name', ''),
    split_part(users.email, '@', 1)
  ) as name,
  lower(users.email) as email,
  case users.raw_user_meta_data->>'role'
    when 'Admin' then 'Admin'::public.staff_role
    when 'Manager' then 'Manager'::public.staff_role
    else 'Staff'::public.staff_role
  end as role,
  'Active'::public.record_status as status,
  now() as password_changed_at
from auth.users
where users.email is not null
  and lower(users.email) like '%@skinspectrum.com'
on conflict (id) do update set
  email = excluded.email,
  updated_at = now();

-- Optional: check staff profiles created.
select id, name, email, role, status
from public.staff_profiles
order by created_at desc;
