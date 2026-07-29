import { createClient } from '@hrms/db/server'
import { requireSession } from '@/lib/auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
} from '@hrms/ui'
import { BillingActions } from '@/components/billing/billing-actions'

const TRIAL_DAYS = 14

export default async function BillingSettingsPage() {
  const session = await requireSession()
  const supabase = createClient()

  const [{ count: employeesCount }, subs, prices] = await Promise.all([
    supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', session.company.id)
      .eq('status', 'active'),
    supabase
      .from('subscriptions')
      .select('*')
      .eq('company_id', session.company.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('billing_prices')
      .select('*')
      .eq('is_active', true)
      .order('amount_try', { ascending: true }),
  ])

  const trialEnded =
    session.company.trial_ends_at
      ? new Date(session.company.trial_ends_at).getTime() < Date.now()
      : true

  const activeSub = subs.data?.[0]
  const periodicEnd = activeSub?.current_period_end
    ? new Date(activeSub.current_period_end).toLocaleDateString('tr-TR')
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Abonelik & Faturalandirma</h1>
        <p className="text-sm text-muted-foreground">
          Sirketinizin mevcut plani ve limitleri.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mevcut Plan: {session.company.plan.toUpperCase()}</CardTitle>
          <CardDescription>
            Aktif personel: {employeesCount ?? 0} / limit {session.company.employee_quota}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {session.company.trial_ends_at && !trialEnded ? (
            <Badge variant="warning">
              Deneme suresi: {new Date(session.company.trial_ends_at).toLocaleDateString('tr-TR')}
            </Badge>
          ) : null}
          {activeSub && (
            <p>Durum: <Badge variant={activeSub.status === 'active' ? 'success' : 'outline'}>{activeSub.status ?? 'devam'}</Badge></p>
          )}
          {periodicEnd && (
            <p className="text-muted-foreground">Surum yenilenme: {periodicEnd}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plani Yukselt</CardTitle>
          <CardDescription>
            Plan degisikligi Stripe'a yonlendirilir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BillingActions
            currentPlan={session.company.plan}
            stripeCustomerId={session.company.stripe_customer_id}
            prices={(prices.data ?? []).map((p: { id: string; plan: string; stripe_price_id: string; amount_try: number; interval: string | null }) => ({
              id: p.stripe_price_id,
              plan: p.plan,
              amountTry: p.amount_try,
              interval: p.interval ?? 'month',
            }))}
          />
        </CardContent>
      </Card>
    </div>
  )
}
