import { redirect } from 'next/navigation'
import { createClient, getSession, type Session } from '@hrms/db/server'
import {
  type Action,
  type Resource,
  type Role,
  can,
  ForbiddenError,
} from '@hrms/types'

/**
 * Returns the session for the current request or redirects to /login.
 * Use in any server component / route handler / server action.
 */
export async function requireSession(): Promise<Session> {
  const supabase = createClient()
  const session = await getSession(supabase)
  if (!session) redirect('/login')
  return session
}

/**
 * Same as requireSession but also enforces permission.
 * Throws (or redirects to /403) if the user lacks the required access.
 */
export async function requirePermission(
  action: Action,
  resource: Resource,
): Promise<Session> {
  const session = await requireSession()
  const role = session.profile.role as Role
  if (!can(role, action, resource)) {
    throw new ForbiddenError(action, resource)
  }
  return session
}

/**
 * Soft variant returning null when forbidden, useful when conditionally
 * rendering parts of a page.
 */
export async function getMaybeSession(): Promise<Session | null> {
  const supabase = createClient()
  return getSession(supabase)
}

/** Checks if the role meets the minimum required. */
export function hasRole(session: Session | null, min: Role): boolean {
  if (!session) return false
  const order: Role[] = ['employee', 'hr_manager', 'company_admin', 'super_admin']
  const a = order.indexOf(session.profile.role as Role)
  const b = order.indexOf(min)
  return a >= 0 && a >= b
}
