-- ============================================================================
-- Seed Campaigns Data
-- ============================================================================

INSERT INTO campaigns (name, type, status, audience_source, audience_filter, message_content, message_content_ar, subject, schedule_type, total_contacts, sent_count, delivered_count, failed_count, created_at, updated_at)
VALUES
  -- Active SMS Campaigns
  ('Spring 2026 Enrollment Drive', 'sms', 'active', 'filter', 'all_leads',
   'Hi {{first_name}}, Spring 2026 enrollment is now open at KTECH! Secure your spot today. Reply STOP to opt out.',
   'مرحبًا {{first_name}}، التسجيل لربيع 2026 مفتوح الآن في كي تك! احجز مقعدك اليوم.',
   NULL, 'immediate', 320, 310, 295, 15, now() - interval '7 days', now()),

  ('Ramadan Offer 2026', 'sms', 'completed', 'filter', 'new_leads',
   'Ramadan Mubarak {{first_name}}! Enjoy 15% off all programs this Ramadan. Limited seats. Call us now!',
   'رمضان مبارك {{first_name}}! استمتع بخصم 15% على جميع البرامج في رمضان. مقاعد محدودة.',
   NULL, 'scheduled', 500, 500, 478, 22, now() - interval '30 days', now() - interval '25 days'),

  ('Summer Intensive Promo', 'sms', 'draft', 'filter', 'interested_leads',
   'Hey {{first_name}}, our Summer Intensive programs start June 15! Early bird discount ends May 30. Learn more at ktech.edu.kw',
   'مرحبًا {{first_name}}، برامجنا الصيفية المكثفة تبدأ 15 يونيو! خصم التسجيل المبكر ينتهي 30 مايو.',
   NULL, 'scheduled', 0, 0, 0, 0, now() - interval '2 days', now()),

  -- WhatsApp Campaigns
  ('Welcome New Leads - WhatsApp', 'whatsapp', 'active', 'filter', 'new_leads',
   'Welcome to KTECH {{first_name}}! We received your inquiry. An advisor will contact you within 24 hours. In the meantime, check our programs: ktech.edu.kw/programs',
   'مرحبًا بك في كي تك {{first_name}}! تلقينا استفسارك. سيتواصل معك مستشار خلال 24 ساعة.',
   NULL, 'immediate', 150, 148, 142, 6, now() - interval '14 days', now()),

  ('Exhibition Follow-up', 'whatsapp', 'completed', 'upload', NULL,
   'Hi {{first_name}}, great meeting you at the Kuwait Education Fair! Ready to take the next step? Book a free consultation: ktech.edu.kw/book',
   'مرحبًا {{first_name}}، سعدنا بلقائك في معرض الكويت للتعليم! جاهز للخطوة التالية؟ احجز استشارة مجانية.',
   NULL, 'immediate', 85, 85, 80, 5, now() - interval '60 days', now() - interval '55 days'),

  ('Re-engagement Campaign', 'whatsapp', 'paused', 'filter', 'stale_leads',
   'Hi {{first_name}}, we noticed you were interested in studying abroad. Our new scholarship opportunities might interest you! Reply YES for details.',
   'مرحبًا {{first_name}}، لاحظنا اهتمامك بالدراسة في الخارج. فرص المنح الجديدة قد تهمك! رد بـ نعم للتفاصيل.',
   NULL, 'immediate', 200, 120, 110, 10, now() - interval '20 days', now() - interval '10 days'),

  -- Email Campaigns
  ('Monthly Newsletter - April 2026', 'email', 'completed', 'filter', 'all_leads',
   'Dear {{first_name}},\n\nHere is your monthly update from KTECH:\n- New partnerships with UK universities\n- Scholarship deadline: May 15\n- Success story: Ahmad got accepted to UCL!\n\nBest regards,\nKTECH Team',
   'عزيزي {{first_name}}،\n\nإليك آخر أخبار كي تك:\n- شراكات جديدة مع جامعات بريطانية\n- آخر موعد للمنح: 15 مايو\n- قصة نجاح: أحمد حصل على قبول في UCL!\n\nتحياتنا،\nفريق كي تك',
   'KTECH Monthly Update - April 2026', 'scheduled', 1200, 1200, 1150, 50, now() - interval '5 days', now() - interval '3 days'),

  ('Scholarship Alert', 'email', 'draft', 'filter', 'qualified_leads',
   'Dear {{first_name}},\n\nExciting news! New scholarship opportunities are available for the Fall 2026 semester:\n- 50% tuition at University of Manchester\n- Full ride at University of Exeter\n- Merit-based aid at Kings College London\n\nDeadline: June 30, 2026\n\nContact your advisor to apply.',
   'عزيزي {{first_name}}،\n\nأخبار سارة! فرص منح جديدة لفصل خريف 2026:\n- 50% من الرسوم في جامعة مانشستر\n- منحة كاملة في جامعة إكستر\n- منحة تفوق في كينغز كوليج لندن\n\nآخر موعد: 30 يونيو 2026',
   'New Scholarship Opportunities - Fall 2026', 'scheduled', 0, 0, 0, 0, now() - interval '1 day', now()),

  ('Open Day Invitation', 'email', 'scheduled', 'filter', 'interested_leads',
   'Dear {{first_name}},\n\nYou are invited to KTECH Open Day on April 20, 2026!\n\nMeet university representatives, attend workshops, and get personalized advice.\n\nRegister now: ktech.edu.kw/openday\n\nSee you there!',
   'عزيزي {{first_name}}،\n\nندعوك لحضور اليوم المفتوح في كي تك يوم 20 أبريل 2026!\n\nقابل ممثلي الجامعات واحصل على نصائح شخصية.\n\nسجل الآن: ktech.edu.kw/openday',
   'You are Invited - KTECH Open Day April 20', 'scheduled', 450, 0, 0, 0, now() - interval '3 days', now()),

  -- Voice Campaigns
  ('Kadi AI - New Lead Qualification', 'voice', 'active', 'filter', 'new_leads',
   NULL, NULL, NULL, 'immediate', 75, 70, 65, 5, now() - interval '10 days', now()),

  ('Kadi AI - Appointment Reminder', 'voice', 'active', 'filter', 'upcoming_appointments',
   NULL, NULL, NULL, 'optimal', 30, 28, 27, 1, now() - interval '5 days', now()),

  ('Kadi AI - Payment Follow-up', 'voice', 'paused', 'filter', 'pending_payments',
   NULL, NULL, NULL, 'scheduled', 45, 20, 18, 2, now() - interval '15 days', now() - interval '8 days')

ON CONFLICT DO NOTHING;
