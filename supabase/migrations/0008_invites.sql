create table public.invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  role text not null default 'employee' check (role in ('company_admin','hr_manager','employee')),
  invited_by uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create index on public.invites (company_id, email);

alter table public.invites enable row level security;
create policy "Staff can manage invites" on public.invites for all
  using (company_id = public.current_company_id() and public.is_staff())
  with check (company_id = public.current_company_id() and public.is_staff());
