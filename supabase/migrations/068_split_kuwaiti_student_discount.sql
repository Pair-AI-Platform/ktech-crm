-- Split kuwaiti_student discount type into new_certificate (20%) and old_certificate (25%)

-- Add new enum values
ALTER TYPE discount_type ADD VALUE IF NOT EXISTS 'kuwaiti_new_certificate';
ALTER TYPE discount_type ADD VALUE IF NOT EXISTS 'kuwaiti_old_certificate';

-- Migrate existing kuwaiti_student records to kuwaiti_new_certificate (default)
UPDATE leads
SET discount_type = 'kuwaiti_new_certificate'
WHERE discount_type = 'kuwaiti_student';
