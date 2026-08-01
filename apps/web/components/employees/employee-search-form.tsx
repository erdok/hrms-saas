'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input, Select } from '@hrms/ui'

export interface EmployeeSearchFormProps {
  departments: { id: string; name: string }[]
  currentSearch?: string
  currentDepartmentId?: string
  currentStatus?: 'active' | 'passive'
  currentView?: 'active' | 'passive'
}

export function EmployeeSearchForm({
  departments,
  currentSearch = '',
  currentDepartmentId = '',
  currentStatus = 'active',
  currentView = 'active',
}: EmployeeSearchFormProps) {
  const router = useRouter()
  const params = useSearchParams()
  const [_, startTransition] = useTransition()

  const [search, setSearch] = useState(currentSearch)
  const [departmentId, setDepartmentId] = useState(currentDepartmentId)
  const [status, setStatus] = useState(currentStatus)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      updateQuery()
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, departmentId, status])

  function updateQuery() {
    const q = new URLSearchParams(params.toString())
    if (search) q.set('q', search)
    else q.delete('q')
    if (departmentId) q.set('dept', departmentId)
    else q.delete('dept')
    q.set('status', status)
    startTransition(() => {
      router.replace(`/dashboard/employees?${q.toString()}`)
    })
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
      <div className="relative sm:col-span-2">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Ad veya soyad ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
        <option value="">Tum Departmanlar</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </Select>
      <Select value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'passive')}>
        <option value="active">Aktif Personeller</option>
        <option value="passive">Pasif (Arsiv)</option>
      </Select>
    </div>
  )
}
