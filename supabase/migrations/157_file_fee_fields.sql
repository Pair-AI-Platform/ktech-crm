-- Migration: Add file fee tracking fields to leads
-- When a lead moves to the "application" (File) stage, they must pay application + test fees or be exempted.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS file_fee_status TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS file_application_fee NUMERIC(10,3) DEFAULT 20,
  ADD COLUMN IF NOT EXISTS file_test_fee NUMERIC(10,3) DEFAULT 15,
  ADD COLUMN IF NOT EXISTS file_fee_exempted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS file_fee_exempted_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS file_fee_exempted_at TIMESTAMPTZ;

COMMENT ON COLUMN leads.file_fee_status IS 'File stage fee status: none, pending, paid, exempt';
COMMENT ON COLUMN leads.file_application_fee IS 'Application fee amount in KWD (default 20)';
COMMENT ON COLUMN leads.file_test_fee IS 'Test fee amount in KWD (default 15, adjustable)';
COMMENT ON COLUMN leads.file_fee_exempted IS 'Whether the lead was exempted from file fees';
COMMENT ON COLUMN leads.file_fee_exempted_by IS 'User who exempted the lead from file fees';
COMMENT ON COLUMN leads.file_fee_exempted_at IS 'When the lead was exempted from file fees';

CREATE INDEX IF NOT EXISTS idx_leads_file_fee_status ON leads(file_fee_status);
