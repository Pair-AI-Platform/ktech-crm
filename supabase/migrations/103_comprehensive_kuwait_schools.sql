-- =============================================
-- MIGRATION: Comprehensive Kuwait Schools Addition
-- Adds missing schools across all governorates and types:
-- - Government middle schools (متوسط)
-- - Additional government secondary schools
-- - Indian curriculum schools
-- - Pakistani curriculum schools
-- - French/Bilingual curriculum schools
-- - Philippine curriculum schools
-- - KSA curriculum schools
-- - Additional private/international schools
-- Uses WHERE NOT EXISTS to avoid duplicates
-- =============================================

-- =============================================
-- INDIAN CURRICULUM SCHOOLS
-- =============================================
INSERT INTO schools (name_en, name_ar, school_type, gender, is_active)
SELECT v.name_en, v.name_ar, 'others', v.gender, true
FROM (VALUES
  ('Indian Community School Kuwait (ICSK) - Khaitan', 'المدرسة الهندية الكويت - خيطان', 'mixed'),
  ('Indian Community School Kuwait (ICSK) - Amman', 'المدرسة الهندية الكويت - عمان', 'mixed'),
  ('Indian Community School Kuwait (ICSK) - Junior', 'المدرسة الهندية الكويت - الصغار', 'mixed'),
  ('Indian Community School Kuwait (ICSK) - Senior', 'المدرسة الهندية الكويت - الكبار', 'mixed'),
  ('Indian Central School (ICS)', 'المدرسة الهندية المركزية', 'mixed'),
  ('Indian Learners Own Academy (ILOA)', 'أكاديمية المتعلمين الهنود', 'mixed'),
  ('Indian English Academy School (IEAS)', 'مدرسة الأكاديمية الإنجليزية الهندية', 'mixed'),
  ('Carmel School Kuwait', 'مدرسة الكرمل الكويت', 'mixed'),
  ('Bharatiya Vidya Bhavan (BVB)', 'مدرسة بهاراتيا فيديا بهافان', 'mixed'),
  ('Smart Indian School (SIS)', 'المدرسة الهندية الذكية', 'mixed'),
  ('India International School (IIS)', 'المدرسة الهندية الدولية', 'mixed'),
  ('Gulf Indian School (GIS)', 'مدرسة الخليج الهندية', 'mixed'),
  ('Indian Educational School (IES)', 'المدرسة التعليمية الهندية', 'mixed'),
  ('Jabriya Indian School', 'المدرسة الهندية الجابرية', 'mixed'),
  ('Salmiya Indian Model School (SIMS)', 'مدرسة السالمية الهندية النموذجية', 'mixed'),
  ('Fahaheel Al-Watanieh Indian Private School', 'مدرسة الفحيحيل الوطنية الهندية الخاصة', 'mixed'),
  ('United Indian School (UIS)', 'المدرسة الهندية المتحدة', 'mixed'),
  ('Indian Model School', 'المدرسة الهندية النموذجية', 'mixed'),
  ('Integrated Indian School', 'المدرسة الهندية المتكاملة', 'mixed'),
  ('Kuwait Indian School', 'مدرسة الكويت الهندية', 'mixed'),
  ('National Indian School', 'المدرسة الهندية الوطنية', 'mixed'),
  ('Indian Academy School', 'أكاديمية المدرسة الهندية', 'mixed'),
  ('Don Bosco Indian School', 'مدرسة دون بوسكو الهندية', 'mixed'),
  ('Crescent English School', 'مدرسة الهلال الإنجليزية', 'mixed')
) AS v(name_en, name_ar, gender)
WHERE NOT EXISTS (SELECT 1 FROM schools s WHERE s.name_ar = v.name_ar);

-- =============================================
-- PAKISTANI CURRICULUM SCHOOLS
-- =============================================
INSERT INTO schools (name_en, name_ar, school_type, gender, is_active)
SELECT v.name_en, v.name_ar, 'others', v.gender, true
FROM (VALUES
  ('Pakistan English School (PES)', 'المدرسة الباكستانية الإنجليزية', 'mixed'),
  ('Pakistan Community School', 'مدرسة الجالية الباكستانية', 'mixed'),
  ('Islamia English School', 'المدرسة الإسلامية الإنجليزية', 'mixed'),
  ('Lahore Lyceum School', 'مدرسة لاهور ليسيوم', 'mixed'),
  ('Fazaia Inter College', 'كلية فضائية', 'mixed'),
  ('New Pakistan International School', 'مدرسة باكستان الدولية الجديدة', 'mixed'),
  ('Pakistan Educators School', 'مدرسة المعلمين الباكستانية', 'mixed'),
  ('Al-Maarif International School', 'مدرسة المعارف الدولية', 'mixed'),
  ('Gulf Pakistani School', 'مدرسة الخليج الباكستانية', 'mixed')
) AS v(name_en, name_ar, gender)
WHERE NOT EXISTS (SELECT 1 FROM schools s WHERE s.name_ar = v.name_ar);

-- =============================================
-- FRENCH / BILINGUAL CURRICULUM SCHOOLS
-- =============================================
INSERT INTO schools (name_en, name_ar, school_type, gender, is_active)
SELECT v.name_en, v.name_ar, 'others', v.gender, true
FROM (VALUES
  ('Lycée Français de Koweït', 'المدرسة الفرنسية في الكويت', 'mixed'),
  ('French Academy Kuwait', 'الأكاديمية الفرنسية الكويت', 'mixed'),
  ('Lycée Franco-Koweïtien', 'الليسيه الفرنسية الكويتية', 'mixed'),
  ('International French School (IFS)', 'المدرسة الفرنسية الدولية', 'mixed')
) AS v(name_en, name_ar, gender)
WHERE NOT EXISTS (SELECT 1 FROM schools s WHERE s.name_ar = v.name_ar);

-- =============================================
-- PHILIPPINE CURRICULUM SCHOOLS
-- =============================================
INSERT INTO schools (name_en, name_ar, school_type, gender, is_active)
SELECT v.name_en, v.name_ar, 'others', v.gender, true
FROM (VALUES
  ('Philippine School Kuwait', 'المدرسة الفلبينية الكويت', 'mixed'),
  ('Philippine International School', 'المدرسة الفلبينية الدولية', 'mixed'),
  ('Al-Rawdah Philippine School', 'مدرسة الروضة الفلبينية', 'mixed'),
  ('Filipino Academy Kuwait', 'الأكاديمية الفلبينية الكويت', 'mixed')
) AS v(name_en, name_ar, gender)
WHERE NOT EXISTS (SELECT 1 FROM schools s WHERE s.name_ar = v.name_ar);

-- =============================================
-- KSA (SAUDI) CURRICULUM SCHOOLS
-- =============================================
INSERT INTO schools (name_en, name_ar, school_type, gender, is_active)
SELECT v.name_en, v.name_ar, 'ksa', v.gender, true
FROM (VALUES
  ('Saudi Schools in Kuwait - Boys', 'المدارس السعودية في الكويت - بنين', 'male'),
  ('Saudi Schools in Kuwait - Girls', 'المدارس السعودية في الكويت - بنات', 'female'),
  ('Al-Manahij Al-Arabiah School', 'مدرسة المناهج العربية', 'mixed'),
  ('Al-Watan Al-Arabi School', 'مدرسة الوطن العربي', 'mixed'),
  ('Dar Al-Fikr School', 'مدرسة دار الفكر', 'mixed'),
  ('Al-Fajr Al-Jadeed Islamic School', 'مدرسة الفجر الجديد الإسلامية', 'mixed'),
  ('Al-Iman Bilingual School', 'مدرسة الإيمان ثنائية اللغة', 'mixed'),
  ('Al-Tarbiya Al-Namouthajiah', 'مدرسة التربية النموذجية', 'mixed')
) AS v(name_en, name_ar, gender)
WHERE NOT EXISTS (SELECT 1 FROM schools s WHERE s.name_ar = v.name_ar);

-- =============================================
-- ADDITIONAL PRIVATE/INTERNATIONAL SCHOOLS
-- =============================================
INSERT INTO schools (name_en, name_ar, school_type, gender, is_active)
SELECT v.name_en, v.name_ar, v.school_type, v.gender, true
FROM (VALUES
  -- More American/International
  ('American School of Creative Science (ASCS)', 'المدرسة الأمريكية للعلوم الإبداعية', 'us', 'mixed'),
  ('Kuwait National Guard School', 'مدرسة الحرس الوطني الكويتي', 'us', 'mixed'),
  ('Al-Jahra American School', 'مدرسة الجهراء الأمريكية', 'us', 'mixed'),
  ('Discovery Learning Academy', 'أكاديمية ديسكفري للتعلم', 'us', 'mixed'),
  ('Kuwait Pioneers School', 'مدرسة رواد الكويت', 'us', 'mixed'),
  ('American Trilingual School (ATS)', 'المدرسة الأمريكية ثلاثية اللغات', 'us', 'mixed'),
  ('International Academy of Kuwait (IAK)', 'الأكاديمية الدولية في الكويت', 'us', 'mixed'),
  ('Learners International School', 'مدرسة المتعلمين الدولية', 'us', 'mixed'),
  ('American Creative Academy', 'الأكاديمية الأمريكية الإبداعية', 'us', 'mixed'),
  ('Al-Wataniya International School', 'مدرسة الوطنية الدولية', 'us', 'mixed'),

  -- More British
  ('Regent International School', 'مدرسة ريجنت الدولية', 'uk', 'mixed'),
  ('Durham School for Girls', 'مدرسة دورهام للبنات', 'uk', 'female'),
  ('Al-Mulla International School', 'مدرسة الملا الدولية', 'uk', 'mixed'),
  ('Abdulla Al-Salem Academy', 'أكاديمية عبدالله السالم', 'uk', 'mixed'),
  ('Future International Academy', 'أكاديمية المستقبل الدولية', 'uk', 'mixed'),
  ('Heritage Bilingual School', 'مدرسة التراث ثنائية اللغة', 'uk', 'mixed'),
  ('Al-Dharra Bilingual School', 'مدرسة الذرة ثنائية اللغة', 'uk', 'mixed'),
  ('International Bilingual School of Kuwait', 'مدرسة الكويت الدولية ثنائية اللغة', 'uk', 'mixed'),

  -- Other international
  ('Armenian Evangelical School', 'المدرسة الأرمنية الإنجيلية', 'others', 'mixed'),
  ('Iranian School in Kuwait', 'المدرسة الإيرانية في الكويت', 'others', 'mixed'),
  ('Egyptian School in Kuwait', 'المدرسة المصرية في الكويت', 'others', 'mixed'),
  ('Jordanian School in Kuwait', 'المدرسة الأردنية في الكويت', 'others', 'mixed'),
  ('Syrian School in Kuwait', 'المدرسة السورية في الكويت', 'others', 'mixed'),
  ('Lebanese School in Kuwait', 'المدرسة اللبنانية في الكويت', 'others', 'mixed'),
  ('Palestinian School in Kuwait', 'المدرسة الفلسطينية في الكويت', 'others', 'mixed'),
  ('Turkish International School', 'المدرسة التركية الدولية', 'others', 'mixed'),
  ('German School Kuwait', 'المدرسة الألمانية الكويت', 'others', 'mixed'),
  ('Bangladesh School Kuwait', 'مدرسة بنغلاديش الكويت', 'others', 'mixed'),
  ('Sri Lanka School Kuwait', 'مدرسة سريلانكا الكويت', 'others', 'mixed'),
  ('Universal Academy Kuwait', 'الأكاديمية العالمية الكويت', 'others', 'mixed')
) AS v(name_en, name_ar, school_type, gender)
WHERE NOT EXISTS (SELECT 1 FROM schools s WHERE s.name_ar = v.name_ar);

-- =============================================
-- GOVERNMENT MIDDLE SCHOOLS (متوسط) - CAPITAL (العاصمة)
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate, school_type, gender, is_active)
SELECT v.name_en, v.name_ar, v.gov::governorate, 'gov', v.gender, true
FROM (VALUES
  -- Capital - Boys Middle
  ('Saud Al-Kharji Middle', 'سعود الخرجي م', 'capital', 'male'),
  ('Abdullah Al-Omar Middle', 'عبدالله العمر م', 'capital', 'male'),
  ('Mansour Al-Atiqi Middle', 'منصور العتيقي م', 'capital', 'male'),
  ('Abdulaziz Al-Anbai Middle', 'عبدالعزيز الأنباعي م', 'capital', 'male'),
  ('Khaled Bin Saeed Middle', 'خالد بن سعيد م', 'capital', 'male'),
  ('Mohammad Al-Shayji Middle', 'محمد الشايجي م', 'capital', 'male'),
  ('Ahmad Al-Bishr Middle', 'أحمد البشر م', 'capital', 'male'),
  ('Suleiman Al-Roudhan Middle', 'سليمان الروضان م', 'capital', 'male'),
  ('Abdul Mohsen Al-Babtain Middle', 'عبدالمحسن البابطين م', 'capital', 'male'),
  ('Al-Shamiya Middle Boys', 'الشامية م بنين', 'capital', 'male'),
  ('Al-Qadisiya Middle Boys', 'القادسية م بنين', 'capital', 'male'),
  ('Al-Mansouriya Middle Boys', 'المنصورية م بنين', 'capital', 'male'),
  ('Al-Nuzha Middle Boys', 'النزهة م بنين', 'capital', 'male'),
  ('Al-Khaldiya Middle Boys', 'الخالدية م بنين', 'capital', 'male'),
  ('Kaifan Middle Boys', 'كيفان م بنين', 'capital', 'male'),
  ('Al-Faiha Middle Boys', 'الفيحاء م بنين', 'capital', 'male'),
  ('Abdullah Al-Salem Middle Boys', 'عبدالله السالم م بنين', 'capital', 'male'),
  ('Al-Dasma Middle Boys', 'الدسمة م بنين', 'capital', 'male'),
  ('Sharq Middle Boys', 'شرق م بنين', 'capital', 'male'),

  -- Capital - Girls Middle
  ('Muneera Al-Adwani Middle', 'منيرة العدواني م', 'capital', 'female'),
  ('Fatima Al-Othman Middle', 'فاطمة العثمان م', 'capital', 'female'),
  ('Sheikha Al-Badr Middle', 'شيخة البدر م', 'capital', 'female'),
  ('Hessa Al-Fulaij Middle', 'حصة الفليج م', 'capital', 'female'),
  ('Al-Shamiya Middle Girls', 'الشامية م بنات', 'capital', 'female'),
  ('Al-Qadisiya Middle Girls', 'القادسية م بنات', 'capital', 'female'),
  ('Al-Mansouriya Middle Girls', 'المنصورية م بنات', 'capital', 'female'),
  ('Al-Nuzha Middle Girls', 'النزهة م بنات', 'capital', 'female'),
  ('Al-Khaldiya Middle Girls', 'الخالدية م بنات', 'capital', 'female'),
  ('Kaifan Middle Girls', 'كيفان م بنات', 'capital', 'female'),
  ('Al-Faiha Middle Girls', 'الفيحاء م بنات', 'capital', 'female'),
  ('Abdullah Al-Salem Middle Girls', 'عبدالله السالم م بنات', 'capital', 'female'),
  ('Al-Dasma Middle Girls', 'الدسمة م بنات', 'capital', 'female'),
  ('Al-Sulaibikhat Middle Girls', 'الصليبيخات م بنات', 'capital', 'female'),
  ('Surra Middle Girls', 'السرة م بنات', 'capital', 'female'),
  ('Al-Yarmouk Middle Girls', 'اليرموك م بنات', 'capital', 'female'),
  ('Al-Rawda Middle Girls', 'الروضة م بنات', 'capital', 'female'),
  ('Al-Adailiya Middle Girls', 'العديلية م بنات', 'capital', 'female'),

  -- Hawalli - Boys Middle
  ('Hawalli Middle Boys', 'حولي م بنين', 'hawalli', 'male'),
  ('Al-Salmiya Middle Boys', 'السالمية م بنين', 'hawalli', 'male'),
  ('Mishref Middle Boys', 'مشرف م بنين', 'hawalli', 'male'),
  ('Bayan Middle Boys', 'بيان م بنين', 'hawalli', 'male'),
  ('Al-Jabriya Middle Boys', 'الجابرية م بنين', 'hawalli', 'male'),
  ('Al-Rumaithiya Middle Boys', 'الرميثية م بنين', 'hawalli', 'male'),
  ('Al-Shuhada Middle Boys', 'الشهداء م بنين', 'hawalli', 'male'),
  ('Al-Siddeeq Middle Boys', 'الصديق م بنين', 'hawalli', 'male'),
  ('Salwa Middle Boys', 'سلوى م بنين', 'hawalli', 'male'),
  ('Hateen Middle Boys', 'حطين م بنين', 'hawalli', 'male'),
  ('Maidan Hawally Middle Boys', 'ميدان حولي م بنين', 'hawalli', 'male'),
  ('Al-Zahra Middle Boys', 'الزهراء م بنين', 'hawalli', 'male'),
  ('Abdullah Al-Mubarak Middle Hawalli', 'عبدالله المبارك م حولي', 'hawalli', 'male'),
  ('Sabah Al-Nasser Middle Hawalli', 'صباح الناصر م حولي', 'hawalli', 'male'),

  -- Hawalli - Girls Middle
  ('Hawalli Middle Girls', 'حولي م بنات', 'hawalli', 'female'),
  ('Al-Salmiya Middle Girls', 'السالمية م بنات', 'hawalli', 'female'),
  ('Mishref Middle Girls', 'مشرف م بنات', 'hawalli', 'female'),
  ('Bayan Middle Girls', 'بيان م بنات', 'hawalli', 'female'),
  ('Al-Jabriya Middle Girls', 'الجابرية م بنات', 'hawalli', 'female'),
  ('Al-Rumaithiya Middle Girls', 'الرميثية م بنات', 'hawalli', 'female'),
  ('Al-Shuhada Middle Girls', 'الشهداء م بنات', 'hawalli', 'female'),
  ('Al-Siddeeq Middle Girls', 'الصديق م بنات', 'hawalli', 'female'),
  ('Salwa Middle Girls', 'سلوى م بنات', 'hawalli', 'female'),
  ('Hateen Middle Girls', 'حطين م بنات', 'hawalli', 'female'),
  ('Al-Zahra Middle Girls', 'الزهراء م بنات', 'hawalli', 'female'),
  ('Al-Shaab Middle Girls', 'الشعب م بنات', 'hawalli', 'female'),
  ('Nugra Middle Girls', 'النقرة م بنات', 'hawalli', 'female'),

  -- Farwaniya - Boys Middle
  ('Farwaniya Middle Boys', 'الفروانية م بنين', 'farwaniya', 'male'),
  ('Khaitan Middle Boys', 'خيطان م بنين', 'farwaniya', 'male'),
  ('Jleeb Al-Shuyoukh Middle Boys', 'جليب الشيوخ م بنين', 'farwaniya', 'male'),
  ('Al-Rai Middle Boys', 'الري م بنين', 'farwaniya', 'male'),
  ('Sabah Al-Nasser Middle Farwaniya', 'صباح الناصر م الفروانية', 'farwaniya', 'male'),
  ('Al-Firdous Middle Boys', 'الفردوس م بنين', 'farwaniya', 'male'),
  ('Al-Andalus Middle Boys', 'الأندلس م بنين', 'farwaniya', 'male'),
  ('Al-Rehab Middle Boys', 'الرحاب م بنين', 'farwaniya', 'male'),
  ('Ishbiliya Middle Boys', 'إشبيلية م بنين', 'farwaniya', 'male'),
  ('Al-Ardhiya Middle Boys', 'العارضية م بنين', 'farwaniya', 'male'),
  ('Al-Rabiya Middle Boys', 'الربية م بنين', 'farwaniya', 'male'),
  ('Al-Omariya Middle Boys', 'العمرية م بنين', 'farwaniya', 'male'),
  ('Abdullah Al-Mubarak Middle Farwaniya', 'عبدالله المبارك م الفروانية', 'farwaniya', 'male'),
  ('Abraq Khaitan Middle Boys', 'أبرق خيطان م بنين', 'farwaniya', 'male'),
  ('South Khaitan Middle Boys', 'جنوب خيطان م بنين', 'farwaniya', 'male'),

  -- Farwaniya - Girls Middle
  ('Farwaniya Middle Girls', 'الفروانية م بنات', 'farwaniya', 'female'),
  ('Khaitan Middle Girls', 'خيطان م بنات', 'farwaniya', 'female'),
  ('Jleeb Al-Shuyoukh Middle Girls', 'جليب الشيوخ م بنات', 'farwaniya', 'female'),
  ('Al-Rai Middle Girls', 'الري م بنات', 'farwaniya', 'female'),
  ('Al-Firdous Middle Girls', 'الفردوس م بنات', 'farwaniya', 'female'),
  ('Al-Andalus Middle Girls', 'الأندلس م بنات', 'farwaniya', 'female'),
  ('Al-Rehab Middle Girls', 'الرحاب م بنات', 'farwaniya', 'female'),
  ('Ishbiliya Middle Girls', 'إشبيلية م بنات', 'farwaniya', 'female'),
  ('Al-Ardhiya Middle Girls', 'العارضية م بنات', 'farwaniya', 'female'),
  ('Al-Rabiya Middle Girls', 'الربية م بنات', 'farwaniya', 'female'),
  ('Al-Omariya Middle Girls', 'العمرية م بنات', 'farwaniya', 'female'),
  ('Abdullah Al-Mubarak Middle Girls', 'عبدالله المبارك م بنات', 'farwaniya', 'female'),
  ('Abraq Khaitan Middle Girls', 'أبرق خيطان م بنات', 'farwaniya', 'female'),
  ('South Khaitan Middle Girls', 'جنوب خيطان م بنات', 'farwaniya', 'female'),

  -- Ahmadi - Boys Middle
  ('Ahmadi Middle Boys', 'الأحمدي م بنين', 'ahmadi', 'male'),
  ('Fahaheel Middle Boys', 'الفحيحيل م بنين', 'ahmadi', 'male'),
  ('Mangaf Middle Boys', 'المنقف م بنين', 'ahmadi', 'male'),
  ('Abu Halifa Middle Boys', 'أبو حليفة م بنين', 'ahmadi', 'male'),
  ('Sabahiya Middle Boys', 'الصباحية م بنين', 'ahmadi', 'male'),
  ('Riqqa Middle Boys', 'الرقة م بنين', 'ahmadi', 'male'),
  ('Fintas Middle Boys', 'الفنطاس م بنين', 'ahmadi', 'male'),
  ('Mahboula Middle Boys', 'المهبولة م بنين', 'ahmadi', 'male'),
  ('Wafra Middle Boys', 'الوفرة م بنين', 'ahmadi', 'male'),
  ('Al-Zuhor Middle Boys', 'الزهور م بنين', 'ahmadi', 'male'),
  ('Hadiya Middle Boys', 'هدية م بنين', 'ahmadi', 'male'),
  ('Mubarak Al-Kabeer Middle Boys Ahmadi', 'مبارك الكبير م بنين الأحمدي', 'ahmadi', 'male'),
  ('Jaber Al-Ali Middle Boys', 'جابر العلي م بنين', 'ahmadi', 'male'),
  ('Fahad Al-Ahmad Middle Boys', 'فهد الأحمد م بنين', 'ahmadi', 'male'),
  ('Ali Sabah Al-Salem Middle Boys', 'علي صباح السالم م بنين', 'ahmadi', 'male'),
  ('South Sabahiya Middle Boys', 'جنوب الصباحية م بنين', 'ahmadi', 'male'),

  -- Ahmadi - Girls Middle
  ('Ahmadi Middle Girls', 'الأحمدي م بنات', 'ahmadi', 'female'),
  ('Fahaheel Middle Girls', 'الفحيحيل م بنات', 'ahmadi', 'female'),
  ('Mangaf Middle Girls', 'المنقف م بنات', 'ahmadi', 'female'),
  ('Abu Halifa Middle Girls', 'أبو حليفة م بنات', 'ahmadi', 'female'),
  ('Sabahiya Middle Girls', 'الصباحية م بنات', 'ahmadi', 'female'),
  ('Riqqa Middle Girls', 'الرقة م بنات', 'ahmadi', 'female'),
  ('Fintas Middle Girls', 'الفنطاس م بنات', 'ahmadi', 'female'),
  ('Mahboula Middle Girls', 'المهبولة م بنات', 'ahmadi', 'female'),
  ('Wafra Middle Girls', 'الوفرة م بنات', 'ahmadi', 'female'),
  ('Al-Zuhor Middle Girls', 'الزهور م بنات', 'ahmadi', 'female'),
  ('Hadiya Middle Girls', 'هدية م بنات', 'ahmadi', 'female'),
  ('Jaber Al-Ali Middle Girls', 'جابر العلي م بنات', 'ahmadi', 'female'),
  ('Fahad Al-Ahmad Middle Girls', 'فهد الأحمد م بنات', 'ahmadi', 'female'),
  ('Ali Sabah Al-Salem Middle Girls', 'علي صباح السالم م بنات', 'ahmadi', 'female'),
  ('South Sabahiya Middle Girls', 'جنوب الصباحية م بنات', 'ahmadi', 'female'),
  ('Eqaila Middle Girls', 'العقيلة م بنات', 'ahmadi', 'female'),

  -- Jahra - Boys Middle
  ('Jahra Middle Boys', 'الجهراء م بنين', 'jahra', 'male'),
  ('Sulaibiya Middle Boys', 'الصليبية م بنين', 'jahra', 'male'),
  ('Saad Al-Abdullah Middle Boys', 'سعد العبدالله م بنين', 'jahra', 'male'),
  ('Al-Naeem Middle Boys', 'النعيم م بنين', 'jahra', 'male'),
  ('Al-Qasr Middle Boys', 'القصر م بنين', 'jahra', 'male'),
  ('Taima Middle Boys', 'تيماء م بنين', 'jahra', 'male'),
  ('Al-Oyoun Middle Boys', 'العيون م بنين', 'jahra', 'male'),
  ('Kabd Middle Boys', 'كبد م بنين', 'jahra', 'male'),
  ('Al-Nasseem Middle Boys', 'النسيم م بنين', 'jahra', 'male'),
  ('Amgarah Middle Boys', 'أمغرة م بنين', 'jahra', 'male'),
  ('Jaber Al-Ahmad City Middle Boys', 'مدينة جابر الأحمد م بنين', 'jahra', 'male'),
  ('South Saad Al-Abdullah Middle Boys', 'جنوب سعد العبدالله م بنين', 'jahra', 'male'),

  -- Jahra - Girls Middle
  ('Jahra Middle Girls', 'الجهراء م بنات', 'jahra', 'female'),
  ('Sulaibiya Middle Girls', 'الصليبية م بنات', 'jahra', 'female'),
  ('Saad Al-Abdullah Middle Girls', 'سعد العبدالله م بنات', 'jahra', 'female'),
  ('Al-Naeem Middle Girls', 'النعيم م بنات', 'jahra', 'female'),
  ('Al-Qasr Middle Girls', 'القصر م بنات', 'jahra', 'female'),
  ('Taima Middle Girls', 'تيماء م بنات', 'jahra', 'female'),
  ('Al-Oyoun Middle Girls', 'العيون م بنات', 'jahra', 'female'),
  ('Kabd Middle Girls', 'كبد م بنات', 'jahra', 'female'),
  ('Al-Nasseem Middle Girls', 'النسيم م بنات', 'jahra', 'female'),
  ('Amgarah Middle Girls', 'أمغرة م بنات', 'jahra', 'female'),
  ('Jaber Al-Ahmad City Middle Girls', 'مدينة جابر الأحمد م بنات', 'jahra', 'female'),
  ('South Saad Al-Abdullah Middle Girls', 'جنوب سعد العبدالله م بنات', 'jahra', 'female'),
  ('Al-Waha Middle Girls', 'الواحة م بنات', 'jahra', 'female'),

  -- Mubarak Al-Kabeer - Boys Middle
  ('Mubarak Al-Kabeer Middle Boys', 'مبارك الكبير م بنين', 'mubarak_alkabeer', 'male'),
  ('Sabah Al-Salem Middle Boys', 'صباح السالم م بنين', 'mubarak_alkabeer', 'male'),
  ('Al-Qurain Middle Boys', 'القرين م بنين', 'mubarak_alkabeer', 'male'),
  ('Al-Adan Middle Boys', 'العدان م بنين', 'mubarak_alkabeer', 'male'),
  ('Al-Qusour Middle Boys', 'القصور م بنين', 'mubarak_alkabeer', 'male'),
  ('Al-Masayel Middle Boys', 'المسايل م بنين', 'mubarak_alkabeer', 'male'),
  ('Al-Funaitees Middle Boys', 'الفنيطيس م بنين', 'mubarak_alkabeer', 'male'),
  ('Abu Ftaira Middle Boys', 'أبو فطيرة م بنين', 'mubarak_alkabeer', 'male'),
  ('Abu Al-Hasaniya Middle Boys', 'أبو الحصانية م بنين', 'mubarak_alkabeer', 'male'),
  ('West Abu Ftaira Middle Boys', 'غرب أبو فطيرة م بنين', 'mubarak_alkabeer', 'male'),

  -- Mubarak Al-Kabeer - Girls Middle
  ('Mubarak Al-Kabeer Middle Girls', 'مبارك الكبير م بنات', 'mubarak_alkabeer', 'female'),
  ('Sabah Al-Salem Middle Girls', 'صباح السالم م بنات', 'mubarak_alkabeer', 'female'),
  ('Al-Qurain Middle Girls', 'القرين م بنات', 'mubarak_alkabeer', 'female'),
  ('Al-Adan Middle Girls', 'العدان م بنات', 'mubarak_alkabeer', 'female'),
  ('Al-Qusour Middle Girls', 'القصور م بنات', 'mubarak_alkabeer', 'female'),
  ('Al-Masayel Middle Girls', 'المسايل م بنات', 'mubarak_alkabeer', 'female'),
  ('Al-Funaitees Middle Girls', 'الفنيطيس م بنات', 'mubarak_alkabeer', 'female'),
  ('Abu Ftaira Middle Girls', 'أبو فطيرة م بنات', 'mubarak_alkabeer', 'female'),
  ('Abu Al-Hasaniya Middle Girls', 'أبو الحصانية م بنات', 'mubarak_alkabeer', 'female'),
  ('West Abu Ftaira Middle Girls', 'غرب أبو فطيرة م بنات', 'mubarak_alkabeer', 'female')
) AS v(name_en, name_ar, gov, gender)
WHERE NOT EXISTS (SELECT 1 FROM schools s WHERE s.name_ar = v.name_ar);

-- =============================================
-- GOVERNMENT PRIMARY SCHOOLS (ابتدائي) - ALL GOVERNORATES
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate, school_type, gender, is_active)
SELECT v.name_en, v.name_ar, v.gov::governorate, 'gov', v.gender, true
FROM (VALUES
  -- Capital - Boys Primary
  ('Al-Shamiya Primary Boys', 'الشامية ب بنين', 'capital', 'male'),
  ('Al-Qadisiya Primary Boys', 'القادسية ب بنين', 'capital', 'male'),
  ('Al-Mansouriya Primary Boys', 'المنصورية ب بنين', 'capital', 'male'),
  ('Al-Nuzha Primary Boys', 'النزهة ب بنين', 'capital', 'male'),
  ('Kaifan Primary Boys', 'كيفان ب بنين', 'capital', 'male'),
  ('Al-Faiha Primary Boys', 'الفيحاء ب بنين', 'capital', 'male'),
  ('Al-Khaldiya Primary Boys', 'الخالدية ب بنين', 'capital', 'male'),
  ('Abdullah Al-Salem Primary Boys', 'عبدالله السالم ب بنين', 'capital', 'male'),
  ('Al-Dasma Primary Boys', 'الدسمة ب بنين', 'capital', 'male'),
  ('Surra Primary Boys', 'السرة ب بنين', 'capital', 'male'),
  ('Al-Yarmouk Primary Boys', 'اليرموك ب بنين', 'capital', 'male'),
  ('Al-Rawda Primary Boys', 'الروضة ب بنين', 'capital', 'male'),
  ('Al-Sulaibikhat Primary Boys', 'الصليبيخات ب بنين', 'capital', 'male'),
  ('Al-Doha Primary Boys', 'الدوحة ب بنين', 'capital', 'male'),
  ('Al-Adailiya Primary Boys', 'العديلية ب بنين', 'capital', 'male'),
  ('Qortuba Primary Boys', 'قرطبة ب بنين', 'capital', 'male'),

  -- Capital - Girls Primary
  ('Al-Shamiya Primary Girls', 'الشامية ب بنات', 'capital', 'female'),
  ('Al-Qadisiya Primary Girls', 'القادسية ب بنات', 'capital', 'female'),
  ('Al-Mansouriya Primary Girls', 'المنصورية ب بنات', 'capital', 'female'),
  ('Al-Nuzha Primary Girls', 'النزهة ب بنات', 'capital', 'female'),
  ('Kaifan Primary Girls', 'كيفان ب بنات', 'capital', 'female'),
  ('Al-Faiha Primary Girls', 'الفيحاء ب بنات', 'capital', 'female'),
  ('Al-Khaldiya Primary Girls', 'الخالدية ب بنات', 'capital', 'female'),
  ('Abdullah Al-Salem Primary Girls', 'عبدالله السالم ب بنات', 'capital', 'female'),
  ('Al-Dasma Primary Girls', 'الدسمة ب بنات', 'capital', 'female'),
  ('Surra Primary Girls', 'السرة ب بنات', 'capital', 'female'),
  ('Al-Yarmouk Primary Girls', 'اليرموك ب بنات', 'capital', 'female'),
  ('Al-Rawda Primary Girls', 'الروضة ب بنات', 'capital', 'female'),
  ('Al-Sulaibikhat Primary Girls', 'الصليبيخات ب بنات', 'capital', 'female'),
  ('Al-Doha Primary Girls', 'الدوحة ب بنات', 'capital', 'female'),
  ('Al-Adailiya Primary Girls', 'العديلية ب بنات', 'capital', 'female'),
  ('Qortuba Primary Girls', 'قرطبة ب بنات', 'capital', 'female'),

  -- Hawalli - Boys Primary
  ('Hawalli Primary Boys', 'حولي ب بنين', 'hawalli', 'male'),
  ('Al-Salmiya Primary Boys', 'السالمية ب بنين', 'hawalli', 'male'),
  ('Mishref Primary Boys', 'مشرف ب بنين', 'hawalli', 'male'),
  ('Bayan Primary Boys', 'بيان ب بنين', 'hawalli', 'male'),
  ('Al-Jabriya Primary Boys', 'الجابرية ب بنين', 'hawalli', 'male'),
  ('Al-Rumaithiya Primary Boys', 'الرميثية ب بنين', 'hawalli', 'male'),
  ('Al-Siddeeq Primary Boys', 'الصديق ب بنين', 'hawalli', 'male'),
  ('Salwa Primary Boys', 'سلوى ب بنين', 'hawalli', 'male'),
  ('Hateen Primary Boys', 'حطين ب بنين', 'hawalli', 'male'),
  ('Al-Zahra Primary Boys', 'الزهراء ب بنين', 'hawalli', 'male'),
  ('Al-Shaab Primary Boys', 'الشعب ب بنين', 'hawalli', 'male'),
  ('Al-Shuhada Primary Boys', 'الشهداء ب بنين', 'hawalli', 'male'),
  ('Al-Bida Primary Boys', 'البدع ب بنين', 'hawalli', 'male'),

  -- Hawalli - Girls Primary
  ('Hawalli Primary Girls', 'حولي ب بنات', 'hawalli', 'female'),
  ('Al-Salmiya Primary Girls', 'السالمية ب بنات', 'hawalli', 'female'),
  ('Mishref Primary Girls', 'مشرف ب بنات', 'hawalli', 'female'),
  ('Bayan Primary Girls', 'بيان ب بنات', 'hawalli', 'female'),
  ('Al-Jabriya Primary Girls', 'الجابرية ب بنات', 'hawalli', 'female'),
  ('Al-Rumaithiya Primary Girls', 'الرميثية ب بنات', 'hawalli', 'female'),
  ('Al-Siddeeq Primary Girls', 'الصديق ب بنات', 'hawalli', 'female'),
  ('Salwa Primary Girls', 'سلوى ب بنات', 'hawalli', 'female'),
  ('Hateen Primary Girls', 'حطين ب بنات', 'hawalli', 'female'),
  ('Al-Zahra Primary Girls', 'الزهراء ب بنات', 'hawalli', 'female'),
  ('Al-Shaab Primary Girls', 'الشعب ب بنات', 'hawalli', 'female'),
  ('Al-Shuhada Primary Girls', 'الشهداء ب بنات', 'hawalli', 'female'),
  ('Al-Bida Primary Girls', 'البدع ب بنات', 'hawalli', 'female'),

  -- Farwaniya - Boys Primary
  ('Farwaniya Primary Boys', 'الفروانية ب بنين', 'farwaniya', 'male'),
  ('Khaitan Primary Boys', 'خيطان ب بنين', 'farwaniya', 'male'),
  ('Jleeb Al-Shuyoukh Primary Boys', 'جليب الشيوخ ب بنين', 'farwaniya', 'male'),
  ('Al-Rai Primary Boys', 'الري ب بنين', 'farwaniya', 'male'),
  ('Al-Firdous Primary Boys', 'الفردوس ب بنين', 'farwaniya', 'male'),
  ('Al-Andalus Primary Boys', 'الأندلس ب بنين', 'farwaniya', 'male'),
  ('Ishbiliya Primary Boys', 'إشبيلية ب بنين', 'farwaniya', 'male'),
  ('Al-Ardhiya Primary Boys', 'العارضية ب بنين', 'farwaniya', 'male'),
  ('Al-Rabiya Primary Boys', 'الربية ب بنين', 'farwaniya', 'male'),
  ('Al-Omariya Primary Boys', 'العمرية ب بنين', 'farwaniya', 'male'),
  ('Abdullah Al-Mubarak Primary Boys', 'عبدالله المبارك ب بنين', 'farwaniya', 'male'),
  ('Abraq Khaitan Primary Boys', 'أبرق خيطان ب بنين', 'farwaniya', 'male'),
  ('South Khaitan Primary Boys', 'جنوب خيطان ب بنين', 'farwaniya', 'male'),
  ('Al-Rehab Primary Boys', 'الرحاب ب بنين', 'farwaniya', 'male'),
  ('Sabah Al-Nasser Primary Boys', 'صباح الناصر ب بنين', 'farwaniya', 'male'),

  -- Farwaniya - Girls Primary
  ('Farwaniya Primary Girls', 'الفروانية ب بنات', 'farwaniya', 'female'),
  ('Khaitan Primary Girls', 'خيطان ب بنات', 'farwaniya', 'female'),
  ('Jleeb Al-Shuyoukh Primary Girls', 'جليب الشيوخ ب بنات', 'farwaniya', 'female'),
  ('Al-Rai Primary Girls', 'الري ب بنات', 'farwaniya', 'female'),
  ('Al-Firdous Primary Girls', 'الفردوس ب بنات', 'farwaniya', 'female'),
  ('Al-Andalus Primary Girls', 'الأندلس ب بنات', 'farwaniya', 'female'),
  ('Ishbiliya Primary Girls', 'إشبيلية ب بنات', 'farwaniya', 'female'),
  ('Al-Ardhiya Primary Girls', 'العارضية ب بنات', 'farwaniya', 'female'),
  ('Al-Rabiya Primary Girls', 'الربية ب بنات', 'farwaniya', 'female'),
  ('Al-Omariya Primary Girls', 'العمرية ب بنات', 'farwaniya', 'female'),
  ('Abdullah Al-Mubarak Primary Girls', 'عبدالله المبارك ب بنات', 'farwaniya', 'female'),
  ('Abraq Khaitan Primary Girls', 'أبرق خيطان ب بنات', 'farwaniya', 'female'),
  ('South Khaitan Primary Girls', 'جنوب خيطان ب بنات', 'farwaniya', 'female'),
  ('Al-Rehab Primary Girls', 'الرحاب ب بنات', 'farwaniya', 'female'),
  ('Sabah Al-Nasser Primary Girls', 'صباح الناصر ب بنات', 'farwaniya', 'female'),

  -- Ahmadi - Boys Primary
  ('Ahmadi Primary Boys', 'الأحمدي ب بنين', 'ahmadi', 'male'),
  ('Fahaheel Primary Boys', 'الفحيحيل ب بنين', 'ahmadi', 'male'),
  ('Mangaf Primary Boys', 'المنقف ب بنين', 'ahmadi', 'male'),
  ('Abu Halifa Primary Boys', 'أبو حليفة ب بنين', 'ahmadi', 'male'),
  ('Sabahiya Primary Boys', 'الصباحية ب بنين', 'ahmadi', 'male'),
  ('Riqqa Primary Boys', 'الرقة ب بنين', 'ahmadi', 'male'),
  ('Fintas Primary Boys', 'الفنطاس ب بنين', 'ahmadi', 'male'),
  ('Mahboula Primary Boys', 'المهبولة ب بنين', 'ahmadi', 'male'),
  ('Wafra Primary Boys', 'الوفرة ب بنين', 'ahmadi', 'male'),
  ('Hadiya Primary Boys', 'هدية ب بنين', 'ahmadi', 'male'),
  ('Jaber Al-Ali Primary Boys', 'جابر العلي ب بنين', 'ahmadi', 'male'),
  ('Fahad Al-Ahmad Primary Boys', 'فهد الأحمد ب بنين', 'ahmadi', 'male'),
  ('Ali Sabah Al-Salem Primary Boys', 'علي صباح السالم ب بنين', 'ahmadi', 'male'),
  ('South Sabahiya Primary Boys', 'جنوب الصباحية ب بنين', 'ahmadi', 'male'),
  ('Eqaila Primary Boys', 'العقيلة ب بنين', 'ahmadi', 'male'),
  ('Khairan Primary Boys', 'الخيران ب بنين', 'ahmadi', 'male'),

  -- Ahmadi - Girls Primary
  ('Ahmadi Primary Girls', 'الأحمدي ب بنات', 'ahmadi', 'female'),
  ('Fahaheel Primary Girls', 'الفحيحيل ب بنات', 'ahmadi', 'female'),
  ('Mangaf Primary Girls', 'المنقف ب بنات', 'ahmadi', 'female'),
  ('Abu Halifa Primary Girls', 'أبو حليفة ب بنات', 'ahmadi', 'female'),
  ('Sabahiya Primary Girls', 'الصباحية ب بنات', 'ahmadi', 'female'),
  ('Riqqa Primary Girls', 'الرقة ب بنات', 'ahmadi', 'female'),
  ('Fintas Primary Girls', 'الفنطاس ب بنات', 'ahmadi', 'female'),
  ('Mahboula Primary Girls', 'المهبولة ب بنات', 'ahmadi', 'female'),
  ('Wafra Primary Girls', 'الوفرة ب بنات', 'ahmadi', 'female'),
  ('Hadiya Primary Girls', 'هدية ب بنات', 'ahmadi', 'female'),
  ('Jaber Al-Ali Primary Girls', 'جابر العلي ب بنات', 'ahmadi', 'female'),
  ('Fahad Al-Ahmad Primary Girls', 'فهد الأحمد ب بنات', 'ahmadi', 'female'),
  ('Ali Sabah Al-Salem Primary Girls', 'علي صباح السالم ب بنات', 'ahmadi', 'female'),
  ('South Sabahiya Primary Girls', 'جنوب الصباحية ب بنات', 'ahmadi', 'female'),
  ('Eqaila Primary Girls', 'العقيلة ب بنات', 'ahmadi', 'female'),
  ('Khairan Primary Girls', 'الخيران ب بنات', 'ahmadi', 'female'),

  -- Jahra - Boys Primary
  ('Jahra Primary Boys', 'الجهراء ب بنين', 'jahra', 'male'),
  ('Sulaibiya Primary Boys', 'الصليبية ب بنين', 'jahra', 'male'),
  ('Saad Al-Abdullah Primary Boys', 'سعد العبدالله ب بنين', 'jahra', 'male'),
  ('Al-Naeem Primary Boys', 'النعيم ب بنين', 'jahra', 'male'),
  ('Al-Qasr Primary Boys', 'القصر ب بنين', 'jahra', 'male'),
  ('Taima Primary Boys', 'تيماء ب بنين', 'jahra', 'male'),
  ('Al-Oyoun Primary Boys', 'العيون ب بنين', 'jahra', 'male'),
  ('Kabd Primary Boys', 'كبد ب بنين', 'jahra', 'male'),
  ('Al-Nasseem Primary Boys', 'النسيم ب بنين', 'jahra', 'male'),
  ('Amgarah Primary Boys', 'أمغرة ب بنين', 'jahra', 'male'),
  ('Jaber Al-Ahmad City Primary Boys', 'مدينة جابر الأحمد ب بنين', 'jahra', 'male'),
  ('South Saad Al-Abdullah Primary Boys', 'جنوب سعد العبدالله ب بنين', 'jahra', 'male'),
  ('Al-Waha Primary Boys', 'الواحة ب بنين', 'jahra', 'male'),

  -- Jahra - Girls Primary
  ('Jahra Primary Girls', 'الجهراء ب بنات', 'jahra', 'female'),
  ('Sulaibiya Primary Girls', 'الصليبية ب بنات', 'jahra', 'female'),
  ('Saad Al-Abdullah Primary Girls', 'سعد العبدالله ب بنات', 'jahra', 'female'),
  ('Al-Naeem Primary Girls', 'النعيم ب بنات', 'jahra', 'female'),
  ('Al-Qasr Primary Girls', 'القصر ب بنات', 'jahra', 'female'),
  ('Taima Primary Girls', 'تيماء ب بنات', 'jahra', 'female'),
  ('Al-Oyoun Primary Girls', 'العيون ب بنات', 'jahra', 'female'),
  ('Kabd Primary Girls', 'كبد ب بنات', 'jahra', 'female'),
  ('Al-Nasseem Primary Girls', 'النسيم ب بنات', 'jahra', 'female'),
  ('Amgarah Primary Girls', 'أمغرة ب بنات', 'jahra', 'female'),
  ('Jaber Al-Ahmad City Primary Girls', 'مدينة جابر الأحمد ب بنات', 'jahra', 'female'),
  ('South Saad Al-Abdullah Primary Girls', 'جنوب سعد العبدالله ب بنات', 'jahra', 'female'),
  ('Al-Waha Primary Girls', 'الواحة ب بنات', 'jahra', 'female'),

  -- Mubarak Al-Kabeer - Boys Primary
  ('Mubarak Al-Kabeer Primary Boys', 'مبارك الكبير ب بنين', 'mubarak_alkabeer', 'male'),
  ('Sabah Al-Salem Primary Boys', 'صباح السالم ب بنين', 'mubarak_alkabeer', 'male'),
  ('Al-Qurain Primary Boys', 'القرين ب بنين', 'mubarak_alkabeer', 'male'),
  ('Al-Adan Primary Boys', 'العدان ب بنين', 'mubarak_alkabeer', 'male'),
  ('Al-Qusour Primary Boys', 'القصور ب بنين', 'mubarak_alkabeer', 'male'),
  ('Al-Masayel Primary Boys', 'المسايل ب بنين', 'mubarak_alkabeer', 'male'),
  ('Al-Funaitees Primary Boys', 'الفنيطيس ب بنين', 'mubarak_alkabeer', 'male'),
  ('Abu Ftaira Primary Boys', 'أبو فطيرة ب بنين', 'mubarak_alkabeer', 'male'),
  ('Abu Al-Hasaniya Primary Boys', 'أبو الحصانية ب بنين', 'mubarak_alkabeer', 'male'),
  ('West Abu Ftaira Primary Boys', 'غرب أبو فطيرة ب بنين', 'mubarak_alkabeer', 'male'),

  -- Mubarak Al-Kabeer - Girls Primary
  ('Mubarak Al-Kabeer Primary Girls', 'مبارك الكبير ب بنات', 'mubarak_alkabeer', 'female'),
  ('Sabah Al-Salem Primary Girls', 'صباح السالم ب بنات', 'mubarak_alkabeer', 'female'),
  ('Al-Qurain Primary Girls', 'القرين ب بنات', 'mubarak_alkabeer', 'female'),
  ('Al-Adan Primary Girls', 'العدان ب بنات', 'mubarak_alkabeer', 'female'),
  ('Al-Qusour Primary Girls', 'القصور ب بنات', 'mubarak_alkabeer', 'female'),
  ('Al-Masayel Primary Girls', 'المسايل ب بنات', 'mubarak_alkabeer', 'female'),
  ('Al-Funaitees Primary Girls', 'الفنيطيس ب بنات', 'mubarak_alkabeer', 'female'),
  ('Abu Ftaira Primary Girls', 'أبو فطيرة ب بنات', 'mubarak_alkabeer', 'female'),
  ('Abu Al-Hasaniya Primary Girls', 'أبو الحصانية ب بنات', 'mubarak_alkabeer', 'female'),
  ('West Abu Ftaira Primary Girls', 'غرب أبو فطيرة ب بنات', 'mubarak_alkabeer', 'female')
) AS v(name_en, name_ar, gov, gender)
WHERE NOT EXISTS (SELECT 1 FROM schools s WHERE s.name_ar = v.name_ar);

-- =============================================
-- ADDITIONAL GOVERNMENT SECONDARY SCHOOLS (missing from earlier migrations)
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate, school_type, gender, is_active)
SELECT v.name_en, v.name_ar, v.gov::governorate, 'gov', v.gender, true
FROM (VALUES
  -- Capital - Additional Secondary
  ('Al-Shamiya Secondary Boys', 'الشامية ث بنين', 'capital', 'male'),
  ('Abdullah Al-Salem Secondary Boys', 'عبدالله السالم ث بنين', 'capital', 'male'),
  ('Al-Doha Secondary Boys', 'الدوحة ث بنين', 'capital', 'male'),
  ('Al-Sulaibikhat Secondary Boys', 'الصليبيخات ث بنين', 'capital', 'male'),
  ('Surra Secondary Boys', 'السرة ث بنين', 'capital', 'male'),
  ('Al-Adailiya Secondary Boys', 'العديلية ث بنين', 'capital', 'male'),
  ('Al-Shamiya Secondary Girls', 'الشامية ث بنات', 'capital', 'female'),
  ('Al-Doha Secondary Girls', 'الدوحة ث بنات', 'capital', 'female'),
  ('Al-Sulaibikhat Secondary Girls', 'الصليبيخات ث بنات', 'capital', 'female'),
  ('Surra Secondary Girls', 'السرة ث بنات', 'capital', 'female'),
  ('Al-Adailiya Secondary Girls', 'العديلية ث بنات', 'capital', 'female'),
  ('Al-Nuzha Secondary Girls', 'النزهة ث بنات', 'capital', 'female'),

  -- Hawalli - Additional Secondary
  ('Al-Zahra Secondary Boys', 'الزهراء ث بنين', 'hawalli', 'male'),
  ('Al-Shaab Secondary Boys', 'الشعب ث بنين', 'hawalli', 'male'),
  ('Al-Bida Secondary Boys', 'البدع ث بنين', 'hawalli', 'male'),
  ('Hateen Secondary Boys', 'حطين ث بنين', 'hawalli', 'male'),
  ('Al-Zahra Secondary Girls', 'الزهراء ث بنات', 'hawalli', 'female'),
  ('Al-Shaab Secondary Girls', 'الشعب ث بنات', 'hawalli', 'female'),
  ('Hateen Secondary Girls', 'حطين ث بنات', 'hawalli', 'female'),
  ('Al-Rumaithiya Secondary Girls', 'الرميثية ث بنات', 'hawalli', 'female'),

  -- Farwaniya - Additional Secondary
  ('Al-Andalus Secondary Boys', 'الأندلس ث بنين', 'farwaniya', 'male'),
  ('Ishbiliya Secondary Boys', 'إشبيلية ث بنين', 'farwaniya', 'male'),
  ('Al-Ardhiya Secondary Boys', 'العارضية ث بنين', 'farwaniya', 'male'),
  ('Al-Rabiya Secondary Boys', 'الربية ث بنين', 'farwaniya', 'male'),
  ('Al-Omariya Secondary Boys', 'العمرية ث بنين', 'farwaniya', 'male'),
  ('South Khaitan Secondary Boys', 'جنوب خيطان ث بنين', 'farwaniya', 'male'),
  ('Al-Andalus Secondary Girls', 'الأندلس ث بنات', 'farwaniya', 'female'),
  ('Ishbiliya Secondary Girls', 'إشبيلية ث بنات', 'farwaniya', 'female'),
  ('Al-Ardhiya Secondary Girls', 'العارضية ث بنات', 'farwaniya', 'female'),
  ('Al-Rabiya Secondary Girls', 'الربية ث بنات', 'farwaniya', 'female'),
  ('Al-Omariya Secondary Girls', 'العمرية ث بنات', 'farwaniya', 'female'),
  ('South Khaitan Secondary Girls', 'جنوب خيطان ث بنات', 'farwaniya', 'female'),
  ('Al-Rehab Secondary Boys', 'الرحاب ث بنين', 'farwaniya', 'male'),
  ('Al-Rehab Secondary Girls', 'الرحاب ث بنات', 'farwaniya', 'female'),

  -- Ahmadi - Additional Secondary
  ('Fintas Secondary Boys', 'الفنطاس ث بنين', 'ahmadi', 'male'),
  ('Mahboula Secondary Boys', 'المهبولة ث بنين', 'ahmadi', 'male'),
  ('Wafra Secondary Boys', 'الوفرة ث بنين', 'ahmadi', 'male'),
  ('Al-Zuhor Secondary Boys', 'الزهور ث بنين', 'ahmadi', 'male'),
  ('Eqaila Secondary Boys', 'العقيلة ث بنين', 'ahmadi', 'male'),
  ('Khairan Secondary Boys', 'الخيران ث بنين', 'ahmadi', 'male'),
  ('Fintas Secondary Girls', 'الفنطاس ث بنات', 'ahmadi', 'female'),
  ('Mahboula Secondary Girls', 'المهبولة ث بنات', 'ahmadi', 'female'),
  ('Wafra Secondary Girls', 'الوفرة ث بنات', 'ahmadi', 'female'),
  ('Al-Zuhor Secondary Girls', 'الزهور ث بنات', 'ahmadi', 'female'),
  ('Eqaila Secondary Girls', 'العقيلة ث بنات', 'ahmadi', 'female'),
  ('Khairan Secondary Girls', 'الخيران ث بنات', 'ahmadi', 'female'),

  -- Jahra - Additional Secondary
  ('Al-Naeem Secondary Boys', 'النعيم ث بنين', 'jahra', 'male'),
  ('Al-Qasr Secondary Boys', 'القصر ث بنين', 'jahra', 'male'),
  ('Kabd Secondary Boys', 'كبد ث بنين', 'jahra', 'male'),
  ('Al-Nasseem Secondary Boys', 'النسيم ث بنين', 'jahra', 'male'),
  ('Amgarah Secondary Boys', 'أمغرة ث بنين', 'jahra', 'male'),
  ('Jaber Al-Ahmad City Secondary Boys', 'مدينة جابر الأحمد ث بنين', 'jahra', 'male'),
  ('Al-Naeem Secondary Girls', 'النعيم ث بنات', 'jahra', 'female'),
  ('Al-Qasr Secondary Girls', 'القصر ث بنات', 'jahra', 'female'),
  ('Kabd Secondary Girls', 'كبد ث بنات', 'jahra', 'female'),
  ('Al-Nasseem Secondary Girls', 'النسيم ث بنات', 'jahra', 'female'),
  ('Amgarah Secondary Girls', 'أمغرة ث بنات', 'jahra', 'female'),
  ('Jaber Al-Ahmad City Secondary Girls', 'مدينة جابر الأحمد ث بنات', 'jahra', 'female'),
  ('South Saad Al-Abdullah Secondary Boys', 'جنوب سعد العبدالله ث بنين', 'jahra', 'male'),
  ('South Saad Al-Abdullah Secondary Girls', 'جنوب سعد العبدالله ث بنات', 'jahra', 'female'),

  -- Mubarak Al-Kabeer - Additional Secondary
  ('Al-Masayel Secondary Boys', 'المسايل ث بنين', 'mubarak_alkabeer', 'male'),
  ('Al-Funaitees Secondary Boys', 'الفنيطيس ث بنين', 'mubarak_alkabeer', 'male'),
  ('Abu Ftaira Secondary Boys', 'أبو فطيرة ث بنين', 'mubarak_alkabeer', 'male'),
  ('Abu Al-Hasaniya Secondary Boys', 'أبو الحصانية ث بنين', 'mubarak_alkabeer', 'male'),
  ('West Abu Ftaira Secondary Boys', 'غرب أبو فطيرة ث بنين', 'mubarak_alkabeer', 'male'),
  ('Al-Masayel Secondary Girls', 'المسايل ث بنات', 'mubarak_alkabeer', 'female'),
  ('Al-Funaitees Secondary Girls', 'الفنيطيس ث بنات', 'mubarak_alkabeer', 'female'),
  ('Abu Ftaira Secondary Girls', 'أبو فطيرة ث بنات', 'mubarak_alkabeer', 'female'),
  ('Abu Al-Hasaniya Secondary Girls', 'أبو الحصانية ث بنات', 'mubarak_alkabeer', 'female'),
  ('West Abu Ftaira Secondary Girls', 'غرب أبو فطيرة ث بنات', 'mubarak_alkabeer', 'female')
) AS v(name_en, name_ar, gov, gender)
WHERE NOT EXISTS (SELECT 1 FROM schools s WHERE s.name_ar = v.name_ar);

-- =============================================
-- ADDITIONAL WELL-KNOWN PRIVATE SCHOOLS IN KUWAIT
-- =============================================
INSERT INTO schools (name_en, name_ar, school_type, gender, is_active)
SELECT v.name_en, v.name_ar, v.school_type, v.gender, true
FROM (VALUES
  ('Al-Resala International School', 'مدرسة الرسالة الدولية', 'us', 'mixed'),
  ('American Gulf School', 'مدرسة الخليج الأمريكية', 'us', 'mixed'),
  ('Al-Dharra Private School', 'مدرسة الذرة الخاصة', 'others', 'mixed'),
  ('Kuwait Montessori School', 'مدرسة الكويت مونتيسوري', 'others', 'mixed'),
  ('Green Fields School', 'مدرسة الحقول الخضراء', 'others', 'mixed'),
  ('American Gulf Academy', 'أكاديمية الخليج الأمريكية', 'us', 'mixed'),
  ('Al-Safa Academy', 'أكاديمية الصفا', 'others', 'mixed'),
  ('Rawdat Al-Ma''arif School', 'مدرسة روضة المعارف', 'others', 'mixed'),
  ('Kuwait Technical College (KTECH)', 'كلية الكويت التقنية', 'others', 'mixed'),
  ('Box Hill College Kuwait', 'كلية بوكس هيل الكويت', 'others', 'mixed'),
  ('Australian College of Kuwait (ACK)', 'الكلية الأسترالية في الكويت', 'others', 'mixed'),
  ('American College of the Middle East (ACM)', 'الكلية الأمريكية للشرق الأوسط', 'us', 'mixed'),
  ('Gulf University for Science and Technology (GUST)', 'جامعة الخليج للعلوم والتكنولوجيا', 'us', 'mixed'),
  ('American University of Kuwait (AUK)', 'الجامعة الأمريكية في الكويت', 'us', 'mixed'),
  ('American University of the Middle East (AUM)', 'الجامعة الأمريكية في الشرق الأوسط', 'us', 'mixed'),
  ('Arab Open University Kuwait', 'الجامعة العربية المفتوحة الكويت', 'others', 'mixed'),
  ('Kuwait College of Science and Technology (KCST)', 'كلية الكويت للعلوم والتكنولوجيا', 'others', 'mixed'),
  ('Al-Manar Bilingual School', 'مدرسة المنار ثنائية اللغة', 'others', 'mixed'),
  ('Al-Jahra Private School', 'مدرسة الجهراء الخاصة', 'others', 'mixed'),
  ('International School of Creative Science', 'المدرسة الدولية للعلوم الإبداعية', 'us', 'mixed'),
  ('Al-Nouri Academy', 'أكاديمية النوري', 'others', 'mixed'),
  ('Continental School of Kuwait', 'المدرسة القارية في الكويت', 'us', 'mixed'),
  ('IB World Schools Kuwait Branch', 'مدارس البكالوريا الدولية فرع الكويت', 'others', 'mixed'),
  ('Kuwait Bahrain International School', 'مدرسة الكويت البحرين الدولية', 'others', 'mixed'),
  ('Al-Sahel Bilingual School', 'مدرسة الساحل ثنائية اللغة', 'others', 'mixed'),
  ('Al-Rayan School', 'مدرسة الريان', 'others', 'mixed'),
  ('Al-Multaqa Bilingual School', 'مدرسة الملتقى ثنائية اللغة', 'others', 'mixed'),
  ('Ideal Education School (IES)', 'مدرسة التعليم المثالي', 'others', 'mixed'),
  ('Gulf Academy School', 'مدرسة أكاديمية الخليج', 'others', 'mixed'),
  ('Injaz International School', 'مدرسة إنجاز الدولية', 'others', 'mixed'),
  ('Al-Mohandis Modern School', 'مدرسة المهندس الحديثة', 'others', 'mixed'),
  ('Tawasol Bilingual School', 'مدرسة تواصل ثنائية اللغة', 'others', 'mixed'),
  ('Al-Mawaheb School', 'مدرسة المواهب', 'others', 'mixed'),
  ('Kuwait International Bilingual School', 'مدرسة الكويت الدولية ثنائية اللغة', 'others', 'mixed'),
  ('Al-Asriya School', 'المدرسة العصرية', 'others', 'mixed'),
  ('Forward International School', 'مدرسة فوروارد الدولية', 'others', 'mixed'),
  ('National Bilingual School', 'المدرسة الوطنية ثنائية اللغة', 'others', 'mixed'),
  ('Knowledge Village School', 'مدرسة قرية المعرفة', 'others', 'mixed'),
  ('Al-Rowad Bilingual School', 'مدرسة الرواد ثنائية اللغة', 'others', 'mixed'),
  ('Al-Nada International School', 'مدرسة الندى الدولية', 'others', 'mixed')
) AS v(name_en, name_ar, school_type, gender)
WHERE NOT EXISTS (SELECT 1 FROM schools s WHERE s.name_ar = v.name_ar);

-- Special entry for "Other" catch-all
INSERT INTO schools (name_en, name_ar, school_type, gender, is_active)
SELECT 'Other School', 'مدرسة أخرى', 'others', 'mixed', true
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'مدرسة أخرى');
