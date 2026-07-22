-- ============================================================
-- HRMS SaaS - Migration 0004 (Phase 4 - Attendance)
-- ============================================================
-- 1. Audit trigger on attendance
-- 2. upsert_attendance RPC: insert record if missing else update day_status
-- 3. attendance_month RPC: returns employees + day_status for given month
-- 4. attendance_summary RPC: per-employee monthly aggregates
-- 5. Public holiday table (lightweight; API integration Aşama 7)
-- ============================================================

-- 1) Audit trigger
drop trigger if exists trg_audit_attendance on public.attendance;
create trigger trg_audit_attendance
  after insert or update or delete on public.attendance
  for each row execute function public.audit_trigger_fn();

-- 2) upsert_attendance RPC
create or replace function public.upsert_attendance(
  p_employee_id uuid,
  p_month date,                       -- first day of month
  p_day_status int[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_company uuid := public.current_company_id();
begin
  if v_company is null then
    raise exception 'Tenant bulunamadi';
  end if;

  -- normalize month_date
  p_month := date_trunc('month', p_month)::date;
  if array_length(p_day_status, 1) <> 31 then
    raise exception 'day_status 31 elemanli olmali';
  end if;

  insert into public.attendance (company_id, employee_id, month_date, day_status)
  values (v_company, p_employee_id, p_month, p_day_status)
  on conflict (employee_id, month_date)
  do update set day_status = excluded.day_status, updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;
grant execute on function public.upsert_attendance(uuid, date, int[]) to authenticated;

-- 3) attendance_month RPC (rich listing)
create or replace function public.attendance_month(
  p_month date                       -- first day of month
)
returns table (
  id uuid,
  employee_id uuid,
  employee_name text,
  department_name text,
  day_status int[]
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.id,
    a.employee_id,
    e.full_name,
    d.name,
    a.day_status
  from public.attendance a
  join public.employees e on e.id = a.employee_id
  left join public.departments d on d.id = e.department_id
  where a.company_id = public.current_company_id()
    and a.month_date = date_trunc('month', p_month)::date
  order by e.full_name;
$$;
grant execute on function public.attendance_month(date) to authenticated;

-- 4) attendance_summary RPC (per-employee monthly totals)
-- Codes: 0 = empty, 1 = G (geldi), 2 = R (raporlu),
--        3 = I (izinli), 4 = T (tatil), 5 = B (boss)
create or replace function public.attendance_summary(
  p_month date
)
returns table (
  employee_id uuid,
  employee_name text,
 _department text,
  came_count int,
  report_count int,
  leave_count int,
  holiday_count int,
  other_count int
)
language sql
stable
security definer
set search_path = public
as $$
  with day_expanded as (
    select
      a.employee_id,
      e.full_name as employee_name,
      d.name as department_name,
      a.day_status[i] as code
    from public.attendance a
    join public.employees e on e.id = a.employee_id
    left join public.departments d on d.id = e.department_id
    cross join generate_series(1, 31) as i
    where a.company_id = public.current_company_id()
      and a.month_date = date_trunc('month', p_month)::date
  )
  select
    employee_id,
    employee_name,
    department_name,
    count(*) filter (where code = 1) as came_count,
    count(*) filter (where code = 2) as report_count,
    count(*) filter (where code = 3) as leave_count,
    count(*) filter (where code = 4) as holiday_count,
    count(*) filter (where code in (0, 5)) as other_count
  from day_expanded
  group by employee_id, employee_name, department_name
  order by employee_name;
$$;
grant execute on function public.attendance_summary(date) to authenticated;

-- 5) Public holidays table 
create table public.public_holidays (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  name text not null,
  country text not null default 'TR',
  created_at timestamptz not null default now(),
  unique (date, country)
);
alter table public.public_holidays enable row level security;
create policy "Anyone authenticated can read public_holidays"
  on public.public_holidays for select
  using (true);
grant select on public.public_holidays to authenticated;

-- ============================================================
-- Done. End of migration 0004.
-- ============================================================
