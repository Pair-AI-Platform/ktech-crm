-- Migration: Backfill lost_at_stage for existing lost leads
-- Uses the activity log to find the stage the lead was in before being marked as lost.
-- Falls back to 'new' for leads with no activity history.

-- Step 1: Backfill from activity log (stage_change to 'lost' records)
UPDATE leads
SET lost_at_stage = sub.old_stage
FROM (
  SELECT DISTINCT ON (a.lead_id)
    a.lead_id,
    a.metadata->>'old_stage' AS old_stage
  FROM activities a
  WHERE a.activity_type = 'stage_change'
    AND a.metadata->>'new_stage' = 'lost'
  ORDER BY a.lead_id, a.created_at DESC
) sub
WHERE leads.id = sub.lead_id
  AND leads.pipeline_stage = 'lost'
  AND leads.lost_at_stage IS NULL;

-- Step 2: For any remaining lost leads without activity history, default to 'new'
UPDATE leads
SET lost_at_stage = 'new'
WHERE pipeline_stage = 'lost'
  AND lost_at_stage IS NULL;
