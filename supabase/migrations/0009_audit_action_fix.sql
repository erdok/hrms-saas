-- ============================================================
-- HRMS SaaS - Migration 0009
-- ============================================================
-- Fix audit_logs.action CHECK constraint to accept 'insert'
-- (audit trigger uses lower(tg_op) which produces 'insert',
--  but constraint was defined with 'create' only).

alter table public.audit_logs
  drop constraint audit_logs_action_check;

alter table public.audit_logs
  add constraint audit_logs_action_check
  check (action in ('create','insert','update','delete'));
