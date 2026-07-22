'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { Select, Input } from '@hrms/ui'

export interface LeaveFiltersProps {
  departments: { id: string; name: string }[]
  currentStatus: string
  currentType: string
  currentDept: string
  currentFrom: string
  currentTo: string
}

export function LeaveFilters({
  departments,
  currentStatus,
  currentType,
  currentDept,
  currentFrom,
  currentTo,
}: LeaveFiltersProps) {
  const router = useRouter()
  const params = useSearchParams()
  const [_, startTransition] = useTransition()

  function setParam(name: string, value: string) {
    const q = new URLSearchParams(params.toString())
    if (value) q.set(name, value)
    else q.delete(name)
    if (!q.has('status')) q.set('status', '')
    startTransition(() => router.replace(`/leaves?${q.toString()}`))
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
      <Select
        value={currentStatus}
        onChange={(e) => setParam('status', e.target.value)}
      >
        <option value="">Tum Durumlar</option>
        <option value="pending">Bekleyen</option>
        <option value="approved">Onayli</option>
        <option value="rejected">Reddedildi</option>
      </Select>
      <Select
        value={currentType}
        onChange={(e) => setParam('type', e.target.value)}
      >
        <option value="">Tum Izinler</option>
        <option value="Yillik">Yillik</option>
        <option value="Mazeret">Mazeret</option>
        <option value="Hastalik">Hastalik</option>
        <option value="Ucretsiz">Ucretsiz</option>
      </Select>
      <Select
        value={currentDept}
        onChange={(e) => setParam('dept', e.target.value)}
      >
        <option value="">Tum Departmanlar</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </Select>
      <Input
        type="date"
        value={currentFrom}
        onChange={(e) => setParam('from', e.target.value)}
        placeholder="Baslangic (sonrasi)"
      />
      <Input
        type="date"
        value={currentTo}
        onChange={(e) => setParam('to', e.target.value)}
        placeholder="Bitis (oncesi)"
      />
    </div>
  )
}
