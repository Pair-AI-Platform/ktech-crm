-- Automation Rules table
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('stage_change', 'lead_created', 'appointment_scheduled', 'payment_received')),
  trigger_conditions JSONB DEFAULT '{}',
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('send_sms', 'assign_lead', 'create_follow_up', 'create_notification', 'change_stage')),
  action_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation Executions log
CREATE TABLE IF NOT EXISTS automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'skipped')) DEFAULT 'success',
  result JSONB DEFAULT '{}',
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminder table (if not using the existing one in-memory)
CREATE TABLE IF NOT EXISTS follow_up_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL DEFAULT 'Follow Up',
  notes TEXT,
  due_at TIMESTAMPTZ NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  automation_rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger ON automation_rules (trigger_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_automation_executions_rule ON automation_executions (rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_lead ON automation_executions (lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_assignee ON follow_up_reminders (assigned_to, is_completed);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_due ON follow_up_reminders (due_at) WHERE is_completed = false;
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_lead ON follow_up_reminders (lead_id);

-- RLS Policies
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_reminders ENABLE ROW LEVEL SECURITY;

-- Automation rules: admins can manage, all authenticated can read active rules
CREATE POLICY "Admins can manage automation rules"
  ON automation_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "All users can view active rules"
  ON automation_rules FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Execution logs: admins can view all, agents can view their own leads
CREATE POLICY "Admins can view all executions"
  ON automation_executions FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can insert executions"
  ON automation_executions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Reminders: users can manage their own, admins can manage all
CREATE POLICY "Users can view own reminders"
  ON follow_up_reminders FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can update own reminders"
  ON follow_up_reminders FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Authenticated users can create reminders"
  ON follow_up_reminders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete own reminders"
  ON follow_up_reminders FOR DELETE
  TO authenticated
  USING (assigned_to = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
