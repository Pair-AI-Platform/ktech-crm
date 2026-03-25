-- Add ministry_accepted_major column to leads table
-- This field stores the major assigned by the Ministry (from the acceptance file)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ministry_accepted_major VARCHAR(255);
