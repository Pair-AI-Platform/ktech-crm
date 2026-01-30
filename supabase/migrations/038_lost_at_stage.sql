-- Migration: Add lost_at_stage field to track which stage a lead was in before being marked as lost
-- This allows filtering lost leads by the stage they were lost at

-- Add the lost_at_stage column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_at_stage TEXT;

-- Add index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_leads_lost_at_stage ON leads(lost_at_stage);

-- Add comment for documentation
COMMENT ON COLUMN leads.lost_at_stage IS 'The pipeline stage the lead was in before being marked as lost. Used for filtering and reporting.';
