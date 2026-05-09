-- Migration 172: Remove SMS feature
--
-- Drops every table, column, constraint enum value, and trigger that exists
-- only to support SMS. WhatsApp, voice, email, and in-app notifications are
-- preserved.
--
-- Tables removed:
--   - sms_messages          (002)
--   - sms_templates         (002)
--   - birthday_greetings_sent (092 — birthday automation was SMS-only)
--
-- Columns removed:
--   - appointments.reminder_24h_sent / reminder_2h_sent (003)
--   - user_preferences.sms_notifications                (097)
--
-- Constraints adjusted:
--   - campaigns.type CHECK no longer accepts 'sms'
--   - automation_rules.trigger_type CHECK no longer accepts 'birthday'

BEGIN;

-- 1. Drop SMS message + template tables (CASCADE removes their RLS policies,
--    triggers from migration 048, and any FKs from other tables).
DROP TABLE IF EXISTS sms_messages CASCADE;
DROP TABLE IF EXISTS sms_templates CASCADE;

-- 2. Drop birthday-greeting tracking table (the cron that wrote it is gone).
DROP TABLE IF EXISTS birthday_greetings_sent CASCADE;

-- 3. Drop SMS-only columns on appointments (the SMS reminder cron is gone).
ALTER TABLE IF EXISTS appointments
  DROP COLUMN IF EXISTS reminder_24h_sent,
  DROP COLUMN IF EXISTS reminder_2h_sent;

-- 4. Drop the SMS notifications preference column.
ALTER TABLE IF EXISTS user_preferences
  DROP COLUMN IF EXISTS sms_notifications;

-- 5. Tighten campaigns.type CHECK so 'sms' is no longer a valid type.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaigns') THEN
    -- First, mark any existing SMS-typed campaign rows as completed + soft-disable
    -- to avoid violating the new CHECK. (No data loss — historical campaigns
    -- remain queryable, just locked.)
    UPDATE campaigns
       SET status = 'completed'
     WHERE type = 'sms';

    -- Now flip the type to 'whatsapp' on those rows so the CHECK passes.
    -- (If you'd rather delete them, run DELETE FROM campaigns WHERE type='sms'
    --  manually before applying this migration.)
    UPDATE campaigns
       SET type = 'whatsapp'
     WHERE type = 'sms';

    EXECUTE 'ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_type_check';
    EXECUTE 'ALTER TABLE campaigns ADD CONSTRAINT campaigns_type_check CHECK (type IN (''voice'', ''whatsapp'', ''email''))';
  END IF;
END $$;

-- 6. Tighten automation_rules.trigger_type CHECK so 'birthday' is gone.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'automation_rules') THEN
    -- Disable any birthday rules so they can't run.
    UPDATE automation_rules
       SET is_active = false
     WHERE trigger_type = 'birthday';

    EXECUTE 'ALTER TABLE automation_rules DROP CONSTRAINT IF EXISTS automation_rules_trigger_type_check';
    EXECUTE 'ALTER TABLE automation_rules ADD CONSTRAINT automation_rules_trigger_type_check CHECK (trigger_type IN (''stage_change'', ''lead_created'', ''appointment_scheduled'', ''payment_received''))';
  END IF;
END $$;

COMMIT;
