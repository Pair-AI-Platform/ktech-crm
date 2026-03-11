-- Add school_type column to schools table
-- Types: gov (Kuwait Government), us (American Curriculum), uk (British Curriculum), ksa (Saudi Arabian Curriculum), others (Other Curriculum)

ALTER TABLE schools
ADD COLUMN school_type VARCHAR(10) CHECK (school_type IN ('gov', 'us', 'uk', 'ksa', 'others'));

-- Default all existing schools to 'gov' (Kuwait Government) since they were imported from MOE data
UPDATE schools SET school_type = 'gov' WHERE school_type IS NULL;
