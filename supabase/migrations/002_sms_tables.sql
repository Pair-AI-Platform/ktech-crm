-- SMS Templates
create table if not exists sms_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('appointment', 'payment', 'follow_up', 'welcome', 'reminder', 'custom')),
  content_en text not null,
  content_ar text,
  variables text[] default '{}',
  is_active boolean default true,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- SMS Messages
create table if not exists sms_messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete set null,
  student_id uuid references students(id) on delete set null,
  phone_number text not null,
  content text not null,
  template_id uuid references sms_templates(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'delivered', 'failed')),
  provider_id text, -- Twilio message SID
  error_message text,
  sent_by uuid references profiles(id),
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_sms_messages_lead_id on sms_messages(lead_id);
create index if not exists idx_sms_messages_student_id on sms_messages(student_id);
create index if not exists idx_sms_messages_phone on sms_messages(phone_number);
create index if not exists idx_sms_messages_status on sms_messages(status);
create index if not exists idx_sms_messages_created_at on sms_messages(created_at desc);

-- Insert default templates
insert into sms_templates (name, category, content_en, content_ar, variables) values
(
  'Appointment Reminder',
  'appointment',
  'Hi {{first_name}}, reminder: Your {{appointment_type}} at KTECH is on {{appointment_date}} at {{appointment_time}}. Reply YES to confirm or call 1828888 to reschedule.',
  'مرحبا {{first_name}}، تذكير: موعدك في KTECH يوم {{appointment_date}} الساعة {{appointment_time}}. رد بـ نعم للتأكيد أو اتصل على 1828888',
  ARRAY['first_name', 'appointment_type', 'appointment_date', 'appointment_time']
),
(
  'Appointment Confirmation',
  'appointment',
  'Hi {{first_name}}, your {{appointment_type}} at KTECH is confirmed for {{appointment_date}} at {{appointment_time}}. See you soon! - {{agent_name}}',
  'مرحبا {{first_name}}، تم تأكيد موعدك في KTECH يوم {{appointment_date}} الساعة {{appointment_time}}. نراك قريباً! - {{agent_name}}',
  ARRAY['first_name', 'appointment_type', 'appointment_date', 'appointment_time', 'agent_name']
),
(
  'Payment Reminder - Seat',
  'payment',
  'Hi {{first_name}}, secure your spot at KTECH with 150 KD seat reservation. Pay now: ktech.edu.kw/pay. Questions? Call 1828888',
  'مرحبا {{first_name}}، احجز مقعدك في KTECH بـ 150 دينار. ادفع الآن: ktech.edu.kw/pay. استفسارات؟ 1828888',
  ARRAY['first_name']
),
(
  'Payment Reminder - Balance',
  'payment',
  'Hi {{first_name}}, your remaining balance is {{amount}} KD. Complete payment before {{deadline}} to avoid late fees. Pay: ktech.edu.kw/pay',
  'مرحبا {{first_name}}، المبلغ المتبقي {{amount}} دينار. أكمل الدفع قبل {{deadline}}. ادفع: ktech.edu.kw/pay',
  ARRAY['first_name', 'amount', 'deadline']
),
(
  'Follow-up',
  'follow_up',
  'Hi {{first_name}}, this is {{agent_name}} from KTECH. We tried reaching you about your enrollment. Best time to call? Reply or call 1828888',
  'مرحبا {{first_name}}، هنا {{agent_name}} من KTECH. حاولنا التواصل معك بخصوص التسجيل. متى يناسبك الاتصال؟ رد أو اتصل 1828888',
  ARRAY['first_name', 'agent_name']
),
(
  'Welcome',
  'welcome',
  'Welcome to KTECH, {{first_name}}! Thank you for your interest. An advisor will contact you soon. Questions? Call 1828888 or visit ktech.edu.kw',
  'أهلاً بك في KTECH يا {{first_name}}! شكراً لاهتمامك. سيتواصل معك مستشار قريباً. استفسارات؟ 1828888 أو ktech.edu.kw',
  ARRAY['first_name']
),
(
  'Application Status - Approved',
  'reminder',
  'Great news {{first_name}}! Your KTECH application is APPROVED. Next: Visit campus to complete enrollment. Call {{agent_name}} at 1828888',
  'أخبار رائعة {{first_name}}! تم قبول طلبك في KTECH. الخطوة التالية: زيارة الحرم الجامعي. اتصل بـ {{agent_name}} على 1828888',
  ARRAY['first_name', 'agent_name']
),
(
  'Deadline Alert',
  'reminder',
  'Hi {{first_name}}, registration deadline is {{deadline}}! Complete your KTECH application now at ktech.edu.kw. Don''t miss out!',
  'مرحبا {{first_name}}، آخر موعد للتسجيل {{deadline}}! أكمل طلبك في KTECH الآن: ktech.edu.kw',
  ARRAY['first_name', 'deadline']
);

-- RLS Policies
alter table sms_templates enable row level security;
alter table sms_messages enable row level security;

create policy "Users can view templates" on sms_templates for select using (true);
create policy "Admins can manage templates" on sms_templates for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "Users can view their messages" on sms_messages for select using (true);
create policy "Users can insert messages" on sms_messages for insert with check (sent_by = auth.uid());
create policy "Users can update their messages" on sms_messages for update using (sent_by = auth.uid());
