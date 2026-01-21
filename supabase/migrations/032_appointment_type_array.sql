-- Migration: Convert appointment_type from single ENUM to array
-- This allows appointments to have multiple types selected

-- Convert appointments table
ALTER TABLE appointments
  ALTER COLUMN appointment_type TYPE appointment_type[]
  USING ARRAY[appointment_type];

-- Convert appointment_slots table
ALTER TABLE appointment_slots
  ALTER COLUMN appointment_type TYPE appointment_type[]
  USING ARRAY[appointment_type];

-- Add comment for documentation
COMMENT ON COLUMN appointments.appointment_type IS 'Array of appointment types - allows multiple types per appointment';
COMMENT ON COLUMN appointment_slots.appointment_type IS 'Array of appointment types for this slot';
