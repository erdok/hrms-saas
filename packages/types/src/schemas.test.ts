import { describe, it, expect } from 'vitest'
import {
  CompanyCreateSchema,
  EmployeeCreateSchema,
  LeaveCreateSchema,
  AttendanceUpdateSchema,
} from './schemas'

describe('zod schemas', () => {
  describe('CompanyCreateSchema', () => {
    it('accepts valid company', () => {
      expect(() =>
        CompanyCreateSchema.parse({ name: 'Acme', slug: 'acme' }),
      ).not.toThrow()
    })
    it('rejects slug with uppercase', () => {
      expect(() =>
        CompanyCreateSchema.parse({ name: 'Acme', slug: 'Acme' }),
      ).toThrow()
    })
    it('rejects slug with whitespace', () => {
      expect(() =>
        CompanyCreateSchema.parse({ name: 'Acme', slug: 'acme-corp' }),
      ).not.toThrow()
      expect(() =>
        CompanyCreateSchema.parse({ name: 'Acme', slug: 'acme corp' }),
      ).toThrow()
    })
    it('rejects too short name', () => {
      expect(() =>
        CompanyCreateSchema.parse({ name: 'A', slug: 'acme' }),
      ).toThrow()
    })
  })

  describe('EmployeeCreateSchema', () => {
    it('accepts minimal valid input and defaults totalLeaveDays to 14', () => {
      const r = EmployeeCreateSchema.parse({
        firstName: 'Ahmet',
        lastName: 'Yilmaz',
        gender: 'K',
        startDate: '2025-01-01',
      })
      expect(r.totalLeaveDays).toBe(14)
      expect(r.tcKimlik).toBeUndefined()
    })
    it('rejects bad TC (not 11 digits)', () => {
      expect(() =>
        EmployeeCreateSchema.parse({
          firstName: 'A',
          lastName: 'B',
          gender: 'E',
          startDate: '2025-01-01',
          tcKimlik: '12345',
        }),
      ).toThrow()
    })
    it('rejects missing firstName', () => {
      expect(() =>
        EmployeeCreateSchema.parse({
          lastName: 'B',
          gender: 'K',
          startDate: '2025-01-01',
        }),
      ).toThrow()
    })
    it('rejects totalLeaveDays > 365', () => {
      expect(() =>
        EmployeeCreateSchema.parse({
          firstName: 'A',
          lastName: 'B',
          gender: 'K',
          startDate: '2025-01-01',
          totalLeaveDays: 400,
        }),
      ).toThrow()
    })
    it('accepts date YYYY-MM-DD format only', () => {
      expect(() =>
        EmployeeCreateSchema.parse({
          firstName: 'A',
          lastName: 'B',
          gender: 'K',
          startDate: '01.01.2025',
        }),
      ).toThrow()
    })
  })

  describe('LeaveCreateSchema', () => {
    it('accepts valid leave', () => {
      const r = LeaveCreateSchema.parse({
        employeeId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'Yillik',
        startDate: '2025-07-01',
        endDate: '2025-07-05',
      })
      expect(r.type).toBe('Yillik')
    })
    it('rejects end before start', () => {
      expect(() =>
        LeaveCreateSchema.parse({
          employeeId: '123e4567-e89b-12d3-a456-426614174000',
          type: 'Yillik',
          startDate: '2025-07-05',
          endDate: '2025-07-01',
        }),
      ).toThrow()
    })
    it('rejects invalid employeeId', () => {
      expect(() =>
        LeaveCreateSchema.parse({
          employeeId: 'not-a-uuid',
          type: 'Yillik',
          startDate: '2025-07-01',
          endDate: '2025-07-05',
        }),
      ).toThrow()
    })
    it('rejects invalid type enum', () => {
      expect(() =>
        LeaveCreateSchema.parse({
          employeeId: '123e4567-e89b-12d3-a456-426614174000',
          type: 'Annual' as never,
          startDate: '2025-07-01',
          endDate: '2025-07-05',
        }),
      ).toThrow()
    })
  })

  describe('AttendanceUpdateSchema', () => {
    it('requires exactly 31 day entries', () => {
      expect(() =>
        AttendanceUpdateSchema.parse({
          employeeId: '123e4567-e89b-12d3-a456-426614174000',
          monthDate: '2025-07-01',
          dayStatus: new Array(30).fill(0),
        }),
      ).toThrow()
      expect(() =>
        AttendanceUpdateSchema.parse({
          employeeId: '123e4567-e89b-12d3-a456-426614174000',
          monthDate: '2025-07-01',
          dayStatus: new Array(31).fill(0),
        }),
      ).not.toThrow()
    })
    it('rejects values out of range', () => {
      expect(() =>
        AttendanceUpdateSchema.parse({
          employeeId: '123e4567-e89b-12d3-a456-426614174000',
          monthDate: '2025-07-01',
          dayStatus: [9, ...new Array(30).fill(0)],
        }),
      ).toThrow()
    })
  })
})
