-- Add reminder tracking fields to appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS reminder_24h_sent TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reminder_2h_sent TIMESTAMPTZ;

-- Create index for efficient reminder queries
CREATE INDEX IF NOT EXISTS idx_appointments_reminders
ON appointments (scheduled_date, status)
WHERE reminder_24h_sent IS NULL OR reminder_2h_sent IS NULL;
