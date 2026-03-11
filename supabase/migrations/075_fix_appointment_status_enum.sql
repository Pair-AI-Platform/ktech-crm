-- =============================================
-- MIGRATION 075: Fix appointment_status enum to match application code
-- The remote DB has the OLD enum (scheduled, confirmed, attended, no_show, cancelled, rescheduled, will_see)
-- The app code expects (scheduled, confirmed, completed, no_answer, cancelled, postponed, will_see, on_the_way, cant_reach)
-- =============================================

-- Step 1: Create new enum with correct values
CREATE TYPE appointment_status_v2 AS ENUM (
  'scheduled',
  'no_answer',
  'confirmed',
  'on_the_way',
  'postponed',
  'cant_reach',
  'will_see',
  'completed',
  'cancelled'
);

-- Step 2: Add temporary column with new enum
ALTER TABLE appointments ADD COLUMN status_v2 appointment_status_v2;

-- Step 3: Migrate data mapping old values to new
UPDATE appointments SET status_v2 =
  CASE status::text
    WHEN 'scheduled' THEN 'scheduled'::appointment_status_v2
    WHEN 'confirmed' THEN 'confirmed'::appointment_status_v2
    WHEN 'attended' THEN 'completed'::appointment_status_v2
    WHEN 'no_show' THEN 'no_answer'::appointment_status_v2
    WHEN 'cancelled' THEN 'cancelled'::appointment_status_v2
    WHEN 'rescheduled' THEN 'postponed'::appointment_status_v2
    WHEN 'will_see' THEN 'will_see'::appointment_status_v2
    ELSE 'scheduled'::appointment_status_v2
  END;

-- Step 4: Drop old column, rename new, set constraints
ALTER TABLE appointments DROP COLUMN status;
ALTER TABLE appointments RENAME COLUMN status_v2 TO status;
ALTER TABLE appointments ALTER COLUMN status SET DEFAULT 'scheduled'::appointment_status_v2;
ALTER TABLE appointments ALTER COLUMN status SET NOT NULL;

-- Step 5: Drop old enum and rename new one
DROP TYPE appointment_status;
ALTER TYPE appointment_status_v2 RENAME TO appointment_status;

-- Step 6: Add missing tracking columns
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS on_the_way_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS on_the_way_marked_by UUID REFERENCES profiles(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS na_marked_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS na_marked_by UUID REFERENCES profiles(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS na_attempts INTEGER DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cant_reach_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cant_reach_by UUID REFERENCES profiles(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cant_reach_reason TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS done_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS done_by UUID REFERENCES profiles(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS will_see_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS will_see_marked_by UUID REFERENCES profiles(id);

-- Step 7: Migrate legacy column data
UPDATE appointments SET na_marked_at = no_show_marked_at, na_marked_by = no_show_marked_by
  WHERE no_show_marked_at IS NOT NULL AND na_marked_at IS NULL;
UPDATE appointments SET done_at = checked_in_at, done_by = checked_in_by
  WHERE checked_in_at IS NOT NULL AND done_at IS NULL;

-- Step 8: Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
