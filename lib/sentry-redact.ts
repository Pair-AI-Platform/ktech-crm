import type { ErrorEvent } from '@sentry/nextjs'
import { REDACTED, redactObject } from '@/lib/redact'

export function redactSentryEvent(event: ErrorEvent): ErrorEvent {
  if (event.request?.headers) {
    event.request.headers = redactObject(event.request.headers as Record<string, unknown>) as typeof event.request.headers
  }
  if (event.request?.cookies) {
    event.request.cookies = REDACTED as unknown as typeof event.request.cookies
  }
  if (event.request?.data && typeof event.request.data === 'object') {
    event.request.data = redactObject(event.request.data as Record<string, unknown>)
  }
  if (event.extra) {
    event.extra = redactObject(event.extra)
  }
  if (event.user) {
    if (event.user.email) event.user.email = REDACTED
    if ('phone' in event.user) (event.user as Record<string, unknown>).phone = REDACTED
  }
  return event
}
