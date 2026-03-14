-- Add semester_id (cycle) to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES semesters(id);

-- Index for querying leads by semester
CREATE INDEX IF NOT EXISTS idx_leads_semester_id ON leads(semester_id);

-- Backfill: assign active semester to leads that don't have one
UPDATE leads
SET semester_id = (SELECT id FROM semesters WHERE is_active = true LIMIT 1)
WHERE semester_id IS NULL;
