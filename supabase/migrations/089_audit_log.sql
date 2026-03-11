-- Create audit_log table for tracking changes across tables
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  field_changes JSONB DEFAULT '[]',
  old_values JSONB DEFAULT '{}',
  new_values JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);

-- RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Users can view audit logs (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view audit logs"
  ON audit_log FOR SELECT
  TO authenticated
  USING (true);

-- Only the system (triggers) can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON audit_log FOR INSERT
  WITH CHECK (true);

-- Trigger function to auto-capture changes
CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
  changes JSONB := '[]'::JSONB;
  old_vals JSONB := '{}'::JSONB;
  new_vals JSONB := '{}'::JSONB;
  current_user_id UUID;
  col TEXT;
  old_val TEXT;
  new_val TEXT;
  record_uuid UUID;
BEGIN
  -- Get current user if available
  BEGIN
    current_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    current_user_id := NULL;
  END;

  IF TG_OP = 'INSERT' THEN
    record_uuid := NEW.id;
    new_vals := to_jsonb(NEW);

    INSERT INTO audit_log (table_name, record_id, user_id, action, field_changes, old_values, new_values)
    VALUES (TG_TABLE_NAME, record_uuid, current_user_id, 'INSERT', '[]'::JSONB, '{}'::JSONB, new_vals);

    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    record_uuid := NEW.id;

    -- Build field_changes array with only changed fields
    FOR col IN SELECT key FROM jsonb_each(to_jsonb(NEW))
    LOOP
      -- Skip system fields that always change
      IF col IN ('updated_at') THEN
        CONTINUE;
      END IF;

      old_val := (to_jsonb(OLD) ->> col);
      new_val := (to_jsonb(NEW) ->> col);

      IF old_val IS DISTINCT FROM new_val THEN
        changes := changes || jsonb_build_array(
          jsonb_build_object(
            'field', col,
            'old', to_jsonb(OLD) -> col,
            'new', to_jsonb(NEW) -> col
          )
        );
      END IF;
    END LOOP;

    -- Only log if there are actual changes
    IF jsonb_array_length(changes) > 0 THEN
      old_vals := to_jsonb(OLD);
      new_vals := to_jsonb(NEW);

      INSERT INTO audit_log (table_name, record_id, user_id, action, field_changes, old_values, new_values)
      VALUES (TG_TABLE_NAME, record_uuid, current_user_id, 'UPDATE', changes, old_vals, new_vals);
    END IF;

    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    record_uuid := OLD.id;
    old_vals := to_jsonb(OLD);

    INSERT INTO audit_log (table_name, record_id, user_id, action, field_changes, old_values, new_values)
    VALUES (TG_TABLE_NAME, record_uuid, current_user_id, 'DELETE', '[]'::JSONB, old_vals, '{}'::JSONB);

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers to leads table
CREATE TRIGGER leads_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION audit_log_trigger();

-- Apply triggers to students table
CREATE TRIGGER students_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON students
  FOR EACH ROW
  EXECUTE FUNCTION audit_log_trigger();

-- Apply triggers to appointments table
CREATE TRIGGER appointments_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION audit_log_trigger();
