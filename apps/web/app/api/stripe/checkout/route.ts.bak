import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@hrms/db/server'
import {
  PLANS,
  ensureStripeCustomer,
  createCheckoutSession,
  type PlanId,
} from '@hrms/billing'
import { requirePermission } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const session = await requirePermission('update', 'billing')
  const body = await request.json().catch(() => ({}))
  const planId = (body.planId as PlanId) ?? 'pro'

  const plan = PLANS[planId]
  if (!plan?.priceId) {
    return NextResponse.json({ error: 'Bu plan self-service degil; bizimle iletisime gein' }, { status: 400 })
  }

  const supabase = createClient()
  // Cache Stripe customer id locally
  let customerId = session.company.stripe_customer_id
  if (!customerId) {
    const created = await ensureStripeCustomer(
      session.company.id,
      session.company.name,
      session.user.email,
    )
    if (!created) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }
    customerId = created
    await supabase
      .from('companies')
      .update({ stripe_customer_id: customerId })
      .eq('id', session.company.id)
  }

  const result = await createCheckoutSession({
    customerId,
    priceId: plan.priceId,
    successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?status=success`,
    cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?status=cancel`,
    companyId: session.company.id,
  })

  if (!result?.url) {
    return NextResponse.json({ error: 'Checkout session olusturulamadi' }, { status: 500 })
  }
  return NextResponse.json({ url: result.url })
}
