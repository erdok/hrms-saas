import { monthKey, AttendanceCode, daysInMonth } from '@hrms/db/server'

export { AttendanceCode, daysInMonth }

export function nextMonthKey(current: string): string {
  const [y, m] = current.split('-').map(Number)
  const d = new Date(y, m, 1)
  return monthKey(d)
}

export function prevMonthKey(current: string): string {
  const [y, m] = current.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return monthKey(d)
}
