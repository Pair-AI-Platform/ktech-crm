-- Seasons table for non-monthly target periods (SF Applicants + PUC App Submission)
CREATE TABLE target_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,           -- e.g. "Spring 2026", "Fall 2025"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE target_seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated can read seasons" ON target_seasons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage seasons" ON target_seasons FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX idx_target_seasons_dates ON target_seasons(start_date, end_date);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON target_seasons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Per-agent seasonal targets (SF Applicants + PUC App Submission)
CREATE TABLE agent_seasonal_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES target_seasons(id) ON DELETE CASCADE,
  sf_applicants INTEGER NOT NULL DEFAULT 0,
  puc_app_submission INTEGER NOT NULL DEFAULT 0,
  weekly_sf_applicants JSONB,
  weekly_puc_app_submission JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, season_id)
);

ALTER TABLE agent_seasonal_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated can read seasonal targets" ON agent_seasonal_targets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage seasonal targets" ON agent_seasonal_targets FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX idx_agent_seasonal_targets_season ON agent_seasonal_targets(season_id, agent_id);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON agent_seasonal_targets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
