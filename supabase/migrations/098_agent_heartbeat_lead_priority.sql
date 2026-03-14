-- Agent heartbeat for presence tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_profiles_last_activity ON profiles(last_activity_at) WHERE is_active = true;

-- Lead priority system
ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal'
  CHECK (priority IN ('normal', 'important', 'critical'));
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority) WHERE priority != 'normal';

ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority_set_by UUID REFERENCES profiles(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority_set_at TIMESTAMPTZ;

-- Recurring follow-up support (only if table exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'follow_up_reminders' AND table_schema = 'public') THEN
    ALTER TABLE follow_up_reminders ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
    ALTER TABLE follow_up_reminders ADD COLUMN IF NOT EXISTS recurrence_interval_hours INTEGER;
    ALTER TABLE follow_up_reminders ADD COLUMN IF NOT EXISTS last_triggered_at TIMESTAMPTZ;
  END IF;
END $$;
