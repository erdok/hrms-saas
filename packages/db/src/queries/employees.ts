import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types-generated'

export type EmployeeRow = Database['public']['Tables']['employees']['Row']
type EmployeeInsert = Database['public']['Tables']['employees']['Insert']
type EmployeeUpdate = Database['public']['Tables']['employees']['Update']

/** Strongly-typed return shape of the `list_employees_with_stats` RPC. */
export interface EmployeeStatsRow {
  id: string
  first_name: string
  last_name: string
  full_name: string
  gender: 'K' | 'E' | null
  department_id: string | null
  department_name: string | null
  start_date: string
  contract_end: string | null
  phone: string | null
  email: string | null
  salary: number | null
  total_leave_days: number
  used_leave_days: number
  remaining_leave_days: number
  status: 'active' | 'passive'
  created_at: string
}

export interface ListEmployeesArgs {
  search?: string
  departmentId?: string | null
  status?: 'active' | 'passive'
  page?: number
  pageSize?: number
}

export interface ListEmployeesResult {
  rows: EmployeeStatsRow[]
  total: number
}

/**
 * Server-side paginated, filtered employee list via the
 * `list_employees_with_stats` RPC. RLS guarantees tenant scoping.
 */
export async function listEmployees(
  supabase: SupabaseClient<Database>,
  args: ListEmployeesArgs = {},
): Promise<ListEmployeesResult> {
  const { search, departmentId, status, page = 1, pageSize = 20 } = args

  const { data, error } = await supabase.rpc('list_employees_with_stats')
  if (error) throw error

  let rows = (data ?? []) as EmployeeStatsRow[]

  if (status) rows = rows.filter((r) => r.status === status)
  if (departmentId) rows = rows.filter((r) => r.department_id === departmentId)
  if (search) {
    const needle = search.toLocaleLowerCase('tr')
    rows = rows.filter((r) =>
      r.full_name.toLowerCase('tr').includes(needle),
    )
  }

  const total = rows.length
  const start = (page - 1) * pageSize
  rows = rows.slice(start, start + pageSize)

  return { rows, total }
}

/**
 * Get one employee by id (tenant-scoped via RLS).
 */
export async function getEmployee(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<EmployeeRow | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

/**
 * Insert a new employee. The `company_id` is taken from the authed profile;
 * we also pass it explicitly so RLS's WITH CHECK passes even if the
 * Supabase server client has stale session.
 */
export async function createEmployee(
  supabase: SupabaseClient<Database>,
  input: Omit<EmployeeInsert, 'company_id'>,
  companyId: string,
): Promise<EmployeeRow> {
  const payload: EmployeeInsert = { ...input, company_id: companyId }
  const { data, error } = await supabase
    .from('employees')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

/**
 * Update an existing employee (RLS-scoped to tenant automatically).
 */
export async function updateEmployee(
  supabase: SupabaseClient<Database>,
  id: string,
  patch: EmployeeUpdate,
): Promise<EmployeeRow> {
  const { data, error } = await supabase
    .from('employees')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

/**
 * Soft-archive an employee (status -> 'passive').
 */
export async function archiveEmployee(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from('employees')
    .update({ status: 'passive' })
    .eq('id', id)
  if (error) throw error
}

/**
 * Restore an archived employee (status -> 'active').
 */
export async function restoreEmployee(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from('employees')
    .update({ status: 'active' })
    .eq('id', id)
  if (error) throw error
}

/**
 * Hard delete. Discouraged - prefer archive. Audit log will still record it
 * via the BEFORE DELETE trigger.
 */
export async function deleteEmployee(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await supabase.from('employees').delete().eq('id', id)
  if (error) throw error
}
