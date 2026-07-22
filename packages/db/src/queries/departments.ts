import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types-generated'

export type DepartmentRow = Database['public']['Tables']['departments']['Row']
type DepartmentInsert = Database['public']['Tables']['departments']['Insert']
type DepartmentUpdate = Database['public']['Tables']['departments']['Update']

export interface DepartmentWithCount extends DepartmentRow {
  employee_count: number
}

/** Simple list of departments in the current tenant. */
export async function listDepartments(
  supabase: SupabaseClient<Database>,
): Promise<DepartmentRow[]> {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name')
  if (error) throw error
  return data ?? []
}

/** List departments with active employee counts. */
export async function listDepartmentsWithCounts(
  supabase: SupabaseClient<Database>,
): Promise<DepartmentWithCount[]> {
  const [deptsResp, empsResp] = await Promise.all([
    supabase.from('departments').select('*').order('name'),
    supabase
      .from('employees')
      .select('department_id')
      .eq('status', 'active'),
  ])

  if (deptsResp.error) throw deptsResp.error
  if (empsResp.error) throw empsResp.error

  const counts = new Map<string, number>()
  for (const e of empsResp.data ?? []) {
    if (!e.department_id) continue
    counts.set(e.department_id, (counts.get(e.department_id) ?? 0) + 1)
  }

  return (deptsResp.data ?? []).map((d) => ({
    ...d,
    employee_count: counts.get(d.id) ?? 0,
  }))
}

/** Create a new department in the current tenant. */
export async function createDepartment(
  supabase: SupabaseClient<Database>,
  name: string,
  companyId: string,
  parentId?: string | null,
): Promise<DepartmentRow> {
  const payload: DepartmentInsert = {
    name,
    company_id: companyId,
    parent_id: parentId ?? null,
  }
  const { data, error } = await supabase
    .from('departments')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Rename / reparent a department. */
export async function updateDepartment(
  supabase: SupabaseClient<Database>,
  id: string,
  patch: DepartmentUpdate,
): Promise<DepartmentRow> {
  const { data, error } = await supabase
    .from('departments')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Delete a department. Employees referencing it get NULL via on delete set null. */
export async function deleteDepartment(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await supabase.from('departments').delete().eq('id', id)
  if (error) throw error
}
