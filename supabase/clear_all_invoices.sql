-- Delete all billing invoices from Supabase
-- Run in Supabase Dashboard -> SQL Editor
--
-- invoice_items are removed automatically (on delete cascade).
-- New invoices are created from POS when staff save a bill.

delete from public.invoices;

-- Verify
select count(*) as remaining_invoices from public.invoices;
select count(*) as remaining_invoice_items from public.invoice_items;
