-- Add discount_percentage column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) CHECK (discount_percentage >= 0 AND discount_percentage <= 100);
