-- ============================================================
-- HRMS SaaS - Initial migration (Phase 1)
-- ============================================================
-- Created: 2026-07-18
-- Description: Tenant-based HRMS schema with Row Level Security.
-- ============================================================

-- Required extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Helper: updated_at trigger function (reused by all tables)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 1) COMPANIES (tenants)
-- ============================================================
create table public.companies (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  plan            text not null default 'free'
                  check (plan in ('free','pro','enterprise')),
  employee_quota  int not null default 10,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  trial_ends_at   timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger trg_companies_updated
  before update on public.companies
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2) PROFILES (auth users -> company members)
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  company_id  uuid not null references public.companies(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'employee'
              check (role in ('super_admin','company_admin','hr_manager','employee')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

create index on public.profiles (company_id);
create index on public.profiles (email);

-- ============================================================
-- 3) DEPARTMENTS (hierarchical)
-- ============================================================
create table public.departments (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  parent_id   uuid references public.departments(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (company_id, name)
);

create trigger trg_departments_updated
  before update on public.departments
  for each row execute function public.set_updated_at();

create index on public.departments (company_id);

-- ============================================================
-- 4) EMPLOYEES
-- ============================================================
create table public.employees (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references public.companies(id) on delete cascade,
  tc_kimlik_enc     text,  -- encrypted (pgcrypto) - nullable
  first_name        text not null,
  last_name         text not null,
  full_name         text generated always as (first_name || ' ' || last_name) stored,
  gender            text check (gender in ('K','E')),
  department_id     uuid references public.departments(id) on delete set null,
  start_date        date not null,
  contract_end      date,
  address           text,
  phone             text,
  email             text,
  salary            numeric(12,2),
  total_leave_days  int not null default 14,
  status            text not null default 'active' check (status in ('active','passive')),
  user_id           uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references public.profiles(id)
);

create trigger trg_employees_updated
  before update on public.employees
  for each row execute function public.set_updated_at();

create index on public.employees (company_id, status);
create index on public.employees (company_id, department_id);
create index on public.employees (user_id);

-- ============================================================
-- 5) LEAVES
-- ============================================================
create table public.leaves (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  employee_id   uuid not null references public.employees(id) on delete cascade,
  type          text not null check (type in ('Yillik','Mazeret','Hastalik','Ucretsiz')),
  start_date    date not null,
  end_date      date not null,
  days          numeric(5,1) generated always as
                (end_date - start_date + 1) stored,
  status        text not null default 'pending'
                check (status in ('pending','approved','rejected')),
  approver_id   uuid references public.profiles(id) on delete set null,
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references public.profiles(id),
  constraint chk_leave_dates check (end_date >= start_date)
);

create trigger trg_leaves_updated
  before update on public.leaves
  for each row execute function public.set_updated_at();

create index on public.leaves (company_id, employee_id);
create index on public.leaves (start_date, end_date);
create index on public.leaves (status);

-- ============================================================
-- 6) ATTENDANCE (one row per employee per month)
-- ============================================================
create table public.attendance (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  month_date  date not null,  -- always first day of month (YYYY-MM-01)
  day_status  int[] not null default '{}'::int[],  -- length 31
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint unique_month unique (employee_id, month_date)
);

create trigger trg_attendance_updated
  before update on public.attendance
  for each row execute function public.set_updated_at();

create index on public.attendance (company_id, month_date);

-- ============================================================
-- 7) TEMPLATES (document templates)
-- ============================================================
create table public.templates (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  content     text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_templates_updated
  before update on public.templates
  for each row execute function public.set_updated_at();

create index on public.templates (company_id);

-- ============================================================
-- 8) DOCUMENTS
-- ============================================================
create table public.documents (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  employee_id     uuid not null references public.employees(id) on delete cascade,
  template_id     uuid not null references public.templates(id) on delete cascade,
  signed_content_hash text,
  pdf_path        text,
  status          text not null default 'draft'
                  check (status in ('draft','sent','signed','archived')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references public.profiles(id)
);

create trigger trg_documents_updated
  before update on public.documents
  for each row execute function public.set_updated_at();

create index on public.documents (company_id);

-- ============================================================
-- 9) NOTIFICATIONS
-- ============================================================
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,
  payload     jsonb,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index on public.notifications (user_id, read_at);

-- ============================================================
-- 10) AUDIT LOGS (KVKK Madde 12)
-- ============================================================
create table public.audit_logs (
  id          bigserial primary key,
  company_id  uuid not null references public.companies(id) on delete cascade,
  actor_id    uuid references public.profiles(id) on delete set null,
  action      text not null check (action in ('create','update','delete')),
  entity      text not null,
  entity_id   uuid,
  diff        jsonb,
  ip          inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index on public.audit_logs (company_id, created_at desc);
create index on public.audit_logs (entity, entity_id);

-- ============================================================
-- 11) SUBSCRIPTIONS (Stripe cache)
-- ============================================================
create table public.subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  company_id            uuid not null references public.companies(id) on delete cascade,
  stripe_subscription_id text unique,
  status                text,
  current_period_end    timestamptz,
  created_at            timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger trg_subscriptions_updated
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ============================================================
-- 12) AUTH TRIGGER - new auth.users -> profiles row
-- ============================================================
-- We do NOT auto-create profile here because we need a company_id.
-- Profile creation happens in the signup RPC (see below).
-- But we DO auto-cleanup: when auth.users deleted, profiles cascade handles it.

-- ============================================================
-- 13) RPC: Sign up a new company + first admin user
-- ============================================================
-- Called from client after auth.signUp() succeeds. The client passes
-- its new auth.uid() and we insert both company and profile in one tx.
create or replace function public.sign_up_company(
  p_company_name text,
  p_company_slug  text,
  p_full_name    text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_profile_id uuid;
begin
  -- Caller must be authenticated (auth.uid() returns the new user id)
  if auth.uid() is null then
    raise exception 'Yetkisiz: kullanici oturum acmamis';
  end if;

  -- Create company
  insert into public.companies (name, slug, plan, employee_quota, trial_ends_at)
  values (p_company_name, p_company_slug, 'pro', 50, now() + interval '14 days')
  returning id into v_company_id;

  -- Create admin profile linked to current user
  insert into public.profiles (id, company_id, email, full_name, role, is_active)
  select auth.uid(), v_company_id, u.email, p_full_name, 'company_admin', true
  from auth.users u where u.id = auth.uid()
  returning id into v_profile_id;

  return v_company_id;
end;
$$;

-- ============================================================
-- 14) ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tenant-scoped tables
alter table public.companies     enable row level security;
alter table public.profiles      enable row level security;
alter table public.departments   enable row level security;
alter table public.employees     enable row level security;
alter table public.leaves        enable row level security;
alter table public.attendance    enable row level security;
alter table public.templates     enable row level security;
alter table public.documents    enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs   enable row level security;
alter table public.subscriptions enable row level security;

-- Helper: get caller's company_id (single source of truth)
create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid();
$$;

-- Helper: get caller's role
create or replace function public.get_current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Helper: is caller at least hr_manager?
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.get_current_role() in ('hr_manager','company_admin','super_admin');
$$;

-- -------- companies --------
create policy "Tenant: read own company"
  on public.companies for select
  using (id = public.current_company_id());

create policy "Admin: update own company"
  on public.companies for update
  using (id = public.current_company_id() and public.get_current_role() in ('company_admin','super_admin'));

-- -------- profiles --------
create policy "Member: see colleagues"
  on public.profiles for select
  using (company_id = public.current_company_id());

create policy "Admin: manage profiles"
  on public.profiles for all
  using (company_id = public.current_company_id() and public.is_staff())
  with check (company_id = public.current_company_id() and public.is_staff());

create policy "Self: update own profile basic fields"
  on public.profiles for update
  using (id = auth.uid());

-- -------- departments --------
create policy "Tenant: read departments"
  on public.departments for select
  using (company_id = public.current_company_id());

create policy "Staff: manage departments"
  on public.departments for all
  using (company_id = public.current_company_id() and public.is_staff())
  with check (company_id = public.current_company_id() and public.is_staff());

-- -------- employees --------
create policy "Tenant: read employees"
  on public.employees for select
  using (company_id = public.current_company_id());

create policy "Staff: write employees"
  on public.employees for all
  using (company_id = public.current_company_id() and public.is_staff())
  with check (company_id = public.current_company_id() and public.is_staff());

-- Employees who have a linked user_id can read their own row (no company_id leak)
create policy "Self: read own employee record"
  on public.employees for select
  using (user_id = auth.uid());

-- -------- leaves --------
create policy "Staff: read all leaves"
  on public.leaves for select
  using (company_id = public.current_company_id() and public.is_staff());

create policy "Self: read own leaves"
  on public.leaves for select
  using (employee_id in (
    select id from public.employees where user_id = auth.uid()
  ));

create policy "Self: create own leave (pending)"
  on public.leaves for insert
  with check (
    company_id = public.current_company_id()
    and employee_id in (
      select id from public.employees where user_id = auth.uid()
    )
    and status = 'pending'
  );

create policy "Staff: write leaves"
  on public.leaves for all
  using (company_id = public.current_company_id() and public.is_staff())
  with check (company_id = public.current_company_id() and public.is_staff());

-- -------- attendance --------
create policy "Staff: read/write attendance"
  on public.attendance for all
  using (company_id = public.current_company_id() and public.is_staff())
  with check (company_id = public.current_company_id() and public.is_staff());

create policy "Self: read own attendance"
  on public.attendance for select
  using (employee_id in (
    select id from public.employees where user_id = auth.uid()
  ));

-- -------- templates --------
create policy "Tenant: read templates"
  on public.templates for select
  using (company_id = public.current_company_id());

create policy "Staff: manage templates"
  on public.templates for all
  using (company_id = public.current_company_id() and public.is_staff())
  with check (company_id = public.current_company_id() and public.is_staff());

-- -------- documents --------
create policy "Staff: manage documents"
  on public.documents for all
  using (company_id = public.current_company_id() and public.is_staff())
  with check (company_id = public.current_company_id() and public.is_staff());

create policy "Self: read own documents"
  on public.documents for select
  using (employee_id in (
    select id from public.employees where user_id = auth.uid()
  ));

-- -------- notifications --------
create policy "Self: own notifications"
  on public.notifications for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- -------- audit_logs --------
create policy "Staff: read audit logs"
  on public.audit_logs for select
  using (company_id = public.current_company_id() and public.is_staff());

-- -------- subscriptions --------
create policy "Admin: read subscription"
  on public.subscriptions for select
  using (company_id = public.current_company_id() and public.get_current_role() in ('company_admin','super_admin'));

-- ============================================================
-- 15) REVOKE direct table access from anon/authenticated
-- ============================================================
-- By default Supabase grants ALL to anon/authenticated roles. We strip
-- these and rely solely on RLS + policies above.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- But allow sequences for inserts (e.g. audit_logs.id bigserial)
grant usage, select on sequence public.audit_logs_id_seq to authenticated;

-- Grant DML access to authenticated users; RLS filters everything further.
grant select, insert, update, delete on all tables in schema public to authenticated;

-- Allow the sign_up_company function (SECURITY DEFINER) to operate
grant execute on function public.sign_up_company(text,text,text) to authenticated;
grant execute on function public.current_company_id() to authenticated;
grant execute on function public.get_current_role() to authenticated;
grant execute on function public.is_staff() to authenticated;

-- ============================================================
-- 16) Audit log helper (PL/pgSQL) - call from app triggers later
-- ============================================================
create or replace function public.audit_log(
  p_entity text,
  p_entity_id uuid,
  p_action text,
  p_diff jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (company_id, actor_id, entity, entity_id, action, diff)
  values (public.current_company_id(), auth.uid(), p_entity, p_entity_id, p_action, p_diff);
end;
$$;

grant execute on function public.audit_log(text,uuid,text,jsonb) to authenticated;

-- ============================================================
-- Done. End of migration 0001.
-- ============================================================


