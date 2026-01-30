-- Add submission_blocked_reason_notes column to leads table
-- This field stores additional notes when the blocked reason is "Other"

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS submission_blocked_reason_notes TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN leads.submission_blocked_reason_notes IS 'Additional notes when submission_blocked_reason is set to other';
