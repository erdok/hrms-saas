'use server'

import { revalidatePath } from 'next/cache'
import { createClient, requirePermission } from '@/lib/auth'
import crypto from 'node:crypto'

export async function createInviteAction(email: string, role: 'employee' | 'hr_manager' | 'company_admin') {
  const session = await requirePermission('manage', 'profiles')
  const supabase = createClient()
  const token = crypto.randomUUID()

  const { error } = await supabase.from('invites').insert({
    company_id: session.profile.company_id,
    email,
    role,
    invited_by: session.user.id,
    token,
    expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
  })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/settings/invites')
  return { kind: 'ok' as const, token }
}

export async function deleteInviteAction(id: string) {
  await requirePermission('manage', 'profiles')
  const supabase = createClient()
  await supabase.from('invites').delete().eq('id', id)
  revalidatePath('/dashboard/settings/invites')
}
