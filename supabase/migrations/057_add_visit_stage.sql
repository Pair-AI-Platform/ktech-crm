-- Add 'visit' stage to pipeline_stage enum and stage settings
DO $$
BEGIN
  BEGIN
    ALTER TYPE pipeline_stage ADD VALUE IF NOT EXISTS 'visit';
  EXCEPTION WHEN others THEN NULL;
  END;
END $$;

-- Add visit to pipeline_stage_settings
INSERT INTO pipeline_stage_settings (stage, is_active, display_order) VALUES
  ('visit', true, 3)
ON CONFLICT (stage) DO NOTHING;

-- Shift display_order for stages after visit
UPDATE pipeline_stage_settings SET display_order = display_order + 1
WHERE stage IN ('test', 'application', 'applicant', 'enrolled', 'lost', 'withdraw')
AND display_order >= 3;
