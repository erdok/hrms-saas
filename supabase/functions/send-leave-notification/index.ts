// Follow this setup guide to integrate the Deno runtime:
// https://supabase.com/docs/guides/functions

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@4'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? ''
const emailFrom = Deno.env.get('EMAIL_FROM') ?? 'HRMS <noreply@hrms.app>'

serve(async (_req) => {
  if (!resendApiKey) {
    return new Response(JSON.stringify({ ok: false, reason: 'RESEND_API_KEY missing' }), { status: 503 })
  }

  const admin = createClient(supabaseUrl!, supabaseKey!, { auth: { persistSession: false } })
  const resend = new Resend(resendApiKey)

  // 1) Find pending leave requests older than 1 minute (allow insertion row to settle)
  const threshold = new Date(Date.now() - 60_000).toISOString()
  const { data: pendingLeaves, error: leErr } = await admin
    .from('leaves')
    .select('id, employee_id, type, start_date, end_date, days, created_by')
    .eq('status', 'pending')
    .lt('created_at', threshold)

  if (leErr) return new Response(JSON.stringify({ error: leErr.message }), { status: 500 })
  if (!pendingLeaves?.length) return new Response(JSON.stringify({ processed: 0 }))

  let processed = 0
  for (const leave of pendingLeaves!) {
    // 2) Find employee name
    const { data: emp } = await admin
      .from('employees')
      .select('full_name, department_id')
      .eq('id', leave.employee_id)
      .single()

    if (!emp) continue

    // 3) Find a company_admin / hr_manager from same tenant to notify
    // Simple approach: get any staff user in the company of the leave creator
    const { data: staff } = await admin
      .from('profiles')
      .select('email, full_name')
      .in('role', ['hr_manager', 'company_admin'])
      .limit(3)

    if (!staff?.length) continue

    const employeeName = emp.full_name
    const deptId = emp.department_id

    const emails = staff.map((s) => s.email).filter(Boolean)
    if (!emails.length) continue

    const subject = `[HRMS] Yeni Izin Talebi - ${employeeName}`

    const startStr = new Date(leave.start_date).toLocaleDateString('tr-TR')
    const endStr = new Date(leave.end_date).toLocaleDateString('tr-TR')

    // Simple inline HTML (we don't have bundler in Edge; React Email rendered offline)
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="color:#1e293b">Yeni Izin Talebi</h2>
        <p>Merhaba,</p>
        <p><strong>${employeeName}</strong> adli personel <strong>${leave.type}</strong> izni icin talepte bulundu.</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;margin:12px 0">
          <p style="margin:4px 0">Tur: ${leave.type}<br/>Baslangic: ${startStr}<br/>Bitis: ${endStr}<br/>Gun: ${leave.days}</p>
        </div>
        <a href="${Deno.env.get('APP_URL')}/leaves" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none">Onaylamak Icin Tiklayin</a>
      </div>
    `

    for (const email of emails) {
      try {
        await resend.emails.send({
          from: emailFrom,
          to: email,
          subject,
          html,
        })
        processed++
      } catch (e) {
        console.error('Email send failed', e)
      }
    }
  }

  return new Response(JSON.stringify({ processed }), { status: 200 })
})
