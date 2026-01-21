-- Migration: Add parent_name column to leads table
-- This migration adds the parent_name field and populates it with dummy data

-- =============================================
-- ADD PARENT_NAME TO LEADS
-- =============================================

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS parent_name VARCHAR(100);

-- Create array of dummy parent names
DO $$
DECLARE
  parent_names TEXT[] := ARRAY[
    'Mohammed Al-Rashid',
    'Ahmed Al-Sabah',
    'Fatima Al-Qattan',
    'Khalid Al-Mutairi',
    'Sara Al-Enezi',
    'Abdullah Al-Kandari',
    'Noura Al-Hajri',
    'Youssef Al-Shammari',
    'Maryam Al-Ajmi',
    'Hassan Al-Failakawi',
    'Aisha Al-Dosari',
    'Omar Al-Otaibi',
    'Layla Al-Azmi',
    'Rashed Al-Bader',
    'Huda Al-Saleh'
  ];
  lead_record RECORD;
  counter INT := 0;
BEGIN
  FOR lead_record IN SELECT id FROM leads WHERE parent_name IS NULL LOOP
    UPDATE leads
    SET parent_name = parent_names[(counter % 15) + 1]
    WHERE id = lead_record.id;
    counter := counter + 1;
  END LOOP;
END $$;

-- =============================================
-- ADD PARENT_NAME TO STUDENTS
-- =============================================

ALTER TABLE students
ADD COLUMN IF NOT EXISTS parent_name VARCHAR(100);

-- Populate parent_name for students from their linked lead
UPDATE students s
SET parent_name = l.parent_name
FROM leads l
WHERE s.lead_id = l.id
  AND s.parent_name IS NULL
  AND l.parent_name IS NOT NULL;

-- =============================================
-- ADD COMMENT FOR DOCUMENTATION
-- =============================================

COMMENT ON COLUMN leads.parent_name IS 'Parent/Guardian name for the lead';
COMMENT ON COLUMN students.parent_name IS 'Parent/Guardian name for the student';
