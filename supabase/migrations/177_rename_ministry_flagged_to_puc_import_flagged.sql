-- Migration 177: Rename ministry_flagged to puc_import_flagged
--
-- The "Ministry File Import" feature is rebranded as "PUC Import".
-- The boolean column on leads that marks rows where the ministry accepted the
-- student but they did not enter the system through the PUC Submission flow
-- is renamed accordingly. The same value is now rendered in the UI as a
-- numbered "2" badge instead of a star.
--
-- Existing data is preserved verbatim. The partial index is renamed; Postgres
-- automatically rewrites its predicate to reference the new column name.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'ministry_flagged'
  ) THEN
    ALTER TABLE leads RENAME COLUMN ministry_flagged TO puc_import_flagged;
  END IF;
END$$;

ALTER INDEX IF EXISTS idx_leads_ministry_flagged RENAME TO idx_leads_puc_import_flagged;
