import { createClient } from '@hrms/db/server'
import { requirePermission } from '@/lib/auth'
import { InvitePanel } from '@/components/settings/invite-panel'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@hrms/ui'

export default async function InvitesPage() {
  await requirePermission('manage', 'profiles')
  const supabase = createClient()

  const { data: invites } = await supabase
    .from('invites')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Davetler</h1>
        <p className="text-sm text-muted-foreground">
          Ekibinize yeni kullanicilar davet edin.
        </p>
      </div>

      <InvitePanel invites={(invites ?? []) as unknown as Array<{
        id: string
        email: string
        role: string
        token: string
        accepted_at: string | null
        expires_at: string
        created_at: string
      }>} />
    </div>
  )
}
