-- Rename Al-Najat schools to include branch/area names
-- 1. النجاة بنين (Hawalli) → النجاة بنين حولي
-- 2. النجاة بنات (Ahmadi) → النجاة بنات المنقف
-- 3. NEW: النجاة بنين المقف (Ahmadi)
-- 4. NEW: النجاة بنات السالمية (Hawalli) — original was never inserted due to duplicate name_ar check

-- Rename boys Hawalli
UPDATE schools
SET name_en = 'Al-Najat Boys Hawally',
    name_ar = 'النجاة بنين حولي'
WHERE name_ar = 'النجاة بنين' AND governorate = 'hawalli';

-- Rename girls Ahmadi → Mangaf
UPDATE schools
SET name_en = 'Al-Najat Girls Mangaf',
    name_ar = 'النجاة بنات المنقف'
WHERE name_ar = 'النجاة بنات' AND governorate = 'ahmadi';

-- Add new: النجاة بنين المقف (Ahmadi)
INSERT INTO schools (name_en, name_ar, governorate, gender, school_type, is_active)
SELECT 'Al-Najat Boys Mangaf', 'النجاة بنين المقف', 'ahmadi'::governorate, 'male', 'gov', true
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'النجاة بنين المقف');

-- Add new: النجاة بنات السالمية (Hawalli) — was missing from DB
INSERT INTO schools (name_en, name_ar, governorate, gender, school_type, is_active)
SELECT 'Al-Najat Girls Salmiya', 'النجاة بنات السالمية', 'hawalli'::governorate, 'female', 'gov', true
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'النجاة بنات السالمية');
