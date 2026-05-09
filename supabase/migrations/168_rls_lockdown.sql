-- Migration 168: RLS Lockdown
--
-- Replaces dangerous USING (true) / WITH CHECK (true) policies that were
-- written when this was an internal demo. Trust model now: agents are NOT
-- trusted to see/touch other agents' leads, payments, calls, WhatsApp threads,
-- audit log, voice workflows, PSP documents, RSVP tokens, birthday greetings,
-- or campaign messages.
--
-- Reference tables (semesters, schools, exhibitions, education_cycles,
-- lead_sources, target_seasons, agent_targets, colleges, puc_periods,
-- pipeline_stage_settings) are deliberately left as USING (true) — they are
-- read-only catalogs.
--
-- All sections are idempotent AND tolerant of missing tables: each table's
-- policy block is wrapped in DO $$ IF EXISTS $$ so this migration can be
-- safely run against environments where some optional tables haven't been
-- created (e.g., a prod DB that skipped earlier migrations).

-- =============================================================================
-- 0. Helper functions
-- =============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_lead(p_lead_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.leads
    WHERE id = p_lead_id
      AND assigned_to = (SELECT auth.uid())
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_lead(uuid) TO authenticated;

-- =============================================================================
-- 1. whatsapp_messages
-- =============================================================================
DO $block$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='whatsapp_messages') THEN
    DROP POLICY IF EXISTS "Users can view all whatsapp messages" ON whatsapp_messages;
    DROP POLICY IF EXISTS "Users can insert whatsapp messages" ON whatsapp_messages;
    DROP POLICY IF EXISTS "Users can update whatsapp messages" ON whatsapp_messages;
    DROP POLICY IF EXISTS "whatsapp_messages_select" ON whatsapp_messages;
    DROP POLICY IF EXISTS "whatsapp_messages_insert" ON whatsapp_messages;
    DROP POLICY IF EXISTS "whatsapp_messages_update" ON whatsapp_messages;

    CREATE POLICY "whatsapp_messages_select" ON whatsapp_messages
      FOR SELECT TO authenticated
      USING (
        public.is_admin()
        OR (lead_id IS NOT NULL AND public.owns_lead(lead_id))
        OR agent_id = (SELECT auth.uid())
      );

    CREATE POLICY "whatsapp_messages_insert" ON whatsapp_messages
      FOR INSERT TO authenticated
      WITH CHECK (
        public.is_admin()
        OR (lead_id IS NOT NULL AND public.owns_lead(lead_id))
      );

    CREATE POLICY "whatsapp_messages_update" ON whatsapp_messages
      FOR UPDATE TO authenticated
      USING (
        public.is_admin()
        OR (lead_id IS NOT NULL AND public.owns_lead(lead_id))
      )
      WITH CHECK (
        public.is_admin()
        OR (lead_id IS NOT NULL AND public.owns_lead(lead_id))
      );
  ELSE
    RAISE NOTICE 'skipping whatsapp_messages — table not present';
  END IF;
END
$block$;

-- =============================================================================
-- 2. audit_log
-- =============================================================================
DO $block$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='audit_log') THEN
    DROP POLICY IF EXISTS "Authenticated users can view audit logs" ON audit_log;
    DROP POLICY IF EXISTS "audit_log_select_admin_only" ON audit_log;

    CREATE POLICY "audit_log_select_admin_only" ON audit_log
      FOR SELECT TO authenticated
      USING (public.is_admin());
  ELSE
    RAISE NOTICE 'skipping audit_log — table not present';
  END IF;
END
$block$;

-- =============================================================================
-- 3. appointments
-- =============================================================================
DO $block$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='appointments') THEN
    DROP POLICY IF EXISTS appointments_select_policy ON appointments;
    DROP POLICY IF EXISTS appointments_insert_policy ON appointments;

    CREATE POLICY appointments_select_policy ON appointments
      FOR SELECT TO authenticated
      USING (
        public.is_admin()
        OR created_by = (SELECT auth.uid())
        OR assigned_agent = (SELECT auth.uid())
        OR (lead_id IS NOT NULL AND public.owns_lead(lead_id))
        OR (
          EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='appointment_leads')
          AND EXISTS (
            SELECT 1 FROM appointment_leads al
            WHERE al.appointment_id = appointments.id
              AND public.owns_lead(al.lead_id)
          )
        )
      );

    CREATE POLICY appointments_insert_policy ON appointments
      FOR INSERT TO authenticated
      WITH CHECK (
        public.is_admin()
        OR assigned_agent = (SELECT auth.uid())
        OR created_by = (SELECT auth.uid())
      );
  ELSE
    RAISE NOTICE 'skipping appointments — table not present';
  END IF;
END
$block$;

-- =============================================================================
-- 4. appointment_leads
-- =============================================================================
DO $block$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='appointment_leads') THEN
    DROP POLICY IF EXISTS appointment_leads_select_policy ON appointment_leads;
    DROP POLICY IF EXISTS appointment_leads_insert_policy ON appointment_leads;

    CREATE POLICY appointment_leads_select_policy ON appointment_leads
      FOR SELECT TO authenticated
      USING (
        public.is_admin()
        OR public.owns_lead(lead_id)
        OR EXISTS (
          SELECT 1 FROM appointments a
          WHERE a.id = appointment_leads.appointment_id
            AND (a.created_by = (SELECT auth.uid()) OR a.assigned_agent = (SELECT auth.uid()))
        )
      );

    CREATE POLICY appointment_leads_insert_policy ON appointment_leads
      FOR INSERT TO authenticated
      WITH CHECK (
        public.is_admin()
        OR EXISTS (
          SELECT 1 FROM appointments a
          WHERE a.id = appointment_leads.appointment_id
            AND (a.created_by = (SELECT auth.uid()) OR a.assigned_agent = (SELECT auth.uid()))
        )
      );
  ELSE
    RAISE NOTICE 'skipping appointment_leads — table not present';
  END IF;
END
$block$;

-- =============================================================================
-- 5. calls / call_transcripts / call_summaries / call_action_items / campaign_leads
-- =============================================================================
DO $block$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='calls') THEN
    DROP POLICY IF EXISTS calls_insert_policy ON calls;
    CREATE POLICY calls_insert_policy ON calls
      FOR INSERT TO authenticated
      WITH CHECK (public.is_admin() OR agent_id = (SELECT auth.uid()));
  ELSE
    RAISE NOTICE 'skipping calls — table not present';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='call_transcripts') THEN
    DROP POLICY IF EXISTS transcripts_insert_policy ON call_transcripts;
    CREATE POLICY transcripts_insert_policy ON call_transcripts
      FOR INSERT TO authenticated
      WITH CHECK (
        public.is_admin()
        OR EXISTS (SELECT 1 FROM calls c WHERE c.id = call_transcripts.call_id AND c.agent_id = (SELECT auth.uid()))
      );
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='call_summaries') THEN
    DROP POLICY IF EXISTS summaries_insert_policy ON call_summaries;
    CREATE POLICY summaries_insert_policy ON call_summaries
      FOR INSERT TO authenticated
      WITH CHECK (
        public.is_admin()
        OR EXISTS (SELECT 1 FROM calls c WHERE c.id = call_summaries.call_id AND c.agent_id = (SELECT auth.uid()))
      );
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='call_action_items') THEN
    DROP POLICY IF EXISTS action_items_insert_policy ON call_action_items;
    CREATE POLICY action_items_insert_policy ON call_action_items
      FOR INSERT TO authenticated
      WITH CHECK (public.is_admin() OR assigned_to = (SELECT auth.uid()));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='campaign_leads') THEN
    DROP POLICY IF EXISTS campaign_leads_insert_policy ON campaign_leads;
    CREATE POLICY campaign_leads_insert_policy ON campaign_leads
      FOR INSERT TO authenticated
      WITH CHECK (public.is_admin());
  END IF;
END
$block$;

-- =============================================================================
-- 6. voice_* tables — admin-only SELECT
-- =============================================================================
DO $block$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='voice_agent_configs') THEN
    DROP POLICY IF EXISTS voice_configs_select_policy ON voice_agent_configs;
    CREATE POLICY voice_configs_select_policy ON voice_agent_configs
      FOR SELECT TO authenticated USING (public.is_admin());
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='voice_workflows') THEN
    DROP POLICY IF EXISTS voice_workflows_select_policy ON voice_workflows;
    CREATE POLICY voice_workflows_select_policy ON voice_workflows
      FOR SELECT TO authenticated USING (public.is_admin());
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='voice_workflow_steps') THEN
    DROP POLICY IF EXISTS voice_workflow_steps_select_policy ON voice_workflow_steps;
    CREATE POLICY voice_workflow_steps_select_policy ON voice_workflow_steps
      FOR SELECT TO authenticated USING (public.is_admin());
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='voice_workflow_conditions') THEN
    DROP POLICY IF EXISTS voice_workflow_conditions_select_policy ON voice_workflow_conditions;
    CREATE POLICY voice_workflow_conditions_select_policy ON voice_workflow_conditions
      FOR SELECT TO authenticated USING (public.is_admin());
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='voice_workflow_versions') THEN
    DROP POLICY IF EXISTS voice_workflow_versions_select_policy ON voice_workflow_versions;
    CREATE POLICY voice_workflow_versions_select_policy ON voice_workflow_versions
      FOR SELECT TO authenticated USING (public.is_admin());
  END IF;
END
$block$;

-- =============================================================================
-- 7. psp_documents
-- =============================================================================
DO $block$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='psp_documents') THEN
    DROP POLICY IF EXISTS "Users can view psp documents" ON psp_documents;
    DROP POLICY IF EXISTS "Users can insert psp documents" ON psp_documents;
    DROP POLICY IF EXISTS "Users can update psp documents" ON psp_documents;
    DROP POLICY IF EXISTS "Users can delete psp documents" ON psp_documents;
    DROP POLICY IF EXISTS psp_documents_select ON psp_documents;
    DROP POLICY IF EXISTS psp_documents_insert ON psp_documents;
    DROP POLICY IF EXISTS psp_documents_update ON psp_documents;
    DROP POLICY IF EXISTS psp_documents_delete ON psp_documents;

    CREATE POLICY psp_documents_select ON psp_documents
      FOR SELECT TO authenticated
      USING (public.is_admin() OR public.owns_lead(lead_id));

    CREATE POLICY psp_documents_insert ON psp_documents
      FOR INSERT TO authenticated
      WITH CHECK (public.is_admin() OR public.owns_lead(lead_id));

    CREATE POLICY psp_documents_update ON psp_documents
      FOR UPDATE TO authenticated
      USING (public.is_admin() OR public.owns_lead(lead_id))
      WITH CHECK (public.is_admin() OR public.owns_lead(lead_id));

    CREATE POLICY psp_documents_delete ON psp_documents
      FOR DELETE TO authenticated
      USING (public.is_admin() OR public.owns_lead(lead_id));
  END IF;
END
$block$;

-- =============================================================================
-- 8. psp_document_configs
-- =============================================================================
DO $block$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='psp_document_configs') THEN
    DROP POLICY IF EXISTS "psp_document_configs_insert" ON psp_document_configs;
    DROP POLICY IF EXISTS "psp_document_configs_update" ON psp_document_configs;
    DROP POLICY IF EXISTS "psp_document_configs_delete" ON psp_document_configs;

    CREATE POLICY psp_document_configs_insert ON psp_document_configs
      FOR INSERT TO authenticated
      WITH CHECK (public.is_admin());

    CREATE POLICY psp_document_configs_update ON psp_document_configs
      FOR UPDATE TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());

    CREATE POLICY psp_document_configs_delete ON psp_document_configs
      FOR DELETE TO authenticated
      USING (public.is_admin());
  END IF;
END
$block$;

-- =============================================================================
-- 9. rsvp_tokens
-- =============================================================================
DO $block$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='rsvp_tokens') THEN
    DROP POLICY IF EXISTS "Authenticated users can manage rsvp_tokens" ON rsvp_tokens;
    DROP POLICY IF EXISTS rsvp_tokens_admin_select ON rsvp_tokens;
    DROP POLICY IF EXISTS rsvp_tokens_admin_insert ON rsvp_tokens;
    DROP POLICY IF EXISTS rsvp_tokens_admin_update ON rsvp_tokens;
    DROP POLICY IF EXISTS rsvp_tokens_admin_delete ON rsvp_tokens;

    CREATE POLICY rsvp_tokens_admin_select ON rsvp_tokens
      FOR SELECT TO authenticated
      USING (public.is_admin() OR public.owns_lead(lead_id));

    CREATE POLICY rsvp_tokens_admin_insert ON rsvp_tokens
      FOR INSERT TO authenticated
      WITH CHECK (public.is_admin() OR public.owns_lead(lead_id));

    CREATE POLICY rsvp_tokens_admin_update ON rsvp_tokens
      FOR UPDATE TO authenticated
      USING (public.is_admin() OR public.owns_lead(lead_id))
      WITH CHECK (public.is_admin() OR public.owns_lead(lead_id));

    CREATE POLICY rsvp_tokens_admin_delete ON rsvp_tokens
      FOR DELETE TO authenticated
      USING (public.is_admin());
  END IF;
END
$block$;

-- =============================================================================
-- 10. birthday_greetings_sent
-- =============================================================================
DO $block$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='birthday_greetings_sent') THEN
    DROP POLICY IF EXISTS "Authenticated users can view birthday greetings" ON birthday_greetings_sent;
    DROP POLICY IF EXISTS "Service role can insert birthday greetings" ON birthday_greetings_sent;
    DROP POLICY IF EXISTS birthday_greetings_select ON birthday_greetings_sent;
    DROP POLICY IF EXISTS birthday_greetings_insert_admin ON birthday_greetings_sent;

    CREATE POLICY birthday_greetings_select ON birthday_greetings_sent
      FOR SELECT TO authenticated
      USING (public.is_admin() OR public.owns_lead(lead_id));

    CREATE POLICY birthday_greetings_insert_admin ON birthday_greetings_sent
      FOR INSERT TO authenticated
      WITH CHECK (public.is_admin());
  END IF;
END
$block$;

-- =============================================================================
-- 11. campaign_contact_messages
--     Two variants depending on whether campaigns.assigned_agents column exists.
-- =============================================================================
DO $block$
DECLARE
  has_assigned_agents boolean := EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='campaigns' AND column_name='assigned_agents'
  );
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='campaign_contact_messages')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='campaigns') THEN

    DROP POLICY IF EXISTS "Authenticated users can read campaign messages" ON campaign_contact_messages;
    DROP POLICY IF EXISTS "Authenticated users can insert campaign messages" ON campaign_contact_messages;
    DROP POLICY IF EXISTS campaign_contact_messages_select ON campaign_contact_messages;
    DROP POLICY IF EXISTS campaign_contact_messages_insert ON campaign_contact_messages;

    IF has_assigned_agents THEN
      EXECUTE $sql$
        CREATE POLICY campaign_contact_messages_select ON campaign_contact_messages
          FOR SELECT TO authenticated
          USING (
            public.is_admin()
            OR EXISTS (
              SELECT 1 FROM campaigns c
              WHERE c.id = campaign_contact_messages.campaign_id
                AND (c.created_by = (SELECT auth.uid()) OR (SELECT auth.uid()) = ANY(c.assigned_agents))
            )
          )
      $sql$;
      EXECUTE $sql$
        CREATE POLICY campaign_contact_messages_insert ON campaign_contact_messages
          FOR INSERT TO authenticated
          WITH CHECK (
            public.is_admin()
            OR EXISTS (
              SELECT 1 FROM campaigns c
              WHERE c.id = campaign_contact_messages.campaign_id
                AND (c.created_by = (SELECT auth.uid()) OR (SELECT auth.uid()) = ANY(c.assigned_agents))
            )
          )
      $sql$;
    ELSE
      -- Fallback: only the campaign's creator (or admin) sees its messages.
      EXECUTE $sql$
        CREATE POLICY campaign_contact_messages_select ON campaign_contact_messages
          FOR SELECT TO authenticated
          USING (
            public.is_admin()
            OR EXISTS (
              SELECT 1 FROM campaigns c
              WHERE c.id = campaign_contact_messages.campaign_id
                AND c.created_by = (SELECT auth.uid())
            )
          )
      $sql$;
      EXECUTE $sql$
        CREATE POLICY campaign_contact_messages_insert ON campaign_contact_messages
          FOR INSERT TO authenticated
          WITH CHECK (
            public.is_admin()
            OR EXISTS (
              SELECT 1 FROM campaigns c
              WHERE c.id = campaign_contact_messages.campaign_id
                AND c.created_by = (SELECT auth.uid())
            )
          )
      $sql$;
    END IF;
  END IF;
END
$block$;

-- =============================================================================
-- 12. notifications
-- =============================================================================
DO $block$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='notifications') THEN
    DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;

    CREATE POLICY "Users can insert notifications" ON notifications
      FOR INSERT TO authenticated
      WITH CHECK (
        created_by = (SELECT auth.uid())
        OR public.is_admin()
      );
  END IF;
END
$block$;

COMMENT ON FUNCTION public.is_admin() IS
  'Returns true if the current authenticated user has the admin role. STABLE so PG caches the result per-statement.';
COMMENT ON FUNCTION public.owns_lead(uuid) IS
  'Returns true if the current authenticated user is the assigned agent of the given lead. STABLE so PG caches the result per-statement.';
