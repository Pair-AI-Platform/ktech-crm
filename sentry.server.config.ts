import * as Sentry from '@sentry/nextjs'
import { redactSentryEvent } from '@/lib/sentry-redact'

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      return redactSentryEvent(event)
    },
  })
}
