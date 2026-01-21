-- Add submission stage tracking fields to leads table
-- This tracks substages and statuses within the Submission pipeline stage

-- Add submission_substage field
-- Possible values: 'pending', 'submitted', 'blocked', 'ready', 'documents'
ALTER TABLE leads ADD COLUMN IF NOT EXISTS submission_substage TEXT DEFAULT 'pending';

-- Add submission_status field
-- Possible values: 'cancelled', 'cb', 'appointment'
ALTER TABLE leads ADD COLUMN IF NOT EXISTS submission_status TEXT;

-- Create index for filtering by submission substage
CREATE INDEX IF NOT EXISTS idx_leads_submission_substage ON leads(submission_substage) WHERE submission_substage IS NOT NULL;

-- Create index for filtering by submission status
CREATE INDEX IF NOT EXISTS idx_leads_submission_status ON leads(submission_status) WHERE submission_status IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN leads.submission_substage IS 'Substage within Submission stage: pending, submitted, blocked, ready, documents';
COMMENT ON COLUMN leads.submission_status IS 'Status within Submission stage: cancelled, cb, appointment';
