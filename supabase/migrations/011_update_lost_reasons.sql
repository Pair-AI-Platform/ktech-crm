-- Migration: Update lost reasons with more options and cleaner names
-- Remove "Chose" prefix from competitors and add more reasons

-- First, delete existing lost reasons that aren't referenced by any leads
DELETE FROM lost_reasons
WHERE id NOT IN (
  SELECT DISTINCT lost_reason_id FROM leads WHERE lost_reason_id IS NOT NULL
  UNION
  SELECT DISTINCT withdrawal_reason_id FROM students WHERE withdrawal_reason_id IS NOT NULL
);

-- Insert new lost reasons (ON CONFLICT DO NOTHING to avoid duplicates)
INSERT INTO lost_reasons (category, reason_en, reason_ar) VALUES
  -- Competitors (just university names, no "Chose" prefix)
  ('competitors', 'ACK', 'ACK'),
  ('competitors', 'ACM', 'ACM'),
  ('competitors', 'AOU', 'AOU'),
  ('competitors', 'AUK', 'AUK'),
  ('competitors', 'AUM', 'AUM'),
  ('competitors', 'BHCK', 'BHCK'),
  ('competitors', 'GUST', 'GUST'),
  ('competitors', 'KILAW', 'KILAW'),
  ('competitors', 'KU', 'جامعة الكويت'),
  ('competitors', 'PAAET', 'PAAET'),
  ('competitors', 'MOHE', 'MOHE'),
  ('competitors', 'Other', 'أخرى'),
  -- Military / Security
  ('military_security', 'Joined Military', 'التحق بالجيش'),
  ('military_security', 'Joined Police', 'التحق بالشرطة'),
  ('military_security', 'Joined Fire Force', 'التحق بالإطفاء'),
  ('military_security', 'Joined National Guard', 'التحق بالحرس الوطني'),
  -- Academic
  ('academic', 'Low GPA', 'معدل منخفض'),
  ('academic', 'High GPA', 'معدل عالي'),
  ('academic', 'Failed placement test', 'فشل في اختبار تحديد المستوى'),
  ('academic', 'Already enrolled elsewhere', 'مسجل في جامعة أخرى'),
  ('academic', 'Bachelors', 'بكالوريوس'),
  ('academic', 'Current Student', 'طالب حالي'),
  -- Financial
  ('financial', 'Cannot afford tuition', 'لا يستطيع تحمل الرسوم'),
  ('financial', 'PUC rejected', 'رفض PUC'),
  ('financial', 'Payment Issue', 'مشكلة في الدفع'),
  ('financial', 'Scholarship elsewhere', 'منحة في مكان آخر'),
  -- Personal
  ('personal', 'Traveling abroad', 'مسافر للخارج'),
  ('personal', 'Family reasons', 'أسباب عائلية'),
  ('personal', 'Health reasons', 'أسباب صحية'),
  ('personal', 'Not Interested', 'غير مهتم'),
  ('personal', 'Changed mind', 'غير رأيه'),
  -- Administrative
  ('administrative', 'No response', 'لا يوجد رد'),
  ('administrative', 'Wrong Number', 'رقم خاطئ'),
  ('administrative', 'Duplicate lead', 'سجل مكرر'),
  ('administrative', 'DON''T CALL', 'لا تتصل')
ON CONFLICT DO NOTHING;

-- Update any existing reasons with "Chose" prefix to remove it
UPDATE lost_reasons
SET reason_en = REPLACE(reason_en, 'Chose ', ''),
    reason_ar = REPLACE(reason_ar, 'Chose ', '')
WHERE reason_en LIKE 'Chose %';

-- Update any existing reasons with "Joined" prefix for military to standardize
UPDATE lost_reasons
SET reason_en = 'Joined Military', reason_ar = 'التحق بالجيش'
WHERE category = 'military_security' AND reason_en IN ('Military', 'Joined Military');

UPDATE lost_reasons
SET reason_en = 'Joined Police', reason_ar = 'التحق بالشرطة'
WHERE category = 'military_security' AND reason_en IN ('Police', 'Joined Police');

UPDATE lost_reasons
SET reason_en = 'Joined Fire Force', reason_ar = 'التحق بالإطفاء'
WHERE category = 'military_security' AND reason_en IN ('Fire Force', 'Joined Fire Force');
