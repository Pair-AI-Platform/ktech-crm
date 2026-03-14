-- Add puc_app_submission target column to agent_targets table
ALTER TABLE agent_targets
  ADD COLUMN IF NOT EXISTS puc_app_submission integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weekly_puc_app_submission jsonb;
