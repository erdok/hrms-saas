import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@hrms/db/server'
import { createPortalSession } from '@hrms/billing'
import { requirePermission } from '@/lib/auth'

export async function POST(_request: NextRequest) {
  const session = await requirePermission('update', 'billing')
  if (!session.company.stripe_customer_id) {
    return NextResponse.json({ error: 'Aktif abonelik bulunmuyor' }, { status: 400 })
  }
  const r = await createPortalSession({
    customerId: session.company.stripe_customer_id,
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
  })
  if (!r?.url) {
    return NextResponse.json({ error: 'Portal session olusturulamadi' }, { status: 500 })
  }
  return NextResponse.json({ url: r.url })
}
