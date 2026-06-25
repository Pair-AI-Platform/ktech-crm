import { Redis } from '@upstash/redis'

/**
 * Cross-instance dedup for cron endpoints.
 *
 * Vercel cron can fire the same job on multiple regions/instances. The
 * in-memory `lastRunTimestamp` pattern doesn't catch that. This helper
 * uses Upstash `SET NX EX` so only one instance proceeds per window.
 *
 * When Upstash isn't configured, falls back to allowing the run — the
 * caller's in-memory guard still applies.
 */

let cachedRedis: Redis | null | undefined

function getRedis(): Redis | null {
  if (cachedRedis !== undefined) return cachedRedis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    cachedRedis = null
    return null
  }
  cachedRedis = new Redis({ url, token })
  return cachedRedis
}

const PREFIX = 'ktech-cron:'

/**
 * Returns true if this caller "wins" the run for the given job in the
 * given window. Subsequent callers within `windowSeconds` get false.
 */
export async function tryClaimCronRun(jobName: string, windowSeconds: number): Promise<boolean> {
  const redis = getRedis()
  if (!redis) return true

  const result = await redis.set(PREFIX + jobName, Date.now(), {
    nx: true,
    ex: windowSeconds,
  })
  return result === 'OK'
}
