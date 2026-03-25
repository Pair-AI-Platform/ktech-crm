import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://xllgtrtndxctxmqyauoo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsbGd0cnRuZHhjdHhtcXlhdW9vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI4MzE0OCwiZXhwIjoyMDgyODU5MTQ4fQ.R-3OE4mJLFjGnjNMYUvdspfRXAJ1vfAdRai1CEyE_YY'
)

const KHALIFA_ID = '52bb7f9e-a419-4336-bf1f-53d56eb2f010'
const SEMESTER_ID = '577cfbf4-01a4-466f-901f-f39875b8feb5'

const today = new Date().toISOString().split('T')[0]
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

function daysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString()
}

const { data: schools } = await supabase.from('schools').select('id').eq('is_active', true).limit(1)
const schoolId = schools?.[0]?.id
if (!schoolId) { console.error('No active schools'); process.exit(1) }
console.log('School:', schoolId)

function mkLead(first_name, last_name, phone, civil_id, stage, contactStatus, funding, source, sourceCat, extra = {}) {
  return {
    first_name, last_name, phone, civil_id,
    pipeline_stage: stage, contact_status: contactStatus,
    funding_type: funding, source, source_category: sourceCat,
    assigned_to: KHALIFA_ID, semester_id: SEMESTER_ID, school_id: schoolId,
    nationality: 'Kuwaiti', is_kuwaiti: true, grade_level: '12th',
    ...extra
  }
}

const leads = [
  // SF NEW (5)
  mkLead('Ahmad','Al-Sabah','95001001','280000000001','new','uncontacted','self_funded','walk_in','direct',{assigned_at:daysAgo(3),date_of_birth:'2007-01-15',created_at:daysAgo(3),updated_at:daysAgo(3)}),
  mkLead('Mohammed','Al-Rashidi','95001002','280000000002','new','uncontacted','self_funded','call_center','direct',{assigned_at:daysAgo(3),date_of_birth:'2007-02-15',created_at:daysAgo(3),updated_at:daysAgo(3)}),
  mkLead('Khalid','Al-Ahmad','95001003','280000000003','new','uncontacted','self_funded','whatsapp','direct',{assigned_at:daysAgo(3),date_of_birth:'2007-03-15',created_at:daysAgo(3),updated_at:daysAgo(3)}),
  mkLead('Faisal','Al-Mutairi','95001004','280000000004','new','uncontacted','self_funded','school_visit','events',{assigned_at:daysAgo(3),date_of_birth:'2007-04-15',created_at:daysAgo(3),updated_at:daysAgo(3)}),
  mkLead('Omar','Al-Shammari','95001005','280000000005','new','uncontacted','self_funded','exhibitions','events',{assigned_at:daysAgo(3),date_of_birth:'2007-05-15',created_at:daysAgo(3),updated_at:daysAgo(3)}),

  // SF CONTACTED (6) - various statuses, one birthday today, one callback today, one critical, one important
  mkLead('Salem','Al-Anzi','95002001','280000100001','contacted','interested','self_funded','website_form','digital',{assigned_at:daysAgo(7),first_contacted_at:daysAgo(5),last_contacted_at:daysAgo(2),date_of_birth:today,created_at:daysAgo(10),updated_at:daysAgo(2)}),
  mkLead('Youssef','Al-Harbi','95002002','280000100002','contacted','callback','self_funded','facebook','digital',{assigned_at:daysAgo(7),first_contacted_at:daysAgo(5),last_contacted_at:daysAgo(2),callback_date:today,created_at:daysAgo(10),updated_at:daysAgo(2)}),
  mkLead('Hassan','Al-Kandari','95002003','280000100003','contacted','will_see','self_funded','instagram','digital',{assigned_at:daysAgo(7),first_contacted_at:daysAgo(5),last_contacted_at:daysAgo(2),created_at:daysAgo(10),updated_at:daysAgo(2)}),
  mkLead('Ali','Al-Failakawi','95002004','280000100004','contacted','no_answer','self_funded','walk_in','direct',{assigned_at:daysAgo(7),first_contacted_at:daysAgo(5),last_contacted_at:daysAgo(2),created_at:daysAgo(10),updated_at:daysAgo(2)}),
  mkLead('Nasser','Al-Qattan','95002005','280000100005','contacted','interested','self_funded','walk_in','direct',{assigned_at:daysAgo(7),first_contacted_at:daysAgo(5),last_contacted_at:daysAgo(2),priority:'important',created_at:daysAgo(10),updated_at:daysAgo(2)}),
  mkLead('Bader','Al-Saeed','95002006','280000100006','contacted','interested','self_funded','exhibitions','events',{assigned_at:daysAgo(7),first_contacted_at:daysAgo(5),last_contacted_at:daysAgo(2),priority:'critical',created_at:daysAgo(10),updated_at:daysAgo(2)}),

  // SF TEST (3)
  mkLead('Fahad','Al-Hajri','95003001','280000200001','tested','interested','self_funded','old_contacts','outreach',{assigned_at:daysAgo(14),first_contacted_at:daysAgo(12),last_contacted_at:daysAgo(4),created_at:daysAgo(14),updated_at:daysAgo(4)}),
  mkLead('Hamad','Al-Dossari','95003002','280000200002','tested','interested','self_funded','old_contacts','outreach',{assigned_at:daysAgo(14),first_contacted_at:daysAgo(12),last_contacted_at:daysAgo(4),created_at:daysAgo(14),updated_at:daysAgo(4)}),
  mkLead('Saleh','Al-Azmi','95003003','280000200003','tested','interested','self_funded','snapchat','digital',{assigned_at:daysAgo(14),first_contacted_at:daysAgo(12),last_contacted_at:daysAgo(4),created_at:daysAgo(14),updated_at:daysAgo(4)}),

  // SF APPLICATION (4)
  mkLead('Abdulrahman','Al-Otaibi','95004001','280000300001','applied','interested','self_funded','current_student_referral','referrals',{assigned_at:daysAgo(20),first_contacted_at:daysAgo(18),last_contacted_at:daysAgo(3),created_at:daysAgo(21),updated_at:daysAgo(3)}),
  mkLead('Sara','Al-Fadhli','95004002','280000300002','applied','interested','self_funded','current_student_referral','referrals',{assigned_at:daysAgo(20),first_contacted_at:daysAgo(18),last_contacted_at:daysAgo(3),created_at:daysAgo(21),updated_at:daysAgo(3)}),
  mkLead('Noura','Al-Marri','95004003','280000300003','applied','interested','self_funded','current_student_referral','referrals',{assigned_at:daysAgo(20),first_contacted_at:daysAgo(18),last_contacted_at:daysAgo(3),created_at:daysAgo(21),updated_at:daysAgo(3)}),
  mkLead('Haya','Al-Khalidi','95004004','280000300004','applied','interested','self_funded','walk_in','direct',{assigned_at:daysAgo(20),first_contacted_at:daysAgo(18),last_contacted_at:daysAgo(3),created_at:daysAgo(21),updated_at:daysAgo(3)}),

  // SF APPLICANT (3)
  mkLead('Dana','Al-Ajmi','95005001','280000400001','payment','interested','self_funded','school_visit','events',{assigned_at:daysAgo(25),first_contacted_at:daysAgo(23),last_contacted_at:daysAgo(2),created_at:daysAgo(28),updated_at:daysAgo(2)}),
  mkLead('Lulwa','Al-Dhafiri','95005002','280000400002','payment','interested','self_funded','exhibitions','events',{assigned_at:daysAgo(25),first_contacted_at:daysAgo(23),last_contacted_at:daysAgo(2),created_at:daysAgo(28),updated_at:daysAgo(2)}),
  mkLead('Dalal','Al-Sabah','95005003','280000400003','payment','interested','self_funded','call_center','direct',{assigned_at:daysAgo(25),first_contacted_at:daysAgo(23),last_contacted_at:daysAgo(2),created_at:daysAgo(28),updated_at:daysAgo(2)}),

  // SF ENROLLED (4)
  mkLead('Reem','Al-Rashidi','95006001','280000500001','enrolled','interested','self_funded','facebook','digital',{assigned_at:daysAgo(30),first_contacted_at:daysAgo(28),last_contacted_at:daysAgo(1),created_at:daysAgo(35),updated_at:daysAgo(1)}),
  mkLead('Aseel','Al-Ahmad','95006002','280000500002','enrolled','interested','self_funded','instagram','digital',{assigned_at:daysAgo(30),first_contacted_at:daysAgo(28),last_contacted_at:daysAgo(1),created_at:daysAgo(35),updated_at:daysAgo(1)}),
  mkLead('Sheikha','Al-Mutairi','95006003','280000500003','enrolled','interested','self_funded','whatsapp','direct',{assigned_at:daysAgo(30),first_contacted_at:daysAgo(28),last_contacted_at:daysAgo(1),created_at:daysAgo(35),updated_at:daysAgo(1)}),
  mkLead('Latifa','Al-Shammari','95006004','280000500004','enrolled','interested','self_funded','walk_in','direct',{assigned_at:daysAgo(30),first_contacted_at:daysAgo(28),last_contacted_at:daysAgo(1),created_at:daysAgo(35),updated_at:daysAgo(1)}),

  // PUC NEW (4)
  mkLead('Maha','Al-Anzi','96001001','290000000001','new','uncontacted','puc','school_visit','events',{assigned_at:daysAgo(2),created_at:daysAgo(2),updated_at:daysAgo(2)}),
  mkLead('Amal','Al-Harbi','96001002','290000000002','new','uncontacted','puc','exhibitions','events',{assigned_at:daysAgo(2),created_at:daysAgo(2),updated_at:daysAgo(2)}),
  mkLead('Hessa','Al-Kandari','96001003','290000000003','new','uncontacted','puc','walk_in','direct',{assigned_at:daysAgo(2),created_at:daysAgo(2),updated_at:daysAgo(2)}),
  mkLead('Munira','Al-Qattan','96001004','290000000004','new','uncontacted','puc','old_contacts','outreach',{assigned_at:daysAgo(2),created_at:daysAgo(2),updated_at:daysAgo(2)}),

  // PUC CONTACTED (5)
  mkLead('Bashaer','Al-Saeed','96002001','290000100001','contacted','interested','puc','website_form','digital',{assigned_at:daysAgo(8),first_contacted_at:daysAgo(6),last_contacted_at:daysAgo(1),created_at:daysAgo(10),updated_at:daysAgo(1)}),
  mkLead('Ghadeer','Al-Hajri','96002002','290000100002','contacted','callback','puc','facebook','digital',{assigned_at:daysAgo(8),first_contacted_at:daysAgo(6),last_contacted_at:daysAgo(1),date_of_birth:tomorrow,created_at:daysAgo(10),updated_at:daysAgo(1)}),
  mkLead('Janan','Al-Dossari','96002003','290000100003','contacted','no_answer','puc','instagram','digital',{assigned_at:daysAgo(8),first_contacted_at:daysAgo(6),last_contacted_at:daysAgo(1),created_at:daysAgo(10),updated_at:daysAgo(1)}),
  mkLead('Raghad','Al-Azmi','96002004','290000100004','contacted','will_see','puc','whatsapp','direct',{assigned_at:daysAgo(8),first_contacted_at:daysAgo(6),last_contacted_at:daysAgo(1),created_at:daysAgo(10),updated_at:daysAgo(1)}),
  mkLead('Shahd','Al-Otaibi','96002005','290000100005','contacted','interested','puc','call_center','direct',{assigned_at:daysAgo(8),first_contacted_at:daysAgo(6),last_contacted_at:daysAgo(1),priority:'important',created_at:daysAgo(10),updated_at:daysAgo(1)}),

  // PUC VISIT (3)
  mkLead('Waad','Al-Fadhli','96003001','290000200001','appointed','interested','puc','current_student_referral','referrals',{assigned_at:daysAgo(12),first_contacted_at:daysAgo(10),last_contacted_at:daysAgo(3),created_at:daysAgo(15),updated_at:daysAgo(3)}),
  mkLead('Deema','Al-Marri','96003002','290000200002','appointed','interested','puc','snapchat','digital',{assigned_at:daysAgo(12),first_contacted_at:daysAgo(10),last_contacted_at:daysAgo(3),created_at:daysAgo(15),updated_at:daysAgo(3)}),
  mkLead('Lamia','Al-Khalidi','96003003','290000200003','appointed','interested','puc','old_contacts','outreach',{assigned_at:daysAgo(12),first_contacted_at:daysAgo(10),last_contacted_at:daysAgo(3),created_at:daysAgo(15),updated_at:daysAgo(3)}),

  // PUC TEST (3)
  mkLead('Aisha','Al-Ajmi','96004001','290000300001','tested','interested','puc','walk_in','direct',{assigned_at:daysAgo(16),first_contacted_at:daysAgo(14),last_contacted_at:daysAgo(5),created_at:daysAgo(18),updated_at:daysAgo(5)}),
  mkLead('Ruqaya','Al-Dhafiri','96004002','290000300002','tested','interested','puc','current_student_referral','referrals',{assigned_at:daysAgo(16),first_contacted_at:daysAgo(14),last_contacted_at:daysAgo(5),created_at:daysAgo(18),updated_at:daysAgo(5)}),
  mkLead('Hind','Al-Sabah','96004003','290000300003','tested','interested','puc','current_student_referral','referrals',{assigned_at:daysAgo(16),first_contacted_at:daysAgo(14),last_contacted_at:daysAgo(5),created_at:daysAgo(18),updated_at:daysAgo(5)}),

  // PUC APPLICATION (2)
  mkLead('Nouf','Al-Rashidi','96005001','290000400001','applied','interested','puc','exhibitions','events',{assigned_at:daysAgo(20),first_contacted_at:daysAgo(18),last_contacted_at:daysAgo(2),created_at:daysAgo(22),updated_at:daysAgo(2)}),
  mkLead('Mashael','Al-Ahmad','96005002','290000400002','applied','interested','puc','school_visit','events',{assigned_at:daysAgo(20),first_contacted_at:daysAgo(18),last_contacted_at:daysAgo(2),created_at:daysAgo(22),updated_at:daysAgo(2)}),

  // PUC DOCUMENT SUBMISSION (2)
  mkLead('Alanoud','Al-Mutairi','96006001','290000500001','puc_document_submission','interested','puc','walk_in','direct',{assigned_at:daysAgo(25),first_contacted_at:daysAgo(22),last_contacted_at:daysAgo(1),created_at:daysAgo(28),updated_at:daysAgo(1)}),
  mkLead('Budoor','Al-Shammari','96006002','290000500002','puc_document_submission','interested','puc','whatsapp','direct',{assigned_at:daysAgo(25),first_contacted_at:daysAgo(22),last_contacted_at:daysAgo(1),created_at:daysAgo(28),updated_at:daysAgo(1)}),

  // PUC APPLICATION SUBMISSION (2)
  mkLead('Kholoud','Al-Anzi','96007001','290000600001','puc_application_submission','interested','puc','facebook','digital',{assigned_at:daysAgo(28),first_contacted_at:daysAgo(26),last_contacted_at:daysAgo(1),created_at:daysAgo(30),updated_at:daysAgo(1)}),
  mkLead('Yasmin','Al-Harbi','96007002','290000600002','puc_application_submission','interested','puc','instagram','digital',{assigned_at:daysAgo(28),first_contacted_at:daysAgo(26),last_contacted_at:daysAgo(1),created_at:daysAgo(30),updated_at:daysAgo(1)}),

  // PUC APPLICANT (2)
  mkLead('Jawaher','Al-Kandari','96008001','290000700001','payment','interested','puc','old_contacts','outreach',{assigned_at:daysAgo(30),first_contacted_at:daysAgo(28),last_contacted_at:daysAgo(1),created_at:daysAgo(35),updated_at:daysAgo(1)}),
  mkLead('Taif','Al-Qattan','96008002','290000700002','payment','interested','puc','old_contacts','outreach',{assigned_at:daysAgo(30),first_contacted_at:daysAgo(28),last_contacted_at:daysAgo(1),created_at:daysAgo(35),updated_at:daysAgo(1)}),

  // PUC ENROLLED (2)
  mkLead('Salma','Al-Saeed','96009001','290000800001','enrolled','interested','puc','call_center','direct',{assigned_at:daysAgo(35),first_contacted_at:daysAgo(32),last_contacted_at:daysAgo(1),created_at:daysAgo(40),updated_at:daysAgo(1)}),
  mkLead('Razan','Al-Hajri','96009002','290000800002','enrolled','interested','puc','walk_in','direct',{assigned_at:daysAgo(35),first_contacted_at:daysAgo(32),last_contacted_at:daysAgo(1),created_at:daysAgo(40),updated_at:daysAgo(1)}),

  // LOST (5)
  mkLead('Turki','Al-Dossari','97001001','280001000001','lost','not_interested','self_funded','walk_in','direct',{assigned_at:daysAgo(15),first_contacted_at:daysAgo(13),last_contacted_at:daysAgo(8),lost_at_stage:'contacted',created_at:daysAgo(20),updated_at:daysAgo(8)}),
  mkLead('Saud','Al-Azmi','97001002','280001000002','lost','not_interested','self_funded','facebook','digital',{assigned_at:daysAgo(15),first_contacted_at:daysAgo(13),last_contacted_at:daysAgo(8),lost_at_stage:'contacted',created_at:daysAgo(20),updated_at:daysAgo(8)}),
  mkLead('Jasem','Al-Otaibi','97001003','280001000003','lost','not_interested','self_funded','school_visit','events',{assigned_at:daysAgo(15),first_contacted_at:daysAgo(13),last_contacted_at:daysAgo(8),lost_at_stage:'tested',created_at:daysAgo(20),updated_at:daysAgo(8)}),
  mkLead('Mubarak','Al-Fadhli','97001004','280001000004','lost','no_answer','puc','whatsapp','direct',{assigned_at:daysAgo(15),first_contacted_at:daysAgo(13),last_contacted_at:daysAgo(8),lost_at_stage:'contacted',created_at:daysAgo(20),updated_at:daysAgo(8)}),
  mkLead('Talal','Al-Marri','97001005','280001000005','lost','no_answer','puc','call_center','direct',{assigned_at:daysAgo(15),first_contacted_at:daysAgo(13),last_contacted_at:daysAgo(8),lost_at_stage:'tested',created_at:daysAgo(20),updated_at:daysAgo(8)}),
]

console.log(`Inserting ${leads.length} leads...`)
const { data: insertedLeads, error: leadsError } = await supabase
  .from('leads')
  .insert(leads)
  .select('id, first_name, last_name, pipeline_stage, funding_type, contact_status')

if (leadsError) {
  console.error('Error inserting leads:', leadsError)
  process.exit(1)
}
console.log(`Inserted ${insertedLeads.length} leads!`)

// Appointment slots
const slots = [
  { appointment_type: ['new_appointment'], date: today, start_time: '09:00', end_time: '10:00', capacity: 5, booked_count: 1, is_active: true, created_by: KHALIFA_ID },
  { appointment_type: ['new_appointment'], date: today, start_time: '10:00', end_time: '11:00', capacity: 5, booked_count: 1, is_active: true, created_by: KHALIFA_ID },
  { appointment_type: ['sf_appointment'], date: today, start_time: '11:00', end_time: '12:00', capacity: 5, booked_count: 1, is_active: true, created_by: KHALIFA_ID },
  { appointment_type: ['puc_documents'], date: today, start_time: '13:00', end_time: '14:00', capacity: 5, booked_count: 1, is_active: true, created_by: KHALIFA_ID },
  { appointment_type: ['retest'], date: today, start_time: '14:00', end_time: '15:00', capacity: 5, booked_count: 1, is_active: true, created_by: KHALIFA_ID },
  { appointment_type: ['new_appointment'], date: yesterday, start_time: '09:00', end_time: '10:00', capacity: 5, booked_count: 1, is_active: true, created_by: KHALIFA_ID },
  { appointment_type: ['new_appointment'], date: yesterday, start_time: '11:00', end_time: '12:00', capacity: 5, booked_count: 1, is_active: true, created_by: KHALIFA_ID },
  { appointment_type: ['sf_appointment'], date: twoDaysAgo, start_time: '10:00', end_time: '11:00', capacity: 5, booked_count: 1, is_active: true, created_by: KHALIFA_ID },
]

const { data: insertedSlots, error: slotsError } = await supabase
  .from('appointment_slots').insert(slots).select('id, date, start_time')

if (slotsError) { console.error('Error slots:', slotsError); process.exit(1) }
console.log(`Inserted ${insertedSlots.length} slots`)

const findSlot = (d, t) => insertedSlots.find(s => s.date === d && s.start_time === t)?.id
const byStage = (stage, funding) => insertedLeads.filter(l => l.pipeline_stage === stage && (!funding || l.funding_type === funding))

const contacted = byStage('contacted')
const tests = byStage('tested')
const apps = byStage('applied', 'self_funded')
const docs = byStage('puc_document_submission')
const newL = byStage('new')

const appointments = [
  { slot_id: findSlot(today,'09:00'), lead_id: contacted[0]?.id, appointment_type: ['new_appointment'], scheduled_date: today, scheduled_time: '09:00', duration_minutes: 60, status: 'scheduled', assigned_agent: KHALIFA_ID, modality: 'campus', created_by: KHALIFA_ID, created_at: daysAgo(2) },
  { slot_id: findSlot(today,'10:00'), lead_id: contacted[1]?.id, appointment_type: ['new_appointment'], scheduled_date: today, scheduled_time: '10:00', duration_minutes: 60, status: 'confirmed', assigned_agent: KHALIFA_ID, modality: 'campus', confirmed_at: daysAgo(0), created_by: KHALIFA_ID, created_at: daysAgo(3) },
  { slot_id: findSlot(today,'11:00'), lead_id: apps[0]?.id, appointment_type: ['sf_appointment'], scheduled_date: today, scheduled_time: '11:00', duration_minutes: 60, status: 'on_the_way', assigned_agent: KHALIFA_ID, modality: 'campus', on_the_way_at: daysAgo(0), created_by: KHALIFA_ID, created_at: daysAgo(2) },
  { slot_id: findSlot(today,'13:00'), lead_id: docs[0]?.id, appointment_type: ['puc_documents'], scheduled_date: today, scheduled_time: '13:00', duration_minutes: 60, status: 'scheduled', assigned_agent: KHALIFA_ID, modality: 'campus', created_by: KHALIFA_ID, created_at: daysAgo(1) },
  { slot_id: findSlot(today,'14:00'), lead_id: tests[0]?.id, appointment_type: ['retest'], scheduled_date: today, scheduled_time: '14:00', duration_minutes: 60, status: 'will_see', assigned_agent: KHALIFA_ID, modality: 'campus', will_see_at: daysAgo(0), created_by: KHALIFA_ID, created_at: daysAgo(2) },
  // Past still scheduled (no update)
  { slot_id: findSlot(yesterday,'09:00'), lead_id: newL[0]?.id, appointment_type: ['new_appointment'], scheduled_date: yesterday, scheduled_time: '09:00', duration_minutes: 60, status: 'scheduled', assigned_agent: KHALIFA_ID, modality: 'campus', created_by: KHALIFA_ID, created_at: daysAgo(4) },
  { slot_id: findSlot(yesterday,'11:00'), lead_id: newL[1]?.id, appointment_type: ['new_appointment'], scheduled_date: yesterday, scheduled_time: '11:00', duration_minutes: 60, status: 'scheduled', assigned_agent: KHALIFA_ID, modality: 'campus', created_by: KHALIFA_ID, created_at: daysAgo(3) },
  { slot_id: findSlot(twoDaysAgo,'10:00'), lead_id: contacted[2]?.id, appointment_type: ['sf_appointment'], scheduled_date: twoDaysAgo, scheduled_time: '10:00', duration_minutes: 60, status: 'scheduled', assigned_agent: KHALIFA_ID, modality: 'campus', created_by: KHALIFA_ID, created_at: daysAgo(5) },
].filter(a => a.slot_id && a.lead_id)

console.log(`Inserting ${appointments.length} appointments...`)
const { data: insertedAppts, error: apptsError } = await supabase
  .from('appointments').insert(appointments).select('id, status, scheduled_date')

if (apptsError) { console.error('Error appts:', apptsError); process.exit(1) }

console.log(`\n=== DONE ===`)
console.log(`Leads: ${insertedLeads.length} (SF: ${byStage('','self_funded').length}, PUC: ${byStage('','puc').length})`)
console.log(`Appointments: ${insertedAppts.length} (today: ${insertedAppts.filter(a=>a.scheduled_date===today).length}, past-scheduled: ${insertedAppts.filter(a=>a.scheduled_date!==today).length})`)
console.log(`\nRefresh the dashboard!`)
