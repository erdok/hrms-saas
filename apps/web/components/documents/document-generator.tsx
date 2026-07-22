'use client'

import { useState } from 'react'
import {
  Button,
  Select,
  Label,
} from '@hrms/ui'
import { FilePlus, Loader2 } from 'lucide-react'

export interface TemplateOption {
  id: string
  name: string
}
export interface EmployeeOption {
  id: string
  name: string
}

export function DocumentGenerator({
  templates,
  employees,
}: {
  templates: TemplateOption[]
  employees: EmployeeOption[]
}) {
  const [employeeId, setEmployeeId] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (templates.length === 0 || employees.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Belge olusturmak icin once personel ve sablon eklemelisiniz.
      </p>
    )
  }

  async function onGenerate() {
    if (!employeeId || !templateId) {
      setError('Personel ve sablon seciniz')
      return
    }
    setError(null)
    setBusy(true)
    try {
      const url = `/api/documents/generate?employeeId=${employeeId}&templateId=${templateId}`
      const res = await fetch(url, { credentials: 'same-origin' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'PDF olusturulamadi')
      }
      const blob = await res.blob()
      const objUrl = URL.createObjectURL(blob)
      // open in new tab for preview/print
      window.open(objUrl, '_blank')
      // Revoke after 60 seconds to allow printing
      setTimeout(() => URL.revokeObjectURL(objUrl), 60_000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="employeeId">Personel</Label>
          <Select
            id="employeeId"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            <option value="">Seciniz...</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="templateId">Sablon</Label>
          <Select
            id="templateId"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            <option value="">Seciniz...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={onGenerate} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus className="h-4 w-4" />}
        {busy ? 'Olusturuluyor...' : 'Belge Olustur ve Indir'}
      </Button>
    </div>
  )
}
