import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types-generated'

export type AttendanceRow = Database['public']['Tables']['attendance']['Row']
export type AttendanceInsert = Database['public']['Tables']['attendance']['Insert']

export const AttendanceCode = {
  EMPTY: 0,
  CAME: 1,        // G
  REPORT: 2,       // R
  LEAVE: 3,       // I
  HOLIDAY: 4,     // T
  ABSENT: 5,      // B
} as const

export const CODE_LABELS: Record<number, string> = {
  [AttendanceCode.CAME]: 'G',
  [AttendanceCode.REPORT]: 'R',
  [AttendanceCode.LEAVE]: 'I',
  [AttendanceCode.HOLIDAY]: 'T',
  [AttendanceCode.ABSENT]: 'B',
}

export const CODE_NAMES: Record<number, string> = {
  [AttendanceCode.CAME]: 'Geldi',
  [AttendanceCode.REPORT]: 'Raporlu',
  [AttendanceCode.LEAVE]: 'Izinli',
  [AttendanceCode.HOLIDAY]: 'Tatil',
  [AttendanceCode.ABSENT]: 'Boss',
}

export interface AttendanceMonthRow {
  id: string
  employee_id: string
  employee_name: string
  department_name: string | null
  day_status: number[]
}

export interface AttendanceSummaryRow {
  employee_id: string
  employee_name: string
  _department: string | null
  came_count: number
  report_count: number
  leave_count: number
  holiday_count: number
  other_count: number
}

/** Normalize an arbitrary Date to a "first day of month" date string. */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
}

/** Get the number of days in a given month (YYYY-MM-01 input). */
export function daysInMonth(monthDate: string): number {
  const [y, m] = monthDate.split('-').map(Number)
  if (!y || !m) return 31
  return new Date(y, m, 0).getDate()
}

/**
 * Returns employees with their per-day status array for the given month.
 * If attendance was never set, no row exists; callers should treat
 * missing entries as empty arrays (all zeros).
 */
export async function getAttendanceMonth(
  supabase: SupabaseClient<Database>,
  monthDate: string,
): Promise<AttendanceMonthRow[]> {
  const { data, error } = await supabase.rpc('attendance_month', {
    p_month: monthDate,
  })
  if (error) throw error
  return (data ?? []) as AttendanceMonthRow[]
}

/**
 * Per-employee monthly aggregates (G/R/I/T/B counts).
 */
export async function getAttendanceSummary(
  supabase: SupabaseClient<Database>,
  monthDate: string,
): Promise<AttendanceSummaryRow[]> {
  const { data, error } = await supabase.rpc('attendance_summary', {
    p_month: monthDate,
  })
  if (error) throw error
  return (data ?? []) as AttendanceSummaryRow[]
}

/**
 * Upsert a single employee's full month status via the typed RPC.
 */
export async function upsertAttendance(
  supabase: SupabaseClient<Database>,
  employeeId: string,
  monthDate: string,
  dayStatus: number[],
): Promise<string> {
  if (dayStatus.length !== 31) {
    throw new Error('day_status 31 elemanli olmali')
  }
  const { data, error } = await supabase.rpc('upsert_attendance', {
    p_employee_id: employeeId,
    p_month: monthDate,
    p_day_status: dayStatus,
  })
  if (error) throw error
  return data as unknown as string
}

/**
 * Set a single day's code for an employee (1..31), preserving other days.
 */
export async function setDayCode(
  supabase: SupabaseClient<Database>,
  employeeId: string,
  monthDate: string,
  day: number,
  code: number,
): Promise<void> {
  if (day < 1 || day > 31) throw new Error('Gun 1..31 arasi olmali')
  if (code < 0 || code > 5) throw new Error('Kod 0..5 arasi olmali')

  // Pull current state
  const rows = await getAttendanceMonth(supabase, monthDate)
  const existing = rows.find((r) => r.employee_id === employeeId)
  const status = existing?.day_status ?? new Array(31).fill(0)
  const next = [...status]
  next[day - 1] = code
  await upsertAttendance(supabase, employeeId, monthDate, next)
}
