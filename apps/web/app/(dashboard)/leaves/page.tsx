import { Suspense } from 'react'
import { CalendarMinus, Download, Plus } from 'lucide-react'
import {
  createClient,
  listLeaves,
  type LeaveType,
  type LeaveStatus,
} from '@hrms/db/server'
import { requirePermission } from '@/lib/auth'
import {
  Badge,
  Button,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@hrms/ui'
import { LeaveFormModal } from '@/components/leaves/leave-form-modal'
import { LeaveFilters } from '@/components/leaves/leave-filters'
import { LeaveRowActions, LeaveStatusBadge } from '@/components/leaves/leave-row-actions'
import { LeaveCalendar } from '@/components/leaves/leave-calendar'
import { ExportLeavesButton } from '@/components/leaves/export-leaves-button'

interface PageProps {
  searchParams?: {
    status?: string
    type?: string
    dept?: string
    from?: string
    to?: string
  }
}

export default async function LeavesPage({ searchParams }: PageProps) {
  const session = await requirePermission('read', 'leaves')
  const supabase = createClient()

  const filters = {
    status: (searchParams?.status as LeaveStatus | '') || undefined,
    type: (searchParams?.type as LeaveType | '') || undefined,
    departmentId: searchParams?.dept || undefined,
    from: searchParams?.from || undefined,
    to: searchParams?.to || undefined,
  }

  const [leaves, departmentsResp, employeesResp] = await Promise.all([
    listLeaves(supabase, filters),
    supabase.from('departments').select('id, name').order('name'),
    supabase
      .from('employees')
      .select('id, full_name, department:departments(name)')
      .eq('status', 'active')
      .order('full_name'),
  ])

  const departments = departmentsResp.data ?? []
  const employees =
    employeesResp.data?.map((e) => ({
      id: e.id,
      full_name: e.full_name,
      department_name: Array.isArray(e.department) ? e.department[0]?.name : e.department?.name,
    })) ?? []

  const isStaff = ['hr_manager', 'company_admin', 'super_admin'].includes(
    session.profile.role,
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Izinler</h1>
          <p className="text-sm text-muted-foreground">
            Izin taleplerini goruntule, onayla ya da dagit.
          </p>
        </div>
        <LeaveFormModal
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Yeni Izin
            </Button>
          }
          employees={employees}
        />
      </div>

      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
          Takvim Gorunumu
        </summary>
        <div className="mt-3">
          <LeaveCalendar leaves={leaves} />
        </div>
      </details>

      <Suspense fallback={null}>
        <LeaveFilters
          departments={departments}
          currentStatus={searchParams?.status ?? ''}
          currentType={searchParams?.type ?? ''}
          currentDept={searchParams?.dept ?? ''}
          currentFrom={searchParams?.from ?? ''}
          currentTo={searchParams?.to ?? ''}
        />
      </Suspense>

      <div className="flex justify-end">
        <ExportLeavesButton query={new URLSearchParams(searchParams ?? {})} />
      </div>

      {leaves.length === 0 ? (
        <EmptyState
          icon={CalendarMinus}
          title="Izin kaydi yok"
          description="Filtreleri degistirin ya da yeni bir izin talebi olusturun."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Personel</TableHead>
                <TableHead>Departman</TableHead>
                <TableHead>Tur</TableHead>
                <TableHead>Baslangic</TableHead>
                <TableHead>Bitis</TableHead>
                <TableHead>Gun</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Onaylayan</TableHead>
                <TableHead className="w-24 text-right">Islem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.employee_name}</TableCell>
                  <TableCell>{l.department_name ?? '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{l.type}</Badge>
                  </TableCell>
                  <TableCell>{l.start_date}</TableCell>
                  <TableCell>{l.end_date}</TableCell>
                  <TableCell>{l.days}</TableCell>
                  <TableCell>
                    <LeaveStatusBadge status={l.status} />
                  </TableCell>
                  <TableCell>{l.approver_name ?? '-'}</TableCell>
                  <TableCell>
                    <LeaveRowActions
                      leaveId={l.id}
                      status={l.status}
                      isStaff={isStaff}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

