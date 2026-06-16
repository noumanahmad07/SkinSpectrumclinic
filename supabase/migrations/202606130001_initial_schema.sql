create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

do $$ begin
  create type public.staff_role as enum ('Admin', 'Staff', 'Manager');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.record_status as enum ('Active', 'Inactive');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.invoice_status as enum ('Paid', 'Credit');
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.clinic_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Skin Spectrum Esthetics',
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  website text not null default '',
  logo_url text,
  tax_rate numeric(5, 2) not null default 8,
  currency text not null default 'PKR',
  payment_methods jsonb not null default '{"cash":true,"card":true,"transfer":true,"mobile":true,"credit":true}'::jsonb,
  notification_settings jsonb not null default '{}'::jsonb,
  security_settings jsonb not null default '{"timeout":"30","forceChange":true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role public.staff_role not null default 'Staff',
  status public.record_status not null default 'Active',
  password_changed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bill_persons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  password_hash text not null,
  status public.record_status not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  skin_type text not null,
  last_visit date not null default current_date,
  total_spent numeric(12, 2) not null default 0,
  concerns text[] not null default '{}',
  allergies text not null default 'None',
  notes text not null default '',
  follow_up_days integer,
  follow_up_date date,
  appointment_date date,
  appointment_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category text not null default 'General',
  description text not null default '',
  cost_price numeric(12, 2) not null default 0,
  sell_price numeric(12, 2) not null default 0,
  stock integer not null default 0,
  min_stock integer not null default 10,
  unit text not null default 'Bottle',
  expiry date,
  status public.record_status not null default 'Active',
  image text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id text primary key,
  client_id uuid references public.clients(id) on delete set null,
  client_name text not null,
  invoice_date date not null default current_date,
  due_date date not null,
  amount numeric(12, 2) not null default 0,
  status public.invoice_status not null default 'Paid',
  credit_amount numeric(12, 2),
  paid_amount numeric(12, 2),
  payment_method text,
  subtotal numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0,
  tax numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  created_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id text not null references public.invoices(id) on delete cascade,
  name text not null,
  quantity integer not null default 1,
  price numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  category text not null default 'System',
  status text not null default 'Unread',
  created_at timestamptz not null default now()
);

create index if not exists clients_appointment_idx on public.clients (appointment_date, appointment_time);
create index if not exists clients_follow_up_idx on public.clients (follow_up_date);
create index if not exists products_category_idx on public.products (category);
create index if not exists products_stock_idx on public.products (stock, min_stock);
create index if not exists invoices_date_idx on public.invoices (invoice_date desc);
create index if not exists invoice_items_invoice_id_idx on public.invoice_items (invoice_id);
create index if not exists notifications_status_idx on public.notifications (status, created_at desc);

drop trigger if exists set_clinic_settings_updated_at on public.clinic_settings;
create trigger set_clinic_settings_updated_at
before update on public.clinic_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_staff_profiles_updated_at on public.staff_profiles;
create trigger set_staff_profiles_updated_at
before update on public.staff_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_bill_persons_updated_at on public.bill_persons;
create trigger set_bill_persons_updated_at
before update on public.bill_persons
for each row execute function public.set_updated_at();

drop trigger if exists set_clients_updated_at on public.clients;
create trigger set_clients_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_invoices_updated_at on public.invoices;
create trigger set_invoices_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

alter table public.clinic_settings enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.bill_persons enable row level security;
alter table public.clients enable row level security;
alter table public.products enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "authenticated staff can read clinic settings" on public.clinic_settings;
create policy "authenticated staff can read clinic settings" on public.clinic_settings
  for select to authenticated using (true);

drop policy if exists "authenticated staff can manage clinic settings" on public.clinic_settings;
create policy "authenticated staff can manage clinic settings" on public.clinic_settings
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated staff can read staff profiles" on public.staff_profiles;
create policy "authenticated staff can read staff profiles" on public.staff_profiles
  for select to authenticated using (true);

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
create policy "admins can manage staff profiles" on public.staff_profiles
  for insert to authenticated
  with check (public.is_active_admin());

drop policy if exists "admins can update staff profiles" on public.staff_profiles;
create policy "admins can update staff profiles" on public.staff_profiles
  for update to authenticated
  using (public.is_active_admin())
  with check (public.is_active_admin());

drop policy if exists "admins can delete staff profiles" on public.staff_profiles;
create policy "admins can delete staff profiles" on public.staff_profiles
  for delete to authenticated
  using (public.is_active_admin());

drop policy if exists "authenticated staff can manage bill persons" on public.bill_persons;
create policy "authenticated staff can manage bill persons" on public.bill_persons
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated staff can manage clients" on public.clients;
create policy "authenticated staff can manage clients" on public.clients
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated staff can manage products" on public.products;
create policy "authenticated staff can manage products" on public.products
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated staff can manage invoices" on public.invoices;
create policy "authenticated staff can manage invoices" on public.invoices
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated staff can manage invoice items" on public.invoice_items;
create policy "authenticated staff can manage invoice items" on public.invoice_items
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated staff can manage notifications" on public.notifications;
create policy "authenticated staff can manage notifications" on public.notifications
  for all to authenticated using (true) with check (true);
