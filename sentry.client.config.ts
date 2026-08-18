import { redactSentryEvent } from '@/lib/sentry-redact'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

// Lazy load Sentry to reduce initial bundle size
if (dsn && typeof window !== 'undefined') {
  // Only initialize Sentry after page load
  window.addEventListener('load', () => {
    import('@sentry/nextjs').then(({ init }) => {
      init({
        dsn,
        environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
        beforeSend(event) {
          return redactSentryEvent(event)
        },
      })
    });
  });
}
