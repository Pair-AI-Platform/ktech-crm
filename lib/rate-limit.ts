import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

interface RateLimitConfig {
  interval: number  // time window in ms
  limit: number     // max requests per window
}

/**
 * Create an Upstash Redis-backed rate limiter.
 * Falls back to allowing all requests if Upstash env vars are missing (dev mode).
 */
function createRateLimiter(config: RateLimitConfig): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    return null
  }

  const redis = new Redis({ url, token })

  // Convert ms interval to Upstash duration string
  const seconds = Math.round(config.interval / 1000)
  const window = seconds >= 60 ? `${Math.round(seconds / 60)} m` : `${seconds} s`

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.limit, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    analytics: true,
    prefix: 'ktech-rl',
  })
}

// Cache limiter instances by config to avoid recreating on every call
const limiterCache = new Map<string, Ratelimit | null>()

function getLimiter(config: RateLimitConfig): Ratelimit | null {
  const cacheKey = `${config.interval}:${config.limit}`
  if (!limiterCache.has(cacheKey)) {
    limiterCache.set(cacheKey, createRateLimiter(config))
  }
  return limiterCache.get(cacheKey)!
}

export async function rateLimit(key: string, config: RateLimitConfig): Promise<{ success: boolean; remaining: number; resetIn: number }> {
  const limiter = getLimiter(config)

  // Graceful fallback: if no Upstash config, allow all requests (dev mode)
  if (!limiter) {
    return { success: true, remaining: config.limit, resetIn: 0 }
  }

  const result = await limiter.limit(key)

  return {
    success: result.success,
    remaining: result.remaining,
    resetIn: result.reset - Date.now(),
  }
}

// Pre-configured rate limiters for different use cases
export const RATE_LIMITS = {
  sms: { interval: 60_000, limit: 10 },        // 10 SMS per minute
  whatsapp: { interval: 60_000, limit: 10 },    // 10 WhatsApp per minute
  payment: { interval: 60_000, limit: 5 },      // 5 payment links per minute
  import: { interval: 300_000, limit: 3 },       // 3 bulk imports per 5 min
  export: { interval: 60_000, limit: 5 },        // 5 exports per minute
  api: { interval: 60_000, limit: 60 },          // 60 general API calls per minute
} as const
