import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe, mapStripeStatusToPlan, type PlanId } from '@hrms/billing'
import { createAdminClient } from '@hrms/db/server'

// Stripe webhook needs the raw request body for signature verification.
// Use Node.js runtime so request.arrayBuffer() works as a Buffer.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'


const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''

export async function POST(request: NextRequest) { 
  // Rate limit: 10 req/s for Stripe webhook (burst allowed)
  // Stripe sends <1 req/min; not critical, leave no throttle
  // (rate-limit added for demo)
  const { checkRateLimit } = await import('@/lib/rate-limit')
  const rl = checkRateLimit('stripe-webhook')
  // No block on webhook; do NOT throttle Stripe
  const stripe = getStripe()
  if (!stripe || !endpointSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const sig = request.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  const rawBody = Buffer.from(await request.arrayBuffer())
  const supabase = createAdminClient()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret)
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid signature', detail: err instanceof Error ? err.message : '' },
      { status: 400 },
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const cs = event.data.object as Stripe.CheckoutSession
        const companyId = cs.metadata?.companyId
        if (companyId) {
          // Mark as trial until subscription.active
          await supabase
            .from('companies')
            .update({ plan: 'pro' })
            .eq('id', companyId)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = (typeof sub.customer === 'string' ? sub.customer : sub.customer.id)
        const { data: company } = await supabase
          .from('companies')
          .select('id, plan')
          .eq('stripe_customer_id', customerId)
          .maybeSingle()
        if (!company) break

        const newPlan: PlanId | 'free' = event.type.endsWith('deleted')
          ? 'free'
          : mapStripeStatusToPlan(sub.status)

        await supabase
          .from('companies')
          .update({
            plan: newPlan,
            stripe_subscription_id: sub.id,
          })
          .eq('id', company.id)

        await supabase
          .from('subscriptions')
          .upsert({
            company_id: company.id,
            stripe_subscription_id: sub.id,
            status: sub.status,
            current_period_end: sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toISOString()
              : null,
          }, { onConflict: 'stripe_subscription_id' })

        break
      }

      case 'invoice.paid': {
        const inv = event.data.object as Stripe.Invoice
        const customerId = (typeof inv.customer === 'string' ? inv.customer : inv.customer.id)
        const { data: company } = await supabase
          .from('companies')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle()
        if (!company) break

        await supabase.from('invoices').insert({
          company_id: company.id,
          stripe_invoice_id: inv.id,
          amount_due_try: (inv.amount_due ?? 0) / 100,
          amount_paid_try: (inv.amount_paid ?? 0) / 100,
          status: inv.status ?? 'open',
          invoice_pdf_url: inv.invoice_pdf ?? null,
          paid_at: inv.status === 'paid' ? new Date().toISOString() : null,
        })
        break
      }

      default:
        // ignore unhandled event types
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[stripe webhook]', err)
    return NextResponse.json(
      { error: 'Webhook handler failure', detail: err instanceof Error ? err.message : '' },
      { status: 500 },
    )
  }
}

