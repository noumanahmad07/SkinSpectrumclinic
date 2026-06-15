-- Billing page backend setup for Skin Spectrum
-- Run this AFTER:
-- 1) supabase/migrations/202606130001_initial_schema.sql
-- 2) supabase/seed.sql
-- 3) supabase/login_backend_setup.sql
-- 4) supabase/clients_backend_setup.sql
-- 5) supabase/pos_backend_setup.sql

alter table public.invoices
  add column if not exists client_id uuid references public.clients(id) on delete set null,
  add column if not exists client_name text not null default 'Walk-in',
  add column if not exists invoice_date date not null default current_date,
  add column if not exists due_date date not null default current_date,
  add column if not exists amount numeric(12, 2) not null default 0,
  add column if not exists status public.invoice_status not null default 'Paid',
  add column if not exists credit_amount numeric(12, 2),
  add column if not exists paid_amount numeric(12, 2),
  add column if not exists payment_method text,
  add column if not exists subtotal numeric(12, 2) not null default 0,
  add column if not exists discount numeric(12, 2) not null default 0,
  add column if not exists tax numeric(12, 2) not null default 0,
  add column if not exists total numeric(12, 2) not null default 0;

update public.invoices
set total = amount
where total = 0 and amount > 0;

update public.invoices
set amount = total
where amount = 0 and total > 0;

create index if not exists invoices_client_name_idx on public.invoices (client_name);
create index if not exists invoices_due_date_idx on public.invoices (due_date);
create index if not exists invoices_created_at_idx on public.invoices (created_at desc);

do $$
begin
  execute $view$
    create or replace view public.billing_summary
    with (security_invoker = true)
    as
    select
      coalesce(sum(total), 0)::numeric(12, 2) as total_billed,
      coalesce(sum(
        case
          when status = 'Paid' then total
          else coalesce(paid_amount, 0)
        end
      ), 0)::numeric(12, 2) as total_collected,
      coalesce(sum(
        case
          when status = 'Credit' then coalesce(credit_amount, 0)
          else 0
        end
      ), 0)::numeric(12, 2) as total_credit,
      count(*)::integer as invoice_count,
      count(*) filter (where status = 'Paid')::integer as paid_count,
      count(*) filter (where status = 'Credit')::integer as credit_count
    from public.invoices;
  $view$;

  execute $view$
    create or replace view public.billing_invoice_list
    with (security_invoker = true)
    as
    select
      id,
      client_id,
      client_name,
      invoice_date,
      due_date,
      total as amount,
      status,
      credit_amount,
      paid_amount,
      payment_method,
      subtotal,
      discount,
      tax,
      total,
      created_at,
      updated_at
    from public.invoices
    order by invoice_date desc, created_at desc;
  $view$;

  execute $fn$
    create or replace function public.mark_invoice_paid(invoice_id text)
    returns public.invoices
    language plpgsql
    security invoker
    as $function$
    declare
      paid_invoice public.invoices;
    begin
      update public.invoices
      set
        status = 'Paid',
        credit_amount = null,
        paid_amount = total
      where id = invoice_id
      returning * into paid_invoice;

      return paid_invoice;
    end;
    $function$;
  $fn$;
end $$;
