import crypto from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export type WebhookSource =
  | 'myfatoorah'
  | 'twilio_voice'
  | 'twilio_whatsapp'
  | 'finance'
  | 'ai_transfer'

export type WebhookCheckResult =
  | { ok: true; eventId: string; isReplay: false }
  | { ok: false; reason: 'replay'; eventId: string }
  | { ok: false; reason: 'stale'; eventId: string; ageSeconds: number }

const STALE_TOLERANCE_SECONDS = 60 * 60 // 1 hour

export function hashPayload(body: string): string {
  return crypto.createHash('sha256').update(body).digest('hex')
}

/**
 * Records a webhook event. If the same (source, event_id) was already
 * recorded, returns { ok: false, reason: 'replay' }. The caller should
 * treat that as "already processed — return 200 OK" (do not re-execute
 * side effects).
 *
 * If the body's payload-derived timestamp is older than STALE_TOLERANCE_SECONDS
 * (and the caller passes it), the event is rejected as stale.
 *
 * Service role required (writes bypass RLS).
 */
export async function recordWebhookEvent(
  supabase: SupabaseClient,
  source: WebhookSource,
  eventId: string,
  payloadHash: string,
  payloadTimestampMs: number | null
): Promise<WebhookCheckResult> {
  if (payloadTimestampMs !== null) {
    const ageSeconds = Math.floor((Date.now() - payloadTimestampMs) / 1000)
    if (ageSeconds > STALE_TOLERANCE_SECONDS || ageSeconds < -STALE_TOLERANCE_SECONDS) {
      await supabase.from('webhook_events').insert({
        source,
        event_id: eventId,
        payload_hash: payloadHash,
        status: 'rejected_stale',
        error_message: `Event age ${ageSeconds}s outside ±${STALE_TOLERANCE_SECONDS}s tolerance`,
      })
      return { ok: false, reason: 'stale', eventId, ageSeconds }
    }
  }

  const { error } = await supabase.from('webhook_events').insert({
    source,
    event_id: eventId,
    payload_hash: payloadHash,
    status: 'received',
  })

  if (error) {
    // 23505 = unique_violation → duplicate (source, event_id) → replay
    if (error.code === '23505') {
      return { ok: false, reason: 'replay', eventId }
    }
    throw error
  }

  return { ok: true, eventId, isReplay: false }
}

/**
 * Marks a previously-recorded event as successfully processed.
 */
export async function markWebhookProcessed(
  supabase: SupabaseClient,
  source: WebhookSource,
  eventId: string
): Promise<void> {
  await supabase
    .from('webhook_events')
    .update({ status: 'processed', processed_at: new Date().toISOString() })
    .eq('source', source)
    .eq('event_id', eventId)
}

/**
 * Marks a previously-recorded event as failed during processing.
 */
export async function markWebhookFailed(
  supabase: SupabaseClient,
  source: WebhookSource,
  eventId: string,
  error: string
): Promise<void> {
  await supabase
    .from('webhook_events')
    .update({
      status: 'failed',
      processed_at: new Date().toISOString(),
      error_message: error.slice(0, 500),
    })
    .eq('source', source)
    .eq('event_id', eventId)
}
