-- Migration 125: Add missing pipeline_stage enum values and migrate old stage names
-- The DB has old values (appointed, tested, payment) but frontend expects (visit, test, applicant)

-- Step 1: Add missing enum values
ALTER TYPE pipeline_stage ADD VALUE IF NOT EXISTS 'visit';
ALTER TYPE pipeline_stage ADD VALUE IF NOT EXISTS 'test';
ALTER TYPE pipeline_stage ADD VALUE IF NOT EXISTS 'applicant';
ALTER TYPE pipeline_stage ADD VALUE IF NOT EXISTS 'withdraw';

-- Step 2: Migrate old stage values to new ones (must be in a separate transaction after ADD VALUE)
