/**
 * Shared PII redaction utilities.
 *
 * Single source of truth for which keys are considered sensitive. Used by
 * both the structured logger (lib/logger.ts) and the Sentry beforeSend hook
 * (lib/sentry-redact.ts) so PII can't leak through one channel after being
 * stripped from the other.
 */

export const SENSITIVE_KEYS: ReadonlySet<string> = new Set([
  'phone',
  'phone_number',
  'phonenumber',
  'mobile',
  'email',
  'civil_id',
  'civilid',
  'national_id',
  'nationalid',
  'passport',
  'card_number',
  'cardnumber',
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
  'apikey',
  'secret',
  'client_secret',
  'webhook_secret',
])

export const REDACTED = '[REDACTED]'

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key.toLowerCase())
}

/**
 * Redact a value associated with `key`. Recurses into plain objects and
 * arrays. Non-plain objects (Error, Date, Buffer, Map, etc.) are passed
 * through unchanged so the logger can still serialize them usefully.
 */
function redactValue(key: string, value: unknown): unknown {
  if (isSensitiveKey(key)) return REDACTED
  if (value === null || value === undefined) return value
  if (Array.isArray(value)) {
    return value.map((v) => redactValue('', v))
  }
  if (typeof value === 'object') {
    const proto = Object.getPrototypeOf(value)
    if (proto === Object.prototype || proto === null) {
      return redactPlainObject(value as Record<string, unknown>)
    }
    if (value instanceof Error) {
      return { name: value.name, message: value.message, stack: value.stack }
    }
    return value
  }
  return value
}

function redactPlainObject(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    out[k] = redactValue(k, v)
  }
  return out
}

/**
 * Public entry-point for redacting arbitrary log payloads. Safe to call on
 * `undefined`. Returns a new object; the input is not mutated.
 */
export function redactLogData(
  data: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!data) return data
  return redactPlainObject(data)
}

/**
 * Lower-level helper exported for the Sentry hook, which walks the Sentry
 * event shape itself and needs to redact nested objects in-place.
 */
export function redactObject(
  obj: Record<string, unknown>
): Record<string, unknown> {
  return redactPlainObject(obj)
}
