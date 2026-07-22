import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient, listEmployees } from '@hrms/db/server'
import { requirePermission } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const session = await requirePermission('delete', 'employees')
  const body = await request.json().catch(() => ({}))
  const subject = (body.subject as 'export' | 'delete') ?? 'export'
  const supabase = createClient()
  const admin = createAdminClient()
  const companyId = session.company.id

  if (subject === 'export') {
    const [employees, departments, leaves, templates, documents] = await Promise.all([
      listEmployees(supabase, {}),
      supabase.from('departments').select('*').eq('company_id', companyId),
      supabase.from('leaves').select('*').eq('company_id', companyId),
      supabase.from('templates').select('*').eq('company_id', companyId),
      supabase.from('documents').select('*').eq('company_id', companyId),
    ])

    const payload = {
      exportedAt: new Date().toISOString(),
      company: {
        id: session.company.id,
        name: session.company.name,
      },
      requestedBy: session.user.email,
      employees: employees.rows,
      departments: departments.data,
      leaves: leaves.data,
      templates: templates.data,
      documents: documents.data,
      note:
        'Su an TC ve maaslar sifreli saklanir. Bu ihrac TC bilgisini acik olarak icermeyebilir.',
    }

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="kvkk-veri-ihraci.json"',
      },
    })
  }

  // delete subject
  await Promise.all([
    admin.from('employees').delete().eq('company_id', companyId),
    admin.from('leaves').delete().eq('company_id', companyId),
    admin.from('templates').delete().eq('company_id', companyId),
    admin.from('documents').delete().eq('company_id', companyId),
    admin.from('departments').delete().eq('company_id', companyId),
    admin.from('attendance').delete().eq('company_id', companyId),
  ])

  return NextResponse.json({ status: 'ok' })
}
