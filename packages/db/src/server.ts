import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types-generated'

type TypedClient = SupabaseClient<Database, 'public', 'public'>

/**
 * Server-side Supabase client for use in RSC, route handlers and server
 * actions. Reads/writes auth cookies via next/headers.
 */
export function createClient(): TypedClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY tanimli degil.',
    )
  }

  const cookieStore = cookies()

  return createServerClient<Database>(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as never),
          )
        } catch {
          // Called from a Server Component - safe to ignore when middleware
          // already refreshes the session.
        }
      },
    },
  }) as unknown as TypedClient
}
