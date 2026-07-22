'use client'

import { useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@hrms/ui'

export function KvkkPanel({ employeesCount }: { employeesCount: number }) {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ kind: 'ok' | 'error'; message?: string } | null>(null)

  async function requestData(subject: 'export' | 'delete') {
    if (subject === 'delete') {
      if (!confirm('Bu test ortamindan itibaren TUM personel verisini silmek istediginize emin misiniz? Geri alinamaz.')) return
    }
    setBusy(true)
    setResult(null)
    try {
      const res = await fetch('/api/kvkk/subject-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject }),
      })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        throw new Error(b.error ?? 'Hata')
      }
      setResult({ kind: 'ok', message: subject === 'export' ? 'JSON indirildi' : 'Silme tamam' })
      if (subject === 'export') {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'kvkk-veri-ihraci.json'
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      setResult({ kind: 'error', message: err instanceof Error ? err.message : 'Hata' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Veri Erisim ve Silme Talebi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">{employeesCount} kisi</Badge>
          <p className="text-sm text-muted-foreground">
            Tum sirket personeli verisinin JSON ihracini veya (test) tamamen silinmesini talep edebilirsiniz.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={busy} onClick={() => requestData('export')}>
            Verisihraci JSON indir
          </Button>
          <Button variant="destructive" disabled={busy} onClick={() => requestData('delete')}>
            {busy ? 'Isleniyor...' : 'Verileri kalici sil'}
          </Button>
        </div>
        {result && (
          <p
            className={`text-sm ${
              result.kind === 'ok' ? 'text-emerald-700' : 'text-destructive'
            }`}
          >
            {result.message ?? 'Tamam'}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
