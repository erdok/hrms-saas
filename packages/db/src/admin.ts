import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types-generated'

/**
 * Admin / service-role client. Bypasses RLS entirely.
 * ---------------- WARNING ----------------
 * NEVER import this from a client component or expose the key to the browser.
 * Use only in route handlers, server actions or background jobs where you
 * need to operate across tenants (e.g. Stripe webhooks, billing).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY tanimli degil (server-side only).')
  }

  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
