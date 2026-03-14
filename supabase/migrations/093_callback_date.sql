-- Add callback_date to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS callback_date DATE;

-- Index for filtering callbacks by date
CREATE INDEX IF NOT EXISTS idx_leads_callback_date ON leads (callback_date) WHERE callback_date IS NOT NULL;
