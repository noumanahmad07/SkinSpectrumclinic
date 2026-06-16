-- Emergency: set staff login password directly in Supabase Auth
-- Run in Supabase SQL Editor, then try logging in with staff@skinspectrum.com

create extension if not exists pgcrypto with schema extensions;

update auth.users
set
  encrypted_password = crypt('Staff123', gen_salt('bf', 10)),
  updated_at = now(),
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change = coalesce(email_change, ''),
  email_change_token_new = coalesce(email_change_token_new, '')
where lower(email) = 'staff@skinspectrum.com';

-- Verify login hash (should return 1 row)
select
  email,
  encrypted_password = crypt('Staff123', encrypted_password) as password_matches
from auth.users
where lower(email) = 'staff@skinspectrum.com';
