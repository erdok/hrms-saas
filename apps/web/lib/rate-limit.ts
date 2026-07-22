/**
 * Simple sliding-window rate limiter for API routes.
 *
 * In production, replace with Upstash Redis or Vercel KV.
 * This version resets automatically (memory-resident per instance).
 */

type Window = { count: number; resetAt: number }

const store = new Map<string, Window>()
const MAX_HITS = 60
const WINDOW_SECS = 60

/** Remove expired entries periodically. */
setInterval(() => {
  const now = Date.now()
  for (const [k, w] of store) {
    if (now > w.resetAt) store.delete(k)
  }
}, 60_000)

/**
 * Returns `{ ok: true }` or `{ ok: false; retryAfter: number }`.
 * Use at the start of API route handlers.
 */
export function checkRateLimit(key: string): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now()
  const w = store.get(key)

  if (!w || now > w.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_SECS * 1000 })
    return { ok: true }
  }

  if (w.count >= MAX_HITS) {
    return { ok: false, retryAfter: Math.ceil((w.resetAt - now) / 1000) }
  }

  w.count++
  return { ok: true }
}
