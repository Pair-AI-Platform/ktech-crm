-- PUC Periods: admin-configurable date ranges for PUC reporting cycles
-- Only one period can be 'active' at a time. After end_date passes, it's "frozen"
-- (still active but read-only). Admin archives to start a new cycle.

CREATE TABLE IF NOT EXISTS puc_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT puc_periods_dates_check CHECK (end_date > start_date)
);

-- Only one active period at a time
CREATE UNIQUE INDEX idx_puc_periods_active
  ON puc_periods (status) WHERE status = 'active';

CREATE INDEX idx_puc_periods_dates ON puc_periods (start_date, end_date);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_puc_periods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER puc_periods_updated_at
  BEFORE UPDATE ON puc_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_puc_periods_updated_at();

-- RLS
ALTER TABLE puc_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view puc_periods"
  ON puc_periods FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert puc_periods"
  ON puc_periods FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update puc_periods"
  ON puc_periods FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete puc_periods"
  ON puc_periods FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Index for preference change queries on audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_leads_updates
  ON audit_log (table_name, action, created_at)
  WHERE table_name = 'leads' AND action = 'UPDATE';
