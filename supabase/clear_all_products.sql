-- Delete all inventory products from Supabase
-- Run in Supabase Dashboard -> SQL Editor
--
-- invoice_items.product_id is set to null automatically (on delete set null).
-- New products can be added from Inventory -> Add Product in the app.

delete from public.products;

-- Verify
select count(*) as remaining_products from public.products;
