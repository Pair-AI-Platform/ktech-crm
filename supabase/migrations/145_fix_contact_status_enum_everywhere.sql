-- Fix contact_status: also convert deleted_leads column to TEXT
-- and drop the enum type so PostgREST doesn't cache it as enum

-- 1. Convert deleted_leads.contact_status from enum to TEXT
ALTER TABLE deleted_leads
  ALTER COLUMN contact_status TYPE TEXT USING contact_status::TEXT;

-- 2. Drop the enum type now that no columns reference it
DROP TYPE IF EXISTS contact_status;

-- 3. Notify PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
