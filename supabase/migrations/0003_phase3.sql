-- ============================================================
-- HRMS SaaS - Migration 0003 (Phase 3 - Leaves)
-- ============================================================
-- 1. leave_balance view (per-employee annual allowance summary)
-- 2. leaves_with_employee RPC (join employee + department)
-- 3. check_leave_overlap RPC (clash detection per EMPLOYEE),
--    per DEPARTMENT (limit 30% same-day overlap)
-- 4. Audit triggers for leaves
-- 5. Notification helper for approvals
-- ============================================================

-- 1) leave_balance: hem approved hem pending gün toplami
create or replace view public.leave_balance as
select
  e.id               as employee_id,
  e.company_id       as company_id,
  e.full_name        as full_name,
  e.total_leave_days as total_leave_days,
  coalesce((
    select sum(l.days::numeric)
      from public.leaves l
     where l.employee_id = e.id
       and l.type = 'Yillik'
       and l.status = 'approved'
  ), 0)::int                                              as used_days,
  e.total_leave_days - coalesce((
    select sum(l.days::numeric)
      from public.leaves l
     where l.employee_id = e.id
       and l.type = 'Yillik'
       and l.status in ('approved','pending')
  ), 0)::int                                              as remaining_days
from public.employees e
where e.status = 'active';

grant select on public.leave_balance to authenticated;

-- 2) Audit trigger for leaves
drop trigger if exists trg_audit_leaves on public.leaves;
create trigger trg_audit_leaves
  after insert or update or delete on public.leaves
  for each row execute function public.audit_trigger_fn();

-- 3) leave balance RPC (typed, single tenant via RLS)
create or replace function public.get_leave_balance(p_employee_id uuid)
returns table (
  total_leave_days int,
  used_days int,
  remaining_days int,
  pending_days numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.total_leave_days,
    coalesce((
      select sum(l.days::numeric)::int from public.leaves l
       where l.employee_id = p_employee_id
         and l.type = 'Yillik' and l.status = 'approved'
    ), 0) as used_days,
    e.total_leave_days - coalesce((
      select sum(l.days::numeric)::int from public.leaves l
       where l.employee_id = p_employee_id
         and l.type = 'Yillik' and l.status in ('approved','pending')
    ), 0) as remaining_days,
    coalesce((
      select sum(l.days::numeric) from public.leaves l
       where l.employee_id = p_employee_id
         and l.type = 'Yillik' and l.status = 'pending'
    ), 0) as pending_days
  from public.employees e
  where e.id = p_employee_id;
$$;
grant execute on function public.get_leave_balance(uuid) to authenticated;

-- 4) check_leave_overlap: per-employee date overlap (returns existing clash rows)
create or replace function public.check_leave_overlap(
  p_employee_id uuid,
  p_start date,
  p_end date,
  p_exclude_leave_id uuid default null
)
returns table (
  leave_id uuid,
  type text,
  start_date date,
  end_date date,
  days numeric,
  status text
)
language sql
stable
security definer
set search_path = public
as $$
  select id, type, start_date, end_date, days, status
  from public.leaves
  where employee_id = p_employee_id
    and status not in ('rejected')
    and (p_exclude_leave_id is null or id <> p_exclude_leave_id)
    and daterange(start_date, end_date + 1, '[]')
        && daterange(p_start, p_end + 1, '[]');
$$;
grant execute on function public.check_leave_overlap(uuid, date, date, uuid) to authenticated;

-- 5) leaves_with_employee RPC (rich listing)
create or replace function public.list_leaves_with_employee(
  p_status text default null,
  p_department_id uuid default null,
  p_type text default null,
  p_from date default null,
  p_to date default null
)
returns table (
  id uuid,
  employee_id uuid,
  employee_name text,
  department_id uuid,
  department_name text,
  type text,
  start_date date,
  end_date date,
  days numeric,
  status text,
  note text,
  approver_id uuid,
  approver_name text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    l.id,
    l.employee_id,
    e.full_name,
    e.department_id,
    d.name,
    l.type,
    l.start_date,
    l.end_date,
    l.days,
    l.status,
    l.note,
    l.approver_id,
    p.full_name,
    l.created_at
  from public.leaves l
  join public.employees e on e.id = l.employee_id
  left join public.departments d on d.id = e.department_id
  left join public.profiles p on p.id = l.approver_id
  where l.company_id = public.current_company_id()
    and (p_status is null or l.status = p_status)
    and (p_department_id is null or e.department_id = p_department_id)
    and (p_type is null or l.type = p_type)
    and (p_from is null or l.end_date >= p_from)
    and (p_to is null or l.start_date <= p_to)
  order by l.start_date desc, l.created_at desc;
$$;

revoke all on function public.list_leaves_with_employee(
  text, uuid, text, date, date
) from anon, authenticated;
grant execute on function public.list_leaves_with_employee(
  text, uuid, text, date, date
) to authenticated;

-- 6) send notification helper (called inside triggers / RPC)
create or replace function public.notify_user(
  p_user_id uuid,
  p_type text,
  p_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid;
begin
  select company_id into v_company from public.profiles where id = p_user_id;
  if v_company is null then return; end if;
  insert into public.notifications (company_id, user_id, type, payload)
  values (v_company, p_user_id, p_type, p_payload);
end;
$$;
grant execute on function public.notify_user(uuid, text, jsonb) to authenticated;

-- ============================================================
-- Done. End of migration 0003.
-- ============================================================
