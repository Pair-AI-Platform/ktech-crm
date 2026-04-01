-- Lead sources management table (replaces hardcoded LEAD_SOURCES constant)
CREATE TABLE IF NOT EXISTS lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('direct', 'events', 'marketing', 'referrals', 'outreach')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed with existing sources
INSERT INTO lead_sources (value, label, category, sort_order) VALUES
  ('walk_in', 'Walk-in', 'direct', 1),
  ('call_center', 'Call Center', 'direct', 2),
  ('whatsapp', 'WhatsApp', 'direct', 3),
  ('email', 'Email', 'direct', 4),
  ('school_visit', 'School Visit', 'events', 5),
  ('expo', 'Expo', 'events', 6),
  ('exhibitions', 'Exhibitions', 'events', 7),
  ('karnival', 'Karnival', 'events', 8),
  ('website_form', 'Website Form', 'marketing', 9),
  ('facebook', 'Facebook', 'marketing', 10),
  ('instagram', 'Instagram', 'marketing', 11),
  ('tiktok', 'TikTok', 'marketing', 12),
  ('email_marketing', 'Email Marketing', 'marketing', 13),
  ('whatsapp_ai', 'WhatsApp AI', 'marketing', 14),
  ('current_student_referral', 'Student Referral', 'referrals', 15),
  ('staff_referral', 'Staff Referral', 'referrals', 16),
  ('friend_referral', 'Friend Referral', 'referrals', 17),
  ('old_contacts', 'Old Contacts', 'outreach', 18),
  ('paaet_rejected', 'PAAET Rejected', 'outreach', 19),
  ('gpa_lists', 'GPA Lists', 'outreach', 20)
ON CONFLICT (value) DO NOTHING;

-- Enable RLS
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;

-- Everyone can read sources
CREATE POLICY "Anyone can read lead sources"
  ON lead_sources FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "Admins can insert lead sources"
  ON lead_sources FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update lead sources"
  ON lead_sources FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete lead sources"
  ON lead_sources FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
