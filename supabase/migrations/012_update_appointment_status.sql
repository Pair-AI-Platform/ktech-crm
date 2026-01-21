-- =============================================
-- MIGRATION 012: Update Appointment Status Enum
-- New statuses for better appointment tracking
-- =============================================

-- First, we need to handle the enum update carefully
-- PostgreSQL doesn't allow direct enum modification when values are in use

-- Step 1: Create a new enum type with all statuses
CREATE TYPE appointment_status_new AS ENUM (
  'scheduled',    -- Initial state (جديد)
  'confirmed',    -- Called and confirmed appointment (اتصلنا عليه وواكد الموعد)
  'postponed',    -- Set a new appointment (حط موعد جديد)
  'cancelled',    -- Cancelled the appointment (لغى الموعد)
  'na',           -- No Answer (لا يرد)
  'cant_reach',   -- Can't reach (لا يمكن الوصول)
  'on_the_way',   -- Running late but coming (تاخر عن وقتو بس لسى بالطريق)
  'done'          -- Completed/Attended (اجا وخلص)
);

-- Step 2: Update the appointments table to use the new enum
-- First, add a temporary column
ALTER TABLE appointments ADD COLUMN status_new appointment_status_new;

-- Step 3: Migrate existing data
UPDATE appointments SET status_new =
  CASE status::text
    WHEN 'scheduled' THEN 'scheduled'::appointment_status_new
    WHEN 'confirmed' THEN 'confirmed'::appointment_status_new
    WHEN 'attended' THEN 'done'::appointment_status_new
    WHEN 'no_show' THEN 'na'::appointment_status_new
    WHEN 'cancelled' THEN 'cancelled'::appointment_status_new
    WHEN 'rescheduled' THEN 'postponed'::appointment_status_new
    ELSE 'scheduled'::appointment_status_new
  END;

-- Step 4: Drop the old column and rename the new one
ALTER TABLE appointments DROP COLUMN status;
ALTER TABLE appointments RENAME COLUMN status_new TO status;

-- Step 5: Set default and not null constraints
ALTER TABLE appointments ALTER COLUMN status SET DEFAULT 'scheduled'::appointment_status_new;
ALTER TABLE appointments ALTER COLUMN status SET NOT NULL;

-- Step 6: Drop the old enum type and rename the new one
DROP TYPE appointment_status;
ALTER TYPE appointment_status_new RENAME TO appointment_status;

-- Step 7: Add on_the_way_at timestamp for tracking
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS on_the_way_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS on_the_way_marked_by UUID REFERENCES profiles(id);

-- Step 8: Add postponed tracking fields
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS postponed_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS postponed_by UUID REFERENCES profiles(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS postponed_to_date DATE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS postponed_to_time TIME;

-- Step 9: Add NA (no answer) tracking
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS na_marked_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS na_marked_by UUID REFERENCES profiles(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS na_attempts INTEGER DEFAULT 0;

-- Step 10: Add cant_reach tracking
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cant_reach_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cant_reach_by UUID REFERENCES profiles(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cant_reach_reason TEXT;

-- Step 11: Rename checked_in fields to done fields for clarity
-- Keep the old columns for backwards compatibility but add new ones
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS done_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS done_by UUID REFERENCES profiles(id);

-- Migrate existing checked_in data to done
UPDATE appointments SET done_at = checked_in_at, done_by = checked_in_by WHERE checked_in_at IS NOT NULL;

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Add comment for documentation
COMMENT ON TYPE appointment_status IS 'Appointment status tracking:
- scheduled: Initial state when appointment is created
- confirmed: Called and confirmed the appointment (اتصلنا عليه وواكد الموعد)
- postponed: Set a new appointment date/time (حط موعد جديد)
- cancelled: Cancelled the appointment with optional reason (لغى الموعد)
- na: No Answer when calling (لا يرد)
- cant_reach: Unable to reach the person (لا يمكن الوصول)
- on_the_way: Running late but still coming (تاخر عن وقتو بس لسى بالطريق)
- done: Completed/Attended the appointment (اجا وخلص)';
