-- Colleges management table (admin-controlled dropdown for transfer students)
CREATE TABLE IF NOT EXISTS colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed with common Kuwait colleges
INSERT INTO colleges (name, sort_order) VALUES
  ('American University of the Middle East (AUM)', 1),
  ('Gulf University for Science and Technology (GUST)', 2),
  ('American University of Kuwait (AUK)', 3),
  ('Box Hill College Kuwait', 4),
  ('Australian College of Kuwait (ACK)', 5),
  ('American College of the Middle East (ACM)', 6),
  ('Kuwait College of Science and Technology (KCST)', 7),
  ('Arab Open University (AOU)', 8),
  ('Kuwait University', 9),
  ('Public Authority for Applied Education and Training (PAAET)', 10)
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;

-- Everyone can read colleges
CREATE POLICY "Anyone can read colleges"
  ON colleges FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "Admins can insert colleges"
  ON colleges FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update colleges"
  ON colleges FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete colleges"
  ON colleges FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Add transfer source college FK to leads
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS transfer_from_college UUID REFERENCES colleges(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_transfer_from_college
  ON leads(transfer_from_college)
  WHERE transfer_from_college IS NOT NULL;
