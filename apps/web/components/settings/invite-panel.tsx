'use client'

import { useState, useTransition } from 'react'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Select, Badge } from '@hrms/ui'
import { Plus, Trash2, Clipboard } from 'lucide-react'
import { createInviteAction, deleteInviteAction } from '@/app/dashboard/settings/invites/actions'
import { toast } from 'sonner'

interface InviteRow {
  id: string
  email: string
  role: string
  token: string
  accepted_at: string | null
  expires_at: string
  created_at: string
}

export function InvitePanel({ invites }: { invites: InviteRow[] }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'employee' | 'hr_manager' | 'company_admin'>('employee')
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function invite() {
    setError(null)
    setToken(null)
    startTransition(async () => {
      try {
        const r = await createInviteAction(email, role)
        setToken(r.token!)
        toast.success('Davet olusturuldu')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Hata')
        toast.error(err instanceof Error ? err.message : 'Davet hatasi')
      }
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yeni Davet Olustur</CardTitle>
          <CardDescription>
            Davet 7 gun gecerlidir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <Input
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
              />
            </div>
            <Select value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
              <option value="employee">Employee</option>
              <option value="hr_manager">HR Manager</option>
              <option value="company_admin">Company Admin</option>
            </Select>
            <Button onClick={invite} disabled={!email || isPending}>
              <Plus className="h-4 w-4" />
              {isPending ? 'Gonderiliyor...' : 'Davet Gonder'}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {token && (
              <p className="text-sm text-muted-foreground">Token: {token.slice(0, 8)}... (kullanici bununla giris yapar)</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aktif Davetler ({invites.filter(i => !i.accepted_at).length})</CardTitle>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <p className="text-sm text-muted-foreground">Davet bulunmuyor.</p>
          ) : (
            <div className="space-y-2">
              {invites.map((i) => {
                const expired = new Date(i.expires_at).getTime() < Date.now()
                const accepted = i.accepted_at
                return (
                  <div key={i.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <div>
                      <p className="font-medium">{i.email}</p>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline">{i.role}</Badge>
                        {accepted && <Badge variant="success">Kabul edildi</Badge>}
                        {expired && !accepted && <Badge variant="destructive">Suresi dolu</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(i.token).catch(() => {})} title="Copy token">
                        <Clipboard className="h-4 w-4" />
                      </Button>
                      <DeleteInviteButton id={i.id} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DeleteInviteButton({ id }: { id: string }) {
  const [confirm, setConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  function del() {
    if (!confirm) { setConfirm(true); setTimeout(() => setConfirm(false), 3000); return }
    startTransition(async () => { await deleteInviteAction(id) })
  }
  return (
    <Button variant="ghost" size="icon" onClick={del} disabled={isPending}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  )
}
