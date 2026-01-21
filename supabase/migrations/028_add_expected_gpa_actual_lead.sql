-- Add expected_gpa and actual_lead columns to leads table
ALTER TABLE leads
ADD COLUMN expected_gpa DECIMAL(5,2) CHECK (expected_gpa >= 0 AND expected_gpa <= 100),
ADD COLUMN actual_lead BOOLEAN DEFAULT false;

-- Add index for actual_lead for faster filtering
CREATE INDEX idx_leads_actual_lead ON leads(actual_lead);

-- Update comments for documentation
COMMENT ON COLUMN leads.expected_gpa IS 'Expected GPA for the lead (0-100)';
COMMENT ON COLUMN leads.actual_lead IS 'Whether this is a confirmed, actual lead';
