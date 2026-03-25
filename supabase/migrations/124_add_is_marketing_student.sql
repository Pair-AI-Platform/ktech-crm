-- Add is_marketing_student boolean field to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_marketing_student boolean NOT NULL DEFAULT false;
