-- ============================================================
-- HRMS SaaS - Migration 0006 (Phase 6 - Billing)
-- ============================================================
-- 1. Stripe price cache (so we can render plan options)
-- 2. invoices table (record generated invoices)
-- 3. usage_events table (for usage-based callbacks)
-- Note: subscriptions table already exists (migration 0001)
-- ============================================================

create table public.billing_prices (
  id              uuid primary key default gen_random_uuid(),
  plan            text not null check (plan in ('free','pro','business','enterprise')),
  stripe_price_id text unique not null,
  amount_try      numeric(12,2) not null,
  interval        text check (interval in ('month','year')),
  is_active       boolean default true,
  created_at      timestamptz not null default now()
);

alter table public.billing_prices enable row level security;
create policy "Tenant read prices"
  on public.billing_prices for select to authenticated
  using (true);

create table public.invoices (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies(id) on delete cascade,
  stripe_invoice_id   text unique,
  amount_due_try      numeric(12,2) not null,
  amount_paid_try     numeric(12,2) default 0,
  currency            text default 'try',
  status              text not null default 'open'
                      check (status in ('draft','open','paid','uncollectible','void')),
  invoice_pdf_url     text,
  created_at          timestamptz not null default now(),
  paid_at            timestamptz
);

alter table public.invoices enable row level security;
create policy "Tenant read invoices"
  on public.invoices for select to authenticated
  using (company_id = public.current_company_id());
create policy "Admin read invoices"
  on public.invoices for all to authenticated
  using (company_id = public.current_company_id() and public.is_staff())
  with check (company_id = public.current_company_id() and public.is_staff());

-- Default plan prices (replace with real Stripe price ids in production)
insert into public.billing_prices (plan, stripe_price_id, amount_try, interval, is_active)
values
  ('free', 'price_free_placeholder', 0, 'month', true),
  ('pro', 'price_pro_placeholder', 490, 'month', true),
  ('pro', 'price_pro_year_placeholder', 4900, 'year', true),
  ('business', 'price_business_placeholder', 990, 'month', true),
  ('business', 'price_business_year_placeholder', 9900, 'year', true)
on conflict (stripe_price_id) do nothing;

-- ============================================================
-- Done.
-- ============================================================
