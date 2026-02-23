-- Migration: Add withdrawal reason and notes to leads table
-- Stores the reason for withdrawal when a lead's stage is changed to 'withdraw'

ALTER TABLE leads ADD COLUMN IF NOT EXISTS withdrawal_reason TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS withdrawal_notes TEXT;
