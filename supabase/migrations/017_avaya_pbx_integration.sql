-- Migration: Avaya PBX Integration
-- Adds support for receiving missed calls from Avaya PBX systems

-- Add Avaya-specific columns to calls table
ALTER TABLE calls
ADD COLUMN IF NOT EXISTS avaya_call_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS avaya_ucid TEXT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'twilio' CHECK (source IN ('twilio', 'avaya', 'manual'));

-- Add index for Avaya call lookups
CREATE INDEX IF NOT EXISTS idx_calls_avaya_call_id ON calls(avaya_call_id) WHERE avaya_call_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calls_avaya_ucid ON calls(avaya_ucid) WHERE avaya_ucid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calls_source ON calls(source);

-- Add index for missed calls query (used by dashboard widget)
CREATE INDEX IF NOT EXISTS idx_calls_missed_today ON calls(status, created_at DESC)
WHERE status = 'no_answer';

-- Create avaya_config table for PBX connection settings
CREATE TABLE IF NOT EXISTS avaya_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  system_type TEXT NOT NULL CHECK (system_type IN ('ip_office', 'aura', 'cloud_office', 'other')),
  host_url TEXT,
  webhook_secret TEXT,
  api_key TEXT,
  api_secret TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on avaya_config
ALTER TABLE avaya_config ENABLE ROW LEVEL SECURITY;

-- Only admins can view/modify Avaya config
CREATE POLICY "Admins can manage avaya config" ON avaya_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create avaya_webhook_logs table for debugging
CREATE TABLE IF NOT EXISTS avaya_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  error_message TEXT,
  call_id UUID REFERENCES calls(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for webhook log lookups
CREATE INDEX IF NOT EXISTS idx_avaya_webhook_logs_created_at ON avaya_webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_avaya_webhook_logs_event_type ON avaya_webhook_logs(event_type);

-- Enable RLS on webhook logs
ALTER TABLE avaya_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view webhook logs
CREATE POLICY "Admins can view avaya webhook logs" ON avaya_webhook_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Update existing calls to have source='twilio' if they have a twilio_call_sid
UPDATE calls
SET source = 'twilio'
WHERE twilio_call_sid IS NOT NULL AND source IS NULL;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_avaya_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS avaya_config_updated_at ON avaya_config;
CREATE TRIGGER avaya_config_updated_at
  BEFORE UPDATE ON avaya_config
  FOR EACH ROW
  EXECUTE FUNCTION update_avaya_config_updated_at();

-- Comment on tables/columns for documentation
COMMENT ON COLUMN calls.avaya_call_id IS 'Unique call identifier from Avaya PBX system';
COMMENT ON COLUMN calls.avaya_ucid IS 'Universal Call ID from Avaya (for call tracking across systems)';
COMMENT ON COLUMN calls.source IS 'Source of the call: twilio (cloud), avaya (PBX), or manual (hand-entered)';
COMMENT ON TABLE avaya_config IS 'Configuration for Avaya PBX webhook integration';
COMMENT ON TABLE avaya_webhook_logs IS 'Log of incoming webhooks from Avaya PBX for debugging';
