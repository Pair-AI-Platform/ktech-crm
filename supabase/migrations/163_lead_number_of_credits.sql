-- Add optional number_of_credits column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS number_of_credits INTEGER;
