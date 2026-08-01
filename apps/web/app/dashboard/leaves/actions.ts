'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@hrms/db/server'
import {
  createLeave,
  approveLeave,
  rejectLeave,
  cancelLeave,
  hardDeleteLeave,
  LeaveOverlapError,
  type LeaveType,
  type LeaveStatus,
} from '@hrms/db/server'
import { LeaveCreateSchema } from '@hrms/types'
import { requirePermission, requireSession } from '@/lib/auth'

export interface LeaveInput {
  employeeId: string
  type: LeaveType
  startDate: string
  endDate: string
  note?: string
}

/** Result returned to client. */
export type LeaveActionResult =
  | { kind: 'ok' }
  | { kind: 'overlap'; overlaps: unknown[] }
  | { kind: 'error'; message: string }

export async function createLeaveAction(input: unknown): Promise<LeaveActionResult> {
  const session = await requirePermission('create', 'leaves')
  const data = LeaveCreateSchema.parse(input)
  const supabase = createClient()

  try {
    await createLeave(
      supabase,
      {
        employee_id: data.employeeId,
        type: data.type,
        start_date: data.startDate,
        end_date: data.endDate,
        note: data.note,
        status: 'pending',
        created_by: session.user.id,
      },
      session.profile.company_id,
    )
    revalidatePath('/dashboard/leaves')
    return { kind: 'ok' }
  } catch (err) {
    if (err instanceof LeaveOverlapError) {
      return { kind: 'overlap', overlaps: err.overlaps }
    }
    return {
      kind: 'error',
      message: err instanceof Error ? err.message : 'Izin kaydedilemedi',
    }
  }
}

export async function approveLeaveAction(id: string): Promise<LeaveActionResult> {
  const session = await requirePermission('update', 'leaves')
  const supabase = createClient()
  try {
    await approveLeave(supabase, id, session.user.id)
    revalidatePath('/dashboard/leaves')
    return { kind: 'ok' }
  } catch (err) {
    return { kind: 'error', message: err instanceof Error ? err.message : 'Onay basarisiz' }
  }
}

export async function rejectLeaveAction(id: string, note?: string): Promise<LeaveActionResult> {
  const session = await requirePermission('update', 'leaves')
  const supabase = createClient()
  try {
    await rejectLeave(supabase, id, session.user.id, note)
    revalidatePath('/dashboard/leaves')
    return { kind: 'ok' }
  } catch (err) {
    return { kind: 'error', message: err instanceof Error ? err.message : 'Red basarisiz' }
  }
}

export async function cancelLeaveAction(id: string): Promise<LeaveActionResult> {
  await requireSession()
  const supabase = createClient()
  try {
    await cancelLeave(supabase, id)
    revalidatePath('/dashboard/leaves')
    return { kind: 'ok' }
  } catch (err) {
    return { kind: 'error', message: err instanceof Error ? err.message : 'Iptal basarisiz' }
  }
}

export async function hardDeleteLeaveAction(id: string): Promise<LeaveActionResult> {
  await requirePermission('delete', 'leaves')
  const supabase = createClient()
  try {
    await hardDeleteLeave(supabase, id)
    revalidatePath('/dashboard/leaves')
    return { kind: 'ok' }
  } catch (err) {
    return { kind: 'error', message: err instanceof Error ? err.message : 'Silme basarisiz' }
  }
}

export type { LeaveType, LeaveStatus }
