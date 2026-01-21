-- Add ministry blocked tracking fields to leads table
-- This tracks when a lead is blocked on the ministry website submission

-- Add ministry_blocked boolean field
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ministry_blocked BOOLEAN DEFAULT FALSE;

-- Add ministry_block_reasons as a text array to store multiple reasons
-- Possible values: 'ku', 'paaet', 'abroad', 'aasu', 'paci', 'puc', 'gpa'
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ministry_block_reasons TEXT[] DEFAULT '{}';

-- Create index for filtering blocked leads
CREATE INDEX IF NOT EXISTS idx_leads_ministry_blocked ON leads(ministry_blocked) WHERE ministry_blocked = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN leads.ministry_blocked IS 'Whether the lead is blocked on the ministry website submission';
COMMENT ON COLUMN leads.ministry_block_reasons IS 'Array of block reasons: ku, paaet, abroad, aasu, paci, puc, gpa';
