-- WhatsApp Messages table for tracking direct messages
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  twilio_message_sid TEXT UNIQUE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  message_body TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  template_id TEXT,
  agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_lead_id ON whatsapp_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_student_id ON whatsapp_messages(student_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_agent_id ON whatsapp_messages(agent_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_to_number ON whatsapp_messages(to_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_sent_at ON whatsapp_messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_twilio_sid ON whatsapp_messages(twilio_message_sid);

-- Enable RLS
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all whatsapp messages" ON whatsapp_messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert whatsapp messages" ON whatsapp_messages
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update whatsapp messages" ON whatsapp_messages
  FOR UPDATE TO authenticated USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_whatsapp_messages_updated_at
  BEFORE UPDATE ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
