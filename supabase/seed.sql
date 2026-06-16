create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

insert into public.clinic_settings (
  name,
  phone,
  email,
  address,
  website,
  tax_rate,
  currency,
  payment_methods,
  notification_settings,
  security_settings
) values (
  'Skin Spectrum Esthetics',
  '+1 (555) 123-4567',
  'info@skinspectrum.com',
  '123 Beauty Lane, Suite 100
Los Angeles, CA 90028
United States',
  'www.skinspectrum.com',
  8,
  'PKR',
  '{"cash":true,"card":true,"transfer":true,"mobile":true,"credit":true}'::jsonb,
  '{"whatsappEnabled":true,"emailEnabled":true}'::jsonb,
  '{"timeout":"30","forceChange":true}'::jsonb
) on conflict do nothing;

insert into public.bill_persons (name, password_hash, status) values
  ('Admin User', extensions.crypt('bill1234', extensions.gen_salt('bf')), 'Active'),
  ('Staff Member', extensions.crypt('bill1234', extensions.gen_salt('bf')), 'Active'),
  ('Manager', extensions.crypt('bill1234', extensions.gen_salt('bf')), 'Active')
on conflict do nothing;
