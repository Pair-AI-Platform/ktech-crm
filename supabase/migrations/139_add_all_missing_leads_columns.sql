-- Add all potentially missing columns to leads table
-- These columns are referenced in the codebase but may not exist in the database
-- Using IF NOT EXISTS to safely skip any that already exist

-- Placement Test columns
ALTER TABLE leads ADD COLUMN IF NOT EXISTS placement_level TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS placement_english_score DECIMAL(5,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS placement_english_passed BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS placement_english_override BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS placement_math_score DECIMAL(5,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS placement_math_passed BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS placement_math_override BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS placement_computer_score DECIMAL(5,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS placement_computer_passed BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS placement_computer_override BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS placement_lms_synced BOOLEAN DEFAULT false;

-- Academic extras
ALTER TABLE leads ADD COLUMN IF NOT EXISTS preferred_major VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS preferred_college VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS expected_gpa DECIMAL(5,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS actual_gpa DECIMAL(5,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS actual_lead BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS seat_number VARCHAR(50);

-- MOE GPA Fetch
ALTER TABLE leads ADD COLUMN IF NOT EXISTS moe_fetch_status VARCHAR(20);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS moe_fetch_error TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS moe_fetched_at TIMESTAMPTZ;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
