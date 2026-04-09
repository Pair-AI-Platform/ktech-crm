-- Store individual messages per campaign contact (outbound + inbound replies)
CREATE TABLE IF NOT EXISTS campaign_contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  campaign_contact_id UUID NOT NULL REFERENCES campaign_contacts(id) ON DELETE CASCADE,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'sent', -- sent, delivered, read, failed
  provider_message_id TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_contact_messages_contact ON campaign_contact_messages(campaign_contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contact_messages_campaign ON campaign_contact_messages(campaign_id);

-- RLS
ALTER TABLE campaign_contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read campaign messages"
  ON campaign_contact_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert campaign messages"
  ON campaign_contact_messages FOR INSERT TO authenticated WITH CHECK (true);
