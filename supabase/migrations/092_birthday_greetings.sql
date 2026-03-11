-- Migration 092: Birthday Greetings Automation
-- Adds birthday tracking table, SMS template, and index.

-- 1. Update automation_rules trigger_type constraint (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'automation_rules') THEN
    EXECUTE 'ALTER TABLE automation_rules DROP CONSTRAINT IF EXISTS automation_rules_trigger_type_check';
    EXECUTE 'ALTER TABLE automation_rules ADD CONSTRAINT automation_rules_trigger_type_check CHECK (trigger_type IN (''stage_change'', ''lead_created'', ''appointment_scheduled'', ''payment_received'', ''birthday''))';
  END IF;
END $$;

-- 2. Update sms_templates category constraint (if constraint exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'sms_templates_category_check') THEN
    EXECUTE 'ALTER TABLE sms_templates DROP CONSTRAINT sms_templates_category_check';
    EXECUTE 'ALTER TABLE sms_templates ADD CONSTRAINT sms_templates_category_check CHECK (category IN (''appointment'', ''payment'', ''follow_up'', ''welcome'', ''reminder'', ''custom'', ''birthday''))';
  END IF;
END $$;

-- 3. Tracking table to prevent duplicate birthday greetings per year
CREATE TABLE IF NOT EXISTS birthday_greetings_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  message_type VARCHAR(20) NOT NULL DEFAULT 'sms',
  message_id VARCHAR(255),
  UNIQUE(lead_id, year)
);

-- RLS for birthday_greetings_sent
ALTER TABLE birthday_greetings_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view birthday greetings"
  ON birthday_greetings_sent FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can insert birthday greetings"
  ON birthday_greetings_sent FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 4. Seed a default birthday SMS template (bilingual)
INSERT INTO sms_templates (id, name, category, content_en, content_ar, variables, is_active)
VALUES (
  gen_random_uuid(),
  'Happy Birthday',
  'birthday',
  'Happy Birthday {{first_name}}! 🎂🎉 Wishing you a wonderful year ahead. From your friends at KTECH.',
  'عيد ميلاد سعيد {{first_name}}! 🎂🎉 نتمنى لك سنة سعيدة. من أصدقائك في KTECH.',
  ARRAY['first_name'],
  true
)
ON CONFLICT DO NOTHING;

-- 5. Index for efficient birthday lookups (month + day matching)
CREATE INDEX IF NOT EXISTS idx_leads_date_of_birth_month_day
  ON leads (EXTRACT(MONTH FROM date_of_birth), EXTRACT(DAY FROM date_of_birth))
  WHERE date_of_birth IS NOT NULL;
