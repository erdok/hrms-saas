-- ============================================================
-- HRMS SaaS - Migration 0005 (Phase 5 - Documents)
-- ============================================================
-- Audit triggers for templates and documents
-- Storage bucket creation helper
-- ============================================================

drop trigger if exists trg_audit_templates on public.templates;
create trigger trg_audit_templates
  after insert or update or delete on public.templates
  for each row execute function public.audit_trigger_fn();

drop trigger if exists trg_audit_documents on public.documents;
create trigger trg_audit_documents
  after insert or update or delete on public.documents
  for each row execute function public.audit_trigger_fn();

-- Storage buckets (created via SQL for reproducible local dev)
-- NOTE: Supabase Storage buckets can be created via dashboard too,
-- but creating them here keeps migrations idempotent.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

alter table public.documents enable row level security;

-- Allow owner / staff to read/write documents PDFs in storage
-- (Resource-level; object-level policies live at storage.objects)
create policy "Staff manage documents bucket"
  on storage.objects for all
  using (
    bucket_id = 'documents'
    and public.is_staff()
  );

-- Document render helper: returns rendered HTML with tokens replaced
create or replace function public.render_template(
  p_template_id uuid,
  p_employee_id uuid
)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_template text;
  v_emp record;
  v_html text;
begin
  select content into v_template from public.templates
  where id = p_template_id
    and company_id = public.current_company_id();
  if v_template is null then
    raise exception 'Sirket icinde sablon bulunamadi';
  end if;

  select * into v_emp from public.employees
  where id = p_employee_id
    and company_id = public.current_company_id();
  if v_emp is null then
    raise exception 'Personel bulunamadi';
  end if;

  v_html := v_template;
  v_html := replace(v_html, '{{name}}', v_emp.full_name);
  v_html := replace(v_html, '{{firstName}}', v_emp.first_name);
  v_html := replace(v_html, '{{lastName}}', v_emp.last_name);
  v_html := replace(v_html, '{{gender}}', v_emp.gender);
  v_html := replace(v_html, '{{tcKimlik}}', coalesce(public.tc_kimlik_decrypt(v_emp.tc_kimlik_enc), ''));
  v_html := replace(v_html, '{{departmentName}}', coalesce((
    select d.name from public.departments d where d.id = v_emp.department_id
  ), ''));
  v_html := replace(v_html, '{{startDate}}', to_char(v_emp.start_date, 'DD.MM.YYYY'));
  v_html := replace(v_html, '{{contractEnd}}', case
    when v_emp.contract_end is null then 'Suresiz'
    else to_char(v_emp.contract_end, 'DD.MM.YYYY')
  end);
  v_html := replace(v_html, '{{address}}', coalesce(v_emp.address, ''));
  v_html := replace(v_html, '{{phone}}', coalesce(v_emp.phone, ''));
  v_html := replace(v_html, '{{email}}', coalesce(v_emp.email, ''));
  v_html := replace(v_html, '{{salary}}', coalesce(v_emp.salary::text, ''));
  v_html := replace(v_html, '{{totalLeaveDays}}', v_emp.total_leave_days::text);
  v_html := replace(v_html, '{{currentDate}}', to_char(now(), 'DD.MM.YYYY'));
  v_html := replace(v_html, '{{currentDateLong}}', to_char(now(), 'DD Month YYYY'));

  return v_html;
end;
$$;
grant execute on function public.render_template(uuid, uuid) to authenticated;

-- ============================================================
-- Done. End of migration 0005.
-- ============================================================
