-- Migration: Remove 'orientation' from appointment_type enum
-- This removes the orientation appointment type from the system

-- First, update any existing appointments with 'orientation' type to 'campus_visit'
UPDATE appointments
SET appointment_type = 'campus_visit'
WHERE appointment_type = 'orientation';

UPDATE appointment_slots
SET appointment_type = 'campus_visit'
WHERE appointment_type = 'orientation';

-- Create a new enum type without 'orientation'
CREATE TYPE appointment_type_new AS ENUM (
  'campus_visit', 'application_meeting', 'placement_test', 'callback'
);

-- Update the appointments table to use the new type
ALTER TABLE appointments
  ALTER COLUMN appointment_type TYPE appointment_type_new
  USING appointment_type::text::appointment_type_new;

-- Update the appointment_slots table to use the new type
ALTER TABLE appointment_slots
  ALTER COLUMN appointment_type TYPE appointment_type_new
  USING appointment_type::text::appointment_type_new;

-- Drop the old type and rename the new one
DROP TYPE appointment_type;
ALTER TYPE appointment_type_new RENAME TO appointment_type;
