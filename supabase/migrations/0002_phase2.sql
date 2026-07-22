-- ============================================================
-- HRMS SaaS - Migration 0002 (Phase 2)
-- ============================================================
-- 1. Audit triggers for employees & departments (KVKK Madde 12)
-- 2. TC Kimlik encryption helper (pgcrypto)
-- 3. Additional indexes for performance
-- ============================================================

-- ============================================================
-- 1) Audit log trigger function (generic)
-- ============================================================
-- Captures BEFORE UPDATE/DELETE diffs and writes to audit_logs.
-- For INSERT we log the new row.

create or replace function public.audit_trigger_fn()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid;
  v_actor  uuid := auth.uid();
  v_diff   jsonb;
begin
  -- Determine company_id from the row (works for any tenant-scoped table)
  if tg_op = 'DELETE' then
    v_company := (old).company_id;
    v_diff := jsonb_build_object('before', to_jsonb(old));
  elsif tg_op = 'UPDATE' then
    v_company := (new).company_id;
    v_diff := jsonb_build_object(
      'before', to_jsonb(old),
      'after',  to_jsonb(new)
    );
  else  -- INSERT
    v_company := (new).company_id;
    v_diff := jsonb_build_object('after', to_jsonb(new));
  end if;

  insert into public.audit_logs (
    company_id, actor_id, action, entity, entity_id, diff
  )
  values (
    v_company,
    v_actor,
    lower(tg_op),
    tg_table_name,
    case when tg_op = 'DELETE' then old.id else new.id end,
    v_diff
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- ============================================================
-- 2) Apply audit triggers to employee & departments
-- ============================================================
drop trigger if exists trg_audit_employees on public.employees;
create trigger trg_audit_employees
  after insert or update or delete on public.employees
  for each row execute function public.audit_trigger_fn();

drop trigger if exists trg_audit_departments on public.departments;
create trigger trg_audit_departments
  after insert or update or delete on public.departments
  for each row execute function public.audit_trigger_fn();

-- ============================================================
-- 3) TC Kimlik encryption helper (pgcrypto)
-- ============================================================
-- We accept an env-based passphrase via current_setting('app.tc_key').
-- Caller passes the SETTING before insert/update.
--
-- Usage in app:
--   await supabase.rpc('set_config', { name: 'app.tc_key', value: process.env.TC_ENCRYPTION_KEY })
--   (or use encrypted insert via direct SQL in a server component using
--    the admin client and `pgp_sym_encrypt`).
--
-- For Phase 2 we expose a function pair:
--   - tc_kimlik_encrypt(raw text) -> text
--   - tc_kimlik_decrypt(enc text) -> text (security definer, restricted)

-- Encrypted value is a binary text. Stored in employees.tc_kimlik_enc.

create or replace function public.tc_kimlik_encrypt(p_raw text)
returns text
language sql
volatile
security definer
set search_path = public, extensions
as $$
  select pgp_sym_encrypt(p_raw, current_setting('app.tc_key', true))
$$;

create or replace function public.tc_kimlik_decrypt(p_enc text)
returns text
language sql
volatile
security definer
set search_path = public, extensions
as $$
  select pgp_sym_decrypt(p_enc::bytea, current_setting('app.tc_key', true))
$$;

-- Restrict: only staff can decrypt
revoke execute on function public.tc_kimlik_decrypt(text) from anon, authenticated;
grant execute on function public.tc_kimlik_encrypt(text) to authenticated;
-- tc_kimlik_decrypt granted explicitly to staff role-checks in app.

-- ============================================================
-- 4) Additional indexes for filter queries
-- ============================================================
create index if not exists idx_employees_company_name
  on public.employees (company_id, last_name, first_name)
  where status = 'active';

create index if not exists idx_employees_contract_end
  on public.employees (contract_end)
  where status = 'active';

create index if not exists idx_leaves_pending
  on public.leaves (company_id, status)
  where status = 'pending';

-- ============================================================
-- 5) RPC: List employees with department & leave-usage joined
-- ============================================================
-- Avoids N+1 client queries for the dashboard/employee list.
-- Pagination via range (limit/offset handled client-side via .range()).

create or replace function public.list_employees_with_stats()
returns table (
  id uuid,
  first_name text,
  last_name text,
  full_name text,
  gender text,
  department_id uuid,
  department_name text,
  start_date date,
  contract_end date,
  phone text,
  email text,
  salary numeric,
  total_leave_days int,
  used_leave_days numeric,
  remaining_leave_days numeric,
  status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id,
    e.first_name,
    e.last_name,
    e.full_name,
    e.gender,
    e.department_id,
    d.name   as department_name,
    e.start_date,
    e.contract_end,
    e.phone,
    e.email,
    e.salary,
    e.total_leave_days,
    coalesce(
      (select sum(l.days)
         from public.leaves l
        where l.employee_id = e.id
          and l.type = 'Yillik'
          and l.status in ('approved')),
      0
    ) as used_leave_days,
    e.total_leave_days - coalesce(
      (select sum(l.days)
         from public.leaves l
        where l.employee_id = e.id
          and l.type = 'Yillik'
          and l.status in ('approved')),
      0
    ) as remaining_leave_days,
    e.status,
    e.created_at
  from public.employees e
  left join public.departments d on d.id = e.department_id
  where e.company_id = public.current_company_id()
  order by e.last_name, e.first_name;
$$;

revoke all on function public.list_employees_with_stats() from anon, authenticated;
grant execute on function public.list_employees_with_stats() to authenticated;

-- ============================================================
-- Done. End of migration 0002.
-- ============================================================
