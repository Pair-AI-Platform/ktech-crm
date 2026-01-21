-- =============================================
-- Migration: Remove 'payment' and 'enrolled' from pipeline_stage enum
-- =============================================

-- Step 1: Update any leads with 'payment' or 'enrolled' stage to 'application'
-- (application is the last active stage before lost)
UPDATE leads
SET pipeline_stage = 'application'::pipeline_stage
WHERE pipeline_stage IN ('payment'::pipeline_stage, 'enrolled'::pipeline_stage);

-- Step 2: Create the new enum type without payment and enrolled
CREATE TYPE pipeline_stage_new AS ENUM (
  'new', 'visit', 'test', 'application', 'lost'
);

-- Step 3: Update the leads table to use the new enum
ALTER TABLE leads
  ALTER COLUMN pipeline_stage TYPE pipeline_stage_new
  USING pipeline_stage::text::pipeline_stage_new;

-- Step 4: Update the completed_stages column if it exists and contains the old values
-- First update any arrays that contain payment or enrolled
UPDATE leads
SET completed_stages = array_remove(array_remove(completed_stages, 'payment'), 'enrolled')
WHERE completed_stages IS NOT NULL
  AND (completed_stages @> ARRAY['payment']::pipeline_stage[]
       OR completed_stages @> ARRAY['enrolled']::pipeline_stage[]);

-- Step 5: Update completed_stages column type
ALTER TABLE leads
  ALTER COLUMN completed_stages TYPE pipeline_stage_new[]
  USING completed_stages::text[]::pipeline_stage_new[];

-- Step 6: Update the pipeline_stage_settings table if it uses the enum
UPDATE pipeline_stage_settings
SET stage = 'application'
WHERE stage IN ('payment', 'enrolled');

-- Step 7: Drop the old enum type
DROP TYPE pipeline_stage;

-- Step 8: Rename the new enum to the original name
ALTER TYPE pipeline_stage_new RENAME TO pipeline_stage;

-- Step 9: Clean up pipeline_stage_settings to remove payment and enrolled rows
DELETE FROM pipeline_stage_settings WHERE stage IN ('payment', 'enrolled');
