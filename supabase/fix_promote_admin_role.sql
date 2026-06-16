-- Promote the main admin account to Admin role (run in Supabase SQL Editor)
-- Login email "admin@skinspectrum.com" does NOT automatically get Admin role.
-- Password reset and user management require role = 'Admin' in staff_profiles.

update public.staff_profiles
set role = 'Admin', updated_at = now()
where lower(email) = 'admin@skinspectrum.com';

-- Verify
select id, name, email, role, status
from public.staff_profiles
order by email;
