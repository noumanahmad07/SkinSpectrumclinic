-- Delete all stored notifications and dismissals from Supabase
-- Run in Supabase Dashboard -> SQL Editor
--
-- Stored rows in public.notifications are removed.
-- Mark-read history in notification_dismissals is cleared when that table exists.
-- Live alerts from clients, products, and credit invoices may still appear in the
-- notifications inbox until those records change or are cleared separately.

do $$
begin
  if to_regclass('public.notification_dismissals') is not null then
    delete from public.notification_dismissals;
  end if;
end $$;

delete from public.notifications;

-- Verify
select count(*) as remaining_notifications from public.notifications;
