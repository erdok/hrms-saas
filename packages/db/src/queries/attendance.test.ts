import { describe, it, expect } from 'vitest'
import {
  AttendanceCode,
  CODE_LABELS,
  CODE_NAMES,
  monthKey,
  daysInMonth,
} from './attendance'

describe('AttendanceCode constants', () => {
  it('has stable enum values', () => {
    expect(AttendanceCode.EMPTY).toBe(0)
    expect(AttendanceCode.CAME).toBe(1)
    expect(AttendanceCode.REPORT).toBe(2)
    expect(AttendanceCode.LEAVE).toBe(3)
    expect(AttendanceCode.HOLIDAY).toBe(4)
    expect(AttendanceCode.ABSENT).toBe(5)
  })
  it('every code has a label', () => {
    for (const k of Object.values(AttendanceCode)) {
      if (typeof k === 'number') {
        expect(CODE_LABELS[k]).toBeDefined()
        expect(CODE_NAMES[k]).toBeDefined()
      }
    }
  })
})

describe('monthKey', () => {
  it('returns YYYY-MM-01 string', () => {
    expect(monthKey(new Date(2025, 6, 18))).toBe('2025-07-01')
    expect(monthKey(new Date(2025, 0, 31))).toBe('2025-01-01')
    expect(monthKey(new Date(2025, 11, 1))).toBe('2025-12-01')
  })
  it('zero-pads month', () => {
    expect(monthKey(new Date(2025, 1, 15))).toBe('2025-02-01')
  })
})

describe('daysInMonth', () => {
  it('handles Jan/Kasim (31) and Subat (28 normally, 29 leap year)', () => {
    expect(daysInMonth('2025-01-01')).toBe(31)
    expect(daysInMonth('2025-04-01')).toBe(30)
    expect(daysInMonth('2025-02-01')).toBe(28)
    expect(daysInMonth('2024-02-01')).toBe(29) // leap year
    expect(daysInMonth('2025-12-01')).toBe(31)
  })
  it('defaults to 31 on invalid input', () => {
    expect(daysInMonth('')).toBe(31)
    expect(daysInMonth('not-a-date')).toBe(31)
  })
})
