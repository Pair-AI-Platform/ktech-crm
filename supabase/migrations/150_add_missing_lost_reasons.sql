-- Migration: Add missing lost reasons for military/security, financial, administrative, and personal categories
-- These categories exist in the type system but had no DB rows

-- Military / Security reasons
INSERT INTO lost_reasons (category, reason_en, reason_ar, is_active) VALUES
  ('military_security', 'Joined Military', 'التحق بالجيش', true),
  ('military_security', 'Joined Police', 'التحق بالشرطة', true),
  ('military_security', 'Joined Fire Force', 'التحق بالإطفاء', true),
  ('military_security', 'Joined National Guard', 'التحق بالحرس الوطني', true),
  ('military_security', 'Joined Coast Guard', 'التحق بخفر السواحل', true),
  ('military_security', 'Joined Kuwait Army', 'التحق بالجيش الكويتي', true),
  ('military_security', 'Military Scholarship', 'بعثة عسكرية', true)
ON CONFLICT DO NOTHING;

-- Financial reasons
INSERT INTO lost_reasons (category, reason_en, reason_ar, is_active) VALUES
  ('financial', 'Cannot Afford Tuition', 'لا يستطيع تحمل الرسوم', true),
  ('financial', 'Lost Scholarship', 'فقد المنحة الدراسية', true),
  ('financial', 'Payment Issues', 'مشاكل في الدفع', true),
  ('financial', 'Found Cheaper Option', 'وجد خيار أرخص', true)
ON CONFLICT DO NOTHING;

-- Administrative reasons
INSERT INTO lost_reasons (category, reason_en, reason_ar, is_active) VALUES
  ('administrative', 'Visa Issues', 'مشاكل في التأشيرة', true),
  ('administrative', 'Missing Documents', 'نقص في المستندات', true),
  ('administrative', 'Registration Deadline Missed', 'فات موعد التسجيل', true),
  ('administrative', 'Equivalency Issues', 'مشاكل في المعادلة', true)
ON CONFLICT DO NOTHING;

-- Additional Personal reasons
INSERT INTO lost_reasons (category, reason_en, reason_ar, is_active) VALUES
  ('personal', 'Traveling Abroad', 'السفر للخارج', true),
  ('personal', 'Health Issues', 'مشاكل صحية', true),
  ('personal', 'Family Reasons', 'أسباب عائلية', true),
  ('personal', 'Got Married', 'تزوج/تزوجت', true),
  ('personal', 'Not Interested Anymore', 'لم يعد مهتماً', true),
  ('personal', 'No Response', 'لا يوجد رد', true)
ON CONFLICT DO NOTHING;
