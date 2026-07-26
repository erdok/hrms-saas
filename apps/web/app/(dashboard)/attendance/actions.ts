'use server'

import { revalidatePath } from 'next/cache'
import {
  createClient,
  setDayCode,
  upsertAttendance,
} from '@hrms/db/server'
import { requirePermission } from '@/lib/auth'

const ALLOWED = [0, 1, 2, 3, 4, 5]
const DAY_STATUS_LEN = 31

export type SetDayResult =
  | { kind: 'ok' }
  | { kind: 'error'; message: string }

export async function setDay(
  employeeId: string,
  monthDate: string,
  day: number,
  code: number,
): Promise<SetDayResult> {
  await requirePermission('update', 'attendance')
  if (!ALLOWED.includes(code)) {
    return { kind: 'error', message: 'Gecersiz kod' }
  }
  const supabase = createClient()
  try {
    await setDayCode(supabase, employeeId, monthDate, day, code)
    // Do not revalidatePath here - this is called per cell (too aggressive).
    return { kind: 'ok' }
  } catch (err) {
    return { kind: 'error', message: err instanceof Error ? err.message : 'Hata' }
  }
}

export async function bulkUpsert(
  employeeId: string,
  monthDate: string,
  dayStatus: number[],
): Promise<SetDayResult> {
  await requirePermission('update', 'attendance')
  if (dayStatus.length !== DAY_STATUS_LEN) {
    return { kind: 'error', message: 'day_status 31 olmali' }
  }
  for (const v of dayStatus) {
    if (!ALLOWED.includes(v)) {
      return { kind: 'error', message: 'Gecersiz kod' }
    }
  }
  const supabase = createClient()
  try {
    await upsertAttendance(supabase, employeeId, monthDate, dayStatus)
    revalidatePath('/attendance')
    return { kind: 'ok' }
  } catch (err) {
    return { kind: 'error', message: err instanceof Error ? err.message : 'Hata' }
  }
}

export async function clearMonth(
  employeeId: string,
  monthDate: string,
): Promise<SetDayResult> {
  await requirePermission('update', 'attendance')
  const supabase = createClient()
  try {
    await upsertAttendance(supabase, employeeId, monthDate, new Array(DAY_STATUS_LEN).fill(0))
    revalidatePath('/attendance')
    return { kind: 'ok' }
  } catch (err) {
    return { kind: 'error', message: err instanceof Error ? err.message : 'Hata' }
  }
}

