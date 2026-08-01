'use client'

import { useState } from 'react'
import { Plus, Users } from 'lucide-react'
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
import { EmployeeFormModal, type DepartmentOption, type EmployeeFormValues } from './employee-form-modal'
import { EmployeeRowActions } from './employee-row-actions'
import { EmployeeSearchForm } from './employee-search-form'
import { Pagination } from '@/components/layout/pagination'
import type { EmployeeStatsRow } from '@hrms/db'

export interface EmployeeListClientProps {
  rows: EmployeeStatsRow[]
  total: number
  page: number
  pageSize: number
  search?: string
  departmentId?: string
  status: 'active' | 'passive'
  departments: DepartmentOption[]
}

export function EmployeeListClient({
  rows,
  total,
  page,
  pageSize,
  search,
  departmentId,
  status,
  departments,
}: EmployeeListClientProps) {
  const [editing, setEditing] = useState<EmployeeStatsRow | null>(null)

  const allPages = Math.max(1, Math.ceil(total / pageSize))
  const showActive = status === 'active'

  // Edit modal trigger: pass null for "new", or row when editing.
  const editModalOpen = editing !== null
  const editEmployee = editing
    ? {
        id: editing.id,
        firstName: editing.first_name,
        lastName: editing.last_name,
        tcKimlik: '',
        gender: (editing.gender ?? 'K') as 'K' | 'E',
        departmentId: editing.department_id ?? '',
        startDate: editing.start_date,
        contractEnd: editing.contract_end ?? '',
        address: '',
        phone: editing.phone ?? '',
        email: editing.email ?? '',
        salary: editing.salary ?? '',
        totalLeaveDays: editing.total_leave_days,
      }
    : null

  return (
    <div className="space-y-4">
      <EmployeeSearchForm
        departments={departments.map((d) => ({ id: d.id, name: d.name }))}
        currentSearch={search}
        currentDepartmentId={departmentId}
        currentStatus={status}
        currentView={status}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} kayit - Sayfa {page}/{allPages}
        </p>
        <EmployeeFormModal
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Yeni Personel
            </Button>
          }
          departments={departments}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title={showActive ? 'Henuz personel yok' : 'Arsiv bos'}
          description={
            showActive
              ? 'Ilk calisaninizi ekleyerek baslayin.'
              : 'Pasife alinmis personel kaydi bulunmuyor.'
          }
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>Departman</TableHead>
                <TableHead>Cinsiyet</TableHead>
                <TableHead>Ise Baslangic</TableHead>
                <TableHead>Sozlesme Bitis</TableHead>
                <TableHead>Kalan Izin</TableHead>
                <TableHead className="w-12 text-right">Islem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((emp) => {
                const rowClass = !showActive
                  ? 'opacity-60'
                  : emp.contract_end
                    ? contractClass(emp.contract_end)
                    : ''
                return (
                  <TableRow key={emp.id} className={rowClass}>
                    <TableCell className="font-medium">{emp.full_name}</TableCell>
                    <TableCell>{emp.department_name ?? '-'}</TableCell>
                    <TableCell>{emp.gender === 'K' ? 'Kadin' : emp.gender === 'E' ? 'Erkek' : '-'}</TableCell>
                    <TableCell>{emp.start_date}</TableCell>
                    <TableCell>{emp.contract_end ?? 'Suresiz'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          emp.remaining_leave_days <= 0
                            ? 'destructive'
                            : emp.remaining_leave_days < 5
                              ? 'warning'
                              : 'secondary'
                        }
                      >
                        {emp.remaining_leave_days} gun
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <EmployeeRowActions
                        employeeId={emp.id}
                        status={emp.status}
                        onEdit={() => setEditing(emp)}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {rows.length > 0 && allPages > 1 && (
        <Pagination page={page} totalPages={allPages} basePath="/dashboard/employees" />
      )}

      {editModalOpen && editEmployee && (
        <EmployeeFormModal
          trigger={<span className="hidden" />}
          departments={departments}
          employee={editEmployee as unknown as EmployeeFormValues & { id: string }}
        />
      )}
    </div>
  )
}

function contractClass(end: string): string {
  const days = Math.ceil(
    (new Date(end).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )
  if (days < 0) return 'bg-destructive/10'
  if (days <= 14) return 'bg-amber-100/60'
  return ''
}
