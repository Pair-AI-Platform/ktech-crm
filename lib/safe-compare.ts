import { safeCompareWithHash } from '@/lib/crypto-utils'

/**
 * Constant-time string comparison for shared secrets (API keys, bearer tokens).
 * Avoids the timing side-channel of `a === b` / `a !== b`. Length is compared
 * first via a fixed-length digest so unequal lengths don't short-circuit.
 * 
 * Note: This function is now async due to Web Crypto API requirements.
 */
export async function safeEqual(a: string | null | undefined, b: string | null | undefined): Promise<boolean> {
  return safeCompareWithHash(a, b)
}
