-- Add missing discount columns to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS discount_type discount_type;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS discount_notes TEXT;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
