-- Migration 113: Semester management (cycle lifecycle)

-- 1. Add timestamps to semesters
ALTER TABLE semesters ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE semesters ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- 2. Updated_at trigger
CREATE TRIGGER set_semesters_updated_at
  BEFORE UPDATE ON semesters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. Partial unique index: only one active semester allowed
CREATE UNIQUE INDEX IF NOT EXISTS idx_semesters_single_active
  ON semesters (is_active) WHERE is_active = true;

-- 4. Enable RLS on semesters
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view semesters"
  ON semesters FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage semesters"
  ON semesters FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 5. Add re_registered_from to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS re_registered_from UUID REFERENCES leads(id);
CREATE INDEX IF NOT EXISTS idx_leads_re_registered_from ON leads(re_registered_from);

-- 6. Backfill: assign orphan leads to the active semester
UPDATE leads
SET semester_id = (SELECT id FROM semesters WHERE is_active = true LIMIT 1)
WHERE semester_id IS NULL
  AND EXISTS (SELECT 1 FROM semesters WHERE is_active = true);

-- 7. Update duplicate detection to scope to active semester
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
  v_semester_id UUID;
BEGIN
  -- Default to active semester if not specified
  v_semester_id := p_semester_id;
  IF v_semester_id IS NULL THEN
    SELECT s.id INTO v_semester_id FROM semesters s WHERE s.is_active = true LIMIT 1;
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
    AND (v_semester_id IS NULL OR l.semester_id = v_semester_id);
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
    AND (v_semester_id IS NULL OR l.semester_id = v_semester_id);
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
      AND (v_semester_id IS NULL OR l.semester_id = v_semester_id);
  END IF;
END;
$$;
