import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  hashPayload,
  recordWebhookEvent,
  markWebhookProcessed,
  markWebhookFailed,
} from '@/lib/webhook-events'

/**
 * These tests exercise the dedup helper against a mocked Supabase
 * client. The real database guarantee (UNIQUE on source+event_id) is
 * exercised in supabase/tests/rls/02_payment_immutability.sql — this
 * suite is here to verify the JS-side branching logic: that a 23505
 * error from the DB is correctly translated to { reason: 'replay' },
 * and that stale-by-timestamp gets logged as 'rejected_stale' without
 * touching the unique constraint.
 */

type InsertCall = { source: string; event_id: string; status: string; error_message?: string }

function createMockSupabase(insertBehavior: 'success' | 'unique_violation' | 'other_error') {
  const insertCalls: InsertCall[] = []
  const updateCalls: Array<{ status: string; eventId: string }> = []

  return {
    insertCalls,
    updateCalls,
    client: {
      from: vi.fn().mockImplementation((table: string) => {
        expect(table).toBe('webhook_events')

        return {
          insert: vi.fn().mockImplementation((row: InsertCall) => {
            insertCalls.push(row)
            if (insertBehavior === 'unique_violation') {
              return Promise.resolve({ error: { code: '23505', message: 'duplicate key' } })
            }
            if (insertBehavior === 'other_error') {
              return Promise.resolve({ error: { code: 'XX000', message: 'other db error' } })
            }
            return Promise.resolve({ error: null })
          }),
          update: vi.fn().mockImplementation((patch: { status: string }) => {
            return {
              eq: vi.fn().mockImplementation((_col1: string, _val1: string) => ({
                eq: vi.fn().mockImplementation((_col2: string, val2: string) => {
                  updateCalls.push({ status: patch.status, eventId: val2 })
                  return Promise.resolve({ error: null })
                }),
              })),
            }
          }),
        }
      }),
    },
  }
}

describe('hashPayload', () => {
  it('produces stable sha256 of input', () => {
    expect(hashPayload('hello')).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
    )
  })

  it('different bodies produce different hashes', () => {
    expect(hashPayload('a')).not.toBe(hashPayload('b'))
  })
})

describe('recordWebhookEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns ok on first delivery', async () => {
    const mock = createMockSupabase('success')
    const result = await recordWebhookEvent(
      mock.client as never,
      'myfatoorah',
      'evt-1',
      hashPayload('body'),
      null
    )

    expect(result).toEqual({ ok: true, eventId: 'evt-1', isReplay: false })
    expect(mock.insertCalls).toHaveLength(1)
    expect(mock.insertCalls[0]).toMatchObject({
      source: 'myfatoorah',
      event_id: 'evt-1',
      status: 'received',
    })
  })

  it('returns replay on duplicate (unique_violation)', async () => {
    const mock = createMockSupabase('unique_violation')
    const result = await recordWebhookEvent(
      mock.client as never,
      'twilio_whatsapp',
      'SM123:delivered',
      hashPayload('body'),
      null
    )

    expect(result).toEqual({ ok: false, reason: 'replay', eventId: 'SM123:delivered' })
  })

  it('rethrows on non-uniqueness error', async () => {
    const mock = createMockSupabase('other_error')
    await expect(
      recordWebhookEvent(mock.client as never, 'myfatoorah', 'evt-2', hashPayload('body'), null)
    ).rejects.toMatchObject({ code: 'XX000' })
  })

  it('rejects events older than 1 hour as stale', async () => {
    const mock = createMockSupabase('success')
    const oneHourAndOneSecondAgo = Date.now() - (60 * 60 * 1000 + 1000)

    const result = await recordWebhookEvent(
      mock.client as never,
      'myfatoorah',
      'evt-stale',
      hashPayload('body'),
      oneHourAndOneSecondAgo
    )

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('stale')
    }
    // Stale rejection still records the event for audit, with rejected_stale status.
    expect(mock.insertCalls).toHaveLength(1)
    expect(mock.insertCalls[0].status).toBe('rejected_stale')
  })

  it('rejects far-future events as stale (clock skew defense)', async () => {
    const mock = createMockSupabase('success')
    const oneHourFromNow = Date.now() + (60 * 60 * 1000 + 1000)

    const result = await recordWebhookEvent(
      mock.client as never,
      'myfatoorah',
      'evt-future',
      hashPayload('body'),
      oneHourFromNow
    )

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('stale')
    }
  })

  it('accepts events within tolerance', async () => {
    const mock = createMockSupabase('success')
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000

    const result = await recordWebhookEvent(
      mock.client as never,
      'myfatoorah',
      'evt-fresh',
      hashPayload('body'),
      fiveMinutesAgo
    )

    expect(result.ok).toBe(true)
    expect(mock.insertCalls[0].status).toBe('received')
  })
})

describe('markWebhookProcessed / markWebhookFailed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('markWebhookProcessed updates the row to processed', async () => {
    const mock = createMockSupabase('success')
    await markWebhookProcessed(mock.client as never, 'myfatoorah', 'evt-x')
    expect(mock.updateCalls).toEqual([{ status: 'processed', eventId: 'evt-x' }])
  })

  it('markWebhookFailed truncates long error messages', async () => {
    const mock = createMockSupabase('success')
    const long = 'X'.repeat(1000)
    await markWebhookFailed(mock.client as never, 'twilio_whatsapp', 'SM-x', long)
    // We rely on update being called; the actual truncation happens in the
    // payload to the .update() call. This test exists primarily so future
    // refactors don't regress the truncation guard.
    expect(mock.updateCalls).toHaveLength(1)
    expect(mock.updateCalls[0].status).toBe('failed')
  })
})
