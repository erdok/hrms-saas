'use server'

import { revalidatePath } from 'next/cache'
import { createClient, type Session } from '@hrms/db/server'
import { listEmployees, createEmployee, updateEmployee, archiveEmployee, deleteEmployee, restoreEmployee } from '@hrms/db/server'
import { EmployeeCreateSchema, EmployeeStatusSchema } from '@hrms/types'
import { requirePermission } from '@/lib/auth'

export async function getEmployeesAction(params: {
  page?: number
  pageSize?: number
  search?: string
  departmentId?: string
  status?: 'active' | 'passive'
}) {
  await requirePermission('read', 'employees')
  const supabase = createClient()
  return listEmployees(supabase, params)
}

export async function saveEmployeeAction(input: unknown, id?: string | null) {
  const session = await requirePermission(
    id ? 'update' : 'create',
    'employees',
  )
  const supabase = createClient()

  const data = EmployeeCreateSchema.parse(input)
  const fullName = `${data.firstName} ${data.lastName}`.trim()

  if (id) {
    await updateEmployee(supabase, id, {
      tc_kimlik_enc: data.tcKimlik ?? null,
      first_name: data.firstName,
      last_name: data.lastName,
      gender: data.gender,
      department_id: data.departmentId ?? null,
      start_date: data.startDate,
      contract_end: data.contractEnd ?? null,
      address: data.address ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      salary: data.salary ?? null,
      total_leave_days: data.totalLeaveDays,
    })
  } else {
    await createEmployee(
      supabase,
      {
        tc_kimlik_enc: data.tcKimlik ?? null,
        first_name: data.firstName,
        last_name: data.lastName,
        gender: data.gender,
        department_id: data.departmentId ?? null,
        start_date: data.startDate,
        contract_end: data.contractEnd ?? null,
        address: data.address ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        salary: data.salary ?? null,
        total_leave_days: data.totalLeaveDays,
        created_by: session.user.id,
      },
      session.profile.company_id,
    )
  }

  revalidatePath('/employees')
}

export async function archiveEmployeeAction(id: string) {
  await requirePermission('update', 'employees')
  const supabase = createClient()
  await archiveEmployee(supabase, id)
  revalidatePath('/employees')
  revalidatePath('/leaves')
}

export async function restoreEmployeeAction(id: string) {
  await requirePermission('update', 'employees')
  const supabase = createClient()
  await restoreEmployee(supabase, id)
  revalidatePath('/employees')
  revalidatePath('/leaves')
}

export async function deleteEmployeeAction(id: string) {
  await requirePermission('delete', 'employees')
  const supabase = createClient()
  await deleteEmployee(supabase, id)
  revalidatePath('/employees')
}

// Server actions must return undefined or simple serializable data for next/form.
// We return void for write operations.
export type { Session }
