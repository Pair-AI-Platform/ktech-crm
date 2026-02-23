-- Migration: Create appointment_leads junction table for many-to-many relationship
-- This allows multiple leads to be booked into the same appointment

-- Step 1: Create junction table
CREATE TABLE IF NOT EXISTS appointment_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(appointment_id, lead_id)
);

-- Step 2: Create indexes for efficient lookups
CREATE INDEX idx_appointment_leads_appointment ON appointment_leads(appointment_id);
CREATE INDEX idx_appointment_leads_lead ON appointment_leads(lead_id);

-- Step 3: Migrate existing data from appointments.lead_id
INSERT INTO appointment_leads (appointment_id, lead_id)
SELECT id, lead_id FROM appointments WHERE lead_id IS NOT NULL
ON CONFLICT (appointment_id, lead_id) DO NOTHING;

-- Step 4: Enable RLS
ALTER TABLE appointment_leads ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS policies (mirrors appointment policies)
CREATE POLICY appointment_leads_select_policy ON appointment_leads
  FOR SELECT TO authenticated USING (true);

CREATE POLICY appointment_leads_insert_policy ON appointment_leads
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY appointment_leads_update_policy ON appointment_leads
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = appointment_id
      AND (a.created_by = auth.uid() OR a.assigned_agent = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY appointment_leads_delete_policy ON appointment_leads
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = appointment_id
      AND (a.created_by = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
