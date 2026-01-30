-- Migration: Add withdraw pipeline stage
INSERT INTO pipeline_stage_settings (stage, is_active, display_order) VALUES
  ('withdraw', true, 8)
ON CONFLICT (stage) DO NOTHING;
