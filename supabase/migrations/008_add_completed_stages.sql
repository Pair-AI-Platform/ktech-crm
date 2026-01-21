-- Add completed_stages column to track which stages have been marked as done
-- This allows skipping stages while still being able to mark specific stages as completed

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS completed_stages text[] DEFAULT '{}';

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_leads_completed_stages ON leads USING GIN (completed_stages);

COMMENT ON COLUMN leads.completed_stages IS 'Array of pipeline stages that have been explicitly marked as completed';
