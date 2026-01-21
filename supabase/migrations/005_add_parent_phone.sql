-- Migration: Add parent_phone column to leads and students tables
-- This migration adds the parent_phone field and populates it with
-- generated phone numbers (same first 2 digits as phone + 6 random digits)

-- =============================================
-- ADD PARENT_PHONE TO LEADS
-- =============================================

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(8);

-- Populate parent_phone for all existing leads
-- Uses the first 2 digits of the lead's phone + 6 random digits
UPDATE leads
SET parent_phone = CONCAT(
  LEFT(phone, 2),
  LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
)
WHERE parent_phone IS NULL AND phone IS NOT NULL;

-- Create index for parent_phone lookups
CREATE INDEX IF NOT EXISTS idx_leads_parent_phone ON leads(parent_phone);

-- =============================================
-- ADD PARENT_PHONE TO STUDENTS
-- =============================================

ALTER TABLE students
ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(8);

-- Populate parent_phone for students from their linked lead
UPDATE students s
SET parent_phone = l.parent_phone
FROM leads l
WHERE s.lead_id = l.id
  AND s.parent_phone IS NULL
  AND l.parent_phone IS NOT NULL;

-- For students without a linked lead, generate based on their own phone
UPDATE students
SET parent_phone = CONCAT(
  LEFT(phone, 2),
  LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
)
WHERE parent_phone IS NULL AND phone IS NOT NULL;

-- Create index for parent_phone lookups
CREATE INDEX IF NOT EXISTS idx_students_parent_phone ON students(parent_phone);

-- =============================================
-- ADD COMMENT FOR DOCUMENTATION
-- =============================================

COMMENT ON COLUMN leads.parent_phone IS 'Parent/Guardian phone number for the lead';
COMMENT ON COLUMN students.parent_phone IS 'Parent/Guardian phone number for the student';
