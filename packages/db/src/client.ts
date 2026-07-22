import 'client-only'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types-generated'

/**
 * Browser-side Supabase client. Uses NEXT_PUBLIC_* env vars.
 * Safe to import in client components.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY tanimli degil. .env.local dosyanizi kontrol edin.',
    )
  }

  return createBrowserClient<Database>(url, anon)
}
