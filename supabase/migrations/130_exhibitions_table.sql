-- Exhibitions management table (admin-controlled dropdown for lead source_detail)
CREATE TABLE IF NOT EXISTS exhibitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed with common exhibitions
INSERT INTO exhibitions (name, sort_order) VALUES
  ('Kuwait Education Fair 2025', 1),
  ('Gulf Education Expo 2025', 2),
  ('KTECH Open Day', 3)
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE exhibitions ENABLE ROW LEVEL SECURITY;

-- Everyone can read exhibitions
CREATE POLICY "Anyone can read exhibitions"
  ON exhibitions FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "Admins can insert exhibitions"
  ON exhibitions FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update exhibitions"
  ON exhibitions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete exhibitions"
  ON exhibitions FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
