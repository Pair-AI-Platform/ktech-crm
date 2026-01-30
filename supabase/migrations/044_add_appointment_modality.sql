-- Migration: Add modality column to appointments table
-- This tracks whether the appointment is on-campus or online

ALTER TABLE appointments
  ADD COLUMN modality VARCHAR(20) DEFAULT NULL;

COMMENT ON COLUMN appointments.modality IS 'Appointment modality: campus or online';
