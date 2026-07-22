import { Resend } from 'resend'
import { render } from '@react-email/components'

let _resend: Resend | null = null
let _warned = false

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    if (!_warned) {
      _warned = true
      console.warn('[email] RESEND_API_KEY not set; emails are disabled.')
    }
    return null
  }
  _resend ??= new Resend(key)
  return _resend
}

export async function sendEmail(opts: {
  to: string | string[]
  subject: string
  reactComponent: Parameters<typeof render>[0]
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const resend = getResend()
  if (!resend) return { ok: false, error: 'Resend not configured' }

  try {
    const html = await render(opts.reactComponent)
    const from = process.env.EMAIL_FROM ?? 'HRMS <noreply@hrms.app>'

    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(opts.to) ? opts.to : [opts.to],
      subject: opts.subject,
      html,
    })

    if (error) return { ok: false, error: error.message }
    return { ok: true, id: data?.id ?? '' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown email error'
    return { ok: false, error: msg }
  }
}

// Helper: renders a React Email component server-side
export async function renderEmail(Component: Parameters<typeof render>[0]): Promise<string> {
  return render(Component)
}
