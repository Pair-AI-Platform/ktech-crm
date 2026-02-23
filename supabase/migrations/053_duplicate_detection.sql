-- Add index for faster name-based duplicate lookups
CREATE INDEX IF NOT EXISTS idx_leads_name_search ON leads (lower(first_name), lower(last_name));

-- Function: check for duplicate leads by phone, civil_id, or name
CREATE OR REPLACE FUNCTION check_lead_duplicates(
  p_phone VARCHAR DEFAULT NULL,
  p_civil_id VARCHAR DEFAULT NULL,
  p_first_name VARCHAR DEFAULT NULL,
  p_last_name VARCHAR DEFAULT NULL,
  p_exclude_id UUID DEFAULT NULL
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
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Exact phone match
  IF p_phone IS NOT NULL AND p_phone != '' THEN
    RETURN QUERY
    SELECT l.id, l.first_name, l.last_name, l.phone, l.civil_id,
           l.pipeline_stage::TEXT, l.assigned_to,
           'phone'::TEXT AS match_type,
           l.created_at
    FROM leads l
    WHERE l.phone = p_phone
    AND (p_exclude_id IS NULL OR l.id != p_exclude_id);
  END IF;

  -- Exact civil_id match
  IF p_civil_id IS NOT NULL AND p_civil_id != '' THEN
    RETURN QUERY
    SELECT l.id, l.first_name, l.last_name, l.phone, l.civil_id,
           l.pipeline_stage::TEXT, l.assigned_to,
           'civil_id'::TEXT AS match_type,
           l.created_at
    FROM leads l
    WHERE l.civil_id = p_civil_id
    AND (p_exclude_id IS NULL OR l.id != p_exclude_id)
    AND (p_phone IS NULL OR p_phone = '' OR l.phone != p_phone);
  END IF;

  -- Exact name match (case-insensitive)
  IF p_first_name IS NOT NULL AND p_last_name IS NOT NULL
     AND p_first_name != '' AND p_last_name != '' THEN
    RETURN QUERY
    SELECT l.id, l.first_name, l.last_name, l.phone, l.civil_id,
           l.pipeline_stage::TEXT, l.assigned_to,
           'name'::TEXT AS match_type,
           l.created_at
    FROM leads l
    WHERE lower(l.first_name) = lower(p_first_name)
      AND lower(l.last_name) = lower(p_last_name)
      AND (p_exclude_id IS NULL OR l.id != p_exclude_id)
      AND (p_phone IS NULL OR p_phone = '' OR l.phone != p_phone)
      AND (p_civil_id IS NULL OR p_civil_id = '' OR l.civil_id IS NULL OR l.civil_id != p_civil_id);
  END IF;
END;
$$;
