-- Add manual status for agents (meeting, break)
-- When set, this overrides the heartbeat-derived status
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS manual_status VARCHAR(20) DEFAULT NULL
  CHECK (manual_status IS NULL OR manual_status IN ('meeting', 'break'));
