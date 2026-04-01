-- Remove send_sms from automation_rules action_type constraint
-- The engine no longer supports send_sms; existing rules would silently fail

ALTER TABLE automation_rules
  DROP CONSTRAINT IF EXISTS automation_rules_action_type_check;

ALTER TABLE automation_rules
  ADD CONSTRAINT automation_rules_action_type_check
  CHECK (action_type IN ('assign_lead', 'create_follow_up', 'create_notification', 'change_stage'));

-- Deactivate any existing send_sms rules so they don't accumulate failed executions
UPDATE automation_rules SET is_active = false WHERE action_type = 'send_sms';
