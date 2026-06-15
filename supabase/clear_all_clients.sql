-- Delete all clients from Supabase
-- Run in Supabase Dashboard -> SQL Editor
--
-- Invoices keep their client_name text; client_id is set to null automatically.
-- New clients can be added anytime from the app: Clients -> Add New Client.

delete from public.clients;

-- Verify
select count(*) as remaining_clients from public.clients;
