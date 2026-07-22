'use client'

import { useState } from 'react'
import { Button, Badge } from '@hrms/ui'
import { CreditCard, ExternalLink } from 'lucide-react'

interface PriceRow {
  id: string
  plan: string
  amountTry: number
  interval: string
}

interface Props {
  currentPlan: string
  stripeCustomerId: string | null
  prices: PriceRow[]
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  business: 'Business',
  enterprise: 'Enterprise',
}

export function BillingActions({ currentPlan, stripeCustomerId, prices }: Props) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Group by plan we'll show one row per plan (monthly first)
  const uniquePlans = new Map<string, PriceRow>()
  for (const p of prices) {
    if (!uniquePlans.has(p.plan) || p.interval === 'month') uniquePlans.set(p.plan, p)
  }

  async function onCheckout(priceId: string, planId: string) {
    setBusy(planId)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        throw new Error(b.error ?? 'Checkout hatasi')
      }
      const { url } = await res.json()
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata')
      setBusy(null)
    }
  }

  async function onPortal() {
    setBusy('portal')
    setError(null)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        throw new Error(b.error ?? 'Portal hatasi')
      }
      const { url } = await res.json()
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from(uniquePlans.values()).map((p) => {
          const isCurrent = p.plan === currentPlan
          return (
            <div key={p.id} className="rounded-md border p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold">{PLAN_LABELS[p.plan] ?? p.plan}</h3>
                {isCurrent && <Badge variant="outline">Mevcut</Badge>}
              </div>
              <p className="text-2xl font-bold">
                {p.amountTry} TL
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  / {p.interval === 'year' ? 'yil' : 'ay'}
                </span>
              </p>
              <Button
                className="mt-3 w-full"
                variant={isCurrent ? 'outline' : 'default'}
                disabled={isCurrent || busy === p.plan}
                onClick={() => onCheckout(p.id, p.plan)}
              >
                {isCurrent ? 'Aktif' : busy === p.plan ? 'Yukleniyor...' : 'Sec'}
              </Button>
            </div>
          )
        })}
      </div>

      {stripeCustomerId && (
        <Button variant="outline" onClick={onPortal} disabled={busy === 'portal'}>
          <ExternalLink className="h-4 w-4" />
          {busy === 'portal' ? 'Yukleniyor...' : 'Stripe portal: abonelik karta/kesinti'}
        </Button>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <p className="text-xs text-muted-foreground">
        Stripe ayarlanmadiginda butonlar devre disi kalir. Production'da
        STRIPE_SECRET_KEY ve webhook secret'i .env icerisinde verilmelidir.
      </p>
    </div>
  )
}

export { CreditCard }
