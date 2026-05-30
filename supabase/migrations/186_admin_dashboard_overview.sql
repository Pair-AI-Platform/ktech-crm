-- Migration 186: Admin dashboard overview aggregates
--
-- The admin dashboard should not transfer a large leads payload just to build
-- summary cards. This RPC returns compact, indexed aggregates and the small
-- lead lists the dashboard needs for attention and birthday widgets.

DO $idx$
BEGIN
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_admin_dashboard_leads_source_stage
      ON leads (source, pipeline_stage);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_admin_dashboard_leads_source_stage: %', SQLERRM;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_admin_dashboard_leads_priority_updated
      ON leads (priority, updated_at DESC)
      WHERE pipeline_stage NOT IN ('lost', 'enrolled', 'withdraw');
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_admin_dashboard_leads_priority_updated: %', SQLERRM;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_admin_dashboard_leads_birthdays
      ON leads ((EXTRACT(MONTH FROM date_of_birth)), (EXTRACT(DAY FROM date_of_birth)))
      WHERE date_of_birth IS NOT NULL AND pipeline_stage NOT IN ('lost', 'withdraw');
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_admin_dashboard_leads_birthdays: %', SQLERRM;
  END;
END
$idx$;

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
    WHERE l.funding_type IN ('self_funded', 'puc')
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
      WHERE l.funding_type IN ('self_funded', 'puc')
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
      WHERE l.pipeline_stage <> 'lost'
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
      WHERE l.created_at >= v_last_month_start
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
    WHERE l.pipeline_stage NOT IN ('lost', 'enrolled', 'withdraw')
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
    WHERE l.date_of_birth IS NOT NULL
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
