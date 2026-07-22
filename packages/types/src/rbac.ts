/**
 * Role-Based Access Control helpers.
 *
 * Roles are ordered from least to most privileged:
 *   employee < hr_manager < company_admin < super_admin
 *
 * Resources are scoped strings: "entity[:qualifier]"
 *   e.g. "employees" | "employees:self" | "leaves:self:pending"
 *
 * Actions: read | create | update | delete | manage (= all of the above)
 */

export type Role = 'super_admin' | 'company_admin' | 'hr_manager' | 'employee'

export type Action = 'read' | 'create' | 'update' | 'delete' | 'manage'

export type Resource =
  | 'companies'
  | 'profiles'
  | 'employees'
  | 'employees:self'
  | 'leaves'
  | 'leaves:self'
  | 'attendance'
  | 'documents'
  | 'templates'
  | 'departments'
  | 'audit_logs'
  | 'billing'

export const ROLE_HIERARCHY: Record<Role, number> = {
  employee: 0,
  hr_manager: 1,
  company_admin: 2,
  super_admin: 3,
}

export function isAtLeast(role: Role, min: Role): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[min]
}

/**
 * Permission matrix. `manage` is sugar for all four actions.
 */
export const PERMISSIONS: Record<Role, Partial<Record<Resource, Action[]>>> = {
  super_admin: {
    companies: ['manage'],
    profiles: ['manage'],
    billing: ['manage'],
  },
  company_admin: {
    companies: ['read', 'update'], // own company only
    profiles: ['manage'],
    employees: ['manage'],
    leaves: ['manage'],
    attendance: ['manage'],
    documents: ['manage'],
    templates: ['manage'],
    departments: ['manage'],
    audit_logs: ['read'],
    billing: ['read', 'update'],
  },
  hr_manager: {
    employees: ['read', 'create', 'update'],
    leaves: ['read', 'create', 'update', 'delete'],
    attendance: ['read', 'create', 'update'],
    documents: ['read', 'create', 'update'],
    templates: ['read', 'create', 'update', 'delete'],
    departments: ['read', 'create', 'update', 'delete'],
    audit_logs: ['read'],
    'employees:self': ['read'],
    profiles: ['read'],
  },
  employee: {
    'employees:self': ['read'],
    'leaves:self': ['read', 'create'],
    attendance: ['read'], // own attendance derived server-side
    documents: ['read'], // own only
  },
}

export function can(
  role: Role,
  action: Action,
  resource: Resource,
): boolean {
  if (action === 'manage') {
    return (PERMISSIONS[role][resource] ?? []).includes('manage')
  }
  const allowed = PERMISSIONS[role][resource] ?? []
  return allowed.includes('manage') || allowed.includes(action)
}

/**
 * Error thrown when access is denied. Can be caught by middleware
 * to render a 403 page.
 */
export class ForbiddenError extends Error {
  constructor(
    public readonly action: Action,
    public readonly resource: Resource,
  ) {
    super(`Forbidden: ${action} on ${resource}`)
    this.name = 'ForbiddenError'
  }
}
