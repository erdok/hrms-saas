/**
 * Posthog server-side client (lazy, only when NEXT_PUBLIC_POSTHOG_KEY set).
 *
 * For browser events use the PostHogProvider in the root layout, which is
 * imported by components as needed.
 */

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com'

interface EventPayload {
  event: string
  distinctId?: string
  properties?: Record<string, unknown>
}

export function isPosthogEnabled(): boolean {
  return !!posthogKey
}

export async function captureEvent(p: EventPayload): Promise<void> {
  if (!posthogKey) return
  try {
    await fetch(`${posthogHost}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: posthogKey,
        event: p.event,
        distinct_id: p.distinctId ?? 'anonymous',
        properties: p.properties ?? {},
      }),
    })
  } catch {
    // Swallow - tracking must not break a request.
  }
}

export { posthogKey, posthogHost }
