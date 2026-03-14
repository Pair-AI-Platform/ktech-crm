-- Remove primary and middle schools — CRM only tracks secondary (high) school students
-- Skips any schools that are referenced by leads (FK safety)
DELETE FROM schools
WHERE id NOT IN (SELECT DISTINCT school_id FROM leads WHERE school_id IS NOT NULL)
  AND (
    name_en ILIKE '%Primary%'
    OR name_en ILIKE '%Middle%'
    OR name_en ILIKE '%Elementary%'
    OR name_ar LIKE '% ب بنين'
    OR name_ar LIKE '% ب بنات'
    OR name_ar LIKE '% م بنين'
    OR name_ar LIKE '% م بنات'
    OR name_ar LIKE '%ابتدائي%'
    OR name_ar LIKE '%متوسط%'
  );
