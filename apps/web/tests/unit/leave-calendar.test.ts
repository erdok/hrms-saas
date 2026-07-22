import { describe, it, expect } from 'vitest'

// Re-used light pure utilities the calendar depends on
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

describe('leave-calendar pure helpers', () => {
  it('isSameDay returns true only on equal date', () => {
    const a = new Date(2025, 6, 18, 10, 30)
    const b = new Date(2025, 6, 18, 23, 59)
    const c = new Date(2025, 6, 19, 0, 0)
    expect(isSameDay(a, b)).toBe(true)
    expect(isSameDay(a, c)).toBe(false)
  })

  it('dateKey zero-pads month and day', () => {
    expect(dateKey(new Date(2025, 0, 5))).toBe('2025-01-05')
    expect(dateKey(new Date(2025, 11, 31))).toBe('2025-12-31')
  })
})
