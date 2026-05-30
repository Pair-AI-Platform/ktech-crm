-- Migration 187: Dashboard and lead-list aggregates use real leads only
--
-- Most historical imports are marked actual_lead = false. The admin dashboard
-- and default leads page should operate on confirmed real leads so they load
-- quickly and do not surface placeholder/import noise.

ALTER TABLE leads
  ALTER COLUMN actual_lead SET DEFAULT true;

UPDATE profiles
SET is_active = false,
    updated_at = now()
WHERE role = 'agent'
  AND COALESCE(is_active, true)
  AND lower(split_part(trim(COALESCE(full_name, '')), ' ', 1)) IN ('agent', 'demo', 'khalifa', 'test');

DO $idx$
BEGIN
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_leads_actual_stage_created
      ON leads (pipeline_stage, created_at DESC)
      WHERE actual_lead IS TRUE;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_leads_actual_stage_created: %', SQLERRM;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_leads_actual_stage_position_created
      ON leads (pipeline_stage, position_in_stage, created_at DESC)
      WHERE actual_lead IS TRUE;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_leads_actual_stage_position_created: %', SQLERRM;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_leads_actual_assigned_stage_created
      ON leads (assigned_to, pipeline_stage, position_in_stage, created_at DESC)
      WHERE actual_lead IS TRUE;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_leads_actual_assigned_stage_created: %', SQLERRM;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_leads_actual_source_stage
      ON leads (source, pipeline_stage)
      WHERE actual_lead IS TRUE;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_leads_actual_source_stage: %', SQLERRM;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_leads_actual_priority_updated
      ON leads (priority, updated_at DESC)
      WHERE actual_lead IS TRUE
        AND pipeline_stage NOT IN ('lost', 'enrolled', 'withdraw');
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_leads_actual_priority_updated: %', SQLERRM;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_leads_actual_birthdays
      ON leads ((EXTRACT(MONTH FROM date_of_birth)), (EXTRACT(DAY FROM date_of_birth)))
      WHERE actual_lead IS TRUE
        AND date_of_birth IS NOT NULL
        AND pipeline_stage NOT IN ('lost', 'withdraw');
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_leads_actual_birthdays: %', SQLERRM;
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
      WHERE l.actual_lead IS TRUE
        AND (v_is_admin OR l.assigned_to = v_user_id)
        AND l.pipeline_stage NOT IN ('lost', 'enrolled', 'withdraw')
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
    WHERE l.actual_lead IS TRUE
      AND l.pipeline_stage = 'lost'
      AND l.lost_at_stage IS NOT NULL
  ),
  missing_stage AS (
    SELECT DISTINCT ON (a.lead_id)
      a.metadata->>'old_stage' AS stage
    FROM leads l
    JOIN activities a ON a.lead_id = l.id
    WHERE l.actual_lead IS TRUE
      AND l.pipeline_stage = 'lost'
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
  WHERE l.actual_lead IS TRUE
    AND EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = auth.uid()
        AND (p.role = 'admin' OR l.assigned_to = p.id)
    )
  GROUP BY l.pipeline_stage;
$$;

REVOKE ALL ON FUNCTION public.get_lead_stage_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_lead_stage_counts() TO authenticated;

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
  WHERE l.actual_lead IS TRUE
    AND l.assigned_to IS NOT NULL
  GROUP BY l.assigned_to;
END;
$$;

REVOKE ALL ON FUNCTION public.get_dashboard_agent_workload(timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_dashboard_agent_workload(timestamptz, timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_overview()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_is_admin boolean := false;
  v_today date := current_date;
  v_last_month_start timestamptz := date_trunc('month', now()) - interval '1 month';
  v_last_month_end timestamptz := date_trunc('month', now());
  v_result jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'pipeline_counts', '[]'::jsonb,
      'source_performance', '[]'::jsonb,
      'agent_activity', '[]'::jsonb,
      'priority_leads', '[]'::jsonb,
      'birthday_leads', '[]'::jsonb
    );
  END IF;

  SELECT COALESCE(p.role = 'admin', false)
    INTO v_is_admin
  FROM profiles p
  WHERE p.id = v_user_id;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'pipeline_counts', '[]'::jsonb,
      'source_performance', '[]'::jsonb,
      'agent_activity', '[]'::jsonb,
      'priority_leads', '[]'::jsonb,
      'birthday_leads', '[]'::jsonb
    );
  END IF;

  WITH
  pipeline_totals AS (
    SELECT l.funding_type, count(*)::bigint AS total
    FROM leads l
    WHERE l.actual_lead IS TRUE
      AND l.funding_type IN ('self_funded', 'puc')
      AND l.pipeline_stage NOT IN ('lost', 'withdraw')
    GROUP BY l.funding_type
  ),
  pipeline_counts AS (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'funding_type', grouped.funding_type,
        'stage', grouped.pipeline_stage,
        'count', grouped.lead_count,
        'percent', CASE
          WHEN pt.total > 0 THEN round((grouped.lead_count::numeric / pt.total::numeric) * 100)::int
          ELSE 0
        END
      )
      ORDER BY grouped.funding_type, grouped.pipeline_stage
    ), '[]'::jsonb) AS data
    FROM (
      SELECT l.funding_type, l.pipeline_stage, count(*)::bigint AS lead_count
      FROM leads l
      WHERE l.actual_lead IS TRUE
        AND l.funding_type IN ('self_funded', 'puc')
        AND l.pipeline_stage NOT IN ('lost', 'withdraw')
      GROUP BY l.funding_type, l.pipeline_stage
    ) grouped
    JOIN pipeline_totals pt ON pt.funding_type = grouped.funding_type
  ),
  source_performance AS (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'source', source_key,
        'total', total,
        'files', files,
        'conversion_rate', CASE
          WHEN total > 0 THEN round((files::numeric / total::numeric) * 100)::int
          ELSE 0
        END
      )
      ORDER BY total DESC
    ), '[]'::jsonb) AS data
    FROM (
      SELECT
        COALESCE(NULLIF(l.source::text, ''), 'other') AS source_key,
        count(*)::bigint AS total,
        count(*) FILTER (WHERE l.pipeline_stage = 'application')::bigint AS files
      FROM leads l
      WHERE l.actual_lead IS TRUE
        AND l.pipeline_stage <> 'lost'
      GROUP BY COALESCE(NULLIF(l.source::text, ''), 'other')
      ORDER BY count(*) DESC
      LIMIT 12
    ) sources
  ),
  agent_activity AS (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'agent_id', p.id,
        'today_changes', COALESCE(tc.today_changes, 0),
        'today_appointments', COALESCE(ta.today_appointments, 0),
        'last_month_files', COALESCE(lm.last_month_files, 0)
      )
      ORDER BY p.full_name
    ), '[]'::jsonb) AS data
    FROM profiles p
    LEFT JOIN (
      SELECT a.created_by AS agent_id, count(*)::bigint AS today_changes
      FROM activities a
      WHERE a.activity_type IN ('stage_change', 'status_change')
        AND a.created_at >= v_today::timestamptz
        AND a.created_by IS NOT NULL
      GROUP BY a.created_by
    ) tc ON tc.agent_id = p.id
    LEFT JOIN (
      SELECT a.assigned_agent AS agent_id, count(*)::bigint AS today_appointments
      FROM appointments a
      WHERE a.scheduled_date = v_today
        AND a.status <> 'cancelled'
        AND a.assigned_agent IS NOT NULL
      GROUP BY a.assigned_agent
    ) ta ON ta.agent_id = p.id
    LEFT JOIN (
      SELECT l.assigned_to AS agent_id, count(*)::bigint AS last_month_files
      FROM leads l
      WHERE l.actual_lead IS TRUE
        AND l.created_at >= v_last_month_start
        AND l.created_at < v_last_month_end
        AND l.assigned_to IS NOT NULL
      GROUP BY l.assigned_to
    ) lm ON lm.agent_id = p.id
    WHERE p.role = 'agent'
      AND COALESCE(p.is_active, true)
      AND lower(split_part(trim(COALESCE(p.full_name, '')), ' ', 1)) NOT IN ('admin', 'agent', 'demo', 'khalifa')
  ),
  priority_candidates AS (
    SELECT
      l.*,
      GREATEST(0, floor(extract(epoch FROM (now() - l.created_at)) / 86400))::int AS days_since_created,
      GREATEST(0, floor(extract(epoch FROM (now() - COALESCE(l.last_contacted_at, l.created_at))) / 86400))::int AS days_since_contact,
      GREATEST(0, floor(extract(epoch FROM (now() - l.updated_at)) / 86400))::int AS days_since_updated
    FROM leads l
    WHERE l.actual_lead IS TRUE
      AND l.pipeline_stage NOT IN ('lost', 'enrolled', 'withdraw')
  ),
  priority_ranked AS (
    SELECT
      pc.*,
      CASE
        WHEN pc.priority = 'critical' THEN 'CRITICAL'
        WHEN pc.priority = 'important' THEN 'Important'
        WHEN pc.pipeline_stage = 'new' AND pc.last_contacted_at IS NULL THEN
          CASE WHEN pc.days_since_created = 0 THEN 'New today' ELSE 'Waiting ' || pc.days_since_created || 'd' END
        WHEN pc.pipeline_stage = 'contacted' AND pc.contact_status = 'interested' THEN 'Interested'
        WHEN pc.pipeline_stage = 'contacted' AND pc.contact_status = 'will_see' THEN 'Will See'
        WHEN pc.contact_status = 'callback' THEN 'Callback requested'
        WHEN pc.contact_status = 'no_answer' AND pc.days_since_contact >= 1 THEN 'No answer - ' || pc.days_since_contact || 'd ago'
        WHEN pc.days_since_contact >= 3 THEN pc.days_since_contact || 'd no contact'
        WHEN pc.days_since_updated >= 7 AND pc.pipeline_stage IN ('contacted', 'test') THEN 'Stale ' || pc.days_since_updated || 'd in ' || pc.pipeline_stage
        ELSE NULL
      END AS reason,
      CASE
        WHEN pc.priority = 'critical' THEN 'high'
        WHEN pc.priority = 'important' AND pc.days_since_contact >= 2 THEN 'high'
        WHEN pc.priority = 'important' THEN 'medium'
        WHEN pc.pipeline_stage = 'new' AND pc.last_contacted_at IS NULL AND pc.days_since_created > 2 THEN 'high'
        WHEN pc.pipeline_stage = 'new' AND pc.last_contacted_at IS NULL AND pc.days_since_created > 0 THEN 'medium'
        WHEN pc.pipeline_stage = 'new' AND pc.last_contacted_at IS NULL THEN 'low'
        WHEN pc.pipeline_stage = 'contacted' AND pc.contact_status IN ('interested', 'will_see') AND pc.days_since_contact >= 3 THEN 'high'
        WHEN pc.pipeline_stage = 'contacted' AND pc.contact_status IN ('interested', 'will_see') THEN 'medium'
        WHEN pc.contact_status = 'callback' AND pc.days_since_contact >= 2 THEN 'high'
        WHEN pc.contact_status = 'callback' THEN 'medium'
        WHEN pc.contact_status = 'no_answer' AND pc.days_since_contact >= 3 THEN 'high'
        WHEN pc.contact_status = 'no_answer' AND pc.days_since_contact >= 1 THEN 'medium'
        WHEN pc.days_since_contact >= 5 THEN 'high'
        WHEN pc.days_since_contact >= 3 THEN 'medium'
        WHEN pc.days_since_updated >= 14 AND pc.pipeline_stage IN ('contacted', 'test') THEN 'high'
        WHEN pc.days_since_updated >= 7 AND pc.pipeline_stage IN ('contacted', 'test') THEN 'medium'
        ELSE 'low'
      END AS urgency,
      CASE
        WHEN pc.priority = 'critical' THEN 0
        WHEN pc.priority = 'important' AND pc.days_since_contact >= 2 THEN 0
        WHEN pc.pipeline_stage = 'new' AND pc.last_contacted_at IS NULL AND pc.days_since_created > 2 THEN 0
        WHEN pc.pipeline_stage = 'contacted' AND pc.contact_status IN ('interested', 'will_see') AND pc.days_since_contact >= 3 THEN 0
        WHEN pc.contact_status = 'callback' AND pc.days_since_contact >= 2 THEN 0
        WHEN pc.contact_status = 'no_answer' AND pc.days_since_contact >= 3 THEN 0
        WHEN pc.days_since_contact >= 5 THEN 0
        WHEN pc.days_since_updated >= 14 AND pc.pipeline_stage IN ('contacted', 'test') THEN 0
        WHEN pc.priority = 'important' THEN 1
        WHEN pc.pipeline_stage = 'new' AND pc.last_contacted_at IS NULL AND pc.days_since_created > 0 THEN 1
        WHEN pc.pipeline_stage = 'contacted' AND pc.contact_status IN ('interested', 'will_see') THEN 1
        WHEN pc.contact_status IN ('callback', 'no_answer') THEN 1
        WHEN pc.days_since_contact >= 3 THEN 1
        WHEN pc.days_since_updated >= 7 AND pc.pipeline_stage IN ('contacted', 'test') THEN 1
        ELSE 2
      END AS urgency_rank
    FROM priority_candidates pc
  ),
  priority_leads AS (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'lead', jsonb_build_object(
          'id', l.id,
          'first_name', l.first_name,
          'last_name', l.last_name,
          'first_name_ar', l.first_name_ar,
          'last_name_ar', l.last_name_ar,
          'phone', l.phone,
          'pipeline_stage', l.pipeline_stage,
          'contact_status', l.contact_status,
          'status', l.contact_status,
          'funding_type', l.funding_type,
          'assigned_to', l.assigned_to,
          'created_at', l.created_at,
          'updated_at', l.updated_at,
          'last_contacted_at', l.last_contacted_at,
          'callback_date', l.callback_date,
          'date_of_birth', l.date_of_birth,
          'priority', l.priority,
          'source', l.source
        ),
        'reason', l.reason,
        'urgency', l.urgency
      )
      ORDER BY l.urgency_rank, l.days_since_contact DESC, l.updated_at ASC
    ), '[]'::jsonb) AS data
    FROM (
      SELECT *
      FROM priority_ranked
      WHERE reason IS NOT NULL
      ORDER BY urgency_rank, days_since_contact DESC, updated_at ASC
      LIMIT 5
    ) l
  ),
  birthday_raw AS (
    SELECT
      l.id,
      l.first_name,
      l.last_name,
      l.first_name_ar,
      l.last_name_ar,
      l.phone,
      l.pipeline_stage,
      l.date_of_birth,
      CASE
        WHEN to_date(extract(year FROM v_today)::int || '-' || to_char(l.date_of_birth, 'MM-DD'), 'YYYY-MM-DD') < v_today
          THEN (to_date(extract(year FROM v_today)::int || '-' || to_char(l.date_of_birth, 'MM-DD'), 'YYYY-MM-DD') + interval '1 year')::date
        ELSE to_date(extract(year FROM v_today)::int || '-' || to_char(l.date_of_birth, 'MM-DD'), 'YYYY-MM-DD')
      END AS next_birthday
    FROM leads l
    WHERE l.actual_lead IS TRUE
      AND l.date_of_birth IS NOT NULL
      AND l.pipeline_stage NOT IN ('lost', 'withdraw')
  ),
  birthday_ranked AS (
    SELECT *, (next_birthday - v_today)::int AS days_until
    FROM birthday_raw
  ),
  birthday_leads AS (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'lead', jsonb_build_object(
          'id', b.id,
          'first_name', b.first_name,
          'last_name', b.last_name,
          'first_name_ar', b.first_name_ar,
          'last_name_ar', b.last_name_ar,
          'phone', b.phone,
          'pipeline_stage', b.pipeline_stage,
          'date_of_birth', b.date_of_birth
        ),
        'days_until', b.days_until,
        'is_today', b.days_until = 0
      )
      ORDER BY b.days_until, b.first_name, b.last_name
    ), '[]'::jsonb) AS data
    FROM (
      SELECT *
      FROM birthday_ranked
      WHERE days_until <= 30
      ORDER BY days_until, first_name, last_name
      LIMIT 10
    ) b
  )
  SELECT jsonb_build_object(
    'pipeline_counts', pipeline_counts.data,
    'source_performance', source_performance.data,
    'agent_activity', agent_activity.data,
    'priority_leads', priority_leads.data,
    'birthday_leads', birthday_leads.data
  )
  INTO v_result
  FROM pipeline_counts, source_performance, agent_activity, priority_leads, birthday_leads;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_dashboard_overview() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_overview() TO authenticated;
