import { Suspense } from 'react'
import { createClient, listDepartments, listEmployees } from '@hrms/db/server'
import { requirePermission } from '@/lib/auth'
import { EmployeeListClient } from '@/components/employees/employee-list-client'

interface PageProps {
  searchParams?: {
    q?: string
    dept?: string
    status?: 'active' | 'passive'
    page?: string
    pageSize?: string
  }
}

const DEFAULT_PAGE_SIZE = 20

export default async function EmployeesPage({ searchParams }: PageProps) {
  await requirePermission('read', 'employees')

  const status = searchParams?.status === 'passive' ? 'passive' : 'active'
  const page = Math.max(1, parseInt(searchParams?.page ?? '1', 10) || 1)
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams?.pageSize ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE),
  )

  const supabase = createClient()
  const [{ rows, total }, departments] = await Promise.all([
    listEmployees(supabase, {
      page,
      pageSize,
      search: searchParams?.q,
      departmentId: searchParams?.dept || undefined,
      status,
    }),
    listDepartments(supabase),
  ])

  const deptOptions = departments.map((d) => ({
    id: d.id,
    name: d.name,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {status === 'active' ? 'Personeller' : 'Pasif Personeller (Arsiv)'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {status === 'active'
            ? 'Aktif calisanlarinizi yonetin.'
            : 'Istenden ayrilmis veya pasife alinmis kayitlar.'}
        </p>
      </div>

      <Suspense fallback={null}>
        <EmployeeListClient
          rows={rows}
          total={total}
          page={page}
          pageSize={pageSize}
          search={searchParams?.q}
          departmentId={searchParams?.dept}
          status={status}
          departments={deptOptions}
        />
      </Suspense>
    </div>
  )
}
