-- Add contact_count column to leads table
-- Tracks how many times a lead has been contacted (status changed, callback set, or appointment set)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_count INTEGER DEFAULT 0;
