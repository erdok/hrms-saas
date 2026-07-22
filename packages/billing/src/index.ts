import Stripe from 'stripe'

/**
 * @hrms/billing - Stripe wrapper for HRMS SaaS.
 * Phase 6.
 */

// ----------------------------------
// Plan definitions (matches billing_prices)
// ----------------------------------
export const PLANS = {
  free: { name: 'Free', employeeQuota: 10, monthlyPriceTRY: 0, priceId: null },
  pro: { name: 'Pro', employeeQuota: 50, monthlyPriceTRY: 490, priceId: 'price_pro_placeholder' },
  business: { name: 'Business', employeeQuota: 200, monthlyPriceTRY: 990, priceId: 'price_business_placeholder' },
  enterprise: { name: 'Enterprise', employeeQuota: Infinity, monthlyPriceTRY: null, priceId: null },
} as const

export type PlanId = keyof typeof PLANS

export interface UsageInfo {
  employeesUsed: number
  employeesQuota: number
  overQuota: boolean
}

/** Check if a company can add more employees, based on its plan. */
export function withinQuota(used: number, plan: PlanId): boolean {
  return used < PLANS[plan].employeeQuota
}

/** Lazily-initialized Stripe client (server-only). */
let _client: Stripe | null = null
let _warned = false

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    if (!_warned) {
      _warned = true
      console.warn('[billing] STRIPE_SECRET_KEY not set; billing disabled.')
    }
    return null
  }
  if (_client === null) {
    // null-init-only-once
  }
  _client = new Stripe(key, { apiVersion: '2024-06-20', typescript: true })
  return _client
}

/** Build a Stripe Customer for a company (idempotent). */
export async function ensureStripeCustomer(
  companyId: string,
  companyName: string,
  email: string,
): Promise<string | null> {
  const stripe = getStripe()
  if (!stripe) return null
  const customers = await stripe.customers.list({ email, limit: 1 })
  if (customers.data.length > 0) return customers.data[0].id
  const customer = await stripe.customers.create({
    email,
    name: companyName,
    metadata: { companyId },
  })
  return customer.id
}

/** Create a Checkout Session for upgrading to a plan. */
export async function createCheckoutSession(opts: {
  customerId: string
  priceId: string
  successUrl: string
  cancelUrl: string
  companyId: string
}): Promise<{ url: string } | null> {
  const stripe = getStripe()
  if (!stripe) return null
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: opts.customerId,
    line_items: [{ price: opts.priceId, quantity: 1 }],
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    metadata: { companyId: opts.companyId },
  })
  return { url: session.url ?? '' }
}

/** Build a Customer Portal Session for managing subscription. */
export async function createPortalSession(opts: {
  customerId: string
  returnUrl: string
}): Promise<{ url: string } | null> {
  const stripe = getStripe()
  if (!stripe) return null
  const session = await stripe.billingPortal.sessions.create({
    customer: opts.customerId,
    return_url: opts.returnUrl,
  })
  return { url: session.url }
}

/** Handle the checkout.session.completed webhook event. */
export async function handleCheckoutCompleted(
  event: Stripe.CheckoutSessionCompletedEvent,
) {
  const stripe = getStripe()
  if (!stripe) return
  const cs = event.data.object
  const companyId = cs.metadata?.companyId
  if (!companyId) return
  // Company will be marked 'pro' / 'business' via subscription webhook.
}

/** Sync subscription state from Stripe event into companies table.
 *  Caller is the route handler with admin DB access.
 */
export interface SubSyncPayload {
  companyId: string
  customerId: string
  subscriptionId: string
  status: Stripe.Subscription.Status
  plan: PlanId | 'free'
  currentPeriodEnd: Date | null
}

export function mapStripeStatusToPlan(status: Stripe.Subscription.Status): PlanId | 'free' {
  // DEER: We infer from product metadata; for now any active sub = pro
  if (status === 'active' || status === 'trialing') return 'pro'
  return 'free'
}
