-- Add full_name_ar column to leads table for optional Arabic full name
ALTER TABLE leads ADD COLUMN IF NOT EXISTS full_name_ar VARCHAR(255);
