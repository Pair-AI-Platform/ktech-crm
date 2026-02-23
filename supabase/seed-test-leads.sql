-- Test leads to showcase submission stages
-- Run this in Supabase SQL Editor to add test leads

-- First, get an agent to assign to (using the first available profile)
WITH agent AS (
  SELECT id FROM profiles WHERE role IN ('agent', 'admin') LIMIT 1
)

INSERT INTO leads (
  first_name,
  last_name,
  phone,
  civil_id,
  nationality,
  is_kuwaiti,
  source,
  source_category,
  pipeline_stage,
  submission_substage,
  funding_type,
  gpa_grade_10,
  gpa_grade_11,
  gpa_grade_12_expected,
  assigned_to,
  assigned_at,
  created_at,
  updated_at
)
SELECT
  first_name,
  last_name,
  phone,
  civil_id,
  nationality,
  is_kuwaiti,
  source,
  source_category,
  pipeline_stage,
  submission_substage,
  funding_type,
  gpa_grade_10,
  gpa_grade_11,
  gpa_grade_12_expected,
  agent.id,
  NOW(),
  NOW(),
  NOW()
FROM agent, (VALUES
  -- Documents stage leads
  ('سارة', 'العلي', '55001001', '301234567891', 'Kuwaiti', true, 'instagram', 'digital', 'applicant', 'documents', 'puc', 85.5, 87.2, 88.0),
  ('أحمد', 'المطيري', '55001002', '302234567892', 'Kuwaiti', true, 'school_visit', 'events', 'applicant', 'documents', 'puc', 90.0, 89.5, 91.0),
  ('نورة', 'الشمري', '55001003', '303234567893', 'Kuwaiti', true, 'current_student_referral', 'referrals', 'applicant', 'documents', 'puc', 82.0, 84.5, 86.0),

  -- Submissions stage leads
  ('خالد', 'الحربي', '55001004', '304234567894', 'Kuwaiti', true, 'walk_in', 'direct', 'applicant', 'submissions', 'puc', 78.0, 80.0, 82.0),
  ('فاطمة', 'الكندري', '55001005', '305234567895', 'Kuwaiti', true, 'exhibitions', 'events', 'applicant', 'submissions', 'puc', 75.0, 77.5, 79.0),

  -- Lost stage lead
  ('مريم', 'الهاجري', '55001007', '307234567897', 'Kuwaiti', true, 'facebook', 'digital', 'applicant', 'lost', 'puc', 76.0, 78.0, 80.0)
) AS t(first_name, last_name, phone, civil_id, nationality, is_kuwaiti, source, source_category, pipeline_stage, submission_substage, funding_type, gpa_grade_10, gpa_grade_11, gpa_grade_12_expected)
WHERE NOT EXISTS (
  SELECT 1 FROM leads WHERE phone IN ('55001001', '55001002', '55001003', '55001004', '55001005', '55001007')
);

-- Show result
SELECT first_name, last_name, phone, pipeline_stage, submission_substage
FROM leads
WHERE phone IN ('55001001', '55001002', '55001003', '55001004', '55001005', '55001007')
ORDER BY phone;
