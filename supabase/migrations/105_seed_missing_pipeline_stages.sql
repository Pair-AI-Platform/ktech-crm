-- Migration: Create pipeline_stage_settings table (if not exists) and seed all stages

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS pipeline_stage_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE pipeline_stage_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies (idempotent with DO blocks)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'pipeline_stage_settings'
    AND policyname = 'Users can view stage settings'
  ) THEN
    CREATE POLICY "Users can view stage settings"
      ON pipeline_stage_settings
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'pipeline_stage_settings'
    AND policyname = 'Admins can update stage settings'
  ) THEN
    CREATE POLICY "Admins can update stage settings"
      ON pipeline_stage_settings
      FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'pipeline_stage_settings'
    AND policyname = 'Admins can insert stage settings'
  ) THEN
    CREATE POLICY "Admins can insert stage settings"
      ON pipeline_stage_settings
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_pipeline_stage_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_pipeline_stage_settings_updated_at ON pipeline_stage_settings;
CREATE TRIGGER update_pipeline_stage_settings_updated_at
  BEFORE UPDATE ON pipeline_stage_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_pipeline_stage_settings_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pipeline_stage_settings_stage ON pipeline_stage_settings(stage);
CREATE INDEX IF NOT EXISTS idx_pipeline_stage_settings_active ON pipeline_stage_settings(is_active);

-- Seed all pipeline stages
INSERT INTO pipeline_stage_settings (stage, is_active, display_order) VALUES
  ('new', true, 1),
  ('contacted', true, 2),
  ('visit', true, 3),
  ('test', true, 4),
  ('application', true, 5),
  ('puc_document_submission', true, 6),
  ('puc_application_submission', true, 7),
  ('applicant', true, 8),
  ('enrolled', true, 9),
  ('withdraw', true, 10),
  ('lost', true, 11)
ON CONFLICT (stage) DO NOTHING;

-- Reorder all stages to correct pipeline order
UPDATE pipeline_stage_settings SET display_order = 1 WHERE stage = 'new';
UPDATE pipeline_stage_settings SET display_order = 2 WHERE stage = 'contacted';
UPDATE pipeline_stage_settings SET display_order = 3 WHERE stage = 'visit';
UPDATE pipeline_stage_settings SET display_order = 4 WHERE stage = 'test';
UPDATE pipeline_stage_settings SET display_order = 5 WHERE stage = 'application';
UPDATE pipeline_stage_settings SET display_order = 6 WHERE stage = 'puc_document_submission';
UPDATE pipeline_stage_settings SET display_order = 7 WHERE stage = 'puc_application_submission';
UPDATE pipeline_stage_settings SET display_order = 8 WHERE stage = 'applicant';
UPDATE pipeline_stage_settings SET display_order = 9 WHERE stage = 'enrolled';
UPDATE pipeline_stage_settings SET display_order = 10 WHERE stage = 'withdraw';
UPDATE pipeline_stage_settings SET display_order = 11 WHERE stage = 'lost';

-- Remove old 'submission' stage if it exists
DELETE FROM pipeline_stage_settings WHERE stage = 'submission';
