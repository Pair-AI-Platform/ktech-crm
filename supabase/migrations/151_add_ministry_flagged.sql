-- Migration 151: Add ministry_flagged boolean to leads
-- Used when importing ministry file to flag leads that were NOT in
-- PUC Application Submission stage but appeared in the ministry list.
-- These leads get a visible gold star in the UI.

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS ministry_flagged BOOLEAN DEFAULT FALSE;

-- Index for filtering flagged leads
CREATE INDEX IF NOT EXISTS idx_leads_ministry_flagged
ON leads (ministry_flagged) WHERE ministry_flagged = TRUE;
