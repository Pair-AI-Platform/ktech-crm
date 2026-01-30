-- Seed 10 agents into the CRM
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  _id UUID;
  _emails TEXT[] := ARRAY[
    'sarah.jones@ktech.edu.kw', 'ahmed.hassan@ktech.edu.kw', 'nora.khalid@ktech.edu.kw',
    'omar.farid@ktech.edu.kw', 'lina.mahmoud@ktech.edu.kw', 'khalid.nasser@ktech.edu.kw',
    'dana.ali@ktech.edu.kw', 'faisal.khaled@ktech.edu.kw', 'reem.salem@ktech.edu.kw',
    'yousef.ward@ktech.edu.kw'
  ];
  _names TEXT[] := ARRAY[
    'Sarah Jones', 'Ahmed Hassan', 'Nora Khalid',
    'Omar Farid', 'Lina Mahmoud', 'Khalid Nasser',
    'Dana Ali', 'Faisal Khaled', 'Reem Salem',
    'Yousef Ward'
  ];
  _phones TEXT[] := ARRAY[
    '55010001', '55010002', '55010003', '55010004', '55010005',
    '55010006', '55010007', '55010008', '55010009', '55010010'
  ];
  i INT;
BEGIN
  FOR i IN 1..10 LOOP
    -- Skip if email already exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = _emails[i]) THEN
      _id := gen_random_uuid();

      INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
      VALUES (
        _id,
        '00000000-0000-0000-0000-000000000000',
        _emails[i],
        crypt('Agent@2025!', gen_salt('bf')),
        NOW(),
        json_build_object('full_name', _names[i])::jsonb,
        'authenticated',
        'authenticated',
        NOW(),
        NOW()
      );

      -- Update the auto-created profile with extra details
      UPDATE profiles
      SET role = 'agent', monthly_target = 40, phone = _phones[i]
      WHERE email = _emails[i];
    END IF;
  END LOOP;
END $$;

-- Verify
SELECT full_name, email, role, is_active, monthly_target
FROM profiles
WHERE email LIKE '%@ktech.edu.kw'
ORDER BY full_name;
