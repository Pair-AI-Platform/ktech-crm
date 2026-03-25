-- =============================================
-- SEED: 200 PUC Leads distributed across pipeline stages
-- Run this in Supabase SQL Editor
-- =============================================

DO $$
DECLARE
  first_names_m TEXT[] := ARRAY[
    'Ahmed', 'Mohammed', 'Abdullah', 'Khaled', 'Faisal', 'Omar', 'Salem', 'Youssef', 'Hassan', 'Ali',
    'Nasser', 'Badr', 'Fahd', 'Hamad', 'Saleh', 'Abdulrahman', 'Mishari', 'Bandar', 'Turki', 'Saud',
    'Jassem', 'Mubarak', 'Talal', 'Majed', 'Waleed', 'Naif', 'Saad', 'Ibrahim', 'Abdulaziz', 'Rashed'
  ];
  first_names_f TEXT[] := ARRAY[
    'Fatima', 'Mariam', 'Sarah', 'Noura', 'Haya', 'Dana', 'Lulwa', 'Dalal', 'Reem', 'Aseel',
    'Sheikha', 'Latifa', 'Maha', 'Amal', 'Hessa', 'Munira', 'Bashayer', 'Ghadeer', 'Janan', 'Raghad',
    'Shahd', 'Waad', 'Dima', 'Lamya', 'Aisha', 'Ruqaya', 'Hind', 'Nouf', 'Mashael', 'Alanoud'
  ];
  last_names TEXT[] := ARRAY[
    'Al-Sabah', 'Al-Rashid', 'Al-Ahmad', 'Al-Mutairi', 'Al-Shammari', 'Al-Anzi', 'Al-Harbi', 'Al-Kandari',
    'Al-Failakawi', 'Al-Qattan', 'Al-Saeed', 'Al-Hajri', 'Al-Dosari', 'Al-Azmi', 'Al-Otaibi',
    'Al-Fadhli', 'Al-Marri', 'Al-Khalidi', 'Al-Ajmi', 'Al-Dhafiri', 'Al-Balushi', 'Al-Rashidi',
    'Al-Subaie', 'Al-Shahri', 'Al-Mohammadi', 'Al-Ghamdi', 'Al-Zahrani', 'Al-Qahtani',
    'Al-Jabri', 'Al-Sharif', 'Al-Malki', 'Al-Husseini', 'Al-Mousawi', 'Al-Farsi', 'Al-Muslim'
  ];
  sources_arr TEXT[] := ARRAY[
    'walk_in', 'call_center', 'whatsapp', 'email',
    'school_visit', 'expo', 'exhibitions', 'karnival',
    'website_form', 'facebook', 'instagram', 'snapchat',
    'current_student_referral', 'staff_referral', 'friend_referral',
    'old_contacts', 'gpa_lists'
  ];
  -- Current DB pipeline_stage enum values for PUC flow
  puc_stages TEXT[] := ARRAY['new', 'contacted', 'visit', 'test', 'application', 'puc_document_submission', 'puc_application_submission', 'applicant', 'enrolled'];
  grade_levels TEXT[] := ARRAY['10th', '11th', '12th'];
  tracks TEXT[] := ARRAY['science', 'arts'];
  majors TEXT[] := ARRAY['cyber_security', 'cis', 'marketing', 'accounting', 'mis', 'network_security', 'other'];
  contact_statuses TEXT[] := ARRAY['uncontacted', 'interested', 'not_interested', 'no_answer', 'callback', 'will_see'];
  submission_substages TEXT[] := ARRAY['documents', 'submissions'];
  placement_levels TEXT[] := ARRAY['foundation_1', 'foundation_2', 'direct_entry'];

  school_ids UUID[];
  school_govs TEXT[];
  school_count INT;
  agent_ids UUID[];
  agent_count INT;

  i INT;
  is_male BOOLEAN;
  fname TEXT;
  lname TEXT;
  nat TEXT;
  is_kw BOOLEAN;
  phone_num TEXT;
  civil TEXT;
  src TEXT;
  src_cat TEXT;
  stage TEXT;
  stage_rand FLOAT;
  grade TEXT;
  track TEXT;
  major TEXT;
  contact_st TEXT;
  sub_substage TEXT;
  school_idx INT;
  agent_idx INT;
  gpa10 NUMERIC;
  gpa11 NUMERIC;
  gpa12 NUMERIC;
  created DATE;
  phone_prefix TEXT;
  phone_rest TEXT;
  inserted_count INT := 0;
  skipped_count INT := 0;
  is_lost BOOLEAN;
  lost_stage TEXT;
  p_level TEXT;
BEGIN
  -- Get all active schools
  SELECT array_agg(id ORDER BY id), array_agg(governorate::TEXT ORDER BY id)
  INTO school_ids, school_govs
  FROM schools WHERE is_active = true;

  school_count := COALESCE(array_length(school_ids, 1), 0);
  RAISE NOTICE 'Found % active schools', school_count;

  IF school_count = 0 THEN
    RAISE EXCEPTION 'No active schools found. Run school migrations first.';
  END IF;

  -- Get all agents/admins for assignment
  SELECT array_agg(id)
  INTO agent_ids
  FROM profiles WHERE role IN ('agent', 'admin') AND is_active = true;

  agent_count := COALESCE(array_length(agent_ids, 1), 0);
  RAISE NOTICE 'Found % agents/admins for assignment', agent_count;

  -- Generate 200 PUC leads
  FOR i IN 1..200 LOOP
    is_male := random() > 0.5;

    IF is_male THEN
      fname := first_names_m[1 + floor(random() * array_length(first_names_m, 1))::INT];
    ELSE
      fname := first_names_f[1 + floor(random() * array_length(first_names_f, 1))::INT];
    END IF;
    lname := last_names[1 + floor(random() * array_length(last_names, 1))::INT];

    -- ~85% Kuwaiti for PUC
    is_kw := random() < 0.85;
    IF is_kw THEN nat := 'Kuwaiti';
    ELSE nat := (ARRAY['Saudi', 'Egyptian', 'Syrian', 'Jordanian', 'Palestinian'])[1 + floor(random() * 5)::INT];
    END IF;

    -- Phone
    phone_prefix := (ARRAY['5', '6', '9'])[1 + floor(random() * 3)::INT];
    phone_rest := lpad(floor(random() * 9999999)::TEXT, 7, '0');
    phone_num := phone_prefix || phone_rest;

    -- Civil ID
    civil := (ARRAY['2', '3'])[1 + floor(random() * 2)::INT]
             || lpad(floor(random() * 99999999999)::TEXT, 11, '0');

    -- Source
    src := sources_arr[1 + floor(random() * array_length(sources_arr, 1))::INT];
    CASE src
      WHEN 'walk_in', 'call_center', 'whatsapp', 'email' THEN src_cat := 'direct';
      WHEN 'school_visit', 'expo', 'exhibitions', 'karnival' THEN src_cat := 'events';
      WHEN 'website_form', 'facebook', 'instagram', 'snapchat' THEN src_cat := 'digital';
      WHEN 'current_student_referral', 'staff_referral', 'friend_referral' THEN src_cat := 'referrals';
      WHEN 'old_contacts', 'gpa_lists' THEN src_cat := 'outreach';
      ELSE src_cat := 'direct';
    END CASE;

    -- Pipeline stage: weighted funnel distribution
    -- 10% will be lost leads
    is_lost := random() < 0.10;
    stage_rand := random();
    IF    stage_rand < 0.15 THEN stage := 'new';
    ELSIF stage_rand < 0.28 THEN stage := 'contacted';
    ELSIF stage_rand < 0.38 THEN stage := 'visit';
    ELSIF stage_rand < 0.48 THEN stage := 'test';
    ELSIF stage_rand < 0.58 THEN stage := 'application';
    ELSIF stage_rand < 0.68 THEN stage := 'puc_document_submission';
    ELSIF stage_rand < 0.78 THEN stage := 'puc_application_submission';
    ELSIF stage_rand < 0.88 THEN stage := 'applicant';
    ELSE                         stage := 'enrolled';
    END IF;

    lost_stage := NULL;
    IF is_lost THEN
      lost_stage := stage;
      stage := 'lost';
    END IF;

    -- Academic info
    grade := grade_levels[1 + floor(random() * 3)::INT];
    track := tracks[1 + floor(random() * 2)::INT];
    major := majors[1 + floor(random() * array_length(majors, 1))::INT];
    contact_st := contact_statuses[1 + floor(random() * array_length(contact_statuses, 1))::INT];

    -- GPA (70-100)
    gpa10 := round((70 + random() * 30)::NUMERIC, 1);
    gpa11 := round((70 + random() * 30)::NUMERIC, 1);
    gpa12 := round((70 + random() * 30)::NUMERIC, 1);

    -- Submission substage for document/submission stages
    sub_substage := NULL;
    IF stage = 'puc_document_submission' THEN sub_substage := 'documents';
    ELSIF stage = 'puc_application_submission' THEN sub_substage := 'submissions';
    END IF;

    -- Placement level (for leads past test stage)
    p_level := NULL;
    IF stage IN ('application', 'puc_document_submission', 'puc_application_submission', 'applicant', 'enrolled') THEN
      p_level := placement_levels[1 + floor(random() * 3)::INT];
    END IF;

    -- School round-robin
    school_idx := ((i - 1) % school_count) + 1;

    -- Agent round-robin
    IF agent_count > 0 THEN
      agent_idx := ((i - 1) % agent_count) + 1;
    END IF;

    -- Random creation date (within last 90 days)
    created := CURRENT_DATE - (floor(random() * 90))::INT;

    BEGIN
      INSERT INTO leads (
        first_name, last_name, phone, civil_id,
        nationality, is_kuwaiti, gender,
        school_id, governorate,
        source, source_category,
        pipeline_stage, contact_status, funding_type,
        grade_level, academic_track, intended_major,
        gpa_grade_10, gpa_grade_11, gpa_grade_12_expected,
        submission_substage, placement_level,
        lost_at_stage,
        assigned_to, assigned_at,
        created_at, updated_at
      ) VALUES (
        fname, lname, phone_num, civil,
        nat, is_kw, CASE WHEN is_male THEN 'male' ELSE 'female' END,
        school_ids[school_idx], school_govs[school_idx]::governorate,
        src::lead_source, src_cat::lead_source_category,
        stage::pipeline_stage, contact_st::contact_status, 'puc'::funding_type,
        grade::grade_level, track::academic_track, major::intended_major,
        gpa10, gpa11,
        CASE WHEN stage != 'new' THEN gpa12 ELSE NULL END,
        sub_substage, p_level,
        lost_stage::pipeline_stage,
        CASE WHEN agent_count > 0 THEN agent_ids[agent_idx] ELSE NULL END,
        CASE WHEN agent_count > 0 THEN (created + interval '1 day')::TIMESTAMPTZ ELSE NULL END,
        created::TIMESTAMPTZ,
        (created + (floor(random() * 30))::INT * interval '1 day')::TIMESTAMPTZ
      );
      inserted_count := inserted_count + 1;
    EXCEPTION
      WHEN unique_violation THEN
        skipped_count := skipped_count + 1;
        CONTINUE;
      WHEN others THEN
        RAISE NOTICE 'Error on lead %: %', i, SQLERRM;
        skipped_count := skipped_count + 1;
        CONTINUE;
    END;

    IF i % 50 = 0 THEN
      RAISE NOTICE 'Progress: % / 200 (inserted: %, skipped: %)', i, inserted_count, skipped_count;
    END IF;
  END LOOP;

  RAISE NOTICE '=== DONE === Inserted: %, Skipped: %', inserted_count, skipped_count;
END $$;

-- =============================================
-- VERIFICATION
-- =============================================
SELECT 'Total PUC leads' as metric, COUNT(*)::TEXT as value FROM leads WHERE funding_type = 'puc'
UNION ALL
SELECT 'PUC by stage:', '' FROM leads WHERE false;

SELECT pipeline_stage, COUNT(*) as count
FROM leads
WHERE funding_type = 'puc'
GROUP BY pipeline_stage
ORDER BY count DESC;
