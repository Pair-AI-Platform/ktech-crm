-- Migration: Update appointment_type enum with new types
-- Old types: campus_visit, application_meeting, placement_test, callback
-- New types: new_appointment, puc_documents, puc_application, retest, sf_appointment

-- First, update any existing appointments to map to new types
UPDATE appointments
SET appointment_type = 'new_appointment'
WHERE appointment_type IN ('campus_visit', 'application_meeting', 'callback');

UPDATE appointments
SET appointment_type = 'retest'
WHERE appointment_type = 'placement_test';

UPDATE appointment_slots
SET appointment_type = 'new_appointment'
WHERE appointment_type IN ('campus_visit', 'application_meeting', 'callback');

UPDATE appointment_slots
SET appointment_type = 'retest'
WHERE appointment_type = 'placement_test';

-- Create new enum type
CREATE TYPE appointment_type_new AS ENUM (
  'new_appointment', 'puc_documents', 'puc_application', 'retest', 'sf_appointment'
);

-- Convert appointments table
ALTER TABLE appointments
  ALTER COLUMN appointment_type TYPE appointment_type_new
  USING appointment_type::text::appointment_type_new;

-- Convert appointment_slots table
ALTER TABLE appointment_slots
  ALTER COLUMN appointment_type TYPE appointment_type_new
  USING appointment_type::text::appointment_type_new;

-- Drop old type and rename new one
DROP TYPE appointment_type;
ALTER TYPE appointment_type_new RENAME TO appointment_type;
