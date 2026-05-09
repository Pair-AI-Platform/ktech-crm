-- Migration 174: CHAIN C RLS lockdown round 2
--
-- Migration 168 ("RLS lockdown") missed three high-impact tables:
--
--   A) leads_update_policy from migration 096 had no WITH CHECK.
--      An agent could `UPDATE leads SET assigned_to = my_uid WHERE ...`
--      and silently reassign or steal any lead they could SELECT.
--
--   B) round_robin_state has no RLS at all. Any agent could
--      `UPDATE round_robin_state SET last_agent_index = my_index`
--      and steer every AI-transfer lead to themselves.
--
--   C) audit_log INSERT policy was `WITH CHECK (true)`. Any authenticated
--      user could forge audit rows, including writing arbitrary user_id
--      to frame other agents. Legitimate writes come from the
--      audit_log_trigger() function which is SECURITY DEFINER — it
--      bypasses RLS — so we can safely lock down the policy.
--
-- All sections idempotent.

BEGIN;

-- =============================================================================
-- A) leads_update_policy — add WITH CHECK
-- =============================================================================
DROP POLICY IF EXISTS leads_update_policy ON leads;

CREATE POLICY leads_update_policy ON leads
  FOR UPDATE
  TO authenticated
  USING (
    assigned_to = (SELECT auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    -- Post-update row must still satisfy ownership: agent cannot
    -- reassign a lead away from themselves to anyone except admin.
    assigned_to = (SELECT auth.uid())
    OR public.is_admin()
  );

-- =============================================================================
-- B) round_robin_state — enable RLS, admin-only writes
-- =============================================================================
ALTER TABLE round_robin_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS round_robin_state_select ON round_robin_state;
DROP POLICY IF EXISTS round_robin_state_admin_write ON round_robin_state;
DROP POLICY IF EXISTS round_robin_state_admin_update ON round_robin_state;
DROP POLICY IF EXISTS round_robin_state_admin_insert ON round_robin_state;
DROP POLICY IF EXISTS round_robin_state_admin_delete ON round_robin_state;

-- Read access: any authenticated user (the table is small + non-sensitive,
-- but we keep it scoped for hygiene). The RPC `assign_round_robin()` is
-- SECURITY DEFINER and bypasses RLS for its UPDATE.
CREATE POLICY round_robin_state_select ON round_robin_state
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY round_robin_state_admin_insert ON round_robin_state
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY round_robin_state_admin_update ON round_robin_state
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY round_robin_state_admin_delete ON round_robin_state
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- =============================================================================
-- C) audit_log — deny direct authenticated INSERT
--
-- The audit_log_trigger() function is `SECURITY DEFINER`, so it runs as the
-- function owner (typically `postgres`) and bypasses RLS entirely. A WITH
-- CHECK (false) policy therefore blocks ad-hoc client writes without
-- breaking legitimate trigger-driven inserts.
--
-- We also drop UPDATE and DELETE policies entirely (audit log is append-only).
-- =============================================================================
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_log;
DROP POLICY IF EXISTS audit_log_no_direct_insert ON audit_log;
DROP POLICY IF EXISTS audit_log_no_update ON audit_log;
DROP POLICY IF EXISTS audit_log_no_delete ON audit_log;

CREATE POLICY audit_log_no_direct_insert ON audit_log
  FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY audit_log_no_update ON audit_log
  FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY audit_log_no_delete ON audit_log
  FOR DELETE TO authenticated
  USING (false);

COMMENT ON TABLE audit_log IS
  'Append-only audit trail. Direct INSERT/UPDATE/DELETE blocked by RLS; legitimate writes flow through audit_log_trigger() which is SECURITY DEFINER and bypasses RLS.';

COMMIT;
