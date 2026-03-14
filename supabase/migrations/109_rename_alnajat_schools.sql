-- Rename Al-Najat schools to include branch/area names
-- 1. النجاة بنين (Hawalli) → النجاة بنين حولي
-- 2. النجاة بنات (Hawalli) → النجاة بنات السالمية
-- 3. النجاة بنات (Ahmadi) → النجاة بنات المنقف
-- 4. NEW: النجاة بنين المقف (Ahmadi)

-- Rename boys Hawalli
UPDATE schools
SET name_en = 'Al-Najat Boys Hawally',
    name_ar = 'النجاة بنين حولي'
WHERE name_ar = 'النجاة بنين' AND governorate = 'hawalli';

-- Rename girls Hawalli → Salmiya
UPDATE schools
SET name_en = 'Al-Najat Girls Salmiya',
    name_ar = 'النجاة بنات السالمية'
WHERE name_ar = 'النجاة بنات' AND governorate = 'hawalli';

-- Rename girls Ahmadi → Mangaf
UPDATE schools
SET name_en = 'Al-Najat Girls Mangaf',
    name_ar = 'النجاة بنات المنقف'
WHERE name_ar = 'النجاة بنات' AND governorate = 'ahmadi';

-- Add new: النجاة بنين المقف (Ahmadi)
INSERT INTO schools (name_en, name_ar, governorate, gender, school_type, is_active)
SELECT 'Al-Najat Boys Mangaf', 'النجاة بنين المقف', 'ahmadi'::governorate, 'male', 'gov', true
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'النجاة بنين المقف');

-- No need to update leads — they reference school_id (UUID), which stays the same
