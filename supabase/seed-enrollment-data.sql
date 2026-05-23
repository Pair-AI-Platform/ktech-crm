-- Seed fake enrollment data (students) for Reports Dashboard
-- Distributes ~120 students across all active agents with realistic data
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  _agent_ids UUID[];
  _agent_id UUID;
  _student_id UUID;
  _first_names_m TEXT[] := ARRAY[
    'Mohammed','Ahmed','Omar','Khalid','Yousef','Fahad','Abdullah','Ali','Hassan','Faisal',
    'Nasser','Salem','Turki','Bader','Hamad','Rashed','Mansour','Jaber','Saud','Talal',
    'Mishari','Abdulaziz','Ibrahim','Nawaf','Bandar','Mubarak','Tariq','Saleh','Khaled','Waleed'
  ];
  _first_names_f TEXT[] := ARRAY[
    'Fatima','Noura','Sara','Dana','Reem','Lina','Haya','Maryam','Aisha','Latifa',
    'Dalal','Shaikha','Munira','Anfal','Bashayer','Ghalia','Hajar','Lulwa','Wadha','Shahad',
    'Jouri','Aseel','Abeer','Hessa','Nada','Lamia','Zahra','Yara','Alia','Amina'
  ];
  _last_names TEXT[] := ARRAY[
    'Al-Mutairi','Al-Rashidi','Al-Enezi','Al-Otaibi','Al-Shammari','Al-Dosari','Al-Ajmi',
    'Al-Harbi','Al-Subaie','Al-Azmi','Al-Kandari','Al-Failakawi','Al-Sabah','Al-Jassim',
    'Al-Khalidi','Al-Bader','Al-Hamad','Al-Saleh','Al-Dawsari','Al-Qahtani'
  ];
  _funding TEXT;
  _first TEXT;
  _last TEXT;
  _is_male BOOLEAN;
  _amount DECIMAL;
  _is_withdrawn BOOLEAN;
  _created TIMESTAMPTZ;
  _i INT;
  _agent_count INT;
  _agent_idx INT;
BEGIN
  -- Get all active agent IDs
  SELECT ARRAY_AGG(id ORDER BY full_name)
  INTO _agent_ids
  FROM profiles
  WHERE role = 'agent' AND is_active = true;

  _agent_count := array_length(_agent_ids, 1);

  IF _agent_count IS NULL OR _agent_count = 0 THEN
    RAISE NOTICE 'No active agents found. Aborting.';
    RETURN;
  END IF;

  RAISE NOTICE 'Found % active agents', _agent_count;

  FOR _i IN 1..120 LOOP
    -- Round-robin agent assignment with some variance
    -- Agents 1-3 get more students (top performers)
    IF _i % 7 < 3 THEN
      _agent_idx := (_i % 3) + 1;  -- First 3 agents get extra
    ELSE
      _agent_idx := ((_i * 7 + 3) % _agent_count) + 1;
    END IF;
    _agent_id := _agent_ids[_agent_idx];

    -- Random gender
    _is_male := random() > 0.45;

    -- Pick names
    IF _is_male THEN
      _first := _first_names_m[1 + floor(random() * 30)::int];
    ELSE
      _first := _first_names_f[1 + floor(random() * 30)::int];
    END IF;
    _last := _last_names[1 + floor(random() * 20)::int];

    -- Funding type: ~40% PUC, ~60% self-funded
    IF random() < 0.4 THEN
      _funding := 'puc';
    ELSE
      _funding := 'self_funded';
    END IF;

    -- Payment amount distribution
    -- 35% full tuition (550+), 40% seat reserved (150-549), 25% pending (<150)
    IF random() < 0.35 THEN
      _amount := 550 + floor(random() * 200)::int;
    ELSIF random() < 0.65 THEN
      _amount := 150 + floor(random() * 400)::int;
    ELSE
      _amount := floor(random() * 150)::int;
    END IF;

    -- ~12% withdrawn
    _is_withdrawn := random() < 0.12;

    -- Created date: spread across current month (March 2026)
    _created := date_trunc('month', CURRENT_DATE) + (floor(random() * EXTRACT(DAY FROM CURRENT_DATE))::int || ' days')::interval
                + (floor(random() * 12 + 8)::int || ' hours')::interval
                + (floor(random() * 60)::int || ' minutes')::interval;

    _student_id := gen_random_uuid();

    INSERT INTO students (
      id, first_name, last_name, phone, email, funding_type,
      amount_paid, is_payment_exempted,
      placement_test_passed, placement_level, placement_test_exempted,
      is_withdrawn,
      paci_verified, puc_converted_to_sf, puc_fee_paid,
      puc_stage,
      sf_declaration_submitted, sf_passport_submitted, sf_civil_id_submitted,
      sf_payment_receipt_submitted, sf_official_transcript_submitted,
      puc_high_school_certificate_submitted, puc_civil_id_submitted,
      puc_parent_civil_id_submitted, puc_passport_submitted,
      puc_nationality_document_submitted, puc_payment_receipt_submitted,
      puc_acceptance_letter_submitted,
      assigned_to, created_at, updated_at, enrolled_at,
      civil_id, number_of_credits
    ) VALUES (
      _student_id,
      _first,
      _last,
      '5' || lpad(floor(random() * 10000000)::text, 7, '0'),
      lower(_first) || '.' || lower(replace(_last, '-', '')) || floor(random()*100)::text || '@email.com',
      _funding::funding_type,
      _amount,
      random() < 0.05,  -- 5% payment exempted
      random() > 0.2,   -- 80% passed placement
      (ARRAY['foundation_1','foundation_2','majors'])[1 + floor(random()*3)::int]::placement_level,
      random() < 0.1,   -- 10% test exempted
      _is_withdrawn,
      _funding = 'puc',  -- PUC students are PACI verified
      false,
      _funding = 'puc' AND random() > 0.3,
      CASE WHEN _funding = 'puc' THEN
        (ARRAY['application','submitted','approved','enrolled'])[1 + floor(random()*4)::int]::puc_stage
      ELSE NULL END,
      -- SF docs
      _funding = 'self_funded' AND random() > 0.3,
      _funding = 'self_funded' AND random() > 0.4,
      _funding = 'self_funded' AND random() > 0.3,
      _funding = 'self_funded' AND random() > 0.4,
      false,
      -- PUC docs
      _funding = 'puc' AND random() > 0.3,
      _funding = 'puc' AND random() > 0.3,
      _funding = 'puc' AND random() > 0.4,
      _funding = 'puc' AND random() > 0.4,
      _funding = 'puc' AND random() > 0.5,
      _funding = 'puc' AND random() > 0.5,
      _funding = 'puc' AND random() > 0.6,
      _agent_id,
      _created,
      _created + interval '1 day',
      _created,
      lpad(floor(random() * 1000000000000)::text, 12, '2'),
      0
    );
  END LOOP;

  RAISE NOTICE 'Inserted 120 students successfully';
END $$;

-- Verify the results
SELECT
  p.full_name AS agent,
  COUNT(*) AS total_students,
  COUNT(*) FILTER (WHERE NOT s.is_withdrawn) AS active,
  COUNT(*) FILTER (WHERE s.funding_type = 'puc' AND NOT s.is_withdrawn) AS puc,
  COUNT(*) FILTER (WHERE s.funding_type = 'self_funded' AND NOT s.is_withdrawn) AS self_funded,
  COUNT(*) FILTER (WHERE s.is_withdrawn) AS withdrawn
FROM students s
JOIN profiles p ON p.id = s.assigned_to
WHERE s.created_at >= date_trunc('month', CURRENT_DATE)
GROUP BY p.full_name
ORDER BY total_students DESC;
