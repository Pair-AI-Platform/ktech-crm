-- Migration 116: Education Cycles (Academic Years)
-- Groups semesters (terms) under parent education cycles

BEGIN;

-- ============================================================
-- 1. Create education_cycles table
-- ============================================================
CREATE TABLE education_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,              -- "2025-2026"
  start_year INTEGER NOT NULL,
  end_year INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one active cycle at a time
CREATE UNIQUE INDEX idx_cycles_single_active
  ON education_cycles (is_active) WHERE is_active = true;

-- Updated_at trigger
CREATE TRIGGER set_education_cycles_updated_at
  BEFORE UPDATE ON education_cycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE education_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cycles"
  ON education_cycles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage cycles"
  ON education_cycles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- 2. Alter semesters table - add cycle columns
-- ============================================================
ALTER TABLE semesters
  ADD COLUMN cycle_id UUID REFERENCES education_cycles(id),
  ADD COLUMN term_type TEXT CHECK (term_type IN ('fall', 'spring', 'summer')),
  ADD COLUMN is_open BOOLEAN NOT NULL DEFAULT false;

-- Drop the single-active-semester unique index (we now allow multiple active terms)
DROP INDEX IF EXISTS idx_semesters_single_active;

-- ============================================================
-- 3. Auto-group existing semesters into cycles
-- ============================================================

-- Parse semester names and create cycles
-- "Fall 2024"  → fall, cycle "2024-2025"
-- "Spring 2025" → spring, cycle "2024-2025"
-- "Summer 2024" → summer, cycle "2024-2025" (summer belongs to the start_year cycle)

-- Create cycles for each academic year grouping
INSERT INTO education_cycles (name, start_year, end_year, is_active)
SELECT DISTINCT
  start_year || '-' || (start_year + 1),
  start_year,
  start_year + 1,
  false
FROM (
  SELECT
    CASE
      WHEN name LIKE 'Fall %' THEN CAST(SUBSTRING(name FROM 'Fall (\d+)') AS INTEGER)
      WHEN name LIKE 'Spring %' THEN CAST(SUBSTRING(name FROM 'Spring (\d+)') AS INTEGER) - 1
      WHEN name LIKE 'Summer %' THEN CAST(SUBSTRING(name FROM 'Summer (\d+)') AS INTEGER)
      ELSE EXTRACT(YEAR FROM start_date)::INTEGER
    END AS start_year
  FROM semesters
) sub
WHERE start_year IS NOT NULL
ORDER BY start_year;

-- Set term_type based on semester name
UPDATE semesters SET term_type = 'fall'   WHERE name ILIKE 'Fall %';
UPDATE semesters SET term_type = 'spring' WHERE name ILIKE 'Spring %';
UPDATE semesters SET term_type = 'summer' WHERE name ILIKE 'Summer %';

-- Link semesters to their cycles
UPDATE semesters s SET cycle_id = c.id
FROM education_cycles c
WHERE s.term_type = 'fall'
  AND c.start_year = CAST(SUBSTRING(s.name FROM '\d+') AS INTEGER);

UPDATE semesters s SET cycle_id = c.id
FROM education_cycles c
WHERE s.term_type = 'spring'
  AND c.end_year = CAST(SUBSTRING(s.name FROM '\d+') AS INTEGER);

UPDATE semesters s SET cycle_id = c.id
FROM education_cycles c
WHERE s.term_type = 'summer'
  AND c.start_year = CAST(SUBSTRING(s.name FROM '\d+') AS INTEGER);

-- ============================================================
-- 4. Activate the cycle that contains the currently active semester
-- ============================================================

-- Find the cycle of the currently active semester and mark it active
UPDATE education_cycles SET is_active = true
WHERE id = (
  SELECT cycle_id FROM semesters WHERE is_active = true LIMIT 1
);

-- Set is_open = true for all terms in the active cycle
UPDATE semesters SET is_open = true
WHERE cycle_id = (SELECT id FROM education_cycles WHERE is_active = true LIMIT 1);

-- ============================================================
-- 5. Update check_lead_duplicates to scope to active cycle terms
-- ============================================================
CREATE OR REPLACE FUNCTION check_lead_duplicates(
  p_phone VARCHAR DEFAULT NULL,
  p_civil_id VARCHAR DEFAULT NULL,
  p_first_name VARCHAR DEFAULT NULL,
  p_last_name VARCHAR DEFAULT NULL,
  p_exclude_id UUID DEFAULT NULL,
  p_semester_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  first_name VARCHAR,
  last_name VARCHAR,
  phone VARCHAR,
  civil_id VARCHAR,
  pipeline_stage TEXT,
  assigned_to UUID,
  match_type TEXT,
  created_at TIMESTAMPTZ,
  assigned_agent_name TEXT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_cycle_semester_ids UUID[];
BEGIN
  -- If a specific semester is provided, use just that one
  -- Otherwise, get ALL semester IDs in the active cycle
  IF p_semester_id IS NOT NULL THEN
    v_cycle_semester_ids := ARRAY[p_semester_id];
  ELSE
    SELECT ARRAY_AGG(s.id) INTO v_cycle_semester_ids
    FROM semesters s
    JOIN education_cycles c ON c.id = s.cycle_id
    WHERE c.is_active = true;
  END IF;

  -- Exact phone match
  IF p_phone IS NOT NULL AND p_phone != '' THEN
    RETURN QUERY
    SELECT l.id, l.first_name, l.last_name, l.phone, l.civil_id,
           l.pipeline_stage::TEXT, l.assigned_to,
           'phone'::TEXT AS match_type,
           l.created_at,
           p.full_name::TEXT AS assigned_agent_name
    FROM leads l
    LEFT JOIN profiles p ON p.id = l.assigned_to
    WHERE l.phone = p_phone
    AND (p_exclude_id IS NULL OR l.id != p_exclude_id)
    AND (v_cycle_semester_ids IS NULL OR l.semester_id = ANY(v_cycle_semester_ids));
  END IF;

  -- Exact civil_id match
  IF p_civil_id IS NOT NULL AND p_civil_id != '' THEN
    RETURN QUERY
    SELECT l.id, l.first_name, l.last_name, l.phone, l.civil_id,
           l.pipeline_stage::TEXT, l.assigned_to,
           'civil_id'::TEXT AS match_type,
           l.created_at,
           p.full_name::TEXT AS assigned_agent_name
    FROM leads l
    LEFT JOIN profiles p ON p.id = l.assigned_to
    WHERE l.civil_id = p_civil_id
    AND (p_exclude_id IS NULL OR l.id != p_exclude_id)
    AND (p_phone IS NULL OR p_phone = '' OR l.phone != p_phone)
    AND (v_cycle_semester_ids IS NULL OR l.semester_id = ANY(v_cycle_semester_ids));
  END IF;

  -- Exact name match (case-insensitive)
  IF p_first_name IS NOT NULL AND p_last_name IS NOT NULL
     AND p_first_name != '' AND p_last_name != '' THEN
    RETURN QUERY
    SELECT l.id, l.first_name, l.last_name, l.phone, l.civil_id,
           l.pipeline_stage::TEXT, l.assigned_to,
           'name'::TEXT AS match_type,
           l.created_at,
           p.full_name::TEXT AS assigned_agent_name
    FROM leads l
    LEFT JOIN profiles p ON p.id = l.assigned_to
    WHERE lower(l.first_name) = lower(p_first_name)
      AND lower(l.last_name) = lower(p_last_name)
      AND (p_exclude_id IS NULL OR l.id != p_exclude_id)
      AND (p_phone IS NULL OR p_phone = '' OR l.phone != p_phone)
      AND (p_civil_id IS NULL OR p_civil_id = '' OR l.civil_id IS NULL OR l.civil_id != p_civil_id)
      AND (v_cycle_semester_ids IS NULL OR l.semester_id = ANY(v_cycle_semester_ids));
  END IF;
END;
$$;

COMMIT;
