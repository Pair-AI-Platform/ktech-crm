-- Add ministry_assigned flag to track leads assigned by ministry (not 1st choice KTECH)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ministry_assigned BOOLEAN DEFAULT false;

-- Add address field (extracted from Civil ID or manual entry)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS address TEXT;

-- Add civil ID expiry date (extracted from Civil ID document)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS civil_id_expiry DATE;

-- Partial index for efficient filtering of ministry-assigned leads
CREATE INDEX IF NOT EXISTS idx_leads_ministry_assigned ON leads(ministry_assigned) WHERE ministry_assigned = true;
