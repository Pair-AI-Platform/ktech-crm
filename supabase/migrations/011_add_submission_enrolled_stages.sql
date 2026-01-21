-- Migration: Add submission and enrolled stages to pipeline_stage_settings
-- This adds the missing stages that were not included in the initial migration

-- Add submission stage if not exists
INSERT INTO pipeline_stage_settings (stage, is_active, display_order) VALUES
  ('submission', true, 5)
ON CONFLICT (stage) DO NOTHING;

-- Add enrolled stage if not exists
INSERT INTO pipeline_stage_settings (stage, is_active, display_order) VALUES
  ('enrolled', true, 6)
ON CONFLICT (stage) DO NOTHING;

-- Update display_order for lost stage to be after enrolled
UPDATE pipeline_stage_settings
SET display_order = 7
WHERE stage = 'lost';
