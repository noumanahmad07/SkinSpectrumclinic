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
  'SkinSpectrum Esthetics',
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
  ('Admin User', crypt('bill1234', gen_salt('bf')), 'Active'),
  ('Staff Member', crypt('bill1234', gen_salt('bf')), 'Active'),
  ('Manager', crypt('bill1234', gen_salt('bf')), 'Active')
on conflict do nothing;

insert into public.products (
  code,
  name,
  category,
  description,
  cost_price,
  sell_price,
  stock,
  min_stock,
  unit,
  expiry,
  status,
  image
) values
  ('SKU-001', 'Hydrating Serum', 'Serums', 'Deep hydration serum with hyaluronic acid', 45, 89, 45, 20, 'Bottle', '2027-12-31', 'Active', '💧'),
  ('SKU-002', 'Anti-Aging Cream', 'Creams', 'Premium anti-aging formula with retinol', 65, 125, 32, 15, 'Jar', '2027-10-15', 'Active', '✨'),
  ('SKU-003', 'Vitamin C Serum', 'Serums', 'Brightening serum with 20% Vitamin C', 50, 95, 28, 25, 'Bottle', '2027-08-20', 'Active', '🍊'),
  ('SKU-004', 'Retinol Night Cream', 'Creams', 'Intensive night repair with retinol', 58, 110, 5, 15, 'Jar', '2027-11-30', 'Active', '🌙'),
  ('SKU-005', 'Facial Treatment - Basic', 'Treatments', 'Standard facial treatment service', 0, 150, 999, 999, 'Service', null, 'Active', '💆'),
  ('SKU-006', 'Exfoliating Scrub', 'Scrubs', 'Gentle exfoliating scrub with natural beads', 28, 65, 50, 30, 'Tube', '2027-09-15', 'Active', '🧴'),
  ('SKU-007', 'Cleanser Foam', 'Cleansers', 'Deep cleansing foam for all skin types', 22, 48, 0, 25, 'Bottle', '2027-06-30', 'Inactive', '🫧')
on conflict (code) do nothing;

insert into public.notifications (title, message, category, status) values
  ('Low stock: Retinol Night Cream', 'Current quantity is 5. Minimum stock level is 15. Create a purchase order soon.', 'Inventory', 'Unread'),
  ('Billing review', 'Review credit and pending invoices before closing today.', 'Billing', 'Unread'),
  ('System ready', 'Supabase backend schema has been initialized.', 'System', 'Read')
on conflict do nothing;
