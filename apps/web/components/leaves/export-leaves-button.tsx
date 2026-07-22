'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@hrms/ui'

export function ExportLeavesButton({ query }: { query: URLSearchParams }) {
  const [busy, setBusy] = useState(false)

  async function onClick() {
    setBusy(true)
    try {
      const url = `/api/export/leaves?${query.toString()}`
      const res = await fetch(url, { credentials: 'same-origin' })
      if (!res.ok) throw new Error('Indirme hatasi')
      const blob = await res.blob()
      const objUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objUrl
      a.download = `izinler_${new Date().toISOString().slice(0,10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objUrl)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Indirme hatasi')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={busy}>
      <Download className="h-4 w-4" />
      {busy ? 'Hazirlaniyor...' : 'Excel indir'}
    </Button>
  )
}
