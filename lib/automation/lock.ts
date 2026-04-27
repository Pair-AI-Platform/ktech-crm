import { Redis } from '@upstash/redis'

/**
 * Cross-instance re-entry guard for the automation engine.
 *
 * In serverless (Vercel), the per-instance `Set<string>` guard in engine.ts
 * is useless across multiple cold starts running in parallel. This helper
 * uses Upstash Redis `SET NX EX` to give us a real distributed lock with
 * TTL — so a runaway loop on instance A cannot trigger the same rule on
 * instance B.
 *
 * When Upstash is not configured, all calls are no-ops and the engine
 * falls back to its in-memory Set. That's fine for local dev and for
 * preview deploys without Redis creds.
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

const LOCK_PREFIX = 'ktech-automation-lock:'
const LOCK_TTL_SECONDS = 30

/**
 * Try to acquire a lock for `(leadId, trigger)`.
 * Returns true if we got it (caller must release), false if another
 * instance/in-flight execution holds it.
 */
export async function tryAcquireAutomationLock(executionKey: string): Promise<boolean> {
  const redis = getRedis()
  if (!redis) return true // Upstash not configured — fall through to in-memory guard

  const key = LOCK_PREFIX + executionKey
  const result = await redis.set(key, '1', { nx: true, ex: LOCK_TTL_SECONDS })
  return result === 'OK'
}

export async function releaseAutomationLock(executionKey: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  await redis.del(LOCK_PREFIX + executionKey).catch(() => {
    // Best-effort — TTL will reap the key if delete fails.
  })
}
