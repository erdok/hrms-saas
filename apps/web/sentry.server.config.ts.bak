import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES ?? 0.1),
    environment: process.env.NODE_ENV,
    beforeSend(event) {
      // Stripping anything that might leak secrets
      if (event.request?.cookies) delete event.request.cookies
      if (event.request?.headers?.cookie) delete event.request.headers.cookie
      return event
    },
  })
}
