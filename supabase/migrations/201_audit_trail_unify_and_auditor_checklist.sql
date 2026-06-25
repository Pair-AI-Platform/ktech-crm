-- Migration 201: Unify audit trail on audit_logs + cover documents + auditor checklist
--
-- Two problems addressed here:
--   1. Audit data was written by the trigger in migration 089 to `audit_log` (singular),
--      but the Activity page, the per-lead history component, and the AuditLog type all
--      read `audit_logs` (plural) — which had no writer and was always empty.
--      We consolidate everything onto `audit_logs` (plural).
--   2. Document changes (psp_documents) were never audited. We now capture them, and add a
--      `lead_id` column so a lead's full change history (record + documents) is queryable.
--
-- Also adds the manual auditor checklist columns to `leads` (Part 1 of the request).

-- ---------------------------------------------------------------------------
-- 1. Ensure the canonical audit_logs (plural) table exists with a lead_id column
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  user_id UUID REFERENCES profiles(id),
  user_email VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- lead_id lets us pull a lead's full history (its own record + its documents) in one query.
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS lead_id UUID;

CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_lead ON audit_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

-- RLS: read for any authenticated user (app layer scopes by assignment); inserts come from
-- the SECURITY DEFINER trigger only.
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view audit_logs" ON audit_logs;
CREATE POLICY "Authenticated users can view audit_logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "System can insert audit_logs" ON audit_logs;
CREATE POLICY "System can insert audit_logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 2. Unified trigger function -> writes to audit_logs (plural)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_logs_capture()
RETURNS TRIGGER AS $$
DECLARE
  changed TEXT[] := ARRAY[]::TEXT[];
  current_user_id UUID;
  current_user_email TEXT;
  col TEXT;
  rec_id UUID;
  rec_lead_id UUID;
  payload JSONB;
BEGIN
  -- Resolve the acting user (auth.uid() may be null for service-role / system writes)
  BEGIN
    current_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    current_user_id := NULL;
  END;

  IF current_user_id IS NOT NULL THEN
    SELECT email INTO current_user_email FROM profiles WHERE id = current_user_id;
  END IF;

  -- Identify record id and the owning lead
  IF TG_OP = 'DELETE' THEN
    rec_id := OLD.id;
    payload := to_jsonb(OLD);
  ELSE
    rec_id := NEW.id;
    payload := to_jsonb(NEW);
  END IF;

  IF TG_TABLE_NAME = 'leads' THEN
    rec_lead_id := rec_id;
  ELSE
    rec_lead_id := NULLIF(payload ->> 'lead_id', '')::UUID;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, lead_id, action, old_values, new_values, changed_fields, user_id, user_email)
    VALUES (TG_TABLE_NAME, rec_id, rec_lead_id, 'INSERT', NULL, to_jsonb(NEW), ARRAY[]::TEXT[], current_user_id, current_user_email);
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    FOR col IN SELECT key FROM jsonb_each(to_jsonb(NEW))
    LOOP
      IF col IN ('updated_at') THEN
        CONTINUE;
      END IF;
      IF (to_jsonb(OLD) ->> col) IS DISTINCT FROM (to_jsonb(NEW) ->> col) THEN
        changed := array_append(changed, col);
      END IF;
    END LOOP;

    IF array_length(changed, 1) > 0 THEN
      INSERT INTO audit_logs (table_name, record_id, lead_id, action, old_values, new_values, changed_fields, user_id, user_email)
      VALUES (TG_TABLE_NAME, rec_id, rec_lead_id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), changed, current_user_id, current_user_email);
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, lead_id, action, old_values, new_values, changed_fields, user_id, user_email)
    VALUES (TG_TABLE_NAME, rec_id, rec_lead_id, 'DELETE', to_jsonb(OLD), NULL, ARRAY[]::TEXT[], current_user_id, current_user_email);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 3. Replace the old singular triggers; add document coverage
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS leads_audit_trigger ON leads;
DROP TRIGGER IF EXISTS students_audit_trigger ON students;
DROP TRIGGER IF EXISTS appointments_audit_trigger ON appointments;

CREATE TRIGGER leads_audit_logs_trigger
  AFTER INSERT OR UPDATE OR DELETE ON leads
  FOR EACH ROW EXECUTE FUNCTION audit_logs_capture();

CREATE TRIGGER students_audit_logs_trigger
  AFTER INSERT OR UPDATE OR DELETE ON students
  FOR EACH ROW EXECUTE FUNCTION audit_logs_capture();

CREATE TRIGGER appointments_audit_logs_trigger
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW EXECUTE FUNCTION audit_logs_capture();

CREATE TRIGGER psp_documents_audit_logs_trigger
  AFTER INSERT OR UPDATE OR DELETE ON psp_documents
  FOR EACH ROW EXECUTE FUNCTION audit_logs_capture();

-- ---------------------------------------------------------------------------
-- 4. Backfill historical rows from the old singular audit_log (best effort)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'audit_log'
  ) THEN
    INSERT INTO audit_logs (id, table_name, record_id, lead_id, action, old_values, new_values, changed_fields, user_id, user_email, created_at)
    SELECT
      al.id,
      al.table_name,
      al.record_id,
      CASE WHEN al.table_name = 'leads'
           THEN al.record_id
           ELSE NULLIF(al.new_values ->> 'lead_id', '')::UUID END,
      al.action,
      NULLIF(al.old_values, '{}'::JSONB),
      NULLIF(al.new_values, '{}'::JSONB),
      COALESCE(
        (SELECT array_agg(fc ->> 'field') FROM jsonb_array_elements(al.field_changes) AS fc),
        ARRAY[]::TEXT[]
      ),
      al.user_id,
      (SELECT email FROM profiles WHERE id = al.user_id),
      al.created_at
    FROM audit_log al
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 5. Manual auditor checklist columns on leads (Part 1)
--    Each item is ticked manually by an admin/auditor; we record who + when.
-- ---------------------------------------------------------------------------
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS auditor_check_documents BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auditor_check_documents_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS auditor_check_documents_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auditor_check_preferences BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auditor_check_preferences_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS auditor_check_preferences_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auditor_check_acceptance_match BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auditor_check_acceptance_match_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS auditor_check_acceptance_match_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auditor_check_notes TEXT;

COMMENT ON COLUMN leads.auditor_check_documents IS 'Manual auditor confirmation that uploaded documents match the application details';
COMMENT ON COLUMN leads.auditor_check_preferences IS 'Manual auditor confirmation that selected preferences were reviewed';
COMMENT ON COLUMN leads.auditor_check_acceptance_match IS 'Manual auditor confirmation that the acceptance letter matches the selected preferences';
