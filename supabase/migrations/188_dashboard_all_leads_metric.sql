-- Migration 188: Dashboard headline lead metric means all real leads
--
-- The dashboard card is now labeled "All Leads". Keep the RPC column name
-- active_leads for client compatibility, but count every actual lead rather
-- than only non-terminal pipeline rows.

CREATE OR REPLACE FUNCTION public.get_dashboard_critical_stats(p_today date DEFAULT CURRENT_DATE)
RETURNS TABLE (
  active_leads bigint,
  total_files bigint,
  puc_files bigint,
  sf_files bigint,
  today_appointments bigint,
  today_callbacks bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_is_admin boolean := false;
BEGIN
  IF v_user_id IS NULL THEN
    active_leads := 0;
    total_files := 0;
    puc_files := 0;
    sf_files := 0;
    today_appointments := 0;
    today_callbacks := 0;
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT COALESCE(p.role = 'admin', false)
    INTO v_is_admin
  FROM profiles p
  WHERE p.id = v_user_id;

  RETURN QUERY
  SELECT
    (
      SELECT count(*)
      FROM leads l
      WHERE l.actual_lead IS TRUE
        AND (v_is_admin OR l.assigned_to = v_user_id)
    )::bigint AS active_leads,
    (
      SELECT count(*)
      FROM leads l
      WHERE l.actual_lead IS TRUE
        AND (v_is_admin OR l.assigned_to = v_user_id)
        AND l.pipeline_stage = 'application'
    )::bigint AS total_files,
    (
      SELECT count(*)
      FROM leads l
      WHERE l.actual_lead IS TRUE
        AND (v_is_admin OR l.assigned_to = v_user_id)
        AND l.pipeline_stage = 'application'
        AND l.funding_type = 'puc'
    )::bigint AS puc_files,
    (
      SELECT count(*)
      FROM leads l
      WHERE l.actual_lead IS TRUE
        AND (v_is_admin OR l.assigned_to = v_user_id)
        AND l.pipeline_stage = 'application'
        AND l.funding_type = 'self_funded'
    )::bigint AS sf_files,
    (
      SELECT count(*)
      FROM appointments a
      WHERE (v_is_admin OR a.assigned_agent = v_user_id)
        AND a.scheduled_date = p_today
        AND a.status <> 'cancelled'
    )::bigint AS today_appointments,
    (
      SELECT count(*)
      FROM leads l
      WHERE l.actual_lead IS TRUE
        AND (v_is_admin OR l.assigned_to = v_user_id)
        AND l.contact_status = 'callback'
        AND l.callback_date = p_today
    )::bigint AS today_callbacks;
END;
$$;

REVOKE ALL ON FUNCTION public.get_dashboard_critical_stats(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_dashboard_critical_stats(date) TO authenticated;
