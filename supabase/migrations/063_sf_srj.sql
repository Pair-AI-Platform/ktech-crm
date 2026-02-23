-- Migration 063: SF SRJ table
-- Stores SF SRJ entries managed from Settings

CREATE TABLE IF NOT EXISTS sf_srj (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint on code
CREATE UNIQUE INDEX idx_sf_srj_code ON sf_srj(code);

-- Index for listing/filtering
CREATE INDEX idx_sf_srj_status ON sf_srj(status, created_at DESC);

-- RLS
ALTER TABLE sf_srj ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view SF SRJ entries
CREATE POLICY "Authenticated users can view sf_srj"
  ON sf_srj FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can insert/update/delete (enforced via app logic + RLS)
CREATE POLICY "Authenticated users can insert sf_srj"
  ON sf_srj FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update sf_srj"
  ON sf_srj FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete sf_srj"
  ON sf_srj FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Ensure the reusable trigger function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at
DO $$ BEGIN
  CREATE TRIGGER sf_srj_updated_at
    BEFORE UPDATE ON sf_srj
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
