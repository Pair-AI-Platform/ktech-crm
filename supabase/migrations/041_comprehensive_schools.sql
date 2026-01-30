-- =============================================
-- MIGRATION: Comprehensive Kuwait Secondary Schools
-- Source: Excel file "مدارس_الكويت_الثانوية_شاملة"
-- Sheet: "جميع المدارس"
-- Total: ~204 secondary schools (ثانوي عام + ديني ثانوي)
-- Skipped: ابتدائي (primary) and متوسط (middle) schools
-- Uses WHERE NOT EXISTS to avoid duplicates with earlier migrations
-- =============================================

-- =============================================
-- AHMADI (الأحمدي) - BOYS (بنين)
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Abdulaziz Muslim Al-Zamel', 'عبدالعزيز مسلم الزامل', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'عبدالعزيز مسلم الزامل');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Mohammad Ghaith Al-Mutawa', 'محمد غيث المطوع', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'محمد غيث المطوع');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Abdullah Bin Abbas', 'عبدالله بن عباس', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'عبدالله بن عباس');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Ayoub Hussain Al-Ayoub', 'أيوب حسين الأيوب', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'أيوب حسين الأيوب');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Talha Bin Ubaid', 'طلحة بن عبيد', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'طلحة بن عبيد');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Omar Bin Al-Khattab', 'عمر بن الخطاب', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'عمر بن الخطاب');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Mohammad Al-Nashmi', 'محمد النشمي', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'محمد النشمي');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Kindi', 'الكندي', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الكندي');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Hisham Bin Al-Aas', 'هشام بن العاص', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'هشام بن العاص');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Sabahiya Boys', 'الصباحية بنين', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الصباحية بنين');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Qurtubi', 'القرطبي', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'القرطبي');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Balat Al-Shuhada', 'بلاط الشهداء', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'بلاط الشهداء');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Salem Al-Mubarak', 'سالم المبارك', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'سالم المبارك');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Saeed Bin Amer', 'سعيد بن عامر', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'سعيد بن عامر');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Issa Abdullah Al-Houli', 'عيسى عبدالله الهولي', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'عيسى عبدالله الهولي');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Abdullah Al-Ahmad Al-Sabah', 'عبدالله الأحمد الصباح', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'عبدالله الأحمد الصباح');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Haroun Al-Rashid', 'هارون الرشيد', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'هارون الرشيد');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Religious Institute South Sabahiya', 'المعهد الديني  (جنوب الصباحية)', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'المعهد الديني  (جنوب الصباحية)');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Iman Sharia Private Institute', 'معهد الإيمان الشرعي الأهلية', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'معهد الإيمان الشرعي الأهلية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Maarifa Model Boys', 'المعرفة النموذجية بنين', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'المعرفة النموذجية بنين');

-- =============================================
-- AHMADI (الأحمدي) - GIRLS (بنات)
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Moudhi Sultan Al-Essa', 'موضي سلطان العيسى', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'موضي سلطان العيسى');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Khairan Mixed', 'الخيران المشتركة', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الخيران المشتركة');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Ghanima Al-Marzouq', 'غنيمة المرزوق', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'غنيمة المرزوق');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Shakriya Obaid Al-Saidi', 'شكرية عبيد السعيدي', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'شكرية عبيد السعيدي');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Jumana Bint Al-Hassan', 'جمانة بنت الحسن', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'جمانة بنت الحسن');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Rawdatain', 'الروضتين', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الروضتين');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Um Al-Haiman', 'أم الهيمان', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'أم الهيمان');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Fatima Bint Asad', 'فاطمة بنت أسد الثانوية', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'فاطمة بنت أسد الثانوية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Latifa Abdulrahman Al-Fares', 'لطيفه عبد الرحمن الفارس', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'لطيفه عبد الرحمن الفارس');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Amah Bint Khaled', 'أمة بنت خالد', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'أمة بنت خالد');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Sabahiya Girls', 'الصباحية بنات', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الصباحية بنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Lubna Bint Al-Harith', 'لبنى بنت الحارث', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'لبنى بنت الحارث');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Ratqa', 'الرتقة', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الرتقة');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Riqa', 'الرقة', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الرقة');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Hadiya', 'هدية', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'هدية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Um Al-Alaa Al-Ansariya', 'أم العلاء الأنصارية', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'أم العلاء الأنصارية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Anisa Bint Khubaib Al-Ansariya', 'أنيسة بنت خبيب الانصارية', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'أنيسة بنت خبيب الانصارية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Awatif Khalifa Al-Athbi Al-Sabah', 'عواطف خليفة العذبي الصباح', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'عواطف خليفة العذبي الصباح');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Muadha Al-Ghifariya', 'معاذة الغفارية', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'معاذة الغفارية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Maarifa Model Girls', 'المعرفة النموذجية بنات', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'المعرفة النموذجية بنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Najat Girls', 'النجاة بنات', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'النجاة بنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Um Al-Qura', 'أم القرى', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'أم القرى');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Zainab Bint Mudhoun', 'زينب بنت مظعون', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'زينب بنت مظعون');

-- =============================================
-- JAHRA (الجهراء) - BOYS (بنين)
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Thabit Bin Qais', 'ثابت بن قيس', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثابت بن قيس');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Orwa Bin Al-Zubair', 'عروة بن الزبير', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'عروة بن الزبير');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Saad Al-Abdullah Al-Sabah', 'سعد العبدالله الصباح', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'سعد العبدالله الصباح');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Mohammad Abdullah Al-Muhaini', 'محمد عبدالله المهيني', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'محمد عبدالله المهيني');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Khaled Bin Saeed', 'خالد بن سعيد', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'خالد بن سعيد');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Sabah Al-Nasser Al-Sabah', 'صباح الناصر الصباح', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'صباح الناصر الصباح');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Waha', 'الواحة', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الواحة');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Youssef Al-Athbi Al-Sabah', 'يوسف العذبي الصباح', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'يوسف العذبي الصباح');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Jahra Private Boys', 'الجهراء الأهلية بنين', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الجهراء الأهلية بنين');

-- =============================================
-- JAHRA (الجهراء) - GIRLS (بنات)
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Um Al-Harith Al-Ansariya', 'أم الحارث الأنصارية', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'أم الحارث الأنصارية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Fatima Bint Utba', 'فاطمة بنت عتبة', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'فاطمة بنت عتبة');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Suaad Bint Salama', 'سعاد بنت سلمة', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'سعاد بنت سلمة');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Raita Bint Al-Harith', 'ريطة بنت الحارث', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ريطة بنت الحارث');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Nouriya Subih Al-Subih', 'نورية صبيح الصبيح', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'نورية صبيح الصبيح');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Amna Bint Al-Arqam Al-Makhzumiya', 'آمنة بنت الأرقم المخزومية', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'آمنة بنت الأرقم المخزومية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Taymaa', 'تيماء', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'تيماء');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Um Mubashir Al-Ansariya', 'أم مبشر الانصارية', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'أم مبشر الانصارية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Zainab Bint Mohammad', 'زينب بنت محمد', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'زينب بنت محمد');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Nawar Bint Malik', 'النوار بنت مالك', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'النوار بنت مالك');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Jahra', 'الجهراء', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الجهراء');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Amra Bint Rawaha', 'عمرة بنت رواحة', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'عمرة بنت رواحة');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Jahra Private Girls', 'الجهراء الأهلية بنات', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الجهراء الأهلية بنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Dhabia Bint Al-Baraa', 'ظبية بنت البراء', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ظبية بنت البراء');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Dhabia Bint Al-Harith', 'ظبية بنت الحارث', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ظبية بنت الحارث');

-- =============================================
-- CAPITAL (العاصمة) - BOYS (بنين)
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Jaber Mubarak Al-Sabah', 'جابر مبارك الصباح', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'جابر مبارك الصباح');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Jasem Mohammad Al-Kharafi', 'جاسم محمد الخرافي', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'جاسم محمد الخرافي');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Abdullah Al-Jaber', 'عبدالله الجابر', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'عبدالله الجابر');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Ahmad Mishari Al-Adwani', 'أحمد مشاري العدواني', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'أحمد مشاري العدواني');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Abdullah Al-Otaibi', 'عبدالله العتيبي', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'عبدالله العتيبي');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Hamad Issa Al-Rajeeb', 'حمد عيسي الرجيب', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'حمد عيسي الرجيب');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Issa Ahmad Al-Hamad', 'عيسى أحمد الحمد', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'عيسى أحمد الحمد');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Ahmad Al-Bishr Al-Rumi', 'أحمد البشر الرومي', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'أحمد البشر الرومي');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Youssef Bin Issa', 'يوسف بن عيسى', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'يوسف بن عيسى');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Talent Academy Boys', 'أكاديمية الموهبة بنين', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'أكاديمية الموهبة بنين');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Saad Bin Al-Rabee Al-Ansari', 'سعد بن الربيع الأنصارى', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'سعد بن الربيع الأنصارى');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Yacoub Youssef Al-Ghunaim', 'يعقوب يوسف الغنيم', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'يعقوب يوسف الغنيم');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Ahmad Shihab Al-Din', 'أحمد شهاب الدين', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'أحمد شهاب الدين');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Sulaiman Abu Ghosh', 'سليمان أبو غوش', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'سليمان أبو غوش');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Oqab Al-Khatib', 'عقاب الخطيب', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'عقاب الخطيب');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Mohammad Mohammad Najm', 'محمد محمود نجم', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'محمد محمود نجم');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Asmaei', 'الأصمعي', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الأصمعي');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Abdulrahman Al-Sumait Religious Institute', 'معهد عبدالرحمن السميط الديني', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'معهد عبدالرحمن السميط الديني');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Tadamun Boys', 'التضامن بنين', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'التضامن بنين');

-- =============================================
-- CAPITAL (العاصمة) - GIRLS (بنات)
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Israa', 'الإسراء', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الإسراء');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Qurtuba', 'قرطبة', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'قرطبة');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Yarmouk', 'اليرموك', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'اليرموك');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Rawda', 'الروضة', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الروضة');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Sharifa Al-Awadhi', 'شريفة العوضي', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'شريفة العوضي');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Asmaa Bint Al-Harith', 'العصماء بنت الحارث', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'العصماء بنت الحارث');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Bibi Al-Salem', 'بيبي السالم', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'بيبي السالم');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Suad Mohammad Al-Sabah', 'سعاد محمد الصباح', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'سعاد محمد الصباح');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Jumana Bint Abi Talib', 'جمانة بنت ابى طالب', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'جمانة بنت ابى طالب');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Jazair', 'الجزائر', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الجزائر');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Talent Academy Girls', 'أكاديمية الموهبة للبنات', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'أكاديمية الموهبة للبنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Latifa Al-Shimali', 'لطيفة الشمالي', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'لطيفة الشمالي');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Fatima Bint Al-Walid', 'فاطمة بنت الوليد', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'فاطمة بنت الوليد');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Doha', 'الدوحة', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الدوحة');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Um Habib Bint Al-Aas Al-Qurashiya', 'أم حبيب بنت العاص القرشية', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'أم حبيب بنت العاص القرشية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Munira Al-Ahmad Al-Jaber Al-Sabah', 'منيرة الأحمد الجابر الصباح', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'منيرة الأحمد الجابر الصباح');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Habiba Bint Shariq Al-Ansariya', 'حبيبة بنت شريق الأنصارية', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'حبيبة بنت شريق الأنصارية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Um Maqel Al-Asdiya', 'أم معقل الأسدية', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'أم معقل الأسدية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Qurtuba Religious Institute', 'معهد قرطبة الديني', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'معهد قرطبة الديني');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Tadamun Girls', 'التضامن بنات', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'التضامن بنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Sharq Al-Awsat', 'الشرق الأوسط', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الشرق الأوسط');

-- =============================================
-- FARWANIYA (الفروانية) - BOYS (بنين)
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Dawgha', 'الدوغة', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الدوغة');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Tariq Bin Ziyad', 'طارق بن زياد', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'طارق بن زياد');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Shujaa Bin Al-Aslam', 'شجاع بن الأسلم', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'شجاع بن الأسلم');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Labid Bin Al-Rabeeah', 'لبيد بن الربيعة', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'لبيد بن الربيعة');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Jleeb Al-Shuyoukh', 'جليب الشيوخ', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'جليب الشيوخ');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Jahiz', 'الجاحظ', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الجاحظ');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Sabah', 'الصباح', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الصباح');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Abdullatif Thunayan Al-Ghanim', 'عبداللطيف ثنيان الغانم', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'عبداللطيف ثنيان الغانم');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Abdulrazzaq Mohammad Saleh Al-Adsani', 'عبدالرزاق محمد صالح العدساني', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'عبدالرزاق محمد صالح العدساني');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Murshid Saad Al-Bathal', 'مرشد سعد البذال', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'مرشد سعد البذال');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Ibn Al-Ameed', 'إبن العميد', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'إبن العميد');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Mubarakiya', 'المباركية', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'المباركية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Humoud Al-Jaber Al-Sabah', 'حمود الجابر الصباح', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'حمود الجابر الصباح');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Anas Bin Malik', 'أنس بن مالك', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'أنس بن مالك');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Nukhba', 'النخبة', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'النخبة');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Fajr Al-Jadeed', 'فجر الجديد', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'فجر الجديد');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Imtiaz', 'الإمتياز', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الإمتياز');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Jawharat Al-Saleh', 'جوهرة الصالح', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'جوهرة الصالح');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Kuwait Modern Private', 'الكويت الأهلية الحديثة', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الكويت الأهلية الحديثة');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Mohammad Al-Othman Al-Rashed', 'محمد العثمان الراشد', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'محمد العثمان الراشد');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Tamayuz Boys', 'التميز بنين', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'التميز بنين');

-- =============================================
-- FARWANIYA (الفروانية) - GIRLS (بنات)
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Dalal Ahmad Al-Bishr Al-Rumi', 'دلال أحمد البشر الرومي', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'دلال أحمد البشر الرومي');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Tahira Bint Al-Harith', 'الطاهرة بنت الحارث', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الطاهرة بنت الحارث');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Fariea Bint Malik', 'الفريعة بنت مالك', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الفريعة بنت مالك');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Khadija Bint Al-Zubair', 'خديجة بنت الزبير', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'خديجة بنت الزبير');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Um Ziyad Al-Ashjaiya', 'أم زياد الأشجعية', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'أم زياد الأشجعية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Razina Secondary', 'رزينة الثانوية', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'رزينة الثانوية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Durrat Al-Hashimiya', 'درة الهاشمية', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'درة الهاشمية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Firdaws', 'الفردوس', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الفردوس');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Um Al-Hakam Bint Abi Sufyan', 'أم الحكم بنت ابي سفيان', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'أم الحكم بنت ابي سفيان');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Rabee Bint Muawwadh', 'الربيع بنت معوذ', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الربيع بنت معوذ');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Hawaa Bint Yazid Al-Ansariya', 'حواء بنت يزيد الانصارية', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'حواء بنت يزيد الانصارية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Um Amer Al-Ansariya', 'أم عامر الأنصارية', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'أم عامر الأنصارية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Rabiya', 'الرابية', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الرابية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Umaima Bint Rabia', 'أميمة بنت ربيعة', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'أميمة بنت ربيعة');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Farwaniya', 'الفروانية', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الفروانية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Abraq Khaitan', 'أبرق خيطان', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'أبرق خيطان');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Farwaniya Religious Institute', 'المعهد الفروانية الديني', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'المعهد الفروانية الديني');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Jaber Private', 'الجابر الاهلية', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الجابر الاهلية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Um Hani Private', 'أم هاني الأهلية', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'أم هاني الأهلية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Harvard', 'هارفرد', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'هارفرد');

-- =============================================
-- HAWALLI (حولي) - BOYS (بنين)
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Saleh Shihab', 'صالح شهاب', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'صالح شهاب');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Fahd Al-Salem', 'فهد السالم', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'فهد السالم');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Palestine', 'فلسطين', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'فلسطين');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Abdullah Al-Asousi', 'عبدالله العسعوسي', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'عبدالله العسعوسي');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Jaber Al-Ahmad Al-Sabah', 'جابر الأحمد الصباح', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'جابر الأحمد الصباح');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Fahd Al-Duwiri', 'فهد الدويري', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'فهد الدويري');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Abdullah Abdullatif Al-Rajeeb', 'عبدالله عبداللطيف الرجيب', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'عبدالله عبداللطيف الرجيب');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Ahmad Al-Rabie', 'أحمد الربعي', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'أحمد الربعي');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Nasser Abdulmohsen Al-Saeed', 'ناصر عبد المحسن السعيد الثانوية', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ناصر عبد المحسن السعيد الثانوية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Salah Al-Din', 'صلاح الدين', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'صلاح الدين');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Rajaa Mixed Boys', 'الرجاء المشتركة بنين', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الرجاء المشتركة بنين');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Noor Mixed Boys', 'النور المشتركة بنين', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'النور المشتركة بنين');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Amal and Amal Rehabilitation Boys', 'الأمل و تأهيل الأمل بنين', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الأمل و تأهيل الأمل بنين');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Wataniya Private', 'الوطنية الاهلية', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الوطنية الاهلية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Ikhlas Private Boys', 'الإخلاص الأهلية بنين', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الإخلاص الأهلية بنين');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Kuwait Educational Academy', 'أكاديمية الكويت التعليمية', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'أكاديمية الكويت التعليمية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Najat Boys', 'النجاة بنين', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'النجاة بنين');

-- =============================================
-- HAWALLI (حولي) - GIRLS (بنات)
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Mushrif', 'مشرف', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'مشرف');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Salwa', 'سلوى', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'سلوى');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Khalida Bint Al-Aswad', 'خالدة بنت الأسود', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'خالدة بنت الأسود');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Amama Bint Bishr', 'أمامة بنت بشر', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'أمامة بنت بشر');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT '25 February', '25 فبراير', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = '25 فبراير');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Salmiya', 'السالمية', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'السالمية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Jabriya', 'الجابرية', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الجابرية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Bayan', 'بيان', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'بيان');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Fatima Al-Saraawi', 'فاطمة الصرعاوي', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'فاطمة الصرعاوي');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Maria Al-Qibtiya', 'مارية القبطية', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'مارية القبطية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Noor Mixed Girls', 'النور المشتركة البنات', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'النور المشتركة البنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Rajaa Mixed Girls', 'الرجاء المشتركة البنات', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الرجاء المشتركة البنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Amal and Amal Rehabilitation Girls', 'الأمل وتأهيل الأمل بنات', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الأمل وتأهيل الأمل بنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Jeel Al-Jadeed', 'الجيل الجديد', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الجيل الجديد');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Arab Academy', 'الأكاديمية العربية', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الأكاديمية العربية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Ikhlas Private Girls', 'الإخلاص الأهلية بنات', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الإخلاص الأهلية بنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Najat Girls', 'النجاة بنات', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'النجاة بنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Dana', 'الدانة', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الدانة');

-- =============================================
-- MUBARAK AL-KABEER (مبارك الكبير) - BOYS (بنين)
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Imam Malik', 'الإمام مالك', 'mubarak_alkabeer'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الإمام مالك');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Khaled Saud Al-Zaid', 'خالد سعود الزيد', 'mubarak_alkabeer'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'خالد سعود الزيد');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Sulaiman Al-Adsani', 'سليمان العدساني', 'mubarak_alkabeer'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'سليمان العدساني');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Abdullah Al-Mubarak Al-Sabah', 'عبدالله المبارك الصباح', 'mubarak_alkabeer'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'عبدالله المبارك الصباح');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Jaber Al-Ali Al-Sabah', 'جابر العلي الصباح', 'mubarak_alkabeer'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'جابر العلي الصباح');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Sabah Al-Salem Boys', 'صباح السالم بنين', 'mubarak_alkabeer'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'صباح السالم بنين');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Duaij Al-Salman Al-Sabah', 'دعيج السلمان الصباح', 'mubarak_alkabeer'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'دعيج السلمان الصباح');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Riyada Boys', 'الريادة بنين', 'mubarak_alkabeer'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الريادة بنين');

-- =============================================
-- MUBARAK AL-KABEER (مبارك الكبير) - GIRLS (بنات)
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Sharqiya', 'الشرقية', 'mubarak_alkabeer'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الشرقية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Layla Al-Ghifariya', 'ليلى الغفارية', 'mubarak_alkabeer'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ليلى الغفارية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Tulaytula', 'طليطلة', 'mubarak_alkabeer'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'طليطلة');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Burqan', 'برقان', 'mubarak_alkabeer'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'برقان');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Fatima Al-Hashimiya', 'فاطمة الهاشمية', 'mubarak_alkabeer'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'فاطمة الهاشمية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Adan', 'العدان', 'mubarak_alkabeer'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'العدان');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Sabah Al-Salem Girls', 'صباح السالم للبنات', 'mubarak_alkabeer'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'صباح السالم للبنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Fariah Bint Abi Al-Salt', 'فارعة بنت ابي الصلت', 'mubarak_alkabeer'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'فارعة بنت ابي الصلت');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Riyada Girls', 'الريادة بنات', 'mubarak_alkabeer'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'الريادة بنات');

-- =============================================
-- RELIGIOUS INSTITUTES - SECONDARY (ديني - ثانوي)
-- =============================================
-- Qurtuba Religious Institute Boys (حولي - قرطبة → hawalli)
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Qurtuba Religious Institute Boys', 'المعهد الديني قرطبة', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'المعهد الديني قرطبة' AND governorate = 'hawalli');

-- Qurtuba Religious Institute Girls (حولي - قرطبة → hawalli)
-- Note: Same name but different gender section; uses same name_ar check
-- If the DB has a gender column, both will be caught by the NOT EXISTS on name_ar
-- Adding a distinguishing suffix for the girls entry
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Qurtuba Religious Institute Girls', 'المعهد الديني قرطبة بنات', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'المعهد الديني قرطبة بنات');

-- Fahaheel Religious Institute Boys (الأحمدي - الفحيحيل → ahmadi)
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Fahaheel Religious Institute Boys', 'المعهد الديني الفحيحيل', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'المعهد الديني الفحيحيل');

-- South Sabahiya Religious Institute Mixed (الأحمدي - جنوب الصباحية → ahmadi)
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'South Sabahiya Religious Institute', 'المعهد الديني جنوب الصباحية', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'المعهد الديني جنوب الصباحية');

-- Jaber Al-Ahmad Religious Institute Girls (العاصمة - جابر الأحمد → capital)
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Jaber Al-Ahmad Religious Institute Girls', 'المعهد الديني جابر الأحمد', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'المعهد الديني جابر الأحمد');
