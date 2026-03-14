-- Add Harvard Secondary School (ثانوية هارفرد)
INSERT INTO schools (name_en, name_ar, school_type, gender, is_active)
SELECT 'Harvard Secondary School', 'ثانوية هارفرد', 'others', 'female', true
WHERE NOT EXISTS (
  SELECT 1 FROM schools WHERE name_ar = 'ثانوية هارفرد'
);
