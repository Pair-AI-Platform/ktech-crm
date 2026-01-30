-- Test leads to showcase green row feature (Submission stage with Ready substage)
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
  -- GREEN ROW: Ready substage leads
  ('سارة', 'العلي', '55001001', '301234567891', 'Kuwaiti', true, 'instagram', 'digital', 'submission', 'ready', 'puc', 85.5, 87.2, 88.0),
  ('أحمد', 'المطيري', '55001002', '302234567892', 'Kuwaiti', true, 'school_visit', 'events', 'submission', 'ready', 'puc', 90.0, 89.5, 91.0),
  ('نورة', 'الشمري', '55001003', '303234567893', 'Kuwaiti', true, 'current_student_referral', 'referrals', 'submission', 'ready', 'puc', 82.0, 84.5, 86.0),

  -- BLUE ROW: Pending substage lead (for comparison)
  ('خالد', 'الحربي', '55001004', '304234567894', 'Kuwaiti', true, 'walk_in', 'direct', 'submission', 'pending', 'puc', 78.0, 80.0, 82.0),

  -- BLUE ROW: Documents substage lead (for comparison)
  ('فاطمة', 'الكندري', '55001005', '305234567895', 'Kuwaiti', true, 'exhibitions', 'events', 'submission', 'documents', 'puc', 75.0, 77.5, 79.0),

  -- ORANGE ROW: Blocked substage lead (for comparison)
  ('يوسف', 'العنزي', '55001006', '306234567896', 'Kuwaiti', true, 'snapchat', 'digital', 'submission', 'blocked', 'puc', 83.0, 81.5, 84.0),

  -- RED ROW: Lost substage lead (for comparison)
  ('مريم', 'الهاجري', '55001007', '307234567897', 'Kuwaiti', true, 'facebook', 'digital', 'submission', 'lost', 'puc', 76.0, 78.0, 80.0)
) AS t(first_name, last_name, phone, civil_id, nationality, is_kuwaiti, source, source_category, pipeline_stage, submission_substage, funding_type, gpa_grade_10, gpa_grade_11, gpa_grade_12_expected)
WHERE NOT EXISTS (
  SELECT 1 FROM leads WHERE phone IN ('55001001', '55001002', '55001003', '55001004', '55001005', '55001006', '55001007')
);

-- Update ministry_blocked for the blocked lead
UPDATE leads SET ministry_blocked = true, ministry_block_reasons = ARRAY['ku']::text[] WHERE phone = '55001006';

-- Show result
SELECT first_name, last_name, phone, pipeline_stage, submission_substage, ministry_blocked
FROM leads
WHERE phone IN ('55001001', '55001002', '55001003', '55001004', '55001005', '55001006', '55001007')
ORDER BY phone;
