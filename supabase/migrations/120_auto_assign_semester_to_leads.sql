-- Auto-assign all leads without a semester to the first open term in the active cycle
DO $$
DECLARE
  v_semester_id uuid;
BEGIN
  -- Find first open term in the active cycle
  SELECT s.id INTO v_semester_id
  FROM semesters s
  JOIN education_cycles c ON s.cycle_id = c.id
  WHERE c.is_active = true AND s.is_open = true
  ORDER BY s.term_type ASC -- fall before spring
  LIMIT 1;

  IF v_semester_id IS NOT NULL THEN
    UPDATE leads
    SET semester_id = v_semester_id
    WHERE semester_id IS NULL;

    RAISE NOTICE 'Assigned orphaned leads to semester %', v_semester_id;
  ELSE
    RAISE NOTICE 'No active open semester found — skipping auto-assignment';
  END IF;
END $$;
