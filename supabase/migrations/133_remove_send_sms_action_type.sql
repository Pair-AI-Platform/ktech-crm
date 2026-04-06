-- Remove send_sms from automation_rules action_type constraint
-- The engine no longer supports send_sms; existing rules would silently fail
-- Wrapped in DO block to skip gracefully if automation_rules table doesn't exist

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'automation_rules') THEN
    ALTER TABLE automation_rules DROP CONSTRAINT IF EXISTS automation_rules_action_type_check;
    ALTER TABLE automation_rules ADD CONSTRAINT automation_rules_action_type_check
      CHECK (action_type IN ('assign_lead', 'create_follow_up', 'create_notification', 'change_stage'));
    UPDATE automation_rules SET is_active = false WHERE action_type = 'send_sms';
  END IF;
END $$;
