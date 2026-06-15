-- Show all inventory products in POS (including 0 stock and inactive).
-- Run in Supabase Dashboard -> SQL Editor if POS shows fewer products than Inventory.

create or replace view public.pos_products
with (security_invoker = true)
as
select
  id,
  code,
  name,
  category,
  sell_price as price,
  stock,
  min_stock,
  unit,
  expiry,
  status,
  image
from public.products
order by category asc, name asc;
