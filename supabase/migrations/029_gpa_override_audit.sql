-- Add GPA override tracking fields to leads table
-- This allows agents to manually override GPA values and bypass auto-PUC logic

-- Override flags for each GPA field (following placement_test override pattern)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS gpa_grade_10_override BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS gpa_grade_11_override BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS gpa_grade_12_expected_override BOOLEAN DEFAULT FALSE;

-- Original values (stored when override is first applied)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS gpa_grade_10_original DECIMAL(5,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS gpa_grade_11_original DECIMAL(5,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS gpa_grade_12_expected_original DECIMAL(5,2);

-- Audit information
ALTER TABLE leads ADD COLUMN IF NOT EXISTS gpa_overridden_by UUID REFERENCES profiles(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS gpa_overridden_at TIMESTAMPTZ;

-- Index for querying overridden leads
CREATE INDEX IF NOT EXISTS idx_leads_gpa_overridden ON leads(gpa_overridden_by)
WHERE gpa_grade_10_override = TRUE
   OR gpa_grade_11_override = TRUE
   OR gpa_grade_12_expected_override = TRUE;

-- Comments for documentation
COMMENT ON COLUMN leads.gpa_grade_10_override IS 'Whether GPA Grade 10 was manually overridden by agent';
COMMENT ON COLUMN leads.gpa_grade_11_override IS 'Whether GPA Grade 11 was manually overridden by agent';
COMMENT ON COLUMN leads.gpa_grade_12_expected_override IS 'Whether GPA Grade 12 Expected was manually overridden by agent';
COMMENT ON COLUMN leads.gpa_grade_10_original IS 'Original GPA Grade 10 value before override';
COMMENT ON COLUMN leads.gpa_grade_11_original IS 'Original GPA Grade 11 value before override';
COMMENT ON COLUMN leads.gpa_grade_12_expected_original IS 'Original GPA Grade 12 Expected value before override';
COMMENT ON COLUMN leads.gpa_overridden_by IS 'Agent who performed the GPA override';
COMMENT ON COLUMN leads.gpa_overridden_at IS 'Timestamp when GPA was overridden';
