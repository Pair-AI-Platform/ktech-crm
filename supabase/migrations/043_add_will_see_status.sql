-- =============================================
-- MIGRATION 043: Add Will See Appointment Status
-- Adds 'will_see' status for when student confirms they will come (بيجي)
-- =============================================

-- Add the new enum value
ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'will_see';

-- Add tracking columns for will_see status
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS will_see_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS will_see_marked_by UUID REFERENCES profiles(id);
