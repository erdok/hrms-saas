import { createClient, listTemplates, listEmployees } from '@hrms/db/server'
import { requirePermission } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@hrms/ui'
import { DocumentGenerator } from '@/components/documents/document-generator'

export default async function DocumentsPage() {
  await requirePermission('read', 'documents')
  const supabase = createClient()
  const [templates, employeesResp] = await Promise.all([
    listTemplates(supabase),
    supabase
      .from('employees')
      .select('id, full_name, status')
      .order('full_name'),
  ])

  const employees = (employeesResp.data ?? []).map((e) => ({
    id: e.id,
    name: `${e.full_name} ${e.status === 'passive' ? '(arsiv)' : ''}`,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Belgeler</h1>
        <p className="text-sm text-muted-foreground">
          Sablona gore personel icin belge olustur ve PDF indir.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Belge Olusturucu</CardTitle>
          <CardDescription>
            Personel + sablon secin, "Olustur"a basin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentGenerator templates={templates} employees={employees} />
        </CardContent>
      </Card>
    </div>
  )
}
