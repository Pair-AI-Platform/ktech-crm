-- =============================================
-- SEED: 2000 Leads distributed across all schools
-- Run this in Supabase SQL Editor
-- =============================================
-- DB pipeline_stage enum values:
--   new, contacted, appointed, visited, applied, tested, application, payment, enrolled
--   (and possibly 'lost' — check with: SELECT unnest(enum_range(NULL::pipeline_stage));)
-- =============================================

DO $$
DECLARE
  first_names_m TEXT[] := ARRAY[
    'أحمد', 'محمد', 'عبدالله', 'خالد', 'فيصل', 'عمر', 'سالم', 'يوسف', 'حسن', 'علي',
    'ناصر', 'بدر', 'فهد', 'حمد', 'صالح', 'عبدالرحمن', 'مشاري', 'بندر', 'تركي', 'سعود',
    'جاسم', 'مبارك', 'طلال', 'ماجد', 'وليد', 'نايف', 'سعد', 'دانيال', 'إبراهيم', 'عبدالعزيز',
    'راشد', 'حمود', 'زياد', 'هاشم', 'أنس', 'عادل', 'منصور', 'جابر', 'ثامر', 'غانم'
  ];
  first_names_f TEXT[] := ARRAY[
    'فاطمة', 'مريم', 'سارة', 'نورة', 'هيا', 'دانة', 'لولوة', 'دلال', 'ريم', 'أسيل',
    'شيخة', 'لطيفة', 'مها', 'أمل', 'حصة', 'منيرة', 'بشاير', 'غدير', 'جنان', 'رغد',
    'شهد', 'وعد', 'ديمة', 'لمياء', 'عائشة', 'رقية', 'هند', 'نوف', 'مشاعل', 'العنود',
    'بدور', 'خلود', 'ياسمين', 'جواهر', 'طيف', 'سلمى', 'رزان', 'جوري', 'لين', 'تالا'
  ];
  last_names TEXT[] := ARRAY[
    'الصباح', 'الرشيد', 'الأحمد', 'المطيري', 'الشمري', 'العنزي', 'الحربي', 'الكندري',
    'الفيلكاوي', 'القطان', 'السعيد', 'الهاجري', 'الدوسري', 'العازمي', 'العتيبي',
    'الفضلي', 'المري', 'الخالدي', 'العجمي', 'الظفيري', 'البلوشي', 'الرشيدي',
    'السبيعي', 'الشهري', 'المحمدي', 'الغامدي', 'الزهراني', 'القحطاني', 'البقمي',
    'الجابري', 'الشريف', 'المالكي', 'الحسيني', 'الموسوي', 'الفارسي', 'المسلم',
    'العلي', 'الإبراهيم', 'الصالح', 'الناصر', 'البدر', 'المنصور', 'الجاسر', 'الخليفة',
    'الحمود', 'التركي', 'السالم', 'الماجد', 'الفهد', 'الحميدان'
  ];
  nationalities TEXT[] := ARRAY[
    'Kuwaiti', 'Kuwaiti', 'Kuwaiti', 'Kuwaiti', 'Kuwaiti', 'Kuwaiti', 'Kuwaiti', 'Kuwaiti',
    'Saudi', 'Egyptian', 'Syrian', 'Jordanian', 'Palestinian', 'Iraqi', 'Bahraini'
  ];
  sources_arr TEXT[] := ARRAY[
    'walk_in', 'call_center', 'whatsapp', 'email',
    'school_visit', 'expo', 'exhibitions', 'karnival',
    'website_form', 'facebook', 'instagram', 'snapchat',
    'current_student_referral', 'staff_referral', 'friend_referral',
    'old_contacts', 'gpa_lists'
  ];
  -- ACTUAL DB enum values (not the TypeScript type names)
  stages TEXT[] := ARRAY['new', 'contacted', 'appointed', 'visited', 'applied', 'tested', 'application', 'payment', 'enrolled'];
  grade_levels TEXT[] := ARRAY['10th', '11th', '12th'];
  tracks TEXT[] := ARRAY['science', 'arts'];
  majors TEXT[] := ARRAY['cyber_security', 'cis', 'marketing', 'accounting', 'mis', 'network_security', 'other'];
  funding_types TEXT[] := ARRAY['self_funded', 'puc'];
  contact_statuses TEXT[] := ARRAY['uncontacted', 'interested', 'not_interested', 'no_answer', 'callback', 'will_see'];
  submission_substages TEXT[] := ARRAY['pending', 'submitted', 'blocked', 'ready', 'documents', 'lost'];
  ministry_reasons TEXT[] := ARRAY['ku', 'paaet', 'abroad', 'aasu', 'paci', 'puc', 'gpa'];

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
  fund TEXT;
  contact_st TEXT;
  sub_substage TEXT;
  min_blocked BOOLEAN;
  min_reasons TEXT[];
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

  -- Generate 2000 leads
  FOR i IN 1..2000 LOOP
    -- Random gender
    is_male := random() > 0.5;

    -- Random name
    IF is_male THEN
      fname := first_names_m[1 + floor(random() * array_length(first_names_m, 1))::INT];
    ELSE
      fname := first_names_f[1 + floor(random() * array_length(first_names_f, 1))::INT];
    END IF;
    lname := last_names[1 + floor(random() * array_length(last_names, 1))::INT];

    -- Random nationality (~80% Kuwaiti)
    nat := nationalities[1 + floor(random() * array_length(nationalities, 1))::INT];
    is_kw := (nat = 'Kuwaiti');

    -- Generate phone (8 digits, starts with 5/6/9)
    phone_prefix := (ARRAY['5', '6', '9'])[1 + floor(random() * 3)::INT];
    phone_rest := lpad(floor(random() * 9999999)::TEXT, 7, '0');
    phone_num := phone_prefix || phone_rest;

    -- Generate civil ID (12 digits, starts with 2 or 3)
    civil := (ARRAY['2', '3'])[1 + floor(random() * 2)::INT]
             || lpad(floor(random() * 99999999999)::TEXT, 11, '0');

    -- Random source with correct category mapping
    src := sources_arr[1 + floor(random() * array_length(sources_arr, 1))::INT];
    CASE src
      WHEN 'walk_in', 'call_center', 'whatsapp', 'email' THEN src_cat := 'direct';
      WHEN 'school_visit', 'expo', 'exhibitions', 'karnival' THEN src_cat := 'events';
      WHEN 'website_form', 'facebook', 'instagram', 'snapchat' THEN src_cat := 'digital';
      WHEN 'current_student_referral', 'staff_referral', 'friend_referral' THEN src_cat := 'referrals';
      WHEN 'old_contacts', 'paaet_rejected', 'gpa_lists' THEN src_cat := 'outreach';
      ELSE src_cat := 'direct';
    END CASE;

    -- Pipeline stage: weighted distribution (funnel shape)
    -- Uses actual DB enum values: new, contacted, appointed, visited, applied, tested, application, payment, enrolled
    stage_rand := random();
    IF    stage_rand < 0.20 THEN stage := 'new';
    ELSIF stage_rand < 0.35 THEN stage := 'contacted';
    ELSIF stage_rand < 0.48 THEN stage := 'appointed';
    ELSIF stage_rand < 0.58 THEN stage := 'visited';
    ELSIF stage_rand < 0.65 THEN stage := 'applied';
    ELSIF stage_rand < 0.73 THEN stage := 'tested';
    ELSIF stage_rand < 0.82 THEN stage := 'application';
    ELSIF stage_rand < 0.90 THEN stage := 'payment';
    ELSE                         stage := 'enrolled';
    END IF;

    -- Academic info
    grade := grade_levels[1 + floor(random() * 3)::INT];
    track := tracks[1 + floor(random() * 2)::INT];
    major := majors[1 + floor(random() * array_length(majors, 1))::INT];
    fund  := funding_types[1 + floor(random() * 2)::INT];
    contact_st := contact_statuses[1 + floor(random() * array_length(contact_statuses, 1))::INT];

    -- GPA (70-100 range)
    gpa10 := round((70 + random() * 30)::NUMERIC, 1);
    gpa11 := round((70 + random() * 30)::NUMERIC, 1);
    gpa12 := round((70 + random() * 30)::NUMERIC, 1);

    -- School: round-robin for even distribution across all schools
    school_idx := ((i - 1) % school_count) + 1;

    -- Agent: round-robin assignment
    IF agent_count > 0 THEN
      agent_idx := ((i - 1) % agent_count) + 1;
    END IF;

    -- Submission-specific fields (for 'application' stage leads)
    sub_substage := NULL;
    min_blocked := false;
    min_reasons := NULL;
    IF stage = 'application' THEN
      sub_substage := submission_substages[1 + floor(random() * array_length(submission_substages, 1))::INT];
      IF sub_substage = 'blocked' THEN
        min_blocked := true;
        min_reasons := ARRAY[ministry_reasons[1 + floor(random() * array_length(ministry_reasons, 1))::INT]];
      END IF;
      fund := 'puc';
    END IF;

    -- Random creation date (within last 90 days)
    created := CURRENT_DATE - (floor(random() * 90))::INT;

    -- Insert the lead
    BEGIN
      INSERT INTO leads (
        first_name, last_name, phone, civil_id,
        nationality, is_kuwaiti, gender,
        school_id, governorate,
        source, source_category,
        pipeline_stage, contact_status,
        grade_level, academic_track, intended_major, funding_type,
        gpa_grade_10, gpa_grade_11, gpa_grade_12_expected,
        submission_substage, ministry_blocked, ministry_block_reasons,
        assigned_to, assigned_at,
        created_at, updated_at
      ) VALUES (
        fname, lname, phone_num, civil,
        nat, is_kw, CASE WHEN is_male THEN 'male' ELSE 'female' END,
        school_ids[school_idx], school_govs[school_idx]::governorate,
        src::lead_source, src_cat::lead_source_category,
        stage::pipeline_stage, contact_st::contact_status,
        grade::grade_level, track::academic_track, major::intended_major, fund::funding_type,
        gpa10, gpa11,
        CASE WHEN stage != 'new' THEN gpa12 ELSE NULL END,
        sub_substage, min_blocked, min_reasons,
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
    END;

    IF i % 500 = 0 THEN
      RAISE NOTICE 'Progress: % / 2000 (inserted: %, skipped: %)', i, inserted_count, skipped_count;
    END IF;
  END LOOP;

  RAISE NOTICE '=== DONE === Inserted: %, Skipped (duplicates): %', inserted_count, skipped_count;
END $$;

-- =============================================
-- VERIFICATION
-- =============================================
SELECT 'Total leads' as metric, COUNT(*)::TEXT as value FROM leads
UNION ALL
SELECT 'Leads with schools', COUNT(*)::TEXT FROM leads WHERE school_id IS NOT NULL
UNION ALL
SELECT 'Distinct schools used', COUNT(DISTINCT school_id)::TEXT FROM leads WHERE school_id IS NOT NULL
UNION ALL
SELECT 'Avg leads per school', ROUND(COUNT(*)::NUMERIC / NULLIF(COUNT(DISTINCT school_id), 0), 1)::TEXT
FROM leads WHERE school_id IS NOT NULL;

SELECT pipeline_stage, COUNT(*) as count FROM leads GROUP BY pipeline_stage ORDER BY count DESC;

SELECT governorate, COUNT(*) as leads_count, COUNT(DISTINCT school_id) as schools_used
FROM leads WHERE school_id IS NOT NULL GROUP BY governorate ORDER BY leads_count DESC;
