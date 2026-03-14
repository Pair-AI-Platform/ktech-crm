-- Seed PUC Document Configs (run this in Supabase SQL Editor)
INSERT INTO psp_document_configs (graduate_type, document_id, name, name_ar, required, sort_order, has_expiration, description) VALUES
  -- GOV
  ('GOV', 'passport',         'Passport',              'جواز السفر',              true,  1, true,  'Valid passport with at least 6 months validity'),
  ('GOV', 'civil_id',         'Civil ID',              'البطاقة المدنية',         true,  2, true,  'Valid Kuwait Civil ID (front and back)'),
  ('GOV', 'parent_civil_id',  'Parent Civil ID',       'البطاقة المدنية للوالد',   true,  3, true,  'Parent/Guardian Kuwait Civil ID'),
  ('GOV', 'hs_certificate',   'High School Certificate','شهادة الثانوية العامة',   true,  4, false, 'Original or certified true copy of high school certificate'),
  ('GOV', 'nationality',      'Proof of Nationality',  'شهادة الجنسية',           true,  5, false, 'Nationality certificate or proof of citizenship'),
  ('GOV', 'acceptance_letter', 'Acceptance Letter',     'خطاب القبول',             true,  6, false, 'Ktech acceptance letter'),
  ('GOV', 'payment_receipt',   'Payment Receipt',       'إيصال الدفع',             true,  7, false, 'Payment receipt'),
  ('GOV', 'declaration',       'Declaration',           'إقرار',                   false, 8, false, 'Signed declaration form'),
  ('GOV', 'extra_document_1',  'Extra Document 1',      'مستند إضافي 1',           false, 9, false, 'Optional additional document'),
  ('GOV', 'extra_document_2',  'Extra Document 2',      'مستند إضافي 2',           false, 10, false, 'Optional additional document'),

  -- US
  ('US', 'civil_id',         'Civil ID',                'البطاقة المدنية',         true,  1, true,  'Valid Kuwait Civil ID (front and back)'),
  ('US', 'parent_civil_id',  'Parent Civil ID',         'البطاقة المدنية للوالد',   true,  2, true,  'Parent/Guardian Kuwait Civil ID'),
  ('US', 'passport',         'Passport',                'جواز السفر',              true,  3, true,  'Valid passport with at least 6 months validity'),
  ('US', 'nationality',      'Proof of Nationality',    'شهادة الجنسية',           true,  4, false, 'Nationality certificate or proof of citizenship'),
  ('US', 'transcript_moh',   'Original HS Transcript',  'كشف الدرجات الأصلي للثانوية', true, 5, false, 'Official high school transcript from grade 9-12'),
  ('US', 'sequence',         'Sequence',                'التسلسل',                 true,  6, false, 'Academic sequence document'),
  ('US', 'equivalency',      'Equivalency',             'المعادلة',                true,  7, false, 'Private education sector equivalency certificate'),
  ('US', 'acceptance_letter', 'Acceptance Letter',      'خطاب القبول',             true,  8, false, 'Ktech acceptance letter'),
  ('US', 'payment_receipt',   'Payment Receipt',        'إيصال الدفع',             true,  9, false, 'Payment receipt'),
  ('US', 'declaration',       'Declaration',            'إقرار',                   false, 10, false, 'Signed declaration form'),
  ('US', 'extra_document_1',  'Extra Document 1',       'مستند إضافي 1',           false, 11, false, 'Optional additional document'),
  ('US', 'extra_document_2',  'Extra Document 2',       'مستند إضافي 2',           false, 12, false, 'Optional additional document'),

  -- UK
  ('UK', 'civil_id',         'Civil ID',                'البطاقة المدنية',         true,  1, true,  'Valid Kuwait Civil ID (front and back)'),
  ('UK', 'parent_civil_id',  'Parent Civil ID',         'البطاقة المدنية للوالد',   true,  2, true,  'Parent/Guardian Kuwait Civil ID'),
  ('UK', 'gcse',             'GCSE/IGCSE Certificates', 'شهادات GCSE/IGCSE',       true,  3, false, 'GCSE or IGCSE exam certificates'),
  ('UK', 'equivalency',      'Equivalency',             'المعادلة',                true,  4, false, 'Private education sector equivalency certificate'),
  ('UK', 'passport',         'Passport',                'جواز السفر',              true,  5, true,  'Valid passport with at least 6 months validity'),
  ('UK', 'nationality',      'Proof of Nationality',    'شهادة الجنسية',           true,  6, false, 'Nationality certificate or proof of citizenship'),
  ('UK', 'acceptance_letter', 'Acceptance Letter',      'خطاب القبول',             true,  7, false, 'Ktech acceptance letter'),
  ('UK', 'payment_receipt',   'Payment Receipt',        'إيصال الدفع',             true,  8, false, 'Payment receipt'),
  ('UK', 'declaration',       'Declaration',            'إقرار',                   false, 9, false, 'Signed declaration form'),
  ('UK', 'extra_document_1',  'Extra Document 1',       'مستند إضافي 1',           false, 10, false, 'Optional additional document'),
  ('UK', 'extra_document_2',  'Extra Document 2',       'مستند إضافي 2',           false, 11, false, 'Optional additional document'),

  -- KSA
  ('KSA', 'civil_id',         'Civil ID',              'البطاقة المدنية',         true,  1, true,  'Valid Kuwait Civil ID (front and back)'),
  ('KSA', 'parent_civil_id',  'Parent Civil ID',       'البطاقة المدنية للوالد',   true,  2, true,  'Parent/Guardian Kuwait Civil ID'),
  ('KSA', 'shahada',          'Original HS Certificate','الشهادة',                 true,  3, false, 'Official high school certificate (Shahada)'),
  ('KSA', 'qiyas',            'Qiyas',                 'قياس',                    true,  4, false, 'Qiyas standardized test result certificate'),
  ('KSA', 'passport',         'Passport',              'جواز السفر',              true,  5, true,  'Valid passport with at least 6 months validity'),
  ('KSA', 'nationality',      'Proof of Nationality',  'شهادة الجنسية',           true,  6, false, 'Nationality certificate or proof of citizenship'),
  ('KSA', 'acceptance_letter', 'Acceptance Letter',    'خطاب القبول',             true,  7, false, 'Ktech acceptance letter'),
  ('KSA', 'payment_receipt',   'Payment Receipt',      'إيصال الدفع',             true,  8, false, 'Payment receipt'),
  ('KSA', 'declaration',       'Declaration',          'إقرار',                   false, 9, false, 'Signed declaration form'),
  ('KSA', 'extra_document_1',  'Extra Document 1',     'مستند إضافي 1',           false, 10, false, 'Optional additional document'),
  ('KSA', 'extra_document_2',  'Extra Document 2',     'مستند إضافي 2',           false, 11, false, 'Optional additional document'),

  -- OTHER
  ('OTHER', 'civil_id',         'Civil ID',              'البطاقة المدنية',         true,  1, true,  'Valid Kuwait Civil ID (front and back)'),
  ('OTHER', 'parent_civil_id',  'Parent Civil ID',       'البطاقة المدنية للوالد',   true,  2, true,  'Parent/Guardian Kuwait Civil ID'),
  ('OTHER', 'hs_certificate',   'High School Certificate','شهادة الثانوية العامة',   true,  3, false, 'Original or certified true copy of high school certificate'),
  ('OTHER', 'equivalency',      'Equivalency',           'المعادلة',                true,  4, false, 'Private education sector equivalency certificate'),
  ('OTHER', 'passport',         'Passport',              'جواز السفر',              true,  5, true,  'Valid passport with at least 6 months validity'),
  ('OTHER', 'nationality',      'Proof of Nationality',  'شهادة الجنسية',           true,  6, false, 'Nationality certificate or proof of citizenship'),
  ('OTHER', 'acceptance_letter', 'Acceptance Letter',    'خطاب القبول',             true,  7, false, 'Ktech acceptance letter'),
  ('OTHER', 'payment_receipt',   'Payment Receipt',      'إيصال الدفع',             true,  8, false, 'Payment receipt'),
  ('OTHER', 'declaration',       'Declaration',          'إقرار',                   false, 9, false, 'Signed declaration form'),
  ('OTHER', 'extra_document_1',  'Extra Document 1',     'مستند إضافي 1',           false, 10, false, 'Optional additional document'),
  ('OTHER', 'extra_document_2',  'Extra Document 2',     'مستند إضافي 2',           false, 11, false, 'Optional additional document')
ON CONFLICT (graduate_type, document_id) DO NOTHING;
