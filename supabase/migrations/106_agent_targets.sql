-- Agent targets table: 3 fixed categories per agent per month
CREATE TABLE agent_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month TEXT NOT NULL,  -- 'YYYY-MM' format

  -- 3 fixed categories
  puc_files INTEGER NOT NULL DEFAULT 0,
  sf_files INTEGER NOT NULL DEFAULT 0,
  sf_applicants INTEGER NOT NULL DEFAULT 0,

  -- Optional gender sub-targets (PUC Files & SF Files only)
  puc_files_male INTEGER,
  puc_files_female INTEGER,
  sf_files_male INTEGER,
  sf_files_female INTEGER,

  -- Weekly breakdowns as JSON arrays (optional, per category)
  weekly_puc_files JSONB,
  weekly_sf_files JSONB,
  weekly_sf_applicants JSONB,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, month)
);

-- RLS
ALTER TABLE agent_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated can read" ON agent_targets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage" ON agent_targets FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Index
CREATE INDEX idx_agent_targets_month ON agent_targets(month, agent_id);

-- Updated_at trigger (reuse existing function)
CREATE TRIGGER set_updated_at BEFORE UPDATE ON agent_targets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
