-- Add seat_number and actual_gpa columns to leads table for MOE GPA fetch feature
ALTER TABLE leads
ADD COLUMN seat_number VARCHAR(50),
ADD COLUMN actual_gpa DECIMAL(5,2) CHECK (actual_gpa >= 0 AND actual_gpa <= 100),
ADD COLUMN moe_fetch_status VARCHAR(20),
ADD COLUMN moe_fetch_error TEXT,
ADD COLUMN moe_fetched_at TIMESTAMPTZ;

-- Add index for seat_number for faster lookups
CREATE INDEX idx_leads_seat_number ON leads(seat_number);

-- Add comments for documentation
COMMENT ON COLUMN leads.seat_number IS 'Student seat number for MOE portal authentication';
COMMENT ON COLUMN leads.actual_gpa IS 'Actual GPA fetched from MOE portal (0-100)';
COMMENT ON COLUMN leads.moe_fetch_status IS 'Status of last MOE fetch attempt: pending, success, error';
COMMENT ON COLUMN leads.moe_fetch_error IS 'Error message from last failed MOE fetch attempt';
COMMENT ON COLUMN leads.moe_fetched_at IS 'Timestamp of last successful MOE GPA fetch';
