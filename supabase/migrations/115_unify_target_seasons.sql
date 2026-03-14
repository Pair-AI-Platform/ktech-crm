-- Migration 115: Unify target_seasons → semesters
-- Point agent_seasonal_targets.season_id to semesters instead of target_seasons

BEGIN;

-- 1. For each target_season, find or create a matching semester by name
--    Map existing season_id values to the corresponding semester id
CREATE TEMP TABLE season_mapping AS
  SELECT ts.id AS old_id, s.id AS new_id
  FROM target_seasons ts
  JOIN semesters s ON s.name = ts.name;

-- 2. Update agent_seasonal_targets to point to semesters
UPDATE agent_seasonal_targets ast
SET season_id = sm.new_id
FROM season_mapping sm
WHERE ast.season_id = sm.old_id;

-- 3. Delete any agent_seasonal_targets whose season_id wasn't mapped
--    (no matching semester exists — these would be orphaned)
DELETE FROM agent_seasonal_targets
WHERE season_id NOT IN (SELECT id FROM semesters);

-- 4. Drop FK constraint on agent_seasonal_targets.season_id → target_seasons
ALTER TABLE agent_seasonal_targets
  DROP CONSTRAINT IF EXISTS agent_seasonal_targets_season_id_fkey;

-- 5. Add new FK constraint on agent_seasonal_targets.season_id → semesters
ALTER TABLE agent_seasonal_targets
  ADD CONSTRAINT agent_seasonal_targets_season_id_fkey
  FOREIGN KEY (season_id) REFERENCES semesters(id) ON DELETE CASCADE;

-- 6. Drop target_seasons table
DROP TABLE IF EXISTS target_seasons;

DROP TABLE IF EXISTS season_mapping;

COMMIT;
