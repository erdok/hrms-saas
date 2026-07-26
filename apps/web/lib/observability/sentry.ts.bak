import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

export function isSentryEnabled(): boolean {
  return !!dsn
}

/**
 * Capture an exception server-side. Falls back to console.error if Sentry
 * is not configured (local dev). Includes context for traceability.
 */
export function captureException(
  err: unknown,
  context?: Record<string, unknown>,
): void {
  if (!dsn) {
    // eslint-disable-next-line no-console
    console.error('[exception]', err, context ?? {})
    return
  }
  Sentry.captureException(err, {
    extra: context,
  })
}

export function captureMessage(
  msg: string,
  context?: Record<string, unknown>,
): void {
  if (!dsn) return
  Sentry.captureMessage(msg, {
    extra: context,
  })
}

export { Sentry }
