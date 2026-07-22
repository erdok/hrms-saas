import { NextRequest, NextResponse } from 'next/server'
import {
  createClient,
  renderTemplate,
  createDocument,
} from '@hrms/db/server'

export async function GET(request: NextRequest) {
  let session
  try {
    // requirePermission is server-action; here we use direct session check
    const { requirePermission } = await import('@/lib/auth')
    session = await requirePermission('create', 'documents')
  } catch {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const url = new URL(request.url)
  const templateId = url.searchParams.get('templateId')
  const employeeId = url.searchParams.get('employeeId')

  if (!templateId || !employeeId) {
    return NextResponse.json({ error: 'Personel ve sablon seciniz' }, { status: 400 })
  }

  const supabase = createClient()
  const html = await renderTemplate(supabase, templateId, employeeId)

  // Record the doc row in DB for later /archive access
  await createDocument(
    supabase,
    {
      employee_id: employeeId,
      template_id: templateId,
      status: 'draft',
      created_by: session.user.id,
    },
    session.profile.company_id,
  )

  // Wrap HTML in a print-complete document that auto-opens print dialog.
  const fullHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>Belge</title>
  <style>
    @page { margin: 2cm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      line-height: 1.6;
      color: #111;
    }
    @media print {
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  ${html}
  <div class="no-print" style="text-align: center; padding: 24px;">
    <button style="
      padding: 8px 16px; background: #2F4F7D; color: #fff;
      border: none; border-radius: 6px; cursor: pointer;
    " onclick="window.print()">Yazdir / PDF indir</button>
  </div>
  <script>
    // Trigger print dialog once the page renders
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 500);
    });
  </script>
</body>
</html>`

  return new NextResponse(fullHtml, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
