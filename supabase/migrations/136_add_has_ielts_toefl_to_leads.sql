-- Add has_ielts_toefl column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS has_ielts_toefl BOOLEAN DEFAULT false;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
