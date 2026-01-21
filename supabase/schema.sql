-- =============================================
-- KTECH ENROLLMENT CRM - DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE user_role AS ENUM ('admin', 'agent');

CREATE TYPE lead_source_category AS ENUM (
  'direct', 'events', 'digital', 'referrals', 'outreach'
);

CREATE TYPE lead_source AS ENUM (
  'walk_in', 'call_center', 'whatsapp', 'email',
  'school_visit', 'expo', 'exhibitions',
  'website_form', 'facebook', 'instagram', 'snapchat',
  'current_student_referral', 'staff_referral', 'friend_referral',
  'old_contacts', 'paaet_rejected', 'gpa_lists'
);

CREATE TYPE pipeline_stage AS ENUM (
  'new', 'visit', 'test', 'application', 'lost'
);

CREATE TYPE contact_status AS ENUM (
  'uncontacted', 'interested', 'not_interested', 'no_answer',
  'callback', 'will_see', 'wrong_number'
);

CREATE TYPE governorate AS ENUM (
  'capital', 'hawalli', 'farwaniya', 'jahra', 'ahmadi', 'mubarak_alkabeer'
);

CREATE TYPE academic_track AS ENUM ('science', 'arts');
CREATE TYPE grade_level AS ENUM ('10th', '11th', '12th');
CREATE TYPE funding_type AS ENUM ('self_funded', 'puc');

CREATE TYPE intended_major AS ENUM (
  'cyber_security', 'cis', 'marketing', 'accounting', 'mis', 'network_security', 'other'
);

CREATE TYPE placement_level AS ENUM ('foundation_1', 'foundation_2', 'majors');
CREATE TYPE payment_status AS ENUM ('pending', 'seat_reserved', 'full_tuition');

CREATE TYPE discount_type AS ENUM (
  'kuwaiti_student', 'non_kuwaiti', 'athletes', 'marketing',
  'employee', 'athletes_full', 'president', 'charity',
  'non_kuwaiti_ministry', 'service_civil_commission'
);

CREATE TYPE puc_stage AS ENUM (
  'ktech_application', 'paci_verification', 'puc_submission',
  'puc_decision', 'enrolled', 'withdrawn'
);

CREATE TYPE orientation_status AS ENUM (
  'informed', 'na', 'cant_reach', 'traveling', 'might_withdraw'
);

CREATE TYPE appointment_type AS ENUM (
  'new_appointment', 'puc_documents', 'puc_application', 'retest', 'sf_appointment'
);

CREATE TYPE appointment_status AS ENUM (
  'scheduled', 'confirmed', 'attended', 'no_show', 'cancelled', 'rescheduled'
);

CREATE TYPE lost_reason_category AS ENUM (
  'competitors', 'military_security', 'academic',
  'administrative', 'financial', 'personal'
);

-- =============================================
-- PROFILES (extends auth.users)
-- =============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  full_name_ar VARCHAR(255),
  role user_role NOT NULL DEFAULT 'agent',
  avatar_url TEXT,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  monthly_target INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- REFERENCE TABLES
-- =============================================

CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  governorate governorate,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lost_reasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category lost_reason_category NOT NULL,
  reason_en VARCHAR(255) NOT NULL,
  reason_ar VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE semesters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- =============================================
-- LEADS
-- =============================================

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Personal Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  first_name_ar VARCHAR(100),
  last_name_ar VARCHAR(100),
  civil_id VARCHAR(12) UNIQUE,
  phone VARCHAR(8) NOT NULL,
  phone_secondary VARCHAR(8),
  email VARCHAR(255),
  date_of_birth DATE,
  gender VARCHAR(10),
  nationality VARCHAR(100) DEFAULT 'Kuwaiti',
  is_kuwaiti BOOLEAN DEFAULT true,

  -- Academic Information
  school_id UUID REFERENCES schools(id),
  school_name_custom VARCHAR(255),
  governorate governorate,
  grade_level grade_level,
  academic_track academic_track,
  gpa_grade_10 DECIMAL(5,2) CHECK (gpa_grade_10 >= 0 AND gpa_grade_10 <= 100),
  gpa_grade_11 DECIMAL(5,2) CHECK (gpa_grade_11 >= 0 AND gpa_grade_11 <= 100),
  gpa_grade_12_expected DECIMAL(5,2) CHECK (gpa_grade_12_expected >= 0 AND gpa_grade_12_expected <= 100),
  intended_major intended_major,
  custom_major VARCHAR(255),
  graduation_year INTEGER,

  -- Financial Qualification
  funding_type funding_type DEFAULT 'self_funded',
  has_weyay_account BOOLEAN DEFAULT false,
  has_bank_account BOOLEAN DEFAULT false,

  -- Lead Tracking
  source_category lead_source_category NOT NULL,
  source lead_source NOT NULL,
  source_detail VARCHAR(255),
  referral_code VARCHAR(50),
  referred_by_lead_id UUID REFERENCES leads(id),

  -- Pipeline
  pipeline_stage pipeline_stage DEFAULT 'new',
  contact_status contact_status DEFAULT 'uncontacted',
  lost_reason_id UUID REFERENCES lost_reasons(id),
  lost_reason_notes TEXT,

  -- Assignment
  assigned_to UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ,
  assigned_by UUID REFERENCES profiles(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  first_contacted_at TIMESTAMPTZ,
  last_contacted_at TIMESTAMPTZ,

  notes TEXT,

  -- Constraints
  CONSTRAINT valid_civil_id CHECK (
    civil_id IS NULL OR
    (LENGTH(civil_id) = 12 AND (civil_id LIKE '2%' OR civil_id LIKE '3%'))
  ),
  CONSTRAINT valid_phone CHECK (
    LENGTH(phone) = 8 AND
    (phone LIKE '5%' OR phone LIKE '6%' OR phone LIKE '9%')
  )
);

-- Indexes
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_civil_id ON leads(civil_id);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_pipeline_stage ON leads(pipeline_stage);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- =============================================
-- STUDENTS
-- =============================================

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  ktech_id VARCHAR(50) UNIQUE,
  semester_id UUID REFERENCES semesters(id),
  transfer_type VARCHAR(50),
  number_of_credits INTEGER DEFAULT 0,

  -- Denormalized fields
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  civil_id VARCHAR(12),
  phone VARCHAR(8) NOT NULL,
  email VARCHAR(255),
  funding_type funding_type NOT NULL,

  -- Payments
  amount_paid DECIMAL(10,3) DEFAULT 0 CHECK (amount_paid >= 0),
  payment_status payment_status GENERATED ALWAYS AS (
    CASE
      WHEN amount_paid < 150 THEN 'pending'::payment_status
      WHEN amount_paid >= 150 AND amount_paid < 550 THEN 'seat_reserved'::payment_status
      ELSE 'full_tuition'::payment_status
    END
  ) STORED,
  is_payment_exempted BOOLEAN DEFAULT false,

  -- Placement Test
  placement_test_passed BOOLEAN,
  placement_level placement_level,
  placement_test_exempted BOOLEAN DEFAULT false,
  placement_test_date TIMESTAMPTZ,
  placement_test_score JSONB,

  -- Withdrawal
  is_withdrawn BOOLEAN DEFAULT false,
  withdrawal_date DATE,
  withdrawal_reason_id UUID REFERENCES lost_reasons(id),
  withdrawal_notes TEXT,

  -- Discount
  discount_type discount_type,
  discount_percentage DECIMAL(5,2) CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  discount_approved_by UUID REFERENCES profiles(id),
  discount_approved_at TIMESTAMPTZ,
  discount_notes TEXT,

  -- PUC Flow
  puc_stage puc_stage,
  puc_application_date DATE,
  paci_verified BOOLEAN DEFAULT false,
  paci_verification_date DATE,
  puc_submission_date DATE,
  puc_decision VARCHAR(20),
  puc_decision_date DATE,
  puc_converted_to_sf BOOLEAN DEFAULT false,

  -- Orientation
  orientation_status orientation_status,
  orientation_group_id UUID,
  orientation_notes TEXT,

  assigned_to UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  enrolled_at TIMESTAMPTZ
);

CREATE INDEX idx_students_ktech_id ON students(ktech_id);
CREATE INDEX idx_students_lead_id ON students(lead_id);
CREATE INDEX idx_students_assigned_to ON students(assigned_to);

-- =============================================
-- APPOINTMENTS
-- =============================================

CREATE TABLE appointment_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_type appointment_type NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INTEGER NOT NULL,
  booked_count INTEGER DEFAULT 0,
  location VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_capacity CHECK (booked_count <= capacity)
);

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slot_id UUID REFERENCES appointment_slots(id),
  lead_id UUID REFERENCES leads(id),
  student_id UUID REFERENCES students(id),

  appointment_type appointment_type NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,

  status appointment_status DEFAULT 'scheduled',

  is_callback BOOLEAN DEFAULT false,
  callback_reason TEXT,

  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES profiles(id),
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES profiles(id),
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES profiles(id),
  cancellation_reason TEXT,
  no_show_marked_at TIMESTAMPTZ,
  no_show_marked_by UUID REFERENCES profiles(id),

  assigned_agent UUID REFERENCES profiles(id),
  notes TEXT,

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_appointment CHECK (lead_id IS NOT NULL OR student_id IS NOT NULL)
);

CREATE INDEX idx_appointments_date ON appointments(scheduled_date);
CREATE INDEX idx_appointments_lead ON appointments(lead_id);
CREATE INDEX idx_appointments_agent ON appointments(assigned_agent);

-- =============================================
-- ACTIVITIES
-- =============================================

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  metadata JSONB,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_activity CHECK (lead_id IS NOT NULL OR student_id IS NOT NULL)
);

CREATE INDEX idx_activities_lead ON activities(lead_id);
CREATE INDEX idx_activities_student ON activities(student_id);

-- =============================================
-- AUDIT LOG
-- =============================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  user_id UUID REFERENCES profiles(id),
  user_email VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Leads: Agents see only their own, Admins see all
CREATE POLICY leads_select_policy ON leads
  FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY leads_insert_policy ON leads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY leads_update_policy ON leads
  FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Students: Same pattern
CREATE POLICY students_select_policy ON students
  FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY students_insert_policy ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY students_update_policy ON students
  FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'agent'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- SEED DATA
-- =============================================

-- Insert lost reasons
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
  ('administrative', 'DON''T CALL', 'لا تتصل');

-- Insert current semester
INSERT INTO semesters (name, start_date, end_date, is_active) VALUES
  ('Fall 2024', '2024-09-01', '2024-12-31', true),
  ('Spring 2025', '2025-01-15', '2025-05-15', false);

-- Kuwait Public Secondary Schools (All Governorates)
-- =============================================
-- CAPITAL (العاصمة) - BOYS
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate) VALUES
  ('Al-Awzai Secondary School', 'ثانوية الأوزاعي', 'capital'),
  ('Jaber Al-Mubarak Al-Sabah Secondary School', 'ثانوية جابر المبارك الصباح', 'capital'),
  ('Ahmad Shihab Al-Din Secondary School', 'ثانوية أحمد شهاب الدين', 'capital'),
  ('Saad Bin Al-Rabee Al-Ansari Secondary School', 'ثانوية سعد بن الربيع الأنصاري', 'capital'),
  ('Abdullah Al-Otaibi Secondary School', 'ثانوية عبدالله العتيبي', 'capital'),
  ('Issa Ahmad Al-Hamad Secondary School', 'ثانوية عيسى أحمد الحمد', 'capital'),
  ('Ahmad Mishari Al-Adwani Secondary School', 'ثانوية أحمد مشاري العدواني', 'capital'),
  ('Youssef Bin Issa Secondary School', 'ثانوية يوسف بن عيسى', 'capital'),
  -- CAPITAL - GIRLS
  ('Qurtuba Secondary School for Girls', 'ثانوية قرطبة للبنات', 'capital'),
  ('Fatima Bint Al-Walid Secondary School', 'ثانوية فاطمة بنت الوليد', 'capital'),
  -- HAWALLI - BOYS
  ('Jaber Al-Ahmad Al-Sabah Secondary School (Hawalli)', 'ثانوية جابر الأحمد الصباح', 'hawalli'),
  ('Abdul Razzaq Al-Bassir Secondary School', 'ثانوية عبدالرزاق البصير', 'hawalli'),
  ('Farhan Al-Khaled Secondary School', 'ثانوية فرحان الخالد', 'hawalli'),
  ('Palestine Secondary School', 'ثانوية فلسطين', 'hawalli'),
  ('Salah Al-Din Secondary School', 'ثانوية صلاح الدين', 'hawalli'),
  ('Fahad Al-Salem Secondary School', 'ثانوية فهد السالم', 'hawalli'),
  ('Fahd Al-Duwiri Secondary School', 'ثانوية فهد الدويري', 'hawalli'),
  -- HAWALLI - GIRLS
  ('Maria Al-Qibtiya Secondary School', 'ثانوية ماريا القبطية', 'hawalli'),
  ('Mushrif Secondary School for Girls', 'ثانوية مشرف للبنات', 'hawalli'),
  ('Hind Secondary School for Girls', 'ثانوية هند للبنات', 'hawalli'),
  -- FARWANIYA - BOYS
  ('Al-Shujaa Bin Al-Aslam Secondary School', 'ثانوية الشجاع بن الأسلم', 'farwaniya'),
  ('Ibn Al-Omaid Secondary School', 'ثانوية ابن العميد', 'farwaniya'),
  ('Anas Bin Malik Secondary School', 'ثانوية أنس بن مالك', 'farwaniya'),
  ('Juleib Al-Shuyoukh Secondary School', 'ثانوية جليب الشيوخ', 'farwaniya'),
  ('Salman Al-Farsi Secondary School', 'ثانوية سلمان الفارسي', 'farwaniya'),
  ('Abdul Latif Thunayan Al-Ghanem Secondary School', 'ثانوية عبداللطيف ثنيان الغانم', 'farwaniya'),
  ('Murshid Saad Al-Bathal Secondary School', 'ثانوية مرشد سعد البذال', 'farwaniya'),
  -- FARWANIYA - GIRLS
  ('Um Ziyad Secondary School for Girls', 'ثانوية أم زياد للبنات', 'farwaniya'),
  -- AHMADI - BOYS
  ('Al-Zour Secondary School', 'ثانوية الزور', 'ahmadi'),
  ('Al-Dahr Secondary School', 'ثانوية الظهر', 'ahmadi'),
  ('Al-Qurtubi Secondary School', 'ثانوية القرطبي', 'ahmadi'),
  ('Al-Siddiq Secondary School', 'ثانوية الصديق', 'ahmadi'),
  ('Al-Nasr Secondary School', 'ثانوية النصر', 'ahmadi'),
  ('Al-Kindi Secondary School', 'ثانوية الكندي', 'ahmadi'),
  ('Salem Al-Mubarak Secondary School', 'ثانوية سالم المبارك', 'ahmadi'),
  ('Saeed Bin Amer Secondary School', 'ثانوية سعيد بن عامر', 'ahmadi'),
  ('Abdullah Al-Ahmad Al-Sabah Secondary School', 'ثانوية عبدالله الأحمد الصباح', 'ahmadi'),
  ('Omar Bin Al-Khattab Secondary School', 'ثانوية عمر بن الخطاب', 'ahmadi'),
  ('Hisham Bin Al-Aas Secondary School', 'ثانوية هشام بن العاص', 'ahmadi'),
  -- AHMADI - GIRLS
  ('Awatif Khalifa Al-Athbi Al-Sabah Secondary School', 'ثانوية عواطف خليفة العذبي الصباح', 'ahmadi'),
  ('Fatima Bint Asad Secondary School', 'ثانوية فاطمة بنت أسد', 'ahmadi'),
  ('Lubna Bint Al-Harith Secondary School', 'ثانوية لبنى بنت الحارث', 'ahmadi'),
  ('Latifa Al-Fares Secondary School', 'ثانوية لطيفة الفارس', 'ahmadi'),
  ('Muadhah Al-Ghifariya Secondary School', 'ثانوية معاذة الغفارية', 'ahmadi'),
  ('Hadiya Secondary School for Girls', 'ثانوية هدية للبنات', 'ahmadi'),
  -- JAHRA - BOYS
  ('Al-Jahra Secondary School for Boys', 'ثانوية الجهراء للبنين', 'jahra'),
  ('Al-Waha Secondary School', 'ثانوية الواحة', 'jahra'),
  ('Thabit Bin Qais Secondary School', 'ثانوية ثابت بن قيس', 'jahra'),
  ('Jaber Al-Abdullah Al-Sabah Secondary School', 'ثانوية جابر العبدالله الصباح', 'jahra'),
  ('Khaled Bin Saeed Secondary School', 'ثانوية خالد بن سعيد', 'jahra'),
  ('Orwa Bin Al-Zubayr Secondary School', 'ثانوية عروة بن الزبير', 'jahra'),
  ('Sabah Al-Nasser Al-Sabah Secondary School', 'ثانوية صباح الناصر الصباح', 'jahra'),
  -- JAHRA - GIRLS
  ('Amra Bint Rawaha Secondary School', 'ثانوية عمرة بنت رواحة', 'jahra'),
  ('Fatima Bint Utba Secondary School', 'ثانوية فاطمة بنت عتبة', 'jahra'),
  ('Al-Jahra Secondary School for Girls', 'ثانوية الجهراء للبنات', 'jahra'),
  -- MUBARAK AL-KABEER - BOYS
  ('Al-Imam Malik Secondary School', 'ثانوية الإمام مالك', 'mubarak_alkabeer'),
  ('Jaber Al-Ali Al-Sabah Secondary School', 'ثانوية جابر العلي الصباح', 'mubarak_alkabeer'),
  ('Suleiman Al-Adassani Secondary School', 'ثانوية سليمان العدساني', 'mubarak_alkabeer'),
  ('Duaij Al-Salman Al-Sabah Secondary School', 'ثانوية دعيج السلمان الصباح', 'mubarak_alkabeer'),
  ('Khaled Saud Al-Zaid Secondary School', 'ثانوية خالد سعود الزيد', 'mubarak_alkabeer'),
  -- MUBARAK AL-KABEER - GIRLS
  ('Faria Bint Abi Al-Salt Secondary School', 'ثانوية فارعة بنت أبي الصلت', 'mubarak_alkabeer'),
  ('Fatima Al-Hashimiya Secondary School', 'ثانوية فاطمة الهاشمية', 'mubarak_alkabeer'),
  ('Layla Al-Ghifariya Secondary School', 'ثانوية ليلى الغفارية', 'mubarak_alkabeer');
