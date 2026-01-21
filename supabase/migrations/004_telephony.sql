-- =============================================
-- TELEPHONY TABLES MIGRATION
-- AI-Powered Telephony System for KTECH CRM
-- =============================================

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE call_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE call_status AS ENUM ('initiated', 'ringing', 'in_progress', 'completed', 'failed', 'no_answer', 'busy', 'voicemail');
CREATE TYPE call_handler AS ENUM ('human', 'ai', 'voicemail');
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed', 'archived');

-- =============================================
-- CALLS TABLE
-- =============================================

CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Twilio identifiers
  twilio_call_sid VARCHAR(50) UNIQUE,
  twilio_parent_call_sid VARCHAR(50),

  -- Call metadata
  direction call_direction NOT NULL,
  from_number VARCHAR(20) NOT NULL,
  to_number VARCHAR(20) NOT NULL,
  status call_status DEFAULT 'initiated',
  handler call_handler DEFAULT 'human',

  -- Associated records
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  campaign_id UUID,

  -- Duration and timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,

  -- Recording
  recording_url TEXT,
  recording_sid VARCHAR(50),
  recording_duration_seconds INTEGER,

  -- Disposition and notes
  disposition VARCHAR(100),
  disposition_notes TEXT,

  -- AI conversation context
  ai_conversation_log JSONB,
  ai_intent_detected VARCHAR(100),
  transfer_reason TEXT,

  -- Metadata
  caller_name VARCHAR(255),
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CALL TRANSCRIPTS TABLE
-- =============================================

CREATE TABLE call_transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,

  -- Transcription content
  full_text TEXT NOT NULL,
  segments JSONB,
  language VARCHAR(10) DEFAULT 'en',

  -- Processing metadata
  whisper_model VARCHAR(50) DEFAULT 'whisper-1',
  processing_time_ms INTEGER,
  word_count INTEGER,
  confidence_score DECIMAL(5,4),

  -- Status
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CALL SUMMARIES TABLE
-- =============================================

CREATE TABLE call_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  transcript_id UUID REFERENCES call_transcripts(id) ON DELETE SET NULL,

  -- Summary content
  summary TEXT NOT NULL,
  summary_ar TEXT,
  key_points JSONB,

  -- Sentiment and intent
  caller_sentiment VARCHAR(20),
  call_intent VARCHAR(100),
  intent_confidence DECIMAL(5,4),

  -- Lead qualification signals
  interest_level VARCHAR(20),
  urgency_level VARCHAR(20),

  -- Recommendations
  recommended_actions TEXT[],
  recommended_pipeline_stage pipeline_stage,

  -- GPT metadata
  gpt_model VARCHAR(50) DEFAULT 'gpt-4o',
  tokens_used INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CALL ACTION ITEMS TABLE
-- =============================================

CREATE TABLE call_action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  summary_id UUID REFERENCES call_summaries(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  -- Action item content
  title VARCHAR(255) NOT NULL,
  description TEXT,
  action_type VARCHAR(50),

  -- Assignment and status
  assigned_to UUID REFERENCES profiles(id),
  status VARCHAR(20) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  due_date TIMESTAMPTZ,

  -- Completion tracking
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),
  completion_notes TEXT,

  -- Auto-detected vs manual
  is_ai_generated BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CALL CAMPAIGNS TABLE
-- =============================================

CREATE TABLE call_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  name VARCHAR(255) NOT NULL,
  description TEXT,
  status campaign_status DEFAULT 'draft',

  -- Lead Filters (stored as JSONB for flexibility)
  lead_filters JSONB,

  -- Assignment
  assigned_agents UUID[],
  created_by UUID REFERENCES profiles(id),

  -- Stats (denormalized for performance)
  total_leads INTEGER DEFAULT 0,
  called_count INTEGER DEFAULT 0,
  connected_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,

  -- Schedule
  start_date DATE,
  end_date DATE,
  call_hours_start TIME,
  call_hours_end TIME,

  -- Settings
  max_attempts_per_lead INTEGER DEFAULT 3,
  retry_delay_hours INTEGER DEFAULT 24,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for campaign_id in calls table
ALTER TABLE calls ADD CONSTRAINT calls_campaign_id_fkey
  FOREIGN KEY (campaign_id) REFERENCES call_campaigns(id) ON DELETE SET NULL;

-- =============================================
-- CAMPAIGN LEADS TABLE (Junction)
-- =============================================

CREATE TABLE campaign_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES call_campaigns(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  status VARCHAR(50) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  last_call_id UUID REFERENCES calls(id),

  assigned_agent_id UUID REFERENCES profiles(id),
  priority INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(campaign_id, lead_id)
);

-- =============================================
-- AGENT VOICE SETTINGS TABLE
-- =============================================

CREATE TABLE agent_voice_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  twilio_identity VARCHAR(100) NOT NULL UNIQUE,

  is_available BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'available',
  current_call_id UUID REFERENCES calls(id),

  -- Queue settings
  max_concurrent_calls INTEGER DEFAULT 1,
  active_calls_count INTEGER DEFAULT 0,

  -- Preferences
  auto_accept_transfers BOOLEAN DEFAULT true,
  receive_ai_transfers BOOLEAN DEFAULT true,

  last_call_at TIMESTAMPTZ,
  last_heartbeat TIMESTAMPTZ,
  device_token TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_agent_voice UNIQUE(agent_id)
);

-- =============================================
-- VOICE AGENT CONFIGURATIONS TABLE
-- =============================================

CREATE TABLE voice_agent_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Agent identity
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100),
  voice_id VARCHAR(50) DEFAULT 'alloy',
  language VARCHAR(10) DEFAULT 'en',

  -- Personality and instructions
  system_prompt TEXT NOT NULL,
  greeting_message TEXT,
  greeting_message_ar TEXT,

  -- Capabilities
  can_book_appointments BOOLEAN DEFAULT true,
  can_answer_enrollment_questions BOOLEAN DEFAULT true,
  can_transfer_to_human BOOLEAN DEFAULT true,

  -- Escalation rules
  escalation_keywords TEXT[],
  max_conversation_turns INTEGER DEFAULT 10,

  -- Business hours (when AI should answer)
  active_outside_hours BOOLEAN DEFAULT true,
  active_when_agents_busy BOOLEAN DEFAULT true,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_calls_twilio_sid ON calls(twilio_call_sid);
CREATE INDEX idx_calls_lead_id ON calls(lead_id);
CREATE INDEX idx_calls_student_id ON calls(student_id);
CREATE INDEX idx_calls_agent_id ON calls(agent_id);
CREATE INDEX idx_calls_campaign_id ON calls(campaign_id);
CREATE INDEX idx_calls_from_number ON calls(from_number);
CREATE INDEX idx_calls_to_number ON calls(to_number);
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_calls_started_at ON calls(started_at DESC);
CREATE INDEX idx_calls_direction ON calls(direction);

CREATE INDEX idx_transcripts_call_id ON call_transcripts(call_id);
CREATE INDEX idx_transcripts_status ON call_transcripts(status);

CREATE INDEX idx_summaries_call_id ON call_summaries(call_id);

CREATE INDEX idx_action_items_call_id ON call_action_items(call_id);
CREATE INDEX idx_action_items_lead_id ON call_action_items(lead_id);
CREATE INDEX idx_action_items_assigned_to ON call_action_items(assigned_to);
CREATE INDEX idx_action_items_status ON call_action_items(status);

CREATE INDEX idx_campaigns_status ON call_campaigns(status);
CREATE INDEX idx_campaigns_created_by ON call_campaigns(created_by);

CREATE INDEX idx_campaign_leads_status ON campaign_leads(campaign_id, status);
CREATE INDEX idx_campaign_leads_agent ON campaign_leads(assigned_agent_id);

CREATE INDEX idx_agent_voice_identity ON agent_voice_settings(twilio_identity);
CREATE INDEX idx_agent_voice_available ON agent_voice_settings(is_available);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_voice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_agent_configs ENABLE ROW LEVEL SECURITY;

-- Calls: Agents see their calls and calls for their leads, admins see all
CREATE POLICY calls_select_policy ON calls
  FOR SELECT TO authenticated
  USING (
    agent_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
    EXISTS (SELECT 1 FROM leads WHERE id = calls.lead_id AND assigned_to = auth.uid())
  );

CREATE POLICY calls_insert_policy ON calls
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY calls_update_policy ON calls
  FOR UPDATE TO authenticated
  USING (
    agent_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Transcripts: Same as calls
CREATE POLICY transcripts_select_policy ON call_transcripts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM calls
      WHERE calls.id = call_transcripts.call_id
      AND (calls.agent_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY transcripts_insert_policy ON call_transcripts
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Summaries: Same as calls
CREATE POLICY summaries_select_policy ON call_summaries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM calls
      WHERE calls.id = call_summaries.call_id
      AND (calls.agent_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY summaries_insert_policy ON call_summaries
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Action Items: Assigned agents and admins
CREATE POLICY action_items_select_policy ON call_action_items
  FOR SELECT TO authenticated
  USING (
    assigned_to = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY action_items_insert_policy ON call_action_items
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY action_items_update_policy ON call_action_items
  FOR UPDATE TO authenticated
  USING (
    assigned_to = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Campaigns: Assigned agents and admins
CREATE POLICY campaigns_select_policy ON call_campaigns
  FOR SELECT TO authenticated
  USING (
    auth.uid() = ANY(assigned_agents) OR
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY campaigns_insert_policy ON call_campaigns
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY campaigns_update_policy ON call_campaigns
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Campaign Leads: Assigned agents and admins
CREATE POLICY campaign_leads_select_policy ON campaign_leads
  FOR SELECT TO authenticated
  USING (
    assigned_agent_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY campaign_leads_insert_policy ON campaign_leads
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY campaign_leads_update_policy ON campaign_leads
  FOR UPDATE TO authenticated
  USING (
    assigned_agent_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Agent Voice Settings: Own settings or admin
CREATE POLICY agent_voice_select_policy ON agent_voice_settings
  FOR SELECT TO authenticated
  USING (
    agent_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY agent_voice_insert_policy ON agent_voice_settings
  FOR INSERT TO authenticated
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY agent_voice_update_policy ON agent_voice_settings
  FOR UPDATE TO authenticated
  USING (
    agent_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Voice Agent Configs: Admin only for modifications, all authenticated can read
CREATE POLICY voice_configs_select_policy ON voice_agent_configs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY voice_configs_insert_policy ON voice_agent_configs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY voice_configs_update_policy ON voice_agent_configs
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- TRIGGERS
-- =============================================

-- Updated at trigger for calls
CREATE TRIGGER calls_updated_at
  BEFORE UPDATE ON calls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Updated at trigger for transcripts
CREATE TRIGGER transcripts_updated_at
  BEFORE UPDATE ON call_transcripts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Updated at trigger for action items
CREATE TRIGGER action_items_updated_at
  BEFORE UPDATE ON call_action_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Updated at trigger for campaigns
CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON call_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Updated at trigger for agent voice settings
CREATE TRIGGER agent_voice_updated_at
  BEFORE UPDATE ON agent_voice_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Updated at trigger for voice agent configs
CREATE TRIGGER voice_configs_updated_at
  BEFORE UPDATE ON voice_agent_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- INSERT DEFAULT AI VOICE AGENT CONFIG
-- =============================================

INSERT INTO voice_agent_configs (
  name,
  name_ar,
  voice_id,
  language,
  system_prompt,
  greeting_message,
  greeting_message_ar,
  escalation_keywords,
  is_active
) VALUES (
  'Sarah',
  'سارة',
  'alloy',
  'en',
  'You are Sarah, a friendly and professional AI admissions assistant for Kuwait Technical College (KTECH). You help prospective students and their families with enrollment inquiries. You can answer questions about programs, tuition, schedule campus visits, and check enrollment status. Transfer to a human agent when: caller explicitly requests it, complex financial questions arise, complaints or escalations occur, or you detect frustration. Be warm, professional, and concise. Keep responses under 3 sentences when possible.',
  'Hello! Thank you for calling Kuwait Technical College. This is Sarah, your admissions assistant. How can I help you today?',
  'أهلاً بك في كلية الكويت التقنية. أنا سارة، مساعدتك في القبول. كيف يمكنني مساعدتك اليوم؟',
  ARRAY['speak to someone', 'human', 'person', 'agent', 'representative', 'manager', 'supervisor', 'complaint', 'problem', 'frustrated'],
  true
);
