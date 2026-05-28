-- Migration 191: Fix infinite recursion in appointments / appointment_leads RLS
--
-- Migration 168 introduced two policies that reference each other:
--
--   appointments_select_policy        — its USING clause queries appointment_leads
--   appointment_leads_select_policy   — its USING clause queries appointments
--
-- When the calendar joins appointments → appointment_leads → leads, Postgres
-- evaluates RLS on both relations. The cross-references cause the planner to
-- bounce between policies and emit:
--
--   "infinite recursion detected in policy for relation appointment_leads"
--
-- Fix: move the cross-table checks into SECURITY DEFINER helper functions.
-- The helpers bypass RLS for the inner lookup, breaking the cycle. The outer
-- access decision is unchanged — same ownership rules, same admin override.

BEGIN;

-- =============================================================================
-- Helper: does the current user own any lead linked to this appointment?
-- =============================================================================
CREATE OR REPLACE FUNCTION public.owns_appointment_via_leads(p_appointment_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.appointment_leads al
    JOIN public.leads l ON l.id = al.lead_id
    WHERE al.appointment_id = p_appointment_id
      AND l.assigned_to = (SELECT auth.uid())
  );
$$;

-- =============================================================================
-- Helper: is the current user the creator or assignee of this appointment?
-- =============================================================================
CREATE OR REPLACE FUNCTION public.owns_appointment(p_appointment_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.appointments a
    WHERE a.id = p_appointment_id
      AND (
        a.created_by = (SELECT auth.uid())
        OR a.assigned_agent = (SELECT auth.uid())
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.owns_appointment_via_leads(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_appointment(uuid) TO authenticated;

-- =============================================================================
-- Rewrite appointments_select_policy to use the helper
-- =============================================================================
DO $block$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='appointments') THEN
    DROP POLICY IF EXISTS appointments_select_policy ON appointments;

    CREATE POLICY appointments_select_policy ON appointments
      FOR SELECT TO authenticated
      USING (
        public.is_admin()
        OR created_by = (SELECT auth.uid())
        OR assigned_agent = (SELECT auth.uid())
        OR (lead_id IS NOT NULL AND public.owns_lead(lead_id))
        OR public.owns_appointment_via_leads(id)
      );
  END IF;
END
$block$;

-- =============================================================================
-- Rewrite appointment_leads_select_policy to use the helper
-- =============================================================================
DO $block$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='appointment_leads') THEN
    DROP POLICY IF EXISTS appointment_leads_select_policy ON appointment_leads;

    CREATE POLICY appointment_leads_select_policy ON appointment_leads
      FOR SELECT TO authenticated
      USING (
        public.is_admin()
        OR public.owns_lead(lead_id)
        OR public.owns_appointment(appointment_id)
      );

    -- INSERT policy also queries appointments; switch it to the helper as well
    -- so future row inserts don't risk the same recursion under more complex
    -- query plans.
    DROP POLICY IF EXISTS appointment_leads_insert_policy ON appointment_leads;

    CREATE POLICY appointment_leads_insert_policy ON appointment_leads
      FOR INSERT TO authenticated
      WITH CHECK (
        public.is_admin()
        OR public.owns_appointment(appointment_id)
      );
  END IF;
END
$block$;

COMMIT;
