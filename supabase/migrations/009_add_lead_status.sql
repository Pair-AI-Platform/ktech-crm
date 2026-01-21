-- Add status column to leads table
-- This adds a general status to track if a lead is active, on hold, etc.

CREATE TYPE lead_status AS ENUM (
  'active',      -- Lead is being actively worked
  'on_hold',     -- Lead is temporarily paused
  'qualified',   -- Lead is qualified and ready for next steps
  'unqualified', -- Lead doesn't meet criteria
  'archived',    -- Lead is no longer active
  'no_answer',   -- Lead not answering calls
  'retry',       -- Need to retry contact
  'cold',        -- Cold lead
  'warm',        -- Warm lead
  'junk'         -- Junk/spam lead
);

ALTER TABLE leads
ADD COLUMN status lead_status DEFAULT 'active';

-- Add index for faster filtering
CREATE INDEX idx_leads_status ON leads(status);

-- Update existing leads to have 'active' status (already set by default)
UPDATE leads SET status = 'active' WHERE status IS NULL;
