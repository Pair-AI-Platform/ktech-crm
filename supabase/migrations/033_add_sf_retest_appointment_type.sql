-- Migration: Add sf_retest appointment type for SF Appointment + Retest combined appointments

-- Add the new value to the appointment_type enum
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'sf_retest';
