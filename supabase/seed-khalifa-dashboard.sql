-- =============================================
-- SEED: Dashboard data for Khalifa (agent)
-- Populates leads, appointments, and sources
-- =============================================

DO $$
DECLARE
  khalifa_id UUID := '52bb7f9e-a419-4336-bf1f-53d56eb2f010';
  semester_id UUID := '577cfbf4-01a4-466f-901f-f39875b8feb5'; -- Spring 2026
  lead_id UUID;
  slot_id UUID;
  school_id UUID;
  i INT;

  -- Lead data arrays
  first_names TEXT[] := ARRAY[
    'Ahmad', 'Mohammed', 'Khalid', 'Faisal', 'Omar', 'Salem', 'Youssef', 'Hassan',
    'Ali', 'Nasser', 'Bader', 'Fahad', 'Hamad', 'Saleh', 'Abdulrahman',
    'Sara', 'Noura', 'Haya', 'Dana', 'Lulwa', 'Dalal', 'Reem', 'Aseel',
    'Sheikha', 'Latifa', 'Maha', 'Amal', 'Hessa', 'Munira', 'Bashaer',
    'Ghadeer', 'Janan', 'Raghad', 'Shahd', 'Waad', 'Deema', 'Lamia',
    'Aisha', 'Ruqaya', 'Hind', 'Nouf', 'Mashael', 'Alanoud', 'Budoor',
    'Kholoud', 'Yasmin', 'Jawaher', 'Taif', 'Salma', 'Razan'
  ];
  last_names TEXT[] := ARRAY[
    'Al-Sabah', 'Al-Rashidi', 'Al-Ahmad', 'Al-Mutairi', 'Al-Shammari',
    'Al-Anzi', 'Al-Harbi', 'Al-Kandari', 'Al-Failakawi', 'Al-Qattan',
    'Al-Saeed', 'Al-Hajri', 'Al-Dossari', 'Al-Azmi', 'Al-Otaibi',
    'Al-Fadhli', 'Al-Marri', 'Al-Khalidi', 'Al-Ajmi', 'Al-Dhafiri'
  ];
  sources TEXT[] := ARRAY[
    'walk_in', 'call_center', 'whatsapp', 'email', 'school_visit',
    'expo', 'website_form', 'facebook', 'instagram', 'tiktok',
    'current_student_referral', 'staff_referral', 'friend_referral',
    'old_contacts', 'gpa_lists'
  ];
  source_cats TEXT[] := ARRAY[
    'direct', 'direct', 'direct', 'direct', 'events',
    'events', 'marketing', 'marketing', 'marketing', 'marketing',
    'referrals', 'referrals', 'referrals', 'outreach', 'outreach'
  ];

BEGIN
  -- Get a random school
  SELECT id INTO school_id FROM schools WHERE is_active = true LIMIT 1;

  -- =============================================
  -- 1. SELF-FUNDED LEADS (25 leads across pipeline)
  -- =============================================

  -- 5 NEW leads (self_funded)
  FOR i IN 1..5 LOOP
    INSERT INTO leads (
      first_name, last_name, phone, civil_id, email,
      pipeline_stage, contact_status, funding_type, source, source_category,
      assigned_to, assigned_at, semester_id, school_id,
      nationality, is_kuwaiti, grade_level, date_of_birth,
      created_at, updated_at
    ) VALUES (
      first_names[i], last_names[i],
      '9' || (5001000 + i)::TEXT,
      '2' || lpad((80000000 + i)::TEXT, 11, '0'),
      lower(first_names[i]) || '.' || lower(replace(last_names[i], '-', '')) || '@gmail.com',
      'new', 'uncontacted', 'self_funded',
      sources[((i - 1) % 15) + 1], source_cats[((i - 1) % 15) + 1],
      khalifa_id, NOW() - interval '3 days', semester_id, school_id,
      'Kuwaiti', true, '12th',
      '2007-' || lpad(((i % 12) + 1)::TEXT, 2, '0') || '-' || lpad(((i % 28) + 1)::TEXT, 2, '0'),
      NOW() - interval '3 days' + (i || ' hours')::interval,
      NOW() - interval '3 days' + (i || ' hours')::interval
    );
  END LOOP;

  -- 6 CONTACTED leads (self_funded) - various statuses
  FOR i IN 1..6 LOOP
    INSERT INTO leads (
      first_name, last_name, phone, civil_id, email,
      pipeline_stage, contact_status, status, funding_type, source, source_category,
      assigned_to, assigned_at, semester_id, school_id,
      nationality, is_kuwaiti, grade_level,
      contact_count, first_contacted_at, last_contacted_at,
      callback_date, priority, date_of_birth,
      created_at, updated_at
    ) VALUES (
      first_names[5 + i], last_names[((5 + i - 1) % 20) + 1],
      '9' || (5002000 + i)::TEXT,
      '2' || lpad((80001000 + i)::TEXT, 11, '0'),
      lower(first_names[5 + i]) || '.sf@gmail.com',
      'contacted',
      CASE
        WHEN i = 1 THEN 'interested'
        WHEN i = 2 THEN 'callback'
        WHEN i = 3 THEN 'will_see'
        WHEN i = 4 THEN 'no_answer'
        WHEN i = 5 THEN 'interested'
        ELSE 'interested'
      END,
      NULL, 'self_funded',
      sources[((5 + i - 1) % 15) + 1], source_cats[((5 + i - 1) % 15) + 1],
      khalifa_id, NOW() - interval '7 days', semester_id, school_id,
      'Kuwaiti', true, '12th',
      i, NOW() - interval '5 days', NOW() - interval '2 days',
      CASE WHEN i = 2 THEN CURRENT_DATE ELSE NULL END,
      CASE WHEN i = 6 THEN 'critical' WHEN i = 5 THEN 'important' ELSE 'normal' END,
      CASE WHEN i = 1 THEN CURRENT_DATE ELSE '2007-06-15' END,
      NOW() - interval '10 days',
      NOW() - interval '2 days'
    );
  END LOOP;

  -- 3 TEST stage leads (self_funded)
  FOR i IN 1..3 LOOP
    INSERT INTO leads (
      first_name, last_name, phone, civil_id, email,
      pipeline_stage, contact_status, funding_type, source, source_category,
      assigned_to, assigned_at, semester_id, school_id,
      nationality, is_kuwaiti, grade_level,
      contact_count, first_contacted_at, last_contacted_at,
      created_at, updated_at
    ) VALUES (
      first_names[11 + i], last_names[((11 + i - 1) % 20) + 1],
      '9' || (5003000 + i)::TEXT,
      '2' || lpad((80002000 + i)::TEXT, 11, '0'),
      lower(first_names[11 + i]) || '.test@gmail.com',
      'test', 'interested', 'self_funded',
      sources[((i + 2) % 15) + 1], source_cats[((i + 2) % 15) + 1],
      khalifa_id, NOW() - interval '14 days', semester_id, school_id,
      'Kuwaiti', true, '12th',
      3, NOW() - interval '12 days', NOW() - interval '4 days',
      NOW() - interval '14 days',
      NOW() - interval '4 days'
    );
  END LOOP;

  -- 4 APPLICATION stage leads (self_funded)
  FOR i IN 1..4 LOOP
    INSERT INTO leads (
      first_name, last_name, phone, civil_id, email,
      pipeline_stage, contact_status, funding_type, source, source_category,
      assigned_to, assigned_at, semester_id, school_id,
      nationality, is_kuwaiti, grade_level,
      contact_count, first_contacted_at, last_contacted_at,
      created_at, updated_at
    ) VALUES (
      first_names[14 + i], last_names[((14 + i - 1) % 20) + 1],
      '9' || (5004000 + i)::TEXT,
      '2' || lpad((80003000 + i)::TEXT, 11, '0'),
      lower(first_names[14 + i]) || '.app@gmail.com',
      'application', 'interested', 'self_funded',
      sources[((i + 5) % 15) + 1], source_cats[((i + 5) % 15) + 1],
      khalifa_id, NOW() - interval '20 days', semester_id, school_id,
      'Kuwaiti', true, '12th',
      5, NOW() - interval '18 days', NOW() - interval '3 days',
      NOW() - interval '21 days',
      NOW() - interval '3 days'
    );
  END LOOP;

  -- 3 APPLICANT stage (self_funded)
  FOR i IN 1..3 LOOP
    INSERT INTO leads (
      first_name, last_name, phone, civil_id, email,
      pipeline_stage, contact_status, funding_type, source, source_category,
      assigned_to, assigned_at, semester_id, school_id,
      nationality, is_kuwaiti, grade_level,
      contact_count, first_contacted_at, last_contacted_at,
      created_at, updated_at
    ) VALUES (
      first_names[18 + i], last_names[((18 + i - 1) % 20) + 1],
      '9' || (5005000 + i)::TEXT,
      '2' || lpad((80004000 + i)::TEXT, 11, '0'),
      lower(first_names[18 + i]) || '.applicant@gmail.com',
      'applicant', 'interested', 'self_funded',
      sources[((i + 7) % 15) + 1], source_cats[((i + 7) % 15) + 1],
      khalifa_id, NOW() - interval '25 days', semester_id, school_id,
      'Kuwaiti', true, '12th',
      6, NOW() - interval '23 days', NOW() - interval '2 days',
      NOW() - interval '28 days',
      NOW() - interval '2 days'
    );
  END LOOP;

  -- 4 ENROLLED (self_funded)
  FOR i IN 1..4 LOOP
    INSERT INTO leads (
      first_name, last_name, phone, civil_id, email,
      pipeline_stage, contact_status, funding_type, source, source_category,
      assigned_to, assigned_at, semester_id, school_id,
      nationality, is_kuwaiti, grade_level,
      contact_count, first_contacted_at, last_contacted_at,
      created_at, updated_at
    ) VALUES (
      first_names[21 + i], last_names[((i) % 20) + 1],
      '9' || (5006000 + i)::TEXT,
      '2' || lpad((80005000 + i)::TEXT, 11, '0'),
      lower(first_names[21 + i]) || '.enrolled@gmail.com',
      'enrolled', 'interested', 'self_funded',
      sources[((i + 9) % 15) + 1], source_cats[((i + 9) % 15) + 1],
      khalifa_id, NOW() - interval '30 days', semester_id, school_id,
      'Kuwaiti', true, '12th',
      8, NOW() - interval '28 days', NOW() - interval '1 day',
      NOW() - interval '35 days',
      NOW() - interval '1 day'
    );
  END LOOP;

  -- =============================================
  -- 2. PUC LEADS (25 leads across pipeline)
  -- =============================================

  -- 4 NEW (puc)
  FOR i IN 1..4 LOOP
    INSERT INTO leads (
      first_name, last_name, phone, civil_id, email,
      pipeline_stage, contact_status, funding_type, source, source_category,
      assigned_to, assigned_at, semester_id, school_id,
      nationality, is_kuwaiti, grade_level,
      created_at, updated_at
    ) VALUES (
      first_names[25 + i], last_names[((i + 3) % 20) + 1],
      '9' || (6001000 + i)::TEXT,
      '2' || lpad((90000000 + i)::TEXT, 11, '0'),
      lower(first_names[25 + i]) || '.puc@gmail.com',
      'new', 'uncontacted', 'puc',
      sources[((i + 3) % 15) + 1], source_cats[((i + 3) % 15) + 1],
      khalifa_id, NOW() - interval '2 days', semester_id, school_id,
      'Kuwaiti', true, '12th',
      NOW() - interval '2 days',
      NOW() - interval '2 days'
    );
  END LOOP;

  -- 5 CONTACTED (puc)
  FOR i IN 1..5 LOOP
    INSERT INTO leads (
      first_name, last_name, phone, civil_id, email,
      pipeline_stage, contact_status, funding_type, source, source_category,
      assigned_to, assigned_at, semester_id, school_id,
      nationality, is_kuwaiti, grade_level,
      contact_count, first_contacted_at, last_contacted_at,
      priority, date_of_birth,
      created_at, updated_at
    ) VALUES (
      first_names[29 + i], last_names[((i + 6) % 20) + 1],
      '9' || (6002000 + i)::TEXT,
      '2' || lpad((90001000 + i)::TEXT, 11, '0'),
      lower(first_names[29 + i]) || '.pucc@gmail.com',
      'contacted',
      CASE
        WHEN i = 1 THEN 'interested'
        WHEN i = 2 THEN 'callback'
        WHEN i = 3 THEN 'no_answer'
        WHEN i = 4 THEN 'will_see'
        ELSE 'interested'
      END,
      'puc',
      sources[((i + 6) % 15) + 1], source_cats[((i + 6) % 15) + 1],
      khalifa_id, NOW() - interval '8 days', semester_id, school_id,
      'Kuwaiti', true, '12th',
      i + 1, NOW() - interval '6 days', NOW() - interval '1 day',
      CASE WHEN i = 5 THEN 'important' ELSE 'normal' END,
      CASE WHEN i = 2 THEN CURRENT_DATE + 1 ELSE '2007-09-20' END,
      NOW() - interval '10 days',
      NOW() - interval '1 day'
    );
  END LOOP;

  -- 3 VISIT (puc)
  FOR i IN 1..3 LOOP
    INSERT INTO leads (
      first_name, last_name, phone, civil_id, email,
      pipeline_stage, contact_status, funding_type, source, source_category,
      assigned_to, assigned_at, semester_id, school_id,
      nationality, is_kuwaiti, grade_level,
      contact_count, first_contacted_at, last_contacted_at,
      created_at, updated_at
    ) VALUES (
      first_names[34 + i], last_names[((i + 10) % 20) + 1],
      '9' || (6003000 + i)::TEXT,
      '2' || lpad((90002000 + i)::TEXT, 11, '0'),
      lower(first_names[34 + i]) || '.pucv@gmail.com',
      'visit', 'interested', 'puc',
      sources[((i + 8) % 15) + 1], source_cats[((i + 8) % 15) + 1],
      khalifa_id, NOW() - interval '12 days', semester_id, school_id,
      'Kuwaiti', true, '12th',
      3, NOW() - interval '10 days', NOW() - interval '3 days',
      NOW() - interval '15 days',
      NOW() - interval '3 days'
    );
  END LOOP;

  -- 3 TEST (puc)
  FOR i IN 1..3 LOOP
    INSERT INTO leads (
      first_name, last_name, phone, civil_id, email,
      pipeline_stage, contact_status, funding_type, source, source_category,
      assigned_to, assigned_at, semester_id, school_id,
      nationality, is_kuwaiti, grade_level,
      contact_count, first_contacted_at, last_contacted_at,
      created_at, updated_at
    ) VALUES (
      first_names[37 + i], last_names[((i + 13) % 20) + 1],
      '9' || (6004000 + i)::TEXT,
      '2' || lpad((90003000 + i)::TEXT, 11, '0'),
      lower(first_names[37 + i]) || '.puct@gmail.com',
      'test', 'interested', 'puc',
      sources[((i + 10) % 15) + 1], source_cats[((i + 10) % 15) + 1],
      khalifa_id, NOW() - interval '16 days', semester_id, school_id,
      'Kuwaiti', true, '12th',
      4, NOW() - interval '14 days', NOW() - interval '5 days',
      NOW() - interval '18 days',
      NOW() - interval '5 days'
    );
  END LOOP;

  -- 2 APPLICATION (puc)
  FOR i IN 1..2 LOOP
    INSERT INTO leads (
      first_name, last_name, phone, civil_id, email,
      pipeline_stage, contact_status, funding_type, source, source_category,
      assigned_to, assigned_at, semester_id, school_id,
      nationality, is_kuwaiti, grade_level,
      contact_count, first_contacted_at, last_contacted_at,
      created_at, updated_at
    ) VALUES (
      first_names[40 + i], last_names[((i + 15) % 20) + 1],
      '9' || (6005000 + i)::TEXT,
      '2' || lpad((90004000 + i)::TEXT, 11, '0'),
      lower(first_names[40 + i]) || '.puca@gmail.com',
      'application', 'interested', 'puc',
      sources[((i + 12) % 15) + 1], source_cats[((i + 12) % 15) + 1],
      khalifa_id, NOW() - interval '20 days', semester_id, school_id,
      'Kuwaiti', true, '12th',
      5, NOW() - interval '18 days', NOW() - interval '2 days',
      NOW() - interval '22 days',
      NOW() - interval '2 days'
    );
  END LOOP;

  -- 2 PUC_DOCUMENT_SUBMISSION (puc)
  FOR i IN 1..2 LOOP
    INSERT INTO leads (
      first_name, last_name, phone, civil_id, email,
      pipeline_stage, contact_status, funding_type, source, source_category,
      assigned_to, assigned_at, semester_id, school_id,
      nationality, is_kuwaiti, grade_level,
      contact_count, first_contacted_at, last_contacted_at,
      created_at, updated_at
    ) VALUES (
      first_names[42 + i], last_names[((i + 17) % 20) + 1],
      '9' || (6006000 + i)::TEXT,
      '2' || lpad((90005000 + i)::TEXT, 11, '0'),
      lower(first_names[42 + i]) || '.pucd@gmail.com',
      'puc_document_submission', 'interested', 'puc',
      sources[((i) % 15) + 1], source_cats[((i) % 15) + 1],
      khalifa_id, NOW() - interval '25 days', semester_id, school_id,
      'Kuwaiti', true, '12th',
      6, NOW() - interval '22 days', NOW() - interval '1 day',
      NOW() - interval '28 days',
      NOW() - interval '1 day'
    );
  END LOOP;

  -- 2 PUC_APPLICATION_SUBMISSION (puc)
  FOR i IN 1..2 LOOP
    INSERT INTO leads (
      first_name, last_name, phone, civil_id, email,
      pipeline_stage, contact_status, funding_type, source, source_category,
      assigned_to, assigned_at, semester_id, school_id,
      nationality, is_kuwaiti, grade_level,
      contact_count, first_contacted_at, last_contacted_at,
      created_at, updated_at
    ) VALUES (
      first_names[44 + i], last_names[((i + 1) % 20) + 1],
      '9' || (6007000 + i)::TEXT,
      '2' || lpad((90006000 + i)::TEXT, 11, '0'),
      lower(first_names[44 + i]) || '.pucas@gmail.com',
      'puc_application_submission', 'interested', 'puc',
      sources[((i + 4) % 15) + 1], source_cats[((i + 4) % 15) + 1],
      khalifa_id, NOW() - interval '28 days', semester_id, school_id,
      'Kuwaiti', true, '12th',
      7, NOW() - interval '26 days', NOW() - interval '1 day',
      NOW() - interval '30 days',
      NOW() - interval '1 day'
    );
  END LOOP;

  -- 2 APPLICANT (puc)
  FOR i IN 1..2 LOOP
    INSERT INTO leads (
      first_name, last_name, phone, civil_id, email,
      pipeline_stage, contact_status, funding_type, source, source_category,
      assigned_to, assigned_at, semester_id, school_id,
      nationality, is_kuwaiti, grade_level,
      contact_count, first_contacted_at, last_contacted_at,
      created_at, updated_at
    ) VALUES (
      first_names[46 + i], last_names[((i + 5) % 20) + 1],
      '9' || (6008000 + i)::TEXT,
      '2' || lpad((90007000 + i)::TEXT, 11, '0'),
      lower(first_names[46 + i]) || '.pucap@gmail.com',
      'applicant', 'interested', 'puc',
      sources[((i + 7) % 15) + 1], source_cats[((i + 7) % 15) + 1],
      khalifa_id, NOW() - interval '30 days', semester_id, school_id,
      'Kuwaiti', true, '12th',
      8, NOW() - interval '28 days', NOW() - interval '1 day',
      NOW() - interval '35 days',
      NOW() - interval '1 day'
    );
  END LOOP;

  -- 2 ENROLLED (puc)
  FOR i IN 1..2 LOOP
    INSERT INTO leads (
      first_name, last_name, phone, civil_id, email,
      pipeline_stage, contact_status, funding_type, source, source_category,
      assigned_to, assigned_at, semester_id, school_id,
      nationality, is_kuwaiti, grade_level,
      contact_count, first_contacted_at, last_contacted_at,
      created_at, updated_at
    ) VALUES (
      first_names[48 + i], last_names[((i + 8) % 20) + 1],
      '9' || (6009000 + i)::TEXT,
      '2' || lpad((90008000 + i)::TEXT, 11, '0'),
      lower(first_names[48 + i]) || '.puce@gmail.com',
      'enrolled', 'interested', 'puc',
      sources[((i + 11) % 15) + 1], source_cats[((i + 11) % 15) + 1],
      khalifa_id, NOW() - interval '35 days', semester_id, school_id,
      'Kuwaiti', true, '12th',
      10, NOW() - interval '32 days', NOW() - interval '1 day',
      NOW() - interval '40 days',
      NOW() - interval '1 day'
    );
  END LOOP;

  -- =============================================
  -- 3. LOST LEADS (for realistic conversion rates)
  -- =============================================
  FOR i IN 1..5 LOOP
    INSERT INTO leads (
      first_name, last_name, phone, civil_id, email,
      pipeline_stage, contact_status, funding_type, source, source_category,
      assigned_to, assigned_at, semester_id, school_id,
      nationality, is_kuwaiti, grade_level,
      contact_count, first_contacted_at, last_contacted_at,
      lost_at_stage,
      created_at, updated_at
    ) VALUES (
      'Lost' || i, last_names[i],
      '9' || (7001000 + i)::TEXT,
      '2' || lpad((80010000 + i)::TEXT, 11, '0'),
      'lost' || i || '@gmail.com',
      'lost',
      CASE WHEN i <= 3 THEN 'not_interested' ELSE 'no_answer' END,
      CASE WHEN i <= 3 THEN 'self_funded' ELSE 'puc' END,
      sources[((i + 1) % 15) + 1], source_cats[((i + 1) % 15) + 1],
      khalifa_id, NOW() - interval '15 days', semester_id, school_id,
      'Kuwaiti', true, '12th',
      2, NOW() - interval '13 days', NOW() - interval '8 days',
      CASE WHEN i <= 2 THEN 'contacted' WHEN i = 3 THEN 'test' ELSE 'contacted' END,
      NOW() - interval '20 days',
      NOW() - interval '8 days'
    );
  END LOOP;

  -- =============================================
  -- 4. APPOINTMENTS FOR TODAY
  -- =============================================

  -- Create appointment slots for today
  INSERT INTO appointment_slots (appointment_type, date, start_time, end_time, capacity, booked_count, is_active, created_by)
  VALUES
    ('new_appointment', CURRENT_DATE, '09:00', '10:00', 5, 2, true, khalifa_id),
    ('new_appointment', CURRENT_DATE, '10:00', '11:00', 5, 1, true, khalifa_id),
    ('sf_appointment', CURRENT_DATE, '11:00', '12:00', 5, 1, true, khalifa_id),
    ('puc_documents', CURRENT_DATE, '13:00', '14:00', 5, 1, true, khalifa_id),
    ('retest', CURRENT_DATE, '14:00', '15:00', 5, 1, true, khalifa_id);

  -- Get lead IDs for appointments (contacted leads)
  -- Appointment 1: scheduled (upcoming)
  SELECT id INTO lead_id FROM leads WHERE assigned_to = khalifa_id AND pipeline_stage = 'contacted' LIMIT 1;
  SELECT id INTO slot_id FROM appointment_slots WHERE date = CURRENT_DATE AND start_time = '09:00' LIMIT 1;
  IF lead_id IS NOT NULL AND slot_id IS NOT NULL THEN
    INSERT INTO appointments (slot_id, lead_id, appointment_type, scheduled_date, scheduled_time, duration_minutes, status, assigned_agent, modality, created_by, created_at)
    VALUES (slot_id, lead_id, ARRAY['new_appointment']::text[], CURRENT_DATE, '09:00', 60, 'scheduled', khalifa_id, 'campus', khalifa_id, NOW() - interval '2 days');
  END IF;

  -- Appointment 2: confirmed
  SELECT id INTO lead_id FROM leads WHERE assigned_to = khalifa_id AND pipeline_stage = 'contacted' AND id != lead_id LIMIT 1;
  SELECT id INTO slot_id FROM appointment_slots WHERE date = CURRENT_DATE AND start_time = '10:00' LIMIT 1;
  IF lead_id IS NOT NULL AND slot_id IS NOT NULL THEN
    INSERT INTO appointments (slot_id, lead_id, appointment_type, scheduled_date, scheduled_time, duration_minutes, status, assigned_agent, modality, confirmed_at, created_by, created_at)
    VALUES (slot_id, lead_id, ARRAY['new_appointment']::text[], CURRENT_DATE, '10:00', 60, 'confirmed', khalifa_id, 'campus', NOW() - interval '1 hour', khalifa_id, NOW() - interval '3 days');
  END IF;

  -- Appointment 3: sf_appointment - on_the_way
  SELECT id INTO lead_id FROM leads WHERE assigned_to = khalifa_id AND pipeline_stage = 'application' AND funding_type = 'self_funded' LIMIT 1;
  SELECT id INTO slot_id FROM appointment_slots WHERE date = CURRENT_DATE AND start_time = '11:00' LIMIT 1;
  IF lead_id IS NOT NULL AND slot_id IS NOT NULL THEN
    INSERT INTO appointments (slot_id, lead_id, appointment_type, scheduled_date, scheduled_time, duration_minutes, status, assigned_agent, modality, on_the_way_at, created_by, created_at)
    VALUES (slot_id, lead_id, ARRAY['sf_appointment']::text[], CURRENT_DATE, '11:00', 60, 'on_the_way', khalifa_id, 'campus', NOW() - interval '30 minutes', khalifa_id, NOW() - interval '2 days');
  END IF;

  -- Appointment 4: puc_documents - scheduled
  SELECT id INTO lead_id FROM leads WHERE assigned_to = khalifa_id AND pipeline_stage = 'puc_document_submission' LIMIT 1;
  SELECT id INTO slot_id FROM appointment_slots WHERE date = CURRENT_DATE AND start_time = '13:00' LIMIT 1;
  IF lead_id IS NOT NULL AND slot_id IS NOT NULL THEN
    INSERT INTO appointments (slot_id, lead_id, appointment_type, scheduled_date, scheduled_time, duration_minutes, status, assigned_agent, modality, created_by, created_at)
    VALUES (slot_id, lead_id, ARRAY['puc_documents']::text[], CURRENT_DATE, '13:00', 60, 'scheduled', khalifa_id, 'campus', khalifa_id, NOW() - interval '1 day');
  END IF;

  -- Appointment 5: retest - will_see
  SELECT id INTO lead_id FROM leads WHERE assigned_to = khalifa_id AND pipeline_stage = 'test' LIMIT 1;
  SELECT id INTO slot_id FROM appointment_slots WHERE date = CURRENT_DATE AND start_time = '14:00' LIMIT 1;
  IF lead_id IS NOT NULL AND slot_id IS NOT NULL THEN
    INSERT INTO appointments (slot_id, lead_id, appointment_type, scheduled_date, scheduled_time, duration_minutes, status, assigned_agent, modality, will_see_at, created_by, created_at)
    VALUES (slot_id, lead_id, ARRAY['retest']::text[], CURRENT_DATE, '14:00', 60, 'will_see', khalifa_id, 'campus', NOW() - interval '2 hours', khalifa_id, NOW() - interval '2 days');
  END IF;

  -- =============================================
  -- 5. PAST APPOINTMENTS (no-updated - scheduled but past time)
  -- =============================================
  INSERT INTO appointment_slots (appointment_type, date, start_time, end_time, capacity, booked_count, is_active, created_by)
  VALUES
    ('new_appointment', CURRENT_DATE - 1, '09:00', '10:00', 5, 2, true, khalifa_id),
    ('new_appointment', CURRENT_DATE - 1, '11:00', '12:00', 5, 1, true, khalifa_id),
    ('sf_appointment', CURRENT_DATE - 2, '10:00', '11:00', 5, 1, true, khalifa_id);

  -- Past appointment 1: still "scheduled" (needs update)
  SELECT id INTO lead_id FROM leads WHERE assigned_to = khalifa_id AND pipeline_stage = 'new' LIMIT 1;
  SELECT id INTO slot_id FROM appointment_slots WHERE date = CURRENT_DATE - 1 AND start_time = '09:00' LIMIT 1;
  IF lead_id IS NOT NULL AND slot_id IS NOT NULL THEN
    INSERT INTO appointments (slot_id, lead_id, appointment_type, scheduled_date, scheduled_time, duration_minutes, status, assigned_agent, modality, created_by, created_at)
    VALUES (slot_id, lead_id, ARRAY['new_appointment']::text[], CURRENT_DATE - 1, '09:00', 60, 'scheduled', khalifa_id, 'campus', khalifa_id, NOW() - interval '4 days');
  END IF;

  -- Past appointment 2: still "scheduled" (needs update)
  SELECT id INTO lead_id FROM leads WHERE assigned_to = khalifa_id AND pipeline_stage = 'new' AND id != lead_id LIMIT 1;
  SELECT id INTO slot_id FROM appointment_slots WHERE date = CURRENT_DATE - 1 AND start_time = '11:00' LIMIT 1;
  IF lead_id IS NOT NULL AND slot_id IS NOT NULL THEN
    INSERT INTO appointments (slot_id, lead_id, appointment_type, scheduled_date, scheduled_time, duration_minutes, status, assigned_agent, modality, created_by, created_at)
    VALUES (slot_id, lead_id, ARRAY['new_appointment']::text[], CURRENT_DATE - 1, '11:00', 60, 'scheduled', khalifa_id, 'campus', khalifa_id, NOW() - interval '3 days');
  END IF;

  -- Past appointment 3: still "scheduled" (needs update)
  SELECT id INTO lead_id FROM leads WHERE assigned_to = khalifa_id AND pipeline_stage = 'contacted' AND contact_status = 'will_see' LIMIT 1;
  SELECT id INTO slot_id FROM appointment_slots WHERE date = CURRENT_DATE - 2 AND start_time = '10:00' LIMIT 1;
  IF lead_id IS NOT NULL AND slot_id IS NOT NULL THEN
    INSERT INTO appointments (slot_id, lead_id, appointment_type, scheduled_date, scheduled_time, duration_minutes, status, assigned_agent, modality, created_by, created_at)
    VALUES (slot_id, lead_id, ARRAY['sf_appointment']::text[], CURRENT_DATE - 2, '10:00', 60, 'scheduled', khalifa_id, 'campus', khalifa_id, NOW() - interval '5 days');
  END IF;

  RAISE NOTICE 'Seed complete for Khalifa dashboard!';
END $$;

-- Verify counts
SELECT 'Total Leads' as metric, count(*) as count FROM leads WHERE assigned_to = '52bb7f9e-a419-4336-bf1f-53d56eb2f010'
UNION ALL
SELECT 'SF Leads', count(*) FROM leads WHERE assigned_to = '52bb7f9e-a419-4336-bf1f-53d56eb2f010' AND funding_type = 'self_funded'
UNION ALL
SELECT 'PUC Leads', count(*) FROM leads WHERE assigned_to = '52bb7f9e-a419-4336-bf1f-53d56eb2f010' AND funding_type = 'puc'
UNION ALL
SELECT 'Today Appointments', count(*) FROM appointments WHERE assigned_agent = '52bb7f9e-a419-4336-bf1f-53d56eb2f010' AND scheduled_date = CURRENT_DATE
UNION ALL
SELECT 'Past Scheduled (No Update)', count(*) FROM appointments WHERE assigned_agent = '52bb7f9e-a419-4336-bf1f-53d56eb2f010' AND scheduled_date < CURRENT_DATE AND status = 'scheduled';
