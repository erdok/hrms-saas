import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Mirror of the modal-local schema (zod tests shape, not import-bound logic)
const schema = z.object({
  firstName: z.string().min(1, 'Ad gerekli').max(60),
  lastName: z.string().min(1, 'Soyad gerekli').max(60),
  tcKimlik: z
    .string()
    .regex(/^\d{11}$/, 'TC 11 haneli olmali')
    .optional()
    .or(z.literal('')),
  gender: z.enum(['K', 'E']),
  departmentId: z.string().uuid().optional().or(z.literal('')),
  startDate: z.string().min(1, 'Baslangic tarihi gerekli'),
  contractEnd: z.string().optional().or(z.literal('')),
})

describe('employee form validation', () => {
  it('accepts minimal valid input', () => {
    expect(() =>
      schema.parse({
        firstName: 'Ada',
        lastName: 'Yılmaz',
        tcKimlik: '',
        gender: 'K',
        departmentId: '',
        startDate: '2025-01-01',
        contractEnd: '',
      })
    ).not.toThrow()
  })
  it('rejects missing firstName', () => {
    expect(() =>
      schema.parse({
        lastName: 'Y',
        tcKimlik: '',
        gender: 'E',
        departmentId: '',
        startDate: '2025-01-01',
        contractEnd: '',
      })
    ).toThrow()
  })
  it('rejects bad TC shape', () => {
    expect(() =>
      schema.parse({
        firstName: 'A',
        lastName: 'Y',
        tcKimlik: '123abc',
        gender: 'E',
        departmentId: '',
        startDate: '2025-01-01',
        contractEnd: '',
      })
    ).toThrow()
  })
  it('accepts optional empty TC', () => {
    expect(() =>
      schema.parse({
        firstName: 'A',
        lastName: 'Y',
        tcKimlik: '',
        gender: 'E',
        departmentId: '',
        startDate: '2025-01-01',
        contractEnd: '',
      })
    ).not.toThrow()
  })
  it('accepts valid 11-digit TC', () => {
    expect(() =>
      schema.parse({
        firstName: 'A',
        lastName: 'Y',
        tcKimlik: '12345678901',
        gender: 'E',
        departmentId: '',
        startDate: '2025-01-01',
        contractEnd: '',
      })
    ).not.toThrow()
  })
})
