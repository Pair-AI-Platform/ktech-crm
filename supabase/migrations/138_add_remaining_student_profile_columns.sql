-- Add remaining missing student profile boolean columns to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_transfer_student boolean NOT NULL DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_special_needs boolean NOT NULL DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_diplomatic boolean NOT NULL DEFAULT false;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
