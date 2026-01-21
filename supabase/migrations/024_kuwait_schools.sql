-- =============================================
-- MIGRATION: Add all Kuwait Public Secondary Schools
-- =============================================

-- First, clear existing sample schools
DELETE FROM schools WHERE name_en IN (
  'Abdullah Al-Ahmad High School',
  'Jaber Al-Ahmad High School',
  'Kuwait High School',
  'Farwaniya High School'
);

-- Insert all Kuwait public secondary schools organized by governorate

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
  ('Youssef Bin Issa Secondary School', 'ثانوية يوسف بن عيسى', 'capital');

-- =============================================
-- CAPITAL (العاصمة) - GIRLS
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate) VALUES
  ('Qurtuba Secondary School for Girls', 'ثانوية قرطبة للبنات', 'capital'),
  ('Fatima Bint Al-Walid Secondary School', 'ثانوية فاطمة بنت الوليد', 'capital');

-- =============================================
-- HAWALLI (حولي) - BOYS
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate) VALUES
  ('Jaber Al-Ahmad Al-Sabah Secondary School (Hawalli)', 'ثانوية جابر الأحمد الصباح', 'hawalli'),
  ('Abdul Razzaq Al-Bassir Secondary School', 'ثانوية عبدالرزاق البصير', 'hawalli'),
  ('Farhan Al-Khaled Secondary School', 'ثانوية فرحان الخالد', 'hawalli'),
  ('Palestine Secondary School', 'ثانوية فلسطين', 'hawalli'),
  ('Salah Al-Din Secondary School', 'ثانوية صلاح الدين', 'hawalli'),
  ('Fahad Al-Salem Secondary School', 'ثانوية فهد السالم', 'hawalli'),
  ('Fahd Al-Duwiri Secondary School', 'ثانوية فهد الدويري', 'hawalli');

-- =============================================
-- HAWALLI (حولي) - GIRLS
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate) VALUES
  ('Maria Al-Qibtiya Secondary School', 'ثانوية ماريا القبطية', 'hawalli'),
  ('Mushrif Secondary School for Girls', 'ثانوية مشرف للبنات', 'hawalli'),
  ('Hind Secondary School for Girls', 'ثانوية هند للبنات', 'hawalli');

-- =============================================
-- FARWANIYA (الفروانية) - BOYS
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate) VALUES
  ('Al-Shujaa Bin Al-Aslam Secondary School', 'ثانوية الشجاع بن الأسلم', 'farwaniya'),
  ('Ibn Al-Omaid Secondary School', 'ثانوية ابن العميد', 'farwaniya'),
  ('Anas Bin Malik Secondary School', 'ثانوية أنس بن مالك', 'farwaniya'),
  ('Juleib Al-Shuyoukh Secondary School', 'ثانوية جليب الشيوخ', 'farwaniya'),
  ('Salman Al-Farsi Secondary School', 'ثانوية سلمان الفارسي', 'farwaniya'),
  ('Abdul Latif Thunayan Al-Ghanem Secondary School', 'ثانوية عبداللطيف ثنيان الغانم', 'farwaniya'),
  ('Murshid Saad Al-Bathal Secondary School', 'ثانوية مرشد سعد البذال', 'farwaniya');

-- =============================================
-- FARWANIYA (الفروانية) - GIRLS
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate) VALUES
  ('Um Ziyad Secondary School for Girls', 'ثانوية أم زياد للبنات', 'farwaniya');

-- =============================================
-- AHMADI (الأحمدي) - BOYS
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate) VALUES
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
  ('Hisham Bin Al-Aas Secondary School', 'ثانوية هشام بن العاص', 'ahmadi');

-- =============================================
-- AHMADI (الأحمدي) - GIRLS
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate) VALUES
  ('Awatif Khalifa Al-Athbi Al-Sabah Secondary School', 'ثانوية عواطف خليفة العذبي الصباح', 'ahmadi'),
  ('Fatima Bint Asad Secondary School', 'ثانوية فاطمة بنت أسد', 'ahmadi'),
  ('Lubna Bint Al-Harith Secondary School', 'ثانوية لبنى بنت الحارث', 'ahmadi'),
  ('Latifa Al-Fares Secondary School', 'ثانوية لطيفة الفارس', 'ahmadi'),
  ('Muadhah Al-Ghifariya Secondary School', 'ثانوية معاذة الغفارية', 'ahmadi'),
  ('Hadiya Secondary School for Girls', 'ثانوية هدية للبنات', 'ahmadi');

-- =============================================
-- JAHRA (الجهراء) - BOYS
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate) VALUES
  ('Al-Jahra Secondary School for Boys', 'ثانوية الجهراء للبنين', 'jahra'),
  ('Al-Waha Secondary School', 'ثانوية الواحة', 'jahra'),
  ('Thabit Bin Qais Secondary School', 'ثانوية ثابت بن قيس', 'jahra'),
  ('Jaber Al-Abdullah Al-Sabah Secondary School', 'ثانوية جابر العبدالله الصباح', 'jahra'),
  ('Khaled Bin Saeed Secondary School', 'ثانوية خالد بن سعيد', 'jahra'),
  ('Orwa Bin Al-Zubayr Secondary School', 'ثانوية عروة بن الزبير', 'jahra'),
  ('Sabah Al-Nasser Al-Sabah Secondary School', 'ثانوية صباح الناصر الصباح', 'jahra');

-- =============================================
-- JAHRA (الجهراء) - GIRLS
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate) VALUES
  ('Amra Bint Rawaha Secondary School', 'ثانوية عمرة بنت رواحة', 'jahra'),
  ('Fatima Bint Utba Secondary School', 'ثانوية فاطمة بنت عتبة', 'jahra'),
  ('Al-Jahra Secondary School for Girls', 'ثانوية الجهراء للبنات', 'jahra');

-- =============================================
-- MUBARAK AL-KABEER (مبارك الكبير) - BOYS
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate) VALUES
  ('Al-Imam Malik Secondary School', 'ثانوية الإمام مالك', 'mubarak_alkabeer'),
  ('Jaber Al-Ali Al-Sabah Secondary School', 'ثانوية جابر العلي الصباح', 'mubarak_alkabeer'),
  ('Suleiman Al-Adassani Secondary School', 'ثانوية سليمان العدساني', 'mubarak_alkabeer'),
  ('Duaij Al-Salman Al-Sabah Secondary School', 'ثانوية دعيج السلمان الصباح', 'mubarak_alkabeer'),
  ('Khaled Saud Al-Zaid Secondary School', 'ثانوية خالد سعود الزيد', 'mubarak_alkabeer');

-- =============================================
-- MUBARAK AL-KABEER (مبارك الكبير) - GIRLS
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate) VALUES
  ('Faria Bint Abi Al-Salt Secondary School', 'ثانوية فارعة بنت أبي الصلت', 'mubarak_alkabeer'),
  ('Fatima Al-Hashimiya Secondary School', 'ثانوية فاطمة الهاشمية', 'mubarak_alkabeer'),
  ('Layla Al-Ghifariya Secondary School', 'ثانوية ليلى الغفارية', 'mubarak_alkabeer');
