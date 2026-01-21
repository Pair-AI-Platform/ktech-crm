-- =============================================
-- MIGRATION: Add All Kuwait Secondary Schools from MOE
-- Total target: ~210 schools (123 regular + religious education)
-- =============================================

-- =============================================
-- CAPITAL (العاصمة) - ADDITIONAL BOYS SCHOOLS
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Jasem Mohamed Al-Khurafi Secondary School', 'ثانوية جاسم محمد الخرافي', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية جاسم محمد الخرافي');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Abdullah Al-Jaber Al-Sabah Secondary School', 'ثانوية عبدالله الجابر الصباح', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية عبدالله الجابر الصباح');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Khalifa Al-Mubarakiya Secondary School', 'ثانوية خليفة المباركية', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية خليفة المباركية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Shuwaikh Secondary School', 'ثانوية الشويخ', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية الشويخ');

-- =============================================
-- CAPITAL (العاصمة) - ADDITIONAL GIRLS SCHOOLS
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Algeria Secondary School for Girls', 'ثانوية الجزائر للبنات', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية الجزائر للبنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Doha Secondary School for Girls', 'ثانوية الدوحة للبنات', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية الدوحة للبنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Rawda Secondary School for Girls', 'ثانوية الروضة للبنات', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية الروضة للبنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Asmaa Bint Al-Harith Secondary School', 'ثانوية الأسماء بنت الحارث', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية الأسماء بنت الحارث');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Yarmouk Secondary School for Girls', 'ثانوية اليرموك للبنات', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية اليرموك للبنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Bibi Al-Salem Secondary School', 'ثانوية بيبي السالم', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية بيبي السالم');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Mansouriya Secondary School for Girls', 'ثانوية المنصورية للبنات', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية المنصورية للبنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Jumana Bint Abi Talib Secondary School', 'ثانوية جمانة بنت أبي طالب', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية جمانة بنت أبي طالب');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Sharifa Al-Awadi Secondary School', 'ثانوية شريفة العوضي', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية شريفة العوضي');

-- =============================================
-- HAWALLI (حولي) - ADDITIONAL BOYS SCHOOLS
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Ahmad Al-Adwani Secondary School', 'ثانوية أحمد العدواني', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية أحمد العدواني');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Saud Al-Kharji Secondary School', 'ثانوية سعود الخرجي', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية سعود الخرجي');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Abdullah Al-Mubarak Secondary School', 'ثانوية عبدالله المبارك', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية عبدالله المبارك');

-- =============================================
-- HAWALLI (حولي) - ADDITIONAL GIRLS SCHOOLS
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Jabriya Secondary School for Girls', 'ثانوية الجابرية للبنات', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية الجابرية للبنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Salmiya Secondary School for Girls', 'ثانوية السالمية للبنات', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية السالمية للبنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Amamah Bint Bishr Secondary School', 'ثانوية أمامة بنت بشر', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية أمامة بنت بشر');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Khalida Bint Al-Aswad Secondary School', 'ثانوية خالدة بنت الأسود', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية خالدة بنت الأسود');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Bayan Secondary School for Girls', 'ثانوية بيان للبنات', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية بيان للبنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Salwa Secondary School for Girls', 'ثانوية سلوى للبنات', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية سلوى للبنات');

-- =============================================
-- FARWANIYA (الفروانية) - ADDITIONAL BOYS SCHOOLS
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Jahiz Secondary School', 'ثانوية الجاحظ', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية الجاحظ');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Abdullah Al-Mubarak Secondary School (Farwaniya)', 'ثانوية عبدالله المبارك', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية عبدالله المبارك' AND governorate = 'farwaniya');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Ardhiya Secondary School', 'ثانوية العارضية', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية العارضية');

-- =============================================
-- FARWANIYA (الفروانية) - ADDITIONAL GIRLS SCHOOLS
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Abraq Khaytan Secondary School for Girls', 'ثانوية أبرق خيطان للبنات', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية أبرق خيطان للبنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Rabia Secondary School for Girls', 'ثانوية الرابية للبنات', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية الرابية للبنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Firdaws Secondary School for Girls', 'ثانوية الفردوس للبنات', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية الفردوس للبنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Nahda Secondary School for Girls', 'ثانوية النهضة للبنات', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية النهضة للبنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Um Al-Hakam Bint Abi Sufyan Secondary School', 'ثانوية أم الحكم بنت أبي سفيان', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية أم الحكم بنت أبي سفيان');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Um Amer Al-Ansariya Secondary School', 'ثانوية أم عامر الأنصارية', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية أم عامر الأنصارية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Juleib Al-Shuyoukh Secondary School for Girls', 'ثانوية جليب الشيوخ للبنات', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية جليب الشيوخ للبنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Farwaniya Secondary School for Girls', 'ثانوية الفروانية للبنات', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية الفروانية للبنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Amiriya Secondary School for Girls', 'ثانوية العامرية للبنات', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية العامرية للبنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Hawwa Bint Yazid Al-Ansariya Secondary School', 'ثانوية حواء بنت يزيد الأنصارية', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية حواء بنت يزيد الأنصارية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Durrat Al-Hashimiya Secondary School', 'ثانوية درة الهاشمية', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية درة الهاشمية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Um Ziyad Secondary School', 'ثانوية أم زياد', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية أم زياد');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Ishbiliya Secondary School for Girls', 'ثانوية إشبيلية للبنات', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية إشبيلية للبنات');

-- =============================================
-- AHMADI (الأحمدي) - ADDITIONAL BOYS SCHOOLS
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Mohammad Al-Nashmi Secondary School', 'ثانوية محمد النشمي', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية محمد النشمي');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Sabahiya Secondary School for Boys', 'ثانوية الصباحية للبنين', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية الصباحية للبنين');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Issa Abdullah Al-Houli Secondary School', 'ثانوية عيسى عبدالله الهولي', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية عيسى عبدالله الهولي');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Balat Al-Shuhada Secondary School', 'ثانوية بلاط الشهداء', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية بلاط الشهداء');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Haroun Al-Rashid Secondary School', 'ثانوية هارون الرشيد', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية هارون الرشيد');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Talha Bin Ubaid Secondary School', 'ثانوية طلحة بن عبيد', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية طلحة بن عبيد');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Ayoub Hussain Al-Ayoub Secondary School', 'ثانوية أيوب حسين الأيوب', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية أيوب حسين الأيوب');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Abdullah Bin Abbas Secondary School', 'ثانوية عبدالله بن عباس', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية عبدالله بن عباس');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Abdul Aziz Muslim Al-Zamel Secondary School', 'ثانوية عبدالعزيز مسلم الزامل', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية عبدالعزيز مسلم الزامل');

-- =============================================
-- AHMADI (الأحمدي) - ADDITIONAL GIRLS SCHOOLS
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Fahaheel Secondary School for Girls', 'ثانوية الفحيحيل للبنات', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية الفحيحيل للبنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Um Al-Ala Al-Ansariya Secondary School', 'ثانوية أم العلاء الأنصارية', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية أم العلاء الأنصارية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Anisa Bint Khabib Al-Ansariya Secondary School', 'ثانوية أنيسة بنت خبيب الأنصارية', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية أنيسة بنت خبيب الأنصارية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Riqa Secondary School for Girls', 'ثانوية الرقة للبنات', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية الرقة للبنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Zour Secondary School for Girls', 'ثانوية الزور للبنات', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية الزور للبنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Safiya Bint Abdul-Muttalib Secondary School', 'ثانوية صفية بنت عبدالمطلب', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية صفية بنت عبدالمطلب');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Sabahiya Secondary School for Girls', 'ثانوية الصباحية للبنات', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية الصباحية للبنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Um Al-Haytham Secondary School', 'ثانوية أم الهيثم', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية أم الهيثم');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Jumana Bint Al-Hassan Secondary School', 'ثانوية جمانة بنت الحسن', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية جمانة بنت الحسن');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Ghanima Al-Marzouq Secondary School', 'ثانوية غنيمة المرزوق', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية غنيمة المرزوق');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Rawdatain Secondary School for Girls', 'ثانوية الروضتين للبنات', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية الروضتين للبنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Fintas Secondary School for Girls', 'ثانوية الفنطاس للبنات', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية الفنطاس للبنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Moudhi Sultan Al-Essa Secondary School', 'ثانوية موضي سلطان العيسى', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية موضي سلطان العيسى');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Fadwa Touqan Secondary School', 'ثانوية فدوى طوقان', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية فدوى طوقان');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Amah Bint Khaled Secondary School', 'ثانوية أمة بنت خالد', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية أمة بنت خالد');

-- =============================================
-- JAHRA (الجهراء) - ADDITIONAL BOYS SCHOOLS
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Saad Al-Abdullah Secondary School', 'ثانوية سعد العبدالله', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية سعد العبدالله');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Taima Secondary School for Boys', 'ثانوية تيماء للبنين', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية تيماء للبنين');

-- =============================================
-- JAHRA (الجهراء) - ADDITIONAL GIRLS SCHOOLS
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Nawar Bint Malik Secondary School', 'ثانوية النوار بنت مالك', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية النوار بنت مالك');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Taymaa Secondary School for Girls', 'ثانوية تيماء للبنات', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية تيماء للبنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Rabia Bint Al-Harith Secondary School', 'ثانوية ربيعة بنت الحارث', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية ربيعة بنت الحارث');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Um Al-Harith Al-Ansariya Secondary School', 'ثانوية أم الحارث الأنصارية', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية أم الحارث الأنصارية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Um Mubashir Al-Ansariya Secondary School', 'ثانوية أم مبشر الأنصارية', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية أم مبشر الأنصارية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Zaynab Bint Muhammad Secondary School', 'ثانوية زينب بنت محمد', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية زينب بنت محمد');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Saad Al-Abdullah Secondary School for Girls', 'ثانوية سعد العبدالله للبنات', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية سعد العبدالله للبنات');

-- =============================================
-- MUBARAK AL-KABEER (مبارك الكبير) - ADDITIONAL BOYS SCHOOLS
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Qurain Secondary School for Boys', 'ثانوية القرين للبنين', 'mubarak_alkabeer'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية القرين للبنين');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Sabah Al-Salem Secondary School for Boys', 'ثانوية صباح السالم للبنين', 'mubarak_alkabeer'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية صباح السالم للبنين');

-- =============================================
-- MUBARAK AL-KABEER (مبارك الكبير) - ADDITIONAL GIRLS SCHOOLS
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Adan Secondary School for Girls', 'ثانوية العدان للبنات', 'mubarak_alkabeer'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية العدان للبنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Barqan Secondary School for Girls', 'ثانوية برقان للبنات', 'mubarak_alkabeer'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية برقان للبنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Sabah Al-Salem Secondary School for Girls', 'ثانوية صباح السالم للبنات', 'mubarak_alkabeer'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية صباح السالم للبنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Qurain Secondary School for Girls', 'ثانوية القرين للبنات', 'mubarak_alkabeer'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية القرين للبنات');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Al-Masayel Secondary School for Girls', 'ثانوية المسايل للبنات', 'mubarak_alkabeer'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'ثانوية المسايل للبنات');

-- =============================================
-- RELIGIOUS EDUCATION SECONDARY SCHOOLS (التربية الدينية)
-- =============================================
INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Religious Institute Secondary for Girls - Farwaniya', 'المعهد الديني الثانوي للبنات - الفروانية', 'farwaniya'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'المعهد الديني الثانوي للبنات - الفروانية');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Religious Institute Secondary for Girls - Qurtuba', 'المعهد الديني الثانوي للبنات - قرطبة', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'المعهد الديني الثانوي للبنات - قرطبة');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Religious Institute Secondary for Boys - Fahaheel', 'المعهد الديني الثانوي للبنين - الفحيحيل', 'ahmadi'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'المعهد الديني الثانوي للبنين - الفحيحيل');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Abdul Rahman Al-Sumait Religious Institute Secondary', 'معهد عبدالرحمن السميط الديني الثانوي للبنين', 'capital'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'معهد عبدالرحمن السميط الديني الثانوي للبنين');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Religious Institute Secondary for Girls - Hawalli', 'المعهد الديني الثانوي للبنات - حولي', 'hawalli'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'المعهد الديني الثانوي للبنات - حولي');

INSERT INTO schools (name_en, name_ar, governorate)
SELECT 'Religious Institute Secondary for Boys - Jahra', 'المعهد الديني الثانوي للبنين - الجهراء', 'jahra'::governorate
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name_ar = 'المعهد الديني الثانوي للبنين - الجهراء');
