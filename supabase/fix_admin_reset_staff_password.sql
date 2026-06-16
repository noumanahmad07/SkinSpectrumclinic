-- Fix staff password reset so Supabase Auth login works after admin changes password
-- Run this FULL file in Supabase Dashboard -> SQL Editor

create extension if not exists pgcrypto with schema extensions;

create or replace function public.admin_reset_staff_password(
  target_user_id uuid,
  new_password text
)
returns void
language plpgsql
security definer
set search_path = public, extensions, auth
as $$
declare
  hashed_password text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_active_admin() then
    raise exception 'Password reset requires Admin role in staff_profiles.';
  end if;

  if new_password is null or length(new_password) < 8 then
    raise exception 'Password must be at least 8 characters';
  end if;

  -- GoTrue-compatible bcrypt hash (cost 10)
  hashed_password := crypt(new_password, gen_salt('bf', 10));

  update auth.users
  set
    encrypted_password = hashed_password,
    updated_at = now(),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    confirmation_token = coalesce(confirmation_token, ''),
    recovery_token = coalesce(recovery_token, ''),
    email_change = coalesce(email_change, ''),
    email_change_token_new = coalesce(email_change_token_new, '')
  where id = target_user_id;

  if not found then
    raise exception 'Auth user not found for this staff profile';
  end if;

  -- Verify hash works before returning success
  if not exists (
    select 1
    from auth.users
    where id = target_user_id
      and encrypted_password = crypt(new_password, encrypted_password)
  ) then
    raise exception 'Password hash verification failed. Check that pgcrypto is enabled.';
  end if;

  update public.staff_profiles
  set password_changed_at = now(), updated_at = now()
  where id = target_user_id;
end;
$$;

revoke all on function public.admin_reset_staff_password(uuid, text) from public;
grant execute on function public.admin_reset_staff_password(uuid, text) to authenticated;

-- One-time fix for staff@skinspectrum.com (change password if needed)
-- update auth.users
-- set encrypted_password = crypt('Staff123', gen_salt('bf', 10)), updated_at = now()
-- where lower(email) = 'staff@skinspectrum.com';
