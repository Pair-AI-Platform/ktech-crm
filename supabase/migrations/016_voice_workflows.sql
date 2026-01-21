-- =============================================
-- VOICE WORKFLOW BUILDER TABLES
-- Migration: 016_voice_workflows.sql
-- =============================================

-- Create workflow status enum
DO $$ BEGIN
  CREATE TYPE workflow_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create action type enum for conditions
DO $$ BEGIN
  CREATE TYPE workflow_action_type AS ENUM (
    'proceed',      -- Simply proceed to another step
    'run',          -- Run an integration (verify_identity_check, etc.)
    'trigger',      -- Trigger an event (send_sms, create_appointment, etc.)
    'mark',         -- Mark a status or tag (@info_confirmed, etc.)
    'transfer',     -- Transfer to human agent
    'end_call'      -- End the call
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- VOICE WORKFLOWS (Main workflow container)
-- =============================================
CREATE TABLE IF NOT EXISTS voice_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic info
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  description TEXT,
  description_ar TEXT,

  -- Status and versioning
  status workflow_status DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  published_version INTEGER,
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES profiles(id),

  -- Configuration
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  modality VARCHAR(50) DEFAULT 'voice', -- 'voice', 'chat', 'multi-modal'

  -- AI settings
  voice_agent_config_id UUID REFERENCES voice_agent_configs(id),
  system_prompt_override TEXT,

  -- Metadata
  tags TEXT[],
  metadata JSONB,

  -- Audit
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_workflows_status ON voice_workflows(status);
CREATE INDEX IF NOT EXISTS idx_voice_workflows_active ON voice_workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_voice_workflows_default ON voice_workflows(is_default) WHERE is_default = true;

-- =============================================
-- VOICE WORKFLOW STEPS (Individual steps)
-- =============================================
CREATE TABLE IF NOT EXISTS voice_workflow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES voice_workflows(id) ON DELETE CASCADE,

  -- Step identification
  step_number INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),

  -- Position for visual canvas (react-flow)
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,

  -- Message content
  message TEXT NOT NULL,
  message_ar TEXT,

  -- Step configuration
  is_entry_point BOOLEAN DEFAULT false,
  is_terminal BOOLEAN DEFAULT false,
  step_type VARCHAR(50) DEFAULT 'message', -- 'message', 'input', 'decision', 'action'

  -- Wait/timeout settings
  wait_for_response BOOLEAN DEFAULT true,
  timeout_seconds INTEGER DEFAULT 30,
  timeout_action UUID, -- References target step on timeout

  -- Retry settings
  max_retries INTEGER DEFAULT 2,
  retry_message TEXT,
  retry_message_ar TEXT,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_step_number_per_workflow UNIQUE (workflow_id, step_number)
);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow ON voice_workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_entry ON voice_workflow_steps(workflow_id, is_entry_point) WHERE is_entry_point = true;

-- =============================================
-- VOICE WORKFLOW CONDITIONS (Branches from steps)
-- =============================================
CREATE TABLE IF NOT EXISTS voice_workflow_conditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  step_id UUID NOT NULL REFERENCES voice_workflow_steps(id) ON DELETE CASCADE,

  -- Order of condition evaluation
  priority INTEGER DEFAULT 0,

  -- Condition definition
  condition_label VARCHAR(255) NOT NULL, -- "Customer provides info", "Upload successful"
  condition_label_ar VARCHAR(255),
  condition_type VARCHAR(50) NOT NULL DEFAULT 'always', -- 'intent', 'keyword', 'entity', 'always', 'timeout', 'error'
  condition_config JSONB, -- { "intents": ["confirm"], "keywords": ["yes", "okay"], "entities": ["name", "dob"] }

  -- Action to perform
  action_type workflow_action_type NOT NULL DEFAULT 'proceed',
  action_value VARCHAR(255), -- Function name, tag name, etc.
  action_config JSONB, -- Additional action configuration

  -- Target step
  target_step_id UUID REFERENCES voice_workflow_steps(id) ON DELETE SET NULL,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_conditions_step ON voice_workflow_conditions(step_id);
CREATE INDEX IF NOT EXISTS idx_workflow_conditions_target ON voice_workflow_conditions(target_step_id);

-- =============================================
-- VOICE WORKFLOW VERSIONS (Version history)
-- =============================================
CREATE TABLE IF NOT EXISTS voice_workflow_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES voice_workflows(id) ON DELETE CASCADE,

  version INTEGER NOT NULL,

  -- Snapshot of workflow at this version
  workflow_snapshot JSONB NOT NULL,
  steps_snapshot JSONB NOT NULL,
  conditions_snapshot JSONB NOT NULL,

  -- Metadata
  change_notes TEXT,
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_version_per_workflow UNIQUE (workflow_id, version)
);

CREATE INDEX IF NOT EXISTS idx_workflow_versions_workflow ON voice_workflow_versions(workflow_id);

-- =============================================
-- VOICE WORKFLOW INTEGRATIONS (Available actions)
-- =============================================
CREATE TABLE IF NOT EXISTS voice_workflow_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Integration identification
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  display_name_ar VARCHAR(255),
  description TEXT,

  -- Configuration
  action_type workflow_action_type NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'crm', 'verification', 'communication', 'calendar'
  icon VARCHAR(50), -- Icon name from lucide-react

  -- Schema for parameters
  input_schema JSONB,
  output_schema JSONB,

  -- Implementation
  endpoint_url VARCHAR(500),
  is_async BOOLEAN DEFAULT false,
  timeout_ms INTEGER DEFAULT 10000,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- VOICE WORKFLOW EXECUTIONS (Runtime tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS voice_workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  workflow_id UUID NOT NULL REFERENCES voice_workflows(id),
  workflow_version INTEGER NOT NULL,
  call_id UUID REFERENCES calls(id),
  lead_id UUID REFERENCES leads(id),

  -- Current state
  current_step_id UUID REFERENCES voice_workflow_steps(id),
  execution_state JSONB, -- Variables, collected data, etc.

  -- Status
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'transferred', 'failed', 'abandoned'

  -- Metrics
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_steps_executed INTEGER DEFAULT 0,

  -- Outcome
  outcome VARCHAR(100),
  outcome_data JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON voice_workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_call ON voice_workflow_executions(call_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON voice_workflow_executions(status);

-- =============================================
-- ADD WORKFLOW REFERENCE TO VOICE_AGENT_CONFIGS
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'voice_agent_configs' AND column_name = 'default_workflow_id'
  ) THEN
    ALTER TABLE voice_agent_configs ADD COLUMN default_workflow_id UUID REFERENCES voice_workflows(id);
  END IF;
END $$;

-- =============================================
-- SEED DATA: Default integrations
-- =============================================
INSERT INTO voice_workflow_integrations (name, display_name, display_name_ar, action_type, category, icon, description)
VALUES
  ('verify_identity', 'Verify Identity', 'التحقق من الهوية', 'run', 'verification', 'ShieldCheck', 'Run identity verification against government database'),
  ('book_appointment', 'Book Appointment', 'حجز موعد', 'trigger', 'calendar', 'Calendar', 'Create a new appointment in the calendar'),
  ('send_sms', 'Send SMS', 'إرسال رسالة', 'trigger', 'communication', 'MessageSquare', 'Send an SMS message to the caller'),
  ('send_whatsapp', 'Send WhatsApp', 'إرسال واتساب', 'trigger', 'communication', 'MessageCircle', 'Send a WhatsApp message'),
  ('update_lead_status', 'Update Lead Status', 'تحديث حالة العميل', 'trigger', 'crm', 'UserCheck', 'Update the lead pipeline stage'),
  ('transfer_to_agent', 'Transfer to Agent', 'تحويل لموظف', 'transfer', 'communication', 'PhoneForwarded', 'Transfer call to available human agent'),
  ('collect_info', 'Collect Information', 'جمع المعلومات', 'run', 'crm', 'ClipboardList', 'Collect and save customer information'),
  ('check_enrollment', 'Check Enrollment', 'التحقق من التسجيل', 'run', 'crm', 'Search', 'Check if lead is already enrolled'),
  ('schedule_callback', 'Schedule Callback', 'جدولة اتصال', 'trigger', 'calendar', 'PhoneCall', 'Schedule a callback at a later time'),
  ('add_note', 'Add Note', 'إضافة ملاحظة', 'trigger', 'crm', 'FileText', 'Add a note to the lead record')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE voice_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_workflow_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_workflow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_workflow_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_workflow_executions ENABLE ROW LEVEL SECURITY;

-- Voice Workflows: All authenticated can read, admins can modify
CREATE POLICY voice_workflows_select_policy ON voice_workflows
  FOR SELECT TO authenticated USING (true);

CREATE POLICY voice_workflows_insert_policy ON voice_workflows
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY voice_workflows_update_policy ON voice_workflows
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY voice_workflows_delete_policy ON voice_workflows
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Workflow Steps: Same policies as workflows
CREATE POLICY voice_workflow_steps_select_policy ON voice_workflow_steps
  FOR SELECT TO authenticated USING (true);

CREATE POLICY voice_workflow_steps_insert_policy ON voice_workflow_steps
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY voice_workflow_steps_update_policy ON voice_workflow_steps
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY voice_workflow_steps_delete_policy ON voice_workflow_steps
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Workflow Conditions: Same policies as workflows
CREATE POLICY voice_workflow_conditions_select_policy ON voice_workflow_conditions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY voice_workflow_conditions_insert_policy ON voice_workflow_conditions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY voice_workflow_conditions_update_policy ON voice_workflow_conditions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY voice_workflow_conditions_delete_policy ON voice_workflow_conditions
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Workflow Versions: All authenticated can read, system creates
CREATE POLICY voice_workflow_versions_select_policy ON voice_workflow_versions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY voice_workflow_versions_insert_policy ON voice_workflow_versions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Workflow Integrations: All authenticated can read
CREATE POLICY voice_workflow_integrations_select_policy ON voice_workflow_integrations
  FOR SELECT TO authenticated USING (true);

-- Workflow Executions: All authenticated can read, system creates
CREATE POLICY voice_workflow_executions_select_policy ON voice_workflow_executions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY voice_workflow_executions_insert_policy ON voice_workflow_executions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY voice_workflow_executions_update_policy ON voice_workflow_executions
  FOR UPDATE TO authenticated USING (true);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_voice_workflows_updated_at ON voice_workflows;
CREATE TRIGGER update_voice_workflows_updated_at
  BEFORE UPDATE ON voice_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_voice_workflow_steps_updated_at ON voice_workflow_steps;
CREATE TRIGGER update_voice_workflow_steps_updated_at
  BEFORE UPDATE ON voice_workflow_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_voice_workflow_conditions_updated_at ON voice_workflow_conditions;
CREATE TRIGGER update_voice_workflow_conditions_updated_at
  BEFORE UPDATE ON voice_workflow_conditions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- CREATE DEFAULT WORKFLOW: Student Enrollment
-- =============================================

-- Insert default enrollment workflow
INSERT INTO voice_workflows (
  id,
  name,
  name_ar,
  description,
  description_ar,
  status,
  version,
  is_default,
  is_active,
  modality
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Student Enrollment',
  'تسجيل الطلاب',
  'Default workflow for handling student enrollment inquiries',
  'سير العمل الافتراضي للتعامل مع استفسارات تسجيل الطلاب',
  'draft',
  1,
  true,
  true,
  'voice'
) ON CONFLICT DO NOTHING;

-- Insert steps for default workflow
INSERT INTO voice_workflow_steps (workflow_id, step_number, name, name_ar, message, message_ar, is_entry_point, position_x, position_y)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 1, 'Greeting', 'التحية',
   'Welcome to Kuwait Technical College! I''m here to help you with enrollment. May I have your name please?',
   'أهلاً بك في كلية الكويت التقنية! أنا هنا لمساعدتك في التسجيل. هل يمكنني معرفة اسمك؟',
   true, 250, 50),
  ('a0000000-0000-0000-0000-000000000001', 2, 'Collect Interest', 'جمع الاهتمام',
   'Nice to meet you! Which program are you interested in? We have Web Development, Mobile Apps, Data Science, and Cybersecurity.',
   'سعيد بلقائك! ما هو البرنامج الذي تهتم به؟ لدينا تطوير الويب، تطبيقات الجوال، علوم البيانات، والأمن السيبراني.',
   false, 250, 200),
  ('a0000000-0000-0000-0000-000000000001', 3, 'Provide Info', 'تقديم المعلومات',
   'Great choice! Our program includes hands-on projects, industry certifications, and job placement support. Would you like to schedule a campus visit to learn more?',
   'اختيار رائع! يتضمن برنامجنا مشاريع عملية، شهادات معتمدة، ودعم التوظيف. هل تود جدولة زيارة للحرم الجامعي لمعرفة المزيد؟',
   false, 250, 350),
  ('a0000000-0000-0000-0000-000000000001', 4, 'Book Appointment', 'حجز موعد',
   'Perfect! Let me schedule a campus visit for you. What day works best - weekday or weekend?',
   'ممتاز! دعني أحجز لك زيارة للحرم. ما هو اليوم المناسب لك - أيام الأسبوع أم عطلة نهاية الأسبوع؟',
   false, 100, 500),
  ('a0000000-0000-0000-0000-000000000001', 5, 'Transfer to Agent', 'تحويل لموظف',
   'I''ll connect you with one of our admissions counselors who can help you better. Please hold for a moment.',
   'سأوصلك بأحد مستشاري القبول الذين يمكنهم مساعدتك بشكل أفضل. الرجاء الانتظار لحظة.',
   false, 400, 500),
  ('a0000000-0000-0000-0000-000000000001', 6, 'Closing', 'الإنهاء',
   'Thank you for your interest in Kuwait Technical College! We''ll send you a confirmation SMS shortly. Have a great day!',
   'شكراً لاهتمامك بكلية الكويت التقنية! سنرسل لك رسالة تأكيد قريباً. أتمنى لك يوماً سعيداً!',
   false, 250, 650)
ON CONFLICT DO NOTHING;
