-- Migration 171: Webhook Event Deduplication
--
-- Table that records every webhook delivery from external providers
-- (MyFatoorah, Twilio). UNIQUE(source, event_id) makes replay attacks
-- a no-op: a duplicate INSERT returns the original row, callers detect
-- the conflict and short-circuit.
--
-- received_at lets us reject events older than a tolerance window
-- (currently 1 hour, enforced application-side).

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('myfatoorah', 'twilio_sms', 'twilio_voice', 'twilio_whatsapp')),
  event_id TEXT NOT NULL,
  payload_hash TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'failed', 'rejected_replay', 'rejected_stale')),
  error_message TEXT,
  CONSTRAINT webhook_events_source_event_unique UNIQUE (source, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at
  ON webhook_events (received_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_events_source_status
  ON webhook_events (source, status);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Admin-only read; INSERT happens through service role (bypasses RLS).
DROP POLICY IF EXISTS "webhook_events_admin_select" ON webhook_events;

CREATE POLICY "webhook_events_admin_select" ON webhook_events
  FOR SELECT TO authenticated
  USING (public.is_admin());

COMMENT ON TABLE webhook_events IS
  'Idempotency + replay-protection log for inbound webhooks. UNIQUE(source, event_id) means duplicate deliveries become a no-op. received_at enables stale-event rejection.';
