-- Create filter_presets table for saved filter configurations
CREATE TABLE IF NOT EXISTS filter_presets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  is_shared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_filter_presets_user ON filter_presets(user_id);
CREATE INDEX idx_filter_presets_shared ON filter_presets(is_shared) WHERE is_shared = true;

-- RLS
ALTER TABLE filter_presets ENABLE ROW LEVEL SECURITY;

-- Users can see their own presets + shared presets
CREATE POLICY "Users can view own and shared presets"
  ON filter_presets FOR SELECT
  USING (user_id = auth.uid() OR is_shared = true);

CREATE POLICY "Users can create own presets"
  ON filter_presets FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own presets"
  ON filter_presets FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own presets"
  ON filter_presets FOR DELETE
  USING (user_id = auth.uid());

-- Updated_at trigger
CREATE TRIGGER filter_presets_updated_at
  BEFORE UPDATE ON filter_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
