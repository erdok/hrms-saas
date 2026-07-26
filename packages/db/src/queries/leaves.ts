import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types-generated'

export type LeaveRow = Database['public']['Tables']['leaves']['Row']
export type LeaveInsert = Database['public']['Tables']['leaves']['Insert']
export type LeaveUpdate = Database['public']['Tables']['leaves']['Update']
export type LeaveType = 'Yillik' | 'Mazeret' | 'Hastalik' | 'Ucretsiz'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'

export interface LeaveWithEmployee {
  id: string
  employee_id: string
  employee_name: string
  department_id: string | null
  department_name: string | null
  type: LeaveType
  start_date: string
  end_date: string
  days: number
  status: LeaveStatus
  note: string | null
  approver_id: string | null
  approver_name: string | null
  created_at: string
}

export interface LeaveBalance {
  total_leave_days: number
  used_days: number
  remaining_days: number
  pending_days: number
}

export interface LeaveOverlap {
  leave_id: string
  type: LeaveType
  start_date: string
  end_date: string
  days: number
  status: LeaveStatus
}

export interface ListLeavesFilters {
  status?: LeaveStatus
  departmentId?: string | null
  type?: LeaveType
  from?: string
  to?: string
}

/**
 * List leaves with employee + department joined via the typed RPC.
 * RLS guarantees tenant scoping.
 */
export async function listLeaves(
  supabase: SupabaseClient<Database>,
  filters: ListLeavesFilters = {},
): Promise<LeaveWithEmployee[]> {
  const { data, error } = await supabase.rpc('list_leaves_with_employee', {
    p_status: filters.status ?? undefined,
    p_department_id: filters.departmentId ?? undefined,
    p_type: filters.type ?? undefined,
    p_from: filters.from ?? undefined,
    p_to: filters.to ?? undefined,
  })
  if (error) throw error
  return (data ?? []) as LeaveWithEmployee[]
}

/** Get annual-leave balance for an employee (approved + pending). */
export async function getLeaveBalance(
  supabase: SupabaseClient<Database>,
  employeeId: string,
): Promise<LeaveBalance> {
  const { data, error } = await supabase.rpc('get_leave_balance', {
    p_employee_id: employeeId,
  })
  if (error) throw error
  const row = (data ?? [])[0] ?? {
    total_leave_days: 0,
    used_days: 0,
    remaining_days: 0,
    pending_days: 0,
  } as LeaveBalance
  return row as LeaveBalance
}

/** Check whether requested dates clash with an existing (non-rejected) leave. */
export async function checkLeaveOverlap(
  supabase: SupabaseClient<Database>,
  employeeId: string,
  startDate: string,
  endDate: string,
  excludeLeaveId?: string | null,
): Promise<LeaveOverlap[]> {
  const { data, error } = await supabase.rpc('check_leave_overlap', {
    p_employee_id: employeeId,
    p_start: startDate,
    p_end: endDate,
    p_exclude_leave_id: excludeLeaveId ?? undefined,
  })
  if (error) throw error
  return (data ?? []) as LeaveOverlap[]
}

/**
 * Create a leave request.
 * - Employee creates with status='pending'
 * - Staff/admin may pre-approve (status passed in input)
 * - Performs client-side overlap check; throws on conflict.
 */
export async function createLeave(
  supabase: SupabaseClient<Database>,
  input: Omit<LeaveInsert, 'company_id'>,
  companyId: string,
  options?: { skipOverlapCheck?: boolean },
): Promise<LeaveRow> {
  if (!options?.skipOverlapCheck) {
    const overlaps = await checkLeaveOverlap(
      supabase,
      input.employee_id,
      input.start_date,
      input.end_date,
      null,
    )
    if (overlaps.length > 0) {
      throw new LeaveOverlapError(overlaps)
    }
  }
  const payload: LeaveInsert = { ...input, company_id: companyId }
  const { data, error } = await supabase
    .from('leaves')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Update a leave (used for editing by owner before approval). */
export async function updateLeave(
  supabase: SupabaseClient<Database>,
  id: string,
  patch: LeaveUpdate,
): Promise<LeaveRow> {
  const { data, error } = await supabase
    .from('leaves')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Approve a pending leave. Sets approver_id implicitly (RLS-protected).
 *  Refresh balance on conflict is up to the caller. */
export async function approveLeave(
  supabase: SupabaseClient<Database>,
  id: string,
  approverId: string,
): Promise<LeaveRow> {
  const { data, error } = await supabase
    .from('leaves')
    .update({ status: 'approved', approver_id: approverId })
    .eq('id', id)
    .eq('status', 'pending') // safeguard: only pending can be approved
    .select()
    .single()
  if (error) throw error
  return data
}

/** Reject a pending leave. */
export async function rejectLeave(
  supabase: SupabaseClient<Database>,
  id: string,
  approverId: string,
  note?: string,
): Promise<LeaveRow> {
  const { data, error } = await supabase
    .from('leaves')
    .update({ status: 'rejected', approver_id: approverId, note: note ?? undefined })
    .eq('id', id)
    .eq('status', 'pending')
    .select()
    .single()
  if (error) throw error
  return data
}

/** Cancel/delete a leave. Allowed only if not yet approved (or by staff). */
export async function cancelLeave(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from('leaves')
    .delete()
    .eq('id', id)
    .or('status.eq.pending,status.eq.rejected')
  if (error) throw error
}

/** Hard delete for staff (admin override). */
export async function hardDeleteLeave(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await supabase.from('leaves').delete().eq('id', id)
  if (error) throw error
}

/** Class representing a clash failure raised by createLeave. */
export class LeaveOverlapError extends Error {
  constructor(public readonly overlaps: LeaveOverlap[]) {
    super('Izin tarihi mevcut bir izinle cakisiyor')
    this.name = 'LeaveOverlapError'
  }
}
