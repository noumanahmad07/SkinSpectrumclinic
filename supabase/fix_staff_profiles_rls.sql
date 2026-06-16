-- Fix: infinite recursion detected in policy for relation "staff_profiles"
-- Run this in Supabase Dashboard -> SQL Editor
--
-- Cause: the admin RLS policy queried staff_profiles inside a policy ON staff_profiles.
-- Fix: use a security definer helper that bypasses RLS for the admin check.

create or replace function public.is_active_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.staff_profiles
    where id = auth.uid()
      and role = 'Admin'
      and status = 'Active'
  );
$$;

revoke all on function public.is_active_admin() from public;
grant execute on function public.is_active_admin() to authenticated;

drop policy if exists "admins can manage staff profiles" on public.staff_profiles;
drop policy if exists "admins can update staff profiles" on public.staff_profiles;
drop policy if exists "admins can delete staff profiles" on public.staff_profiles;

create policy "admins can manage staff profiles" on public.staff_profiles
  for insert to authenticated
  with check (public.is_active_admin());

create policy "admins can update staff profiles" on public.staff_profiles
  for update to authenticated
  using (public.is_active_admin())
  with check (public.is_active_admin());

create policy "admins can delete staff profiles" on public.staff_profiles
  for delete to authenticated
  using (public.is_active_admin());

-- Backfill staff_profiles for Auth users added manually in the dashboard.
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
    initcap(replace(split_part(users.email, '@', 1), '.', ' '))
  ) as name,
  lower(users.email) as email,
  case
    when lower(users.email) = 'admin@skinspectrum.com' then 'Admin'::public.staff_role
    when users.raw_user_meta_data->>'role' = 'Admin' then 'Admin'::public.staff_role
    when users.raw_user_meta_data->>'role' = 'Manager' then 'Manager'::public.staff_role
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

-- Verify profiles exist (should list admin@skinspectrum.com, staff@skinspectrum.com, etc.)
select id, name, email, role, status
from public.staff_profiles
order by created_at desc;
