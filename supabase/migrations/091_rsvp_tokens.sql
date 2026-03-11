-- RSVP tokens for orientation event confirmation
-- Leads in the applicant stage receive an RSVP link; confirming sets orientation_status = 'confirmed'

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS rsvp_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  event_title TEXT NOT NULL DEFAULT 'Orientation Day',
  event_date TIMESTAMPTZ,
  event_location TEXT,
  confirmed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index for fast token lookups
CREATE INDEX idx_rsvp_tokens_token ON rsvp_tokens(token);
CREATE INDEX idx_rsvp_tokens_lead_id ON rsvp_tokens(lead_id);

-- RLS
ALTER TABLE rsvp_tokens ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read/create tokens
CREATE POLICY "Authenticated users can manage rsvp_tokens"
  ON rsvp_tokens FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anon (public) to read tokens for RSVP confirmation
CREATE POLICY "Anon can read rsvp_tokens"
  ON rsvp_tokens FOR SELECT
  TO anon
  USING (true);

-- Allow anon to update confirmed_at
CREATE POLICY "Anon can confirm rsvp_tokens"
  ON rsvp_tokens FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
