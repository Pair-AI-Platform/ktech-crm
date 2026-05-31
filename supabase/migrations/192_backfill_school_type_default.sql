-- =============================================
-- MIGRATION: Backfill + default school_type
-- =============================================
-- The lead's education type is now derived (and locked) from the school's
-- school_type. Schools added through the UI could previously be saved with a
-- NULL school_type, which would leave the lead's Education Type unset.
--
-- 1. Backfill any NULL school_type to 'gov' (Kuwait Government) — the same
--    default migration 078 used, and the overwhelming majority of schools.
--    Admins can re-classify any US/UK/KSA/Other schools in Settings → Schools.
-- 2. Add a column DEFAULT so future inserts without an explicit type are never
--    left NULL.

UPDATE schools SET school_type = 'gov' WHERE school_type IS NULL;

ALTER TABLE schools ALTER COLUMN school_type SET DEFAULT 'gov';
