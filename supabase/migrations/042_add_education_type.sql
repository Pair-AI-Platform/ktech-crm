-- Add education type field to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS education_type VARCHAR(10);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS education_type_custom VARCHAR(255);
