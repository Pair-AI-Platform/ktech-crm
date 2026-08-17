/**
 * Web Crypto API utilities for Edge Runtime compatibility
 * 
 * These functions replace Node.js crypto module with Web Crypto API
 * which is available in both Node.js and Edge Runtime environments.
 */

/**
 * Generate random bytes as hex string
 * Replaces: crypto.randomBytes(n).toString('hex')
 */
export function generateRandomHex(bytes: number): string {
  const randomBytes = new Uint8Array(bytes)
  crypto.getRandomValues(randomBytes)
  return Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Generate SHA-256 hash of data
 * Replaces: crypto.createHash('sha256').update(data).digest('hex')
 */
export async function hashSha256(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data))
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Generate HMAC-SHA256 signature
 * Replaces: crypto.createHmac('sha256', secret).update(data).digest('hex')
 */
export async function generateHmacSignature(secret: string, data: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  )
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Verify HMAC-SHA256 signature with timing-safe comparison
 * Replaces: crypto.createHmac + crypto.timingSafeEqual
 */
export async function verifyHmacSignature(
  secret: string,
  data: string,
  signature: string
): Promise<boolean> {
  try {
    const expectedSignature = await generateHmacSignature(secret, data)
    return timingSafeEqual(signature, expectedSignature)
  } catch {
    return false
  }
}

/**
 * Timing-safe string comparison
 * Replaces: crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
 * 
 * This implementation ensures constant-time comparison to prevent timing attacks.
 * It compares strings character by character without short-circuiting.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  // If lengths differ, still compare to avoid timing leak
  const aLen = a.length
  const bLen = b.length
  const maxLen = Math.max(aLen, bLen)
  
  let result = aLen === bLen ? 0 : 1
  
  for (let i = 0; i < maxLen; i++) {
    const aChar = i < aLen ? a.charCodeAt(i) : 0
    const bChar = i < bLen ? b.charCodeAt(i) : 0
    result |= aChar ^ bChar
  }
  
  return result === 0
}

/**
 * Timing-safe comparison with SHA-256 hashing for length normalization
 * Replaces: crypto.createHash + crypto.timingSafeEqual pattern
 * 
 * This is useful when comparing secrets of potentially different lengths,
 * as it hashes both values first to normalize their lengths.
 */
export async function safeCompareWithHash(
  a: string | null | undefined,
  b: string | null | undefined
): Promise<boolean> {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  
  const [hashA, hashB] = await Promise.all([
    hashSha256(a),
    hashSha256(b)
  ])
  
  return timingSafeEqual(hashA, hashB)
}
