-- Add location, principal_name, and phone_number to schools table
ALTER TABLE schools ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS principal_name TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add comment for documentation
COMMENT ON COLUMN schools.location IS 'Physical address or area of the school';
COMMENT ON COLUMN schools.principal_name IS 'Name of the school principal or manager';
COMMENT ON COLUMN schools.phone_number IS 'Contact phone number for the school';
