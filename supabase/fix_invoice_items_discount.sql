-- Fix POS bill saving when PostgREST reports:
-- "Could not find the 'discount' column of 'invoice_items' in the schema cache"
--
-- Run this in Supabase Dashboard -> SQL Editor for the Skin Spectrum project.

alter table public.invoice_items
  add column if not exists discount numeric(5, 2) not null default 0;

grant select, insert, update, delete on public.invoice_items to authenticated;

notify pgrst, 'reload schema';

select
  column_name,
  data_type,
  numeric_precision,
  numeric_scale,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'invoice_items'
  and column_name = 'discount';
