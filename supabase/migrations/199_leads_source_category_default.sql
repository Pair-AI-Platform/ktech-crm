-- Migration 199: Give leads.source_category a safe default.
--
-- leads.source_category is `lead_source_category NOT NULL` with no default, so
-- any INSERT that omits it fails with:
--   null value in column "source_category" of relation "leads"
--   violates not-null constraint
--
-- This surfaced as "Failed to book" in the appointment booking quick-create-lead
-- flow, and is a latent trap for every other lead-insert path. Defaulting the
-- column to 'direct' (the same value the main lead form and quick-create use)
-- eliminates the entire failure class at the database level — any path that
-- forgets to set it now gets a sensible default instead of erroring.
--
-- Idempotent: SET DEFAULT and the guarded backfill are both safe to re-run.

-- 1) Backfill any legacy rows that slipped in without a category (no-op if the
--    NOT NULL has always held — keeps UPDATEs on old leads from failing too).
UPDATE leads
SET source_category = 'direct'
WHERE source_category IS NULL;

-- 2) Default future inserts so no code path can hit the NOT NULL constraint.
ALTER TABLE leads
  ALTER COLUMN source_category SET DEFAULT 'direct';
