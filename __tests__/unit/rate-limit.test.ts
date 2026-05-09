import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Upstash modules before importing
const mockLimit = vi.fn()

vi.mock('@upstash/redis', () => ({
  Redis: class MockRedis {
    constructor() {}
  },
}))

vi.mock('@upstash/ratelimit', () => {
  const MockRatelimit = class {
    constructor() {}
    limit = mockLimit
    static slidingWindow = vi.fn().mockReturnValue('sliding-window-config')
  }
  return { Ratelimit: MockRatelimit }
})

describe('rateLimit', () => {
  beforeEach(() => {
    vi.resetModules()
    mockLimit.mockReset()
  })

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('allows requests when Upstash is not configured (dev fallback)', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN

    const { rateLimit, RATE_LIMITS } = await import('@/lib/rate-limit')
    const result = await rateLimit('test-key', RATE_LIMITS.whatsapp)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(RATE_LIMITS.whatsapp.limit)
  })

  it('uses Upstash when configured and returns success', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'

    mockLimit.mockResolvedValue({
      success: true,
      remaining: 9,
      reset: Date.now() + 60000,
    })

    const { rateLimit, RATE_LIMITS } = await import('@/lib/rate-limit')
    const result = await rateLimit('user:123', RATE_LIMITS.whatsapp)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(9)
    expect(mockLimit).toHaveBeenCalledWith('user:123')
  })

  it('returns failure when rate limit exceeded', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'

    mockLimit.mockResolvedValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 30000,
    })

    const { rateLimit, RATE_LIMITS } = await import('@/lib/rate-limit')
    const result = await rateLimit('user:123', RATE_LIMITS.whatsapp)
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('RATE_LIMITS has expected presets', async () => {
    const { RATE_LIMITS } = await import('@/lib/rate-limit')
    expect(RATE_LIMITS.whatsapp).toEqual({ interval: 60_000, limit: 10 })
    expect(RATE_LIMITS.payment).toEqual({ interval: 60_000, limit: 5 })
    expect(RATE_LIMITS.import).toEqual({ interval: 300_000, limit: 3 })
    expect(RATE_LIMITS.export).toEqual({ interval: 60_000, limit: 5 })
  })
})
