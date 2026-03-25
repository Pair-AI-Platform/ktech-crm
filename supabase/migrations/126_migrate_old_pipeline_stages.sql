-- Migration 126: Migrate leads from old pipeline stage values to new ones
-- Old -> New mapping:
--   appointed -> visit
--   tested    -> test
--   payment   -> applicant

-- Migrate leads
UPDATE leads SET pipeline_stage = 'visit' WHERE pipeline_stage = 'appointed';
UPDATE leads SET pipeline_stage = 'test' WHERE pipeline_stage = 'tested';
UPDATE leads SET pipeline_stage = 'applicant' WHERE pipeline_stage = 'payment';

-- Also migrate completed_stages arrays
UPDATE leads
SET completed_stages = array_replace(completed_stages, 'appointed', 'visit')
WHERE completed_stages IS NOT NULL AND 'appointed' = ANY(completed_stages);

UPDATE leads
SET completed_stages = array_replace(completed_stages, 'tested', 'test')
WHERE completed_stages IS NOT NULL AND 'tested' = ANY(completed_stages);

UPDATE leads
SET completed_stages = array_replace(completed_stages, 'payment', 'applicant')
WHERE completed_stages IS NOT NULL AND 'payment' = ANY(completed_stages);

-- Also fix lost_at_stage references
UPDATE leads SET lost_at_stage = 'visit' WHERE lost_at_stage = 'appointed';
UPDATE leads SET lost_at_stage = 'test' WHERE lost_at_stage = 'tested';
UPDATE leads SET lost_at_stage = 'applicant' WHERE lost_at_stage = 'payment';

-- Update pipeline_stage_settings
UPDATE pipeline_stage_settings SET stage = 'visit' WHERE stage = 'appointed';
UPDATE pipeline_stage_settings SET stage = 'test' WHERE stage = 'tested';
UPDATE pipeline_stage_settings SET stage = 'applicant' WHERE stage = 'payment';
