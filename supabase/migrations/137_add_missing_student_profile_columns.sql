-- Add missing student profile boolean columns to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_athlete boolean NOT NULL DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_married boolean NOT NULL DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_employee boolean NOT NULL DEFAULT false;

-- Also add to deleted_leads for soft delete consistency
ALTER TABLE deleted_leads ADD COLUMN IF NOT EXISTS is_athlete boolean DEFAULT false;
ALTER TABLE deleted_leads ADD COLUMN IF NOT EXISTS is_married boolean DEFAULT false;
ALTER TABLE deleted_leads ADD COLUMN IF NOT EXISTS is_employee boolean DEFAULT false;
ALTER TABLE deleted_leads ADD COLUMN IF NOT EXISTS is_marketing_student boolean DEFAULT false;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
