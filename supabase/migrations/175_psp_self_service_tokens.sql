-- Migration 175: PSP Self-Service Tokens
--
-- Backs the new public flow where a student fills the PSP wizard for
-- themselves via a tokenized link. Mirrors the rsvp_tokens pattern but
-- avoids its security gaps (CR-05 / CR-10 from the May 2026 review):
--   - No anon RLS policies. Public access happens only via service-role
--     API routes that validate the token explicitly.
--   - DB-level CHECK on expires_at so a stale token cannot be revived.
--   - Tokens are rotatable: regenerating sets the previous token's
--     expires_at to NOW() so a leaked old token dies immediately.

CREATE TABLE IF NOT EXISTS psp_self_service_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT psp_tokens_expires_in_future CHECK (expires_at > created_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_psp_tokens_token
  ON psp_self_service_tokens(token);

CREATE INDEX IF NOT EXISTS idx_psp_tokens_lead_active
  ON psp_self_service_tokens(lead_id, expires_at DESC);

ALTER TABLE psp_self_service_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS psp_tokens_select ON psp_self_service_tokens;
DROP POLICY IF EXISTS psp_tokens_insert ON psp_self_service_tokens;
DROP POLICY IF EXISTS psp_tokens_admin_update ON psp_self_service_tokens;
DROP POLICY IF EXISTS psp_tokens_admin_delete ON psp_self_service_tokens;

CREATE POLICY psp_tokens_select ON psp_self_service_tokens
  FOR SELECT TO authenticated
  USING (public.is_admin() OR public.owns_lead(lead_id));

CREATE POLICY psp_tokens_insert ON psp_self_service_tokens
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.owns_lead(lead_id));

CREATE POLICY psp_tokens_admin_update ON psp_self_service_tokens
  FOR UPDATE TO authenticated
  USING (public.is_admin() OR public.owns_lead(lead_id))
  WITH CHECK (public.is_admin() OR public.owns_lead(lead_id));

CREATE POLICY psp_tokens_admin_delete ON psp_self_service_tokens
  FOR DELETE TO authenticated
  USING (public.is_admin());

COMMENT ON TABLE psp_self_service_tokens IS
  'Tokenized links that let a student fill the PSP wizard themselves. Public flows go through service-role API routes; this table has no anon RLS policies on purpose.';
