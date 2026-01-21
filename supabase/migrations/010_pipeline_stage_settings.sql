-- Migration: Add pipeline stage settings table
-- This allows admins to enable/disable pipeline stages

-- Create pipeline_stage_settings table
CREATE TABLE IF NOT EXISTS pipeline_stage_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default settings for all stages
INSERT INTO pipeline_stage_settings (stage, is_active, display_order) VALUES
  ('new', true, 1),
  ('visit', true, 2),
  ('test', true, 3),
  ('application', true, 4),
  ('submission', true, 5),
  ('enrolled', true, 6),
  ('lost', true, 7)
ON CONFLICT (stage) DO NOTHING;

-- Enable RLS
ALTER TABLE pipeline_stage_settings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read stage settings
CREATE POLICY "Users can view stage settings"
  ON pipeline_stage_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can update stage settings
CREATE POLICY "Admins can update stage settings"
  ON pipeline_stage_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_pipeline_stage_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pipeline_stage_settings_updated_at
  BEFORE UPDATE ON pipeline_stage_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_pipeline_stage_settings_updated_at();

-- Add index on stage for quick lookups
CREATE INDEX IF NOT EXISTS idx_pipeline_stage_settings_stage ON pipeline_stage_settings(stage);
CREATE INDEX IF NOT EXISTS idx_pipeline_stage_settings_active ON pipeline_stage_settings(is_active);
