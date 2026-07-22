import { describe, it, expect } from 'vitest'
import {
  type Role,
  can,
  isAtLeast,
  ForbiddenError,
} from './rbac'

describe('RBAC', () => {
  describe('isAtLeast', () => {
    it('returns true when role is above minimum', () => {
      expect(isAtLeast('company_admin', 'hr_manager')).toBe(true)
      expect(isAtLeast('super_admin', 'employee')).toBe(true)
    })
    it('returns true when roles are equal', () => {
      expect(isAtLeast('employee', 'employee')).toBe(true)
    })
    it('returns false when role is below minimum', () => {
      expect(isAtLeast('employee', 'hr_manager')).toBe(false)
      expect(isAtLeast('hr_manager', 'company_admin')).toBe(false)
    })
  })

  describe('can', () => {
    it('super_admin can manage companies', () => {
      expect(can('super_admin', 'manage', 'companies')).toBe(true)
      expect(can('super_admin', 'delete', 'companies')).toBe(true)
    })
    it('company_admin can read own employees but not manage companies', () => {
      expect(can('company_admin', 'read', 'employees')).toBe(true)
      expect(can('company_admin', 'create', 'employees')).toBe(true)
      expect(can('company_admin', 'delete', 'employees')).toBe(true)
      expect(can('company_admin', 'manage', 'companies')).toBe(false)
    })
    it('hr_manager can create/update employees but not delete', () => {
      expect(can('hr_manager', 'create', 'employees')).toBe(true)
      expect(can('hr_manager', 'update', 'employees')).toBe(true)
      expect(can('hr_manager', 'delete', 'employees')).toBe(false)
    })
    it('employee can read own leaves but not others', () => {
      expect(can('employee', 'read', 'leaves:self')).toBe(true)
      expect(can('employee', 'create', 'leaves:self')).toBe(true)
      expect(can('employee', 'read', 'employees')).toBe(false)
      expect(can('employee', 'read', 'leaves')).toBe(false)
    })

    it('manage action grants all-or-nothing', () => {
      expect(can('company_admin', 'manage', 'employees')).toBe(true)
      expect(can('hr_manager', 'manage', 'employees')).toBe(false)
    })

    it('returns false for unknown resources', () => {
      expect(can('employee', 'read', 'audit_logs' as never)).toBe(false)
    })
  })

  describe('ForbiddenError', () => {
    it('carries action and resource on the instance', () => {
      const err = new ForbiddenError('delete', 'employees')
      expect(err.action).toBe('delete')
      expect(err.resource).toBe('employees')
      expect(err.message).toContain('delete')
      expect(err.message).toContain('employees')
      expect(err.name).toBe('ForbiddenError')
    })
  })
})
