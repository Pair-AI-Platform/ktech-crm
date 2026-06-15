import crypto from 'crypto'

/**
 * Constant-time string comparison for shared secrets (API keys, bearer tokens).
 * Avoids the timing side-channel of `a === b` / `a !== b`. Length is compared
 * first via a fixed-length digest so unequal lengths don't short-circuit.
 */
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const ah = crypto.createHash('sha256').update(a).digest()
  const bh = crypto.createHash('sha256').update(b).digest()
  return crypto.timingSafeEqual(ah, bh)
}
