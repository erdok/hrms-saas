import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RETENTION_DAYS = 90

serve(async () => {
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000).toISOString()

  const { count } = await admin
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .lt('created_at', cutoff)

  if (count && count > 0) {
    await admin
      .from('audit_logs')
      .delete()
      .lt('created_at', cutoff)

    console.log(`[audit-retention] Deleted ${count} logs older than ${RETENTION_DAYS} days`)
  }

  return new Response(JSON.stringify({ deleted: count ?? 0, cutoff }), { status: 200 })
})
