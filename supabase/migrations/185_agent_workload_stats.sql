-- Migration 185: Per-agent workload aggregates for the admin dashboard
--
-- The admin dashboard previously derived Team Status / Heatmap / Workload
-- numbers from `useDashboardStats`, which caps the client fetch at the 1,000
-- most recently updated leads. Any agent whose assignments fell outside that
-- window was hidden, leading to dashboards that showed only one agent.
--
-- This RPC returns per-agent counts computed against the full leads table so
-- every active agent appears with accurate numbers.

DO $idx$
BEGIN
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_leads_assigned_last_contacted
      ON leads (assigned_to, last_contacted_at);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_leads_assigned_last_contacted: %', SQLERRM;
  END;
END
$idx$;

CREATE OR REPLACE FUNCTION public.get_dashboard_agent_workload(
  p_month_start timestamptz DEFAULT date_trunc('month', now()),
  p_overdue_cutoff timestamptz DEFAULT (now() - interval '5 days')
)
RETURNS TABLE (
  agent_id uuid,
  active_leads bigint,
  enrolled_count bigint,
  total_assigned bigint,
  new_this_month bigint,
  overdue_followups bigint
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
    RETURN;
  END IF;

  SELECT COALESCE(p.role = 'admin', false)
    INTO v_is_admin
  FROM profiles p
  WHERE p.id = v_user_id;

  IF NOT v_is_admin THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    l.assigned_to AS agent_id,
    count(*) FILTER (
      WHERE l.pipeline_stage NOT IN ('lost', 'enrolled', 'withdraw')
    )::bigint AS active_leads,
    count(*) FILTER (
      WHERE l.pipeline_stage = 'enrolled'
    )::bigint AS enrolled_count,
    count(*)::bigint AS total_assigned,
    count(*) FILTER (
      WHERE l.created_at >= p_month_start
    )::bigint AS new_this_month,
    count(*) FILTER (
      WHERE l.pipeline_stage NOT IN ('lost', 'enrolled', 'withdraw')
        AND (l.last_contacted_at IS NULL OR l.last_contacted_at < p_overdue_cutoff)
    )::bigint AS overdue_followups
  FROM leads l
  WHERE l.assigned_to IS NOT NULL
  GROUP BY l.assigned_to;
END;
$$;

REVOKE ALL ON FUNCTION public.get_dashboard_agent_workload(timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_dashboard_agent_workload(timestamptz, timestamptz) TO authenticated;
