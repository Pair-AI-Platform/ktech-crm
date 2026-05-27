-- Migration 183: Dashboard load-speed primitives
--
-- Collapses the first dashboard KPI cards into one indexed RPC and adds
-- grouped drop-off stats so the dashboard no longer ships every lost lead to
-- the browser just to draw a small chart.

DO $idx$
BEGIN
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_dashboard_leads_assigned_stage_funding
      ON leads (assigned_to, pipeline_stage, funding_type);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_dashboard_leads_assigned_stage_funding: %', SQLERRM;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_dashboard_leads_stage_funding_assigned
      ON leads (pipeline_stage, funding_type, assigned_to);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_dashboard_leads_stage_funding_assigned: %', SQLERRM;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_dashboard_appointments_agent_date_status
      ON appointments (assigned_agent, scheduled_date, status);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_dashboard_appointments_agent_date_status: %', SQLERRM;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_dashboard_activities_type_created_by
      ON activities (activity_type, created_at DESC, created_by);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_dashboard_activities_type_created_by: %', SQLERRM;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_dashboard_leads_created_assigned
      ON leads (created_at DESC, assigned_to);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_dashboard_leads_created_assigned: %', SQLERRM;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_dashboard_lost_leads_stage
      ON leads (pipeline_stage, lost_at_stage)
      WHERE pipeline_stage = 'lost';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_dashboard_lost_leads_stage: %', SQLERRM;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_dashboard_activities_lost_stage
      ON activities (lead_id, created_at DESC)
      WHERE activity_type = 'stage_change';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_dashboard_activities_lost_stage: %', SQLERRM;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_leads_active_created_at
      ON leads (created_at DESC)
      WHERE pipeline_stage <> 'lost';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_leads_active_created_at: %', SQLERRM;
  END;
END
$idx$;

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
      WHERE (v_is_admin OR l.assigned_to = v_user_id)
        AND l.pipeline_stage NOT IN ('lost', 'enrolled', 'withdraw')
    )::bigint AS active_leads,
    (
      SELECT count(*)
      FROM leads l
      WHERE (v_is_admin OR l.assigned_to = v_user_id)
        AND l.pipeline_stage = 'application'
    )::bigint AS total_files,
    (
      SELECT count(*)
      FROM leads l
      WHERE (v_is_admin OR l.assigned_to = v_user_id)
        AND l.pipeline_stage = 'application'
        AND l.funding_type = 'puc'
    )::bigint AS puc_files,
    (
      SELECT count(*)
      FROM leads l
      WHERE (v_is_admin OR l.assigned_to = v_user_id)
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
      WHERE (v_is_admin OR l.assigned_to = v_user_id)
        AND l.contact_status = 'callback'
        AND l.callback_date = p_today
    )::bigint AS today_callbacks;
END;
$$;

REVOKE ALL ON FUNCTION public.get_dashboard_critical_stats(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_dashboard_critical_stats(date) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_dashboard_dropoff_stats()
RETURNS TABLE (
  stage text,
  dropoff_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH has_stage AS (
    SELECT l.lost_at_stage::text AS stage
    FROM leads l
    WHERE l.pipeline_stage = 'lost'
      AND l.lost_at_stage IS NOT NULL
  ),
  missing_stage AS (
    SELECT DISTINCT ON (a.lead_id)
      a.metadata->>'old_stage' AS stage
    FROM leads l
    JOIN activities a ON a.lead_id = l.id
    WHERE l.pipeline_stage = 'lost'
      AND l.lost_at_stage IS NULL
      AND a.activity_type = 'stage_change'
      AND a.metadata->>'new_stage' = 'lost'
      AND a.metadata->>'old_stage' IS NOT NULL
    ORDER BY a.lead_id, a.created_at DESC
  )
  SELECT source.stage, count(*)::bigint AS dropoff_count
  FROM (
    SELECT stage FROM has_stage
    UNION ALL
    SELECT stage FROM missing_stage
  ) source
  WHERE source.stage IS NOT NULL
  GROUP BY source.stage
  ORDER BY dropoff_count DESC;
$$;

REVOKE ALL ON FUNCTION public.get_dashboard_dropoff_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_dashboard_dropoff_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_dropoff_stats() TO service_role;

CREATE OR REPLACE FUNCTION public.get_lead_stage_counts()
RETURNS TABLE (
  stage text,
  lead_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.pipeline_stage::text AS stage, count(*)::bigint AS lead_count
  FROM leads l
  WHERE EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
      AND (p.role = 'admin' OR l.assigned_to = p.id)
  )
  GROUP BY l.pipeline_stage;
$$;

REVOKE ALL ON FUNCTION public.get_lead_stage_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_lead_stage_counts() TO authenticated;
