# Supabase Backend Deployment

This project now includes a Supabase-ready backend foundation.

## Files Added

- `supabase/migrations/202606130001_initial_schema.sql`
- `supabase/seed.sql`
- `supabase/login_backend_setup.sql`
- `supabase/dashboard_backend_setup.sql`
- `supabase/clients_backend_setup.sql`
- `supabase/pos_backend_setup.sql`
- `supabase/billing_backend_setup.sql`
- `supabase/inventory_backend_setup.sql`
- `supabase/reports_backend_setup.sql`
- `supabase/settings_backend_setup.sql`
- `supabase/notifications_backend_setup.sql`
- `src/app/lib/supabase.ts`
- `src/app/lib/backend.ts`
- `.env.example`

## What The Schema Covers

- Clinic/settings data
- Staff profiles linked to Supabase Auth users
- POS bill staff
- Clients
- Appointments and follow-ups
- Inventory/products
- Invoices
- Invoice items
- Notifications

## Deploy To Supabase

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Fill:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Apply the migration.

Using Supabase SQL editor:

- Open Supabase Dashboard.
- Go to SQL Editor.
- Paste `supabase/migrations/202606130001_initial_schema.sql`.
- Run it.
- Paste `supabase/seed.sql`.
- Run it.
- Paste `supabase/login_backend_setup.sql`.
- Run it.
- Paste `supabase/dashboard_backend_setup.sql`.
- Run it.
- Paste `supabase/clients_backend_setup.sql`.
- Run it.
- Paste `supabase/pos_backend_setup.sql`.
- Run it.
- Paste `supabase/billing_backend_setup.sql`.
- Run it.
- Paste `supabase/inventory_backend_setup.sql`.
- Run it.
- Paste `supabase/reports_backend_setup.sql`.
- Run it.
- Paste `supabase/settings_backend_setup.sql`.
- Run it.
- Paste `supabase/notifications_backend_setup.sql`.
- Run it.

Using Supabase CLI:

```bash
supabase link --project-ref your-project-ref
supabase db push
supabase db seed
```

## Staff Login Setup

The database uses Supabase Auth for real hosted login.

Create users in Supabase Dashboard:

- Authentication -> Users -> Add user
- Add the staff email and password

If you already ran `supabase/login_backend_setup.sql`, matching `staff_profiles` rows are created automatically for users with `@skinspectrum.com` emails.

The frontend login now works like this:

1. Supabase Auth checks the email/password.
2. The app reads `public.staff_profiles` for the logged-in auth user ID.
3. Login succeeds only when that profile exists and `status = 'Active'`.

Optional manual staff profile SQL:

```sql
insert into public.staff_profiles (id, name, email, role, status, password_changed_at)
values
  ('PASTE_AUTH_USER_ID', 'New Staff', 'newstaff@skinspectrum.com', 'Staff', 'Active', now());
```

You can find `PASTE_AUTH_USER_ID` in Supabase Dashboard -> Authentication -> Users -> click the user -> copy User UID.

## Current App Status

The app still runs with localStorage fallback. The Supabase backend files are ready, and screens can now be migrated table-by-table using `src/app/lib/backend.ts`.

Recommended migration order:

1. Login/Auth
2. Dashboard
3. Clients
4. POS invoices
5. Billing
6. Inventory
7. Reports
8. Settings
9. Dashboard reports/notifications

## Important

Do not expose the Supabase service role key in this frontend app. Only use the anon key in `.env.local`.
