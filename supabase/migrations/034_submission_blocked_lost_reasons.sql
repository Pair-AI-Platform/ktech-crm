-- Add submission blocked reason and lost reason tracking to leads table
-- This extends the submission tracking to include blocked and lost reasons

-- Add submission_blocked_reason field
-- Possible values: 'ku', 'paaet', 'abroad', 'aasu', 'paci', 'puc', 'gpa', 'documents_missing', 'payment_pending', 'other'
ALTER TABLE leads ADD COLUMN IF NOT EXISTS submission_blocked_reason TEXT;

-- Add submission_lost_reason_id field (references lost_reasons table)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS submission_lost_reason_id UUID REFERENCES lost_reasons(id);

-- Create index for filtering by submission blocked reason
CREATE INDEX IF NOT EXISTS idx_leads_submission_blocked_reason ON leads(submission_blocked_reason) WHERE submission_blocked_reason IS NOT NULL;

-- Create index for filtering by submission lost reason
CREATE INDEX IF NOT EXISTS idx_leads_submission_lost_reason_id ON leads(submission_lost_reason_id) WHERE submission_lost_reason_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN leads.submission_blocked_reason IS 'Reason for blocked status in submission: ku, paaet, abroad, aasu, paci, puc, gpa, documents_missing, payment_pending, other';
COMMENT ON COLUMN leads.submission_lost_reason_id IS 'Reference to lost_reasons table when submission is marked as lost';

-- Update the comment for submission_substage to include lost
COMMENT ON COLUMN leads.submission_substage IS 'Substage within Submission stage: pending, submitted, blocked, ready, documents, lost';
