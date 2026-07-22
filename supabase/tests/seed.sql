-- Seed for RLS penetration tests
-- Created via seed.sql; only ran against ephemeral local DB.
-- Run with: pnpm supabase db reset && pnpm test -- rls

-- Wipe (idempotent reset tries)
delete from public.profiles where email like '%@rlstest.local';
delete from public.companies where slug = 'acme-rls-test' or slug = 'gamma-rls-test';

-- Companies
insert into public.companies (id, name, slug, plan)
values
  ('00000000-0000-0000-0000-000000000001', 'Acme RLS', 'acme-rls-test', 'pro'),
  ('00000000-0000-0000-0000-000000000002', 'Gamma RLS', 'gamma-rls-test', 'pro')
on conflict (slug) do nothing;

-- Test departments
insert into public.departments (id, company_id, name)
values
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Muhasebe'),
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000002', 'IT')
on conflict (id) do nothing;

-- Test employees (one per tenant)
insert into public.employees (
  id, company_id, first_name, last_name, gender, department_id,
  start_date, total_leave_days, status, created_by
) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001',
   'Ada', 'Yilmaz', 'K', '00000000-0000-0000-0000-000000000010',
   '2024-01-01', 14, 'active', null),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000002',
   'Bora', 'Demir', 'E', '00000000-0000-0000-0000-000000000020',
   '2024-01-01', 14, 'active', null)
on conflict (id) do nothing;
