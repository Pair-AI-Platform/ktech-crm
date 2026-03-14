-- =============================================
-- SEED: Pipeline Drop-off Data
-- Marks ~120 existing leads as 'lost' with lost_at_stage populated
-- Run this in Supabase SQL Editor
-- =============================================

DO $$
DECLARE
  dropoff_stages TEXT[] := ARRAY[
    'contacted', 'contacted', 'contacted', 'contacted', 'contacted',   -- 35 leads
    'contacted', 'contacted',
    'new', 'new', 'new', 'new', 'new',                                 -- 25 leads
    'visit', 'visit', 'visit', 'visit',                                -- 20 leads
    'test', 'test', 'test',                                            -- 15 leads
    'application', 'application',                                       -- 10 leads
    'puc_document_submission',                                          -- 5 leads
    'puc_application_submission'                                        -- 5 leads
  ];
  stage TEXT;
  target_count INT;
  lead_ids UUID[];
  lid UUID;
BEGIN
  -- For each drop-off stage, pick random non-lost, non-enrolled leads and mark them lost
  FOREACH stage IN ARRAY ARRAY['contacted','new','visit','test','application','puc_document_submission','puc_application_submission']
  LOOP
    -- Determine how many to mark for this stage
    CASE stage
      WHEN 'contacted' THEN target_count := 35;
      WHEN 'new' THEN target_count := 25;
      WHEN 'visit' THEN target_count := 20;
      WHEN 'test' THEN target_count := 15;
      WHEN 'application' THEN target_count := 10;
      WHEN 'puc_document_submission' THEN target_count := 5;
      WHEN 'puc_application_submission' THEN target_count := 5;
    END CASE;

    -- Select random leads that aren't already lost or enrolled
    SELECT array_agg(id) INTO lead_ids
    FROM (
      SELECT id FROM leads
      WHERE pipeline_stage NOT IN ('lost', 'enrolled', 'withdraw')
        AND lost_at_stage IS NULL
      ORDER BY random()
      LIMIT target_count
    ) sub;

    -- Update them to lost with the drop-off stage
    IF lead_ids IS NOT NULL AND array_length(lead_ids, 1) > 0 THEN
      UPDATE leads
      SET pipeline_stage = 'lost',
          lost_at_stage = stage,
          updated_at = NOW()
      WHERE id = ANY(lead_ids);

      RAISE NOTICE 'Marked % leads as lost at stage: %', array_length(lead_ids, 1), stage;
    END IF;
  END LOOP;
END $$;

-- Verify results
SELECT lost_at_stage, COUNT(*) as count
FROM leads
WHERE pipeline_stage = 'lost' AND lost_at_stage IS NOT NULL
GROUP BY lost_at_stage
ORDER BY count DESC;