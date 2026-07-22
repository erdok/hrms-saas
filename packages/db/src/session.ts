import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types-generated'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Company = Database['public']['Tables']['companies']['Row']
export type Employee = Database['public']['Tables']['employees']['Row']
export type Leave = Database['public']['Tables']['leaves']['Row']

export interface Session {
  user: { id: string; email: string }
  profile: Profile
  company: Company
}

/**
 * Load the current session: user + profile + company.
 * Returns `null` if not authenticated.
 */
export async function getSession(
  supabase: SupabaseClient<Database>,
): Promise<Session | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', profile.company_id)
    .single()

  if (!company) return null

  return {
    user: { id: user.id, email: user.email ?? '' },
    profile,
    company,
  }
}
