-- Migration 200: lock down students RLS and add the missing appointments WITH CHECK
--
-- The 168/174 RLS lockdown that scoped leads/audit_log/payments to owner/admin
-- and added WITH CHECK clauses never touched two tables:
--
--   1. students  — held the original USING(true)/WITH CHECK(true) INSERT policy
--      and an UPDATE policy with no WITH CHECK. students holds the most sensitive
--      financial/enrollment data (amount_paid, discount_*, is_payment_exempted,
--      payment_status, puc_stage, assigned_to). Any authenticated user — including
--      a low-privilege role blocked from inserting leads — could forge student
--      rows or mutate financial fields. Legitimate student rows are only ever
--      created by the SECURITY DEFINER RPCs (convert_lead_to_student /
--      promote_sf_lead_to_applicant), which bypass RLS — so direct client INSERT
--      is never legitimate and can be blocked outright.
--
--   2. appointments — appointments_update_policy (migration 015) has a USING
--      clause but no WITH CHECK, so an owner could UPDATE assigned_agent/created_by
--      to escape the ownership boundary (the same bug fixed for leads in 174).
--
-- Uses the helper functions from migration 168 (is_admin, owns_lead).

BEGIN;

-- =============================================================================
-- students
-- =============================================================================
DO $block$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='students') THEN
    DROP POLICY IF EXISTS students_select_policy ON students;
    DROP POLICY IF EXISTS students_insert_policy ON students;
    DROP POLICY IF EXISTS students_update_policy ON students;

    -- SELECT: admin, the assigned agent, or an agent who owns the source lead.
    CREATE POLICY students_select_policy ON students
      FOR SELECT TO authenticated
      USING (
        public.is_admin()
        OR assigned_to = (SELECT auth.uid())
        OR (lead_id IS NOT NULL AND public.owns_lead(lead_id))
      );

    -- INSERT: never legitimate from a client. All creation flows through the
    -- SECURITY DEFINER enrollment RPCs, which bypass RLS. Block direct inserts.
    CREATE POLICY students_insert_policy ON students
      FOR INSERT TO authenticated
      WITH CHECK (false);

    -- UPDATE: admin or the assigned agent, and the post-update row must still
    -- satisfy ownership (WITH CHECK) so an agent cannot reassign/orphan a record.
    CREATE POLICY students_update_policy ON students
      FOR UPDATE TO authenticated
      USING (
        public.is_admin()
        OR assigned_to = (SELECT auth.uid())
      )
      WITH CHECK (
        public.is_admin()
        OR assigned_to = (SELECT auth.uid())
      );
  END IF;
END
$block$;

-- =============================================================================
-- appointments — add the missing WITH CHECK to the UPDATE policy
-- =============================================================================
DO $block$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='appointments') THEN
    DROP POLICY IF EXISTS appointments_update_policy ON appointments;

    CREATE POLICY appointments_update_policy ON appointments
      FOR UPDATE TO authenticated
      USING (
        public.is_admin()
        OR created_by = (SELECT auth.uid())
        OR assigned_agent = (SELECT auth.uid())
      )
      WITH CHECK (
        public.is_admin()
        OR created_by = (SELECT auth.uid())
        OR assigned_agent = (SELECT auth.uid())
      );
  END IF;
END
$block$;

COMMIT;
