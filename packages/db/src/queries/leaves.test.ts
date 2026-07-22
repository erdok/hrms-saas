import { describe, it, expect } from 'vitest'
import { LeaveOverlapError } from './leaves'

describe('LeaveOverlapError', () => {
  it('carries the overlaps array on the instance', () => {
    const overlaps = [
      {
        leave_id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'Yillik' as const,
        start_date: '2025-07-01',
        end_date: '2025-07-05',
        days: 5,
        status: 'approved' as const,
      },
    ]
    const err = new LeaveOverlapError(overlaps)
    expect(err.name).toBe('LeaveOverlapError')
    expect(err.overlaps).toBe(overlaps)
    expect(err.message).toContain('cakisiyor')
    expect(err).toBeInstanceOf(Error)
  })
})
