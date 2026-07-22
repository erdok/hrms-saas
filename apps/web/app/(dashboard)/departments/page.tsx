import { createClient, listDepartmentsWithCounts } from '@hrms/db/server'
import { requirePermission } from '@/lib/auth'
import { DepartmentList } from '@/components/departments/department-list'

export default async function DepartmentsPage() {
  await requirePermission('read', 'departments')

  const supabase = createClient()
  const departments = await listDepartmentsWithCounts(supabase)
  const counts: Record<string, number> = {}
  for (const d of departments) {
    counts[d.id] = d.employee_count
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Departmanlar</h1>
        <p className="text-sm text-muted-foreground">
          Departmanlari olusturun ve hiyerarsik olarak duzenleyin.
        </p>
      </div>
      <DepartmentList
        departments={departments.map((d) => ({
          id: d.id,
          name: d.name,
          parent_id: d.parent_id,
          created_at: d.created_at,
          updated_at: d.updated_at,
        }))}
        counts={counts}
      />
    </div>
  )
}
