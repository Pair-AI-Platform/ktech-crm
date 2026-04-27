import type { ErrorEvent } from '@sentry/nextjs'

const SENSITIVE_KEYS = new Set([
  'phone',
  'phone_number',
  'mobile',
  'email',
  'civil_id',
  'national_id',
  'passport',
  'card_number',
  'card_cvv',
  'cvv',
  'password',
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'cookie',
  'set-cookie',
  'api_key',
  'secret',
])

const REDACTED = '[REDACTED]'

function redactValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEYS.has(key.toLowerCase())) return REDACTED
  if (value && typeof value === 'object') return redactObject(value as Record<string, unknown>)
  return value
}

function redactObject(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    out[k] = redactValue(k, v)
  }
  return out
}

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
