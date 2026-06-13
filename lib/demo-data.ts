import type { Lead, Student, Appointment, Profile, PipelineStage, AppointmentType, LostReason, Activity } from "@/types"
import { toDateString } from "@/lib/utils"

// Check if we're in demo mode
export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false
  if (process.env.NODE_ENV === "production") return false
  if (process.env.NEXT_PUBLIC_ALLOW_DEMO_MODE !== "true") return false
  return localStorage.getItem("ktech-demo-mode") === "true"
}

// Get the demo role (admin or agent)
export function getDemoRole(): "admin" | "agent" {
  if (typeof window === "undefined") return "agent"
  return localStorage.getItem("ktech-demo-role") === "admin" ? "admin" : "agent"
}

// Demo data persistence - store updates in localStorage
const DEMO_LEADS_STORAGE_KEY = "ktech-demo-leads-updates"
const DEMO_APPOINTMENTS_STORAGE_KEY = "ktech-demo-appointments-updates"

// Get stored demo lead updates
function getDemoLeadUpdates(): Record<string, Partial<Lead>> {
  if (typeof window === "undefined") return {}
  try {
    const stored = localStorage.getItem(DEMO_LEADS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

// Save demo lead update
export function saveDemoLeadUpdate(id: string, updates: Partial<Lead>): void {
  if (typeof window === "undefined") return
  try {
    const current = getDemoLeadUpdates()
    current[id] = { ...current[id], ...updates }
    localStorage.setItem(DEMO_LEADS_STORAGE_KEY, JSON.stringify(current))
  } catch {
    // Ignore storage errors
  }
}

// Get stored demo appointment updates
export function getDemoAppointmentUpdates(): Record<string, Partial<Appointment>> {
  if (typeof window === "undefined") return {}
  try {
    const stored = localStorage.getItem(DEMO_APPOINTMENTS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

// Save demo appointment update
export function saveDemoAppointmentUpdate(id: string, updates: Partial<Appointment>): void {
  if (typeof window === "undefined") return
  try {
    const current = getDemoAppointmentUpdates()
    current[id] = { ...current[id], ...updates }
    localStorage.setItem(DEMO_APPOINTMENTS_STORAGE_KEY, JSON.stringify(current))
  } catch {
    // Ignore storage errors
  }
}

// Get a single demo lead with updates applied
export function getDemoLeadById(id: string): Lead | null {
  const leads = getDemoLeads()
  return leads.find(l => l.id === id) || null
}

// Clear demo data updates (useful for reset)
export function clearDemoDataUpdates(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(DEMO_LEADS_STORAGE_KEY)
}

// Demo agents - fictional data for demo mode
export const DEMO_AGENTS: Profile[] = [
  // Admins
  {
    id: "admin-2",
    email: "demo.admin2@example.com",
    full_name: "Aldana Ali",
    role: "admin",
    avatar_url: undefined,
    is_active: true,
    monthly_target: 50,
    created_at: "2024-01-01T08:00:00Z",
    updated_at: "2024-01-01T08:00:00Z",
  },
  {
    id: "admin-3",
    email: "demo.admin3@example.com",
    full_name: "Abdulwahab Boodai",
    role: "admin",
    avatar_url: undefined,
    is_active: true,
    monthly_target: 50,
    created_at: "2024-01-01T08:00:00Z",
    updated_at: "2024-01-01T08:00:00Z",
  },
  // Agents
  {
    id: "agent-1",
    email: "demo.agent1@example.com",
    full_name: "Sarah Jones",
    role: "agent",
    avatar_url: undefined,
    is_active: true,
    monthly_target: 40,
    created_at: "2024-01-15T08:00:00Z",
    updated_at: "2024-01-15T08:00:00Z",
  },
  {
    id: "agent-2",
    email: "demo.agent2@example.com",
    full_name: "Ahmed Hassan",
    role: "agent",
    avatar_url: undefined,
    is_active: true,
    monthly_target: 40,
    created_at: "2024-01-15T08:00:00Z",
    updated_at: "2024-01-15T08:00:00Z",
  },
  {
    id: "agent-3",
    email: "demo.agent3@example.com",
    full_name: "Nora Khalid",
    role: "agent",
    avatar_url: undefined,
    is_active: true,
    monthly_target: 40,
    created_at: "2024-01-15T08:00:00Z",
    updated_at: "2024-01-15T08:00:00Z",
  },
  {
    id: "agent-4",
    email: "demo.agent4@example.com",
    full_name: "Omar Farid",
    role: "agent",
    avatar_url: undefined,
    is_active: true,
    monthly_target: 40,
    created_at: "2024-01-15T08:00:00Z",
    updated_at: "2024-01-15T08:00:00Z",
  },
  {
    id: "agent-5",
    email: "demo.agent5@example.com",
    full_name: "Lina Mahmoud",
    role: "agent",
    avatar_url: undefined,
    is_active: true,
    monthly_target: 40,
    created_at: "2024-01-15T08:00:00Z",
    updated_at: "2024-01-15T08:00:00Z",
  },
  {
    id: "agent-6",
    email: "demo.agent6@example.com",
    full_name: "Khalid Nasser",
    role: "agent",
    avatar_url: undefined,
    is_active: true,
    monthly_target: 40,
    created_at: "2024-01-15T08:00:00Z",
    updated_at: "2024-01-15T08:00:00Z",
  },
  {
    id: "agent-7",
    email: "demo.agent7@example.com",
    full_name: "Dana Ali",
    role: "agent",
    avatar_url: undefined,
    is_active: true,
    monthly_target: 40,
    created_at: "2024-01-15T08:00:00Z",
    updated_at: "2024-01-15T08:00:00Z",
  },
  {
    id: "agent-8",
    email: "demo.agent8@example.com",
    full_name: "Faisal Khaled",
    role: "agent",
    avatar_url: undefined,
    is_active: true,
    monthly_target: 40,
    created_at: "2024-01-15T08:00:00Z",
    updated_at: "2024-01-15T08:00:00Z",
  },
  {
    id: "agent-9",
    email: "demo.agent9@example.com",
    full_name: "Reem Salem",
    role: "agent",
    avatar_url: undefined,
    is_active: true,
    monthly_target: 40,
    created_at: "2024-01-15T08:00:00Z",
    updated_at: "2024-01-15T08:00:00Z",
  },
  {
    id: "agent-10",
    email: "demo.agent10@example.com",
    full_name: "Yousef Ward",
    role: "agent",
    avatar_url: undefined,
    is_active: true,
    monthly_target: 40,
    created_at: "2024-01-15T08:00:00Z",
    updated_at: "2024-01-15T08:00:00Z",
  },
]

// The persona the "agent" easy-login demo button signs in as (see DEMO_AGENT_PROFILE
// in lib/hooks/use-user.ts). Generated demo data is filtered to this id in the
// agent dashboard, so we bias a healthy share of records to it — otherwise the
// agent view only sees a random ~1/12 sliver and looks empty next to the admin view.
const PRIMARY_DEMO_AGENT_ID = "agent-1"
const PRIMARY_DEMO_AGENT = DEMO_AGENTS.find(a => a.id === PRIMARY_DEMO_AGENT_ID) || DEMO_AGENTS[0]
const OTHER_DEMO_AGENTS = DEMO_AGENTS.filter(a => a.id !== PRIMARY_DEMO_AGENT_ID)

// Deterministically assign ~40% of generated records (2 out of every 5) to the
// primary demo agent so its view is fully populated across every stage, while the
// rest spread across the team to keep admin/team views realistic.
function pickDemoAgent(index: number): Profile {
  if (index % 5 < 2) return PRIMARY_DEMO_AGENT
  return randomItem(OTHER_DEMO_AGENTS)
}

// Kuwaiti names for realistic data (Arabic)
const firstNamesM = ["أحمد", "محمد", "عبدالله", "خالد", "فيصل", "عمر", "سالم", "يوسف", "حسن", "علي", "ناصر", "بدر", "فهد", "حمد", "صالح"]
const firstNamesF = ["فاطمة", "مريم", "سارة", "نورة", "هيا", "دانة", "لولوة", "دلال", "ريم", "أسيل", "شيخة", "لطيفة", "مها", "أمل", "حصة"]
const lastNames = ["الصباح", "الرشيد", "الأحمد", "المطيري", "الشمري", "العنزي", "الحربي", "الكندري", "الفيلكاوي", "القطان", "السعيد", "الهاجري", "الدوسري", "العازمي", "العتيبي"]

const sources = ["instagram", "school_visit", "current_student_referral", "walk_in", "exhibitions", "snapchat", "facebook", "whatsapp", "call_center", "website_form"]
const sourceCategories = ["marketing", "events", "referrals", "direct", "outreach"]
const schools = [
  "jaber_mubarak_boys", "ahmad_shihab_aldin", "saad_bin_alrabee",
  "qurtuba_girls", "alasmaa_bint_alharith", "fatima_bint_alwalid",
  "jaber_alahmad_hawalli", "saleh_shihab", "abdullatif_thunayan",
  "khalida_bint_alaswad", "aljabriya_girls",
  "shujaa_bin_alaslam", "ibn_alomaid", "anas_bin_malik",
  "alfirdaws_girls", "alrabie_girls",
  "alkindi", "alqurtubi", "salem_almubarak",
  "fatima_bint_asad", "alkhairan_girls",
  "aljahra_private_boys", "alwaha", "thabit_bin_qais",
  "alimam_malik", "jaber_alali_alsabah",
]
const tracks = ["science", "arts"]
const majors = ["cyber_security", "cis", "marketing", "accounting", "mis", "network_security", "other"]
const fundingTypes = ["self_funded", "puc"]
const contactStatuses = ["uncontacted", "interested", "not_interested", "no_answer", "callback", "will_see"]
const gradeLevels = ["10th", "11th", "12th"]
const stages: PipelineStage[] = ["new", "contacted", "visit", "test", "application", "puc_document_submission", "puc_application_submission", "applicant", "enrolled", "withdraw", "lost"]

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomPhone(): string {
  const prefixes = ["5", "6", "9"]
  return prefixes[Math.floor(Math.random() * prefixes.length)] + Math.random().toString().slice(2, 9)
}

function randomCivilId(): string {
  const prefix = Math.random() > 0.5 ? "2" : "3"
  return prefix + Math.random().toString().slice(2, 13)
}

function randomGPA(): number {
  return Math.round((70 + Math.random() * 30) * 10) / 10
}

function randomDate(daysAgo: number): string {
  const date = new Date()
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo))
  return date.toISOString()
}

// Generate realistic activity notes for a lead
function generateActivityNotes(stage: PipelineStage, firstName: string): string {
  const now = new Date()
  const notes: string[] = []

  // General notes
  const generalNotes = [
    `Strong candidate, high GPA and motivated`,
    `${firstName} prefers morning classes`,
    `Interested in spring semester enrollment`,
    `Parent is supportive, wants updates`,
    `${firstName} has friends already enrolled`,
    `Referred by current student`,
    `Visited our booth at exhibition, very engaged`,
    `Found us on Instagram, interested in cyber security`,
  ]

  // Number of notes based on stage (more advanced stages = more notes)
  const stageProgress: Record<PipelineStage, number> = {
    new: 1,
    contacted: 2,
    visit: 3,
    test: 5,
    application: 6,
    applicant: 9,
    enrolled: 10,
    withdraw: 3,
    lost: 3,
    puc_document_submission: 7,
    puc_application_submission: 8,
  }

  const numNotes = Math.min(stageProgress[stage], Math.floor(Math.random() * 4) + stageProgress[stage])

  // Generate timestamps going backwards
  for (let i = 0; i < numNotes; i++) {
    const daysAgo = i * Math.floor(Math.random() * 5) + i
    const date = new Date(now)
    date.setDate(date.getDate() - daysAgo)
    date.setHours(9 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60))

    const timestamp = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    // Pick a general note (plain notes only)
    const note = randomItem(generalNotes)

    notes.push(`[${timestamp}] ${note}`)
  }

  // Return notes in chronological order (oldest first)
  return notes.reverse().join('\n\n')
}

// Generate demo leads with even distribution across all stages
export function generateDemoLeads(count: number = 50): Lead[] {
  const leads: Lead[] = []

  // Counter for submission stage leads to distribute substages evenly
  let submissionLeadCounter = 0

  for (let i = 0; i < count; i++) {
    const isMale = Math.random() > 0.5
    const firstName = randomItem(isMale ? firstNamesM : firstNamesF)
    const lastName = randomItem(lastNames)
    // Distribute evenly across stages
    const stageIndex = i % stages.length
    const stage = stages[stageIndex]
    const agent = pickDemoAgent(i)

    const statuses: Lead["status"][] = ["no_answer", "callback", "not_interested", "switched_off", "busy", "confirmed", "wrong_number", "will_see", "postponed", "by_mistake", "disconnected", "hanged_up"]

    // Ministry block reasons for submission stage leads
    // Submission substages for even distribution of colors
    const submissionSubstages: Lead["submission_substage"][] = ['documents', 'submissions']

    // For submission stage leads, assign substage in round-robin for even distribution
    let submissionSubstage: Lead["submission_substage"] | undefined = undefined

    if (stage === 'applicant') {
      // Distribute substages evenly among applicant leads using dedicated counter
      const substageIndex = submissionLeadCounter % submissionSubstages.length
      submissionSubstage = submissionSubstages[substageIndex]
      submissionLeadCounter++
    }

    leads.push({
      id: `lead-${i + 1}`,
      first_name: firstName,
      last_name: lastName,
      civil_id: randomCivilId(),
      phone: randomPhone(),
      email: undefined,
      date_of_birth: `200${Math.floor(Math.random() * 7)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`,
      nationality: "Kuwaiti",
      is_kuwaiti: true,
      is_transfer_student: Math.random() > 0.9,
      is_special_needs: Math.random() > 0.95,
      is_diplomatic: Math.random() > 0.95,
      is_athlete: Math.random() > 0.95,
      is_married: Math.random() > 0.95,
      is_employee: Math.random() > 0.9,
      is_marketing_student: Math.random() > 0.85,
      school: randomItem(schools) as Lead["school"],
      source_category: randomItem(sourceCategories) as Lead["source_category"],
      source: randomItem(sources) as Lead["source"],
      pipeline_stage: stage,
      status: randomItem(statuses),
      contact_status: randomItem(contactStatuses) as Lead["contact_status"],
      grade_level: randomItem(gradeLevels) as Lead["grade_level"],
      academic_track: randomItem(tracks) as Lead["academic_track"],
      gpa_grade_10: randomGPA(),
      gpa_grade_11: randomGPA(),
      gpa_grade_12_expected: stage !== "new" ? randomGPA() : undefined,
      expected_gpa: Math.round((60 + Math.random() * 35) * 10) / 10,
      actual_gpa: Math.round((55 + Math.random() * 35) * 10) / 10,
      intended_major: randomItem(majors) as Lead["intended_major"],
      funding_type: (stage === "puc_document_submission" || stage === "puc_application_submission") ? "puc" : randomItem(fundingTypes) as Lead["funding_type"],
      puc_stage: (stage === "puc_document_submission" || stage === "puc_application_submission")
        ? randomItem(["ktech_application", "paci_verification", "puc_submission", "puc_decision", "enrolled"]) as Lead["puc_stage"]
        : undefined,
      has_bank_account: Math.random() > 0.3,
      has_weyay_account: Math.random() > 0.5,
      assigned_to: agent.id,
      assigned_at: randomDate(30),
      assigned_agent: agent,
      first_contacted_at: stage !== "new" ? randomDate(25) : undefined,
      last_contacted_at: stage !== "new" ? randomDate(7) : undefined,
      notes: generateActivityNotes(stage, firstName),
      created_at: randomDate(60),
      updated_at: randomDate(5),
      submission_substage: submissionSubstage,
      puc_choice: stage === "applicant" ? (randomItem(["1", "1", "2", "3", "4"]) as Lead["puc_choice"]) : undefined,
      puc_first_choice_college: undefined,
      semester_id: "demo-semester",
    })

    // Set first choice college for non-1st choice applicants
    if (stage === "applicant" && leads[leads.length - 1].puc_choice && leads[leads.length - 1].puc_choice !== "1") {
      leads[leads.length - 1].puc_first_choice_college = randomItem(["PAAET", "KU", "AUM", "GUST", "AUK", "ACM"])
    }
  }

  return leads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

// Demo withdrawal/lost reasons
export const DEMO_LOST_REASONS: LostReason[] = [
  { id: 'wr-1', category: 'financial', reason_en: 'Financial difficulties', reason_ar: 'صعوبات مالية', is_active: true },
  { id: 'wr-2', category: 'personal', reason_en: 'Personal reasons', reason_ar: 'أسباب شخصية', is_active: true },
  { id: 'wr-3', category: 'academic', reason_en: 'Transferred to another institution', reason_ar: 'انتقل إلى مؤسسة أخرى', is_active: true },
  { id: 'wr-4', category: 'academic', reason_en: 'Academic performance', reason_ar: 'الأداء الأكاديمي', is_active: true },
  { id: 'wr-5', category: 'personal', reason_en: 'Family relocation', reason_ar: 'انتقال العائلة', is_active: true },
  { id: 'wr-6', category: 'competitors', reason_en: 'Joined competitor', reason_ar: 'انضم إلى منافس', is_active: true },
]

// Generate demo students
export function generateDemoStudents(count: number = 20): Student[] {
  const students: Student[] = []
  const placementLevels = ["foundation_1", "foundation_2", "majors"]
  const pucStages = ["application", "submitted", "approved", "enrolled"]

  for (let i = 0; i < count; i++) {
    const isMale = Math.random() > 0.5
    const firstName = randomItem(isMale ? firstNamesM : firstNamesF)
    const lastName = randomItem(lastNames)
    const agent = pickDemoAgent(i)
    const fundingType = randomItem(fundingTypes) as Student["funding_type"]
    const amountPaid = Math.floor(Math.random() * 600) * 10

    let paymentStatus: Student["payment_status"]
    if (amountPaid >= 550) paymentStatus = "full_tuition"
    else if (amountPaid >= 150) paymentStatus = "seat_reserved"
    else paymentStatus = "pending"

    students.push({
      id: `student-${i + 1}`,
      lead_id: `lead-${i + 1}`,
      ktech_id: `KT${2025}${String(i + 1).padStart(4, "0")}`,
      first_name: firstName,
      last_name: lastName,
      civil_id: randomCivilId(),
      phone: randomPhone(),
      email: undefined,
      funding_type: fundingType,
      number_of_credits: 0,
      amount_paid: amountPaid,
      payment_status: paymentStatus,
      is_payment_exempted: false,
      discount_type: Math.random() > 0.7 ? randomItem(["kuwaiti_new_certificate", "kuwaiti_old_certificate", "non_kuwaiti", "athletes", "marketing", "employee", "employee_full", "athletes_full", "president", "charity", "non_kuwaiti_ministry", "service_civil_commission"]) as Student["discount_type"] : undefined,
      discount_percentage: undefined as number | undefined,
      placement_level: randomItem(placementLevels) as Student["placement_level"],
      placement_test_passed: Math.random() > 0.3,
      placement_test_exempted: Math.random() > 0.8,
      placement_test_date: randomDate(30),
      semester_id: "sem-1",
      is_withdrawn: i % 5 === 0, // ~20% withdrawn
      withdrawal_reason_id: i % 5 === 0 ? randomItem(DEMO_LOST_REASONS).id : undefined,
      paci_verified: fundingType === "puc",
      puc_converted_to_sf: false,
      puc_stage: fundingType === "puc" ? randomItem(pucStages) as Student["puc_stage"] : undefined,
      // SF Document Tracking
      sf_declaration_submitted: fundingType === "self_funded" && Math.random() > 0.3,
      sf_passport_submitted: fundingType === "self_funded" && Math.random() > 0.3,
      sf_civil_id_submitted: fundingType === "self_funded" && Math.random() > 0.3,
      sf_payment_receipt_submitted: fundingType === "self_funded" && Math.random() > 0.5,
      sf_official_transcript_submitted: false,
      // PUC Document Tracking
      puc_high_school_certificate_submitted: fundingType === "puc" && Math.random() > 0.3,
      puc_civil_id_submitted: fundingType === "puc" && Math.random() > 0.3,
      puc_parent_civil_id_submitted: fundingType === "puc" && Math.random() > 0.4,
      puc_passport_submitted: fundingType === "puc" && Math.random() > 0.4,
      puc_nationality_document_submitted: fundingType === "puc" && Math.random() > 0.4,
      puc_payment_receipt_submitted: fundingType === "puc" && Math.random() > 0.5,
      puc_acceptance_letter_submitted: fundingType === "puc" && Math.random() > 0.6,
      puc_fee_paid: fundingType === "puc" && Math.random() > 0.5,
      assigned_to: agent.id,
      assigned_agent: agent,
      created_at: randomDate(45),
      updated_at: randomDate(3),
    })

    // Set discount_percentage based on discount_type
    const student = students[students.length - 1]
    if (student.discount_type) {
      const discountPercentages: Record<string, number> = {
        kuwaiti_new_certificate: 25, kuwaiti_old_certificate: 20, non_kuwaiti: 37.5,
        athletes: 60, marketing: 70, employee: 50,
        employee_full: 100, athletes_full: 100, president: 100,
        charity: 100, non_kuwaiti_ministry: 100, service_civil_commission: 100,
      }
      student.discount_percentage = discountPercentages[student.discount_type]
    }
  }

  return students.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

// Generate demo appointments - large realistic dataset
export function generateDemoAppointments(count: number = 200): Appointment[] {
  const appointments: Appointment[] = []
  const types: AppointmentType[] = ["new_appointment", "puc_documents", "puc_application", "retest", "sf_appointment"]
  // Time slots for realistic scheduling (8:00 AM to 4:00 PM, 30-min increments)
  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00"
  ]

  // Varied realistic notes
  const noteOptions = [
    "Student requested afternoon slot",
    "Parent will accompany",
    "Rescheduled from last week",
    "Needs wheelchair access",
    "Coming from Jahra, may be late",
    "Student called to confirm morning slot",
    "Transfer student - needs evaluation",
    "Referred by current student فهد",
    "Interested in cyber security program",
    "Wants to discuss scholarship options",
    "Bringing required documents",
    "Second visit - very interested",
    "Parent wants to attend orientation",
    "Student prefers online meeting",
    "Called back after Instagram ad",
    "Walk-in converted to appointment",
    "Needs Arabic language support",
    "Coming with friend who is also interested",
    "High GPA - scholarship candidate",
    "Previously missed appointment, rebooked",
    "Documents partially ready",
    "PUC application in progress",
    "Waiting for school transcript",
    "Student confirmed via WhatsApp",
    "Agent follow-up needed",
    undefined, undefined, undefined, // some appointments have no notes
  ]

  // Cancellation reasons
  const cancelReasons = [
    "Student changed mind",
    "Family emergency",
    "Schedule conflict with school",
    "Will reschedule next week",
    "Chose another university",
    "Student unreachable",
    "Parent requested cancellation",
    "Transportation issue",
  ]

  // Can't reach reasons
  const cantReachReasons = [
    "Phone switched off",
    "Number not in service",
    "No answer after 3 attempts",
    "Wrong number provided",
    "WhatsApp message sent, no reply",
  ]

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Helper: get a specific date relative to today
  function getDate(daysOffset: number): string {
    const d = new Date(today)
    d.setDate(d.getDate() + daysOffset)
    return toDateString(d)
  }

  // Helper: skip weekends (Friday/Saturday in Kuwait)
  function isWorkday(dateStr: string): boolean {
    const d = new Date(dateStr)
    const day = d.getDay()
    return day !== 5 && day !== 6 // 5=Friday, 6=Saturday
  }

  // Build a pool of workday dates across a 5-week window
  const datePool: { date: string; daysOffset: number }[] = []
  for (let d = -21; d <= 14; d++) {
    const dateStr = getDate(d)
    if (isWorkday(dateStr)) {
      datePool.push({ date: dateStr, daysOffset: d })
    }
  }

  // Weighted date selection: today and this week get more appointments
  function pickDate(): { date: string; daysOffset: number } {
    const r = Math.random()
    if (r < 0.12) {
      // 12% chance: today
      return { date: getDate(0), daysOffset: 0 }
    } else if (r < 0.20) {
      // 8% chance: tomorrow
      const tom = { date: getDate(1), daysOffset: 1 }
      return isWorkday(tom.date) ? tom : pickDate()
    } else if (r < 0.35) {
      // 15% chance: yesterday or day before
      const offset = -(1 + Math.floor(Math.random() * 2))
      const d = { date: getDate(offset), daysOffset: offset }
      return isWorkday(d.date) ? d : pickDate()
    } else if (r < 0.55) {
      // 20% chance: this week (within ±3 days)
      const offset = -3 + Math.floor(Math.random() * 7)
      const d = { date: getDate(offset), daysOffset: offset }
      return isWorkday(d.date) ? d : pickDate()
    } else if (r < 0.75) {
      // 20% chance: past 1-2 weeks
      const offset = -(4 + Math.floor(Math.random() * 11))
      const d = { date: getDate(offset), daysOffset: offset }
      return isWorkday(d.date) ? d : pickDate()
    } else {
      // 25% chance: next 1-2 weeks
      const offset = 2 + Math.floor(Math.random() * 13)
      const d = { date: getDate(offset), daysOffset: offset }
      return isWorkday(d.date) ? d : pickDate()
    }
  }

  // Pick realistic status based on timing
  function pickStatus(daysOffset: number, isNoUpdated: boolean): Appointment["status"] {
    if (isNoUpdated) return "scheduled" // Past but still "scheduled" = needs attention

    if (daysOffset < -3) {
      // Well in the past: mostly completed or terminal
      return randomItem(["completed", "completed", "completed", "completed", "cancelled", "no_answer", "cant_reach"] as Appointment["status"][])
    } else if (daysOffset < 0) {
      // Recent past (1-3 days ago): mixed results
      return randomItem(["completed", "completed", "completed", "no_answer", "cant_reach", "cancelled", "confirmed"] as Appointment["status"][])
    } else if (daysOffset === 0) {
      // Today: active statuses
      return randomItem(["scheduled", "confirmed", "confirmed", "on_the_way", "will_see", "completed", "no_answer"] as Appointment["status"][])
    } else if (daysOffset <= 3) {
      // Next few days: mostly scheduled/confirmed
      return randomItem(["scheduled", "scheduled", "confirmed", "confirmed", "no_answer", "postponed"] as Appointment["status"][])
    } else {
      // Further future: mostly scheduled
      return randomItem(["scheduled", "scheduled", "scheduled", "confirmed", "postponed"] as Appointment["status"][])
    }
  }

  // Appointment type weights (new_appointment most common)
  function pickType(): AppointmentType {
    const r = Math.random()
    if (r < 0.30) return "new_appointment"
    if (r < 0.50) return "puc_documents"
    if (r < 0.65) return "puc_application"
    if (r < 0.78) return "retest"
    return "sf_appointment"
  }

  // Sometimes appointments have multiple types
  function pickTypes(): AppointmentType[] {
    const primary = pickType()
    if (Math.random() < 0.15) {
      // 15% chance of dual-type appointment
      const secondary = randomItem(types.filter(t => t !== primary))
      return [primary, secondary]
    }
    return [primary]
  }

  // Pipeline stages matched to appointment types
  function stageForType(type: AppointmentType): Lead["pipeline_stage"] {
    switch (type) {
      case "new_appointment": return "contacted"
      case "puc_documents": return "applicant"
      case "puc_application": return "application"
      case "retest": return "test"
      case "sf_appointment": return "contacted"
      default: return "contacted"
    }
  }

  // Funding type matched to appointment type
  function fundingForType(type: AppointmentType): Lead["funding_type"] {
    if (type === "puc_documents" || type === "puc_application") return "puc"
    if (type === "sf_appointment") return "self_funded"
    return Math.random() > 0.5 ? "puc" : "self_funded"
  }

  // First 10 appointments are "no updated" (past with "scheduled" status)
  for (let i = 0; i < count; i++) {
    const isMale = Math.random() > 0.5
    const firstName = randomItem(isMale ? firstNamesM : firstNamesF)
    const lastName = randomItem(lastNames)
    const agent = pickDemoAgent(i)
    const appointmentTypes = pickTypes()
    const primaryType = appointmentTypes[0]
    const isNoUpdated = i < 10

    let dateInfo: { date: string; daysOffset: number }

    if (isNoUpdated) {
      // Past appointments that still show "scheduled" - need attention
      const daysAgo = -(1 + Math.floor(Math.random() * 5))
      dateInfo = { date: getDate(daysAgo), daysOffset: daysAgo }
    } else {
      dateInfo = pickDate()
    }

    const status = pickStatus(dateInfo.daysOffset, isNoUpdated)
    const timeSlot = randomItem(timeSlots)
    const modality = Math.random() > 0.75 ? "online" : "campus"
    const isCallback = Math.random() > 0.85
    const stage = stageForType(primaryType)
    const funding = fundingForType(primaryType)
    // Map appointments to ~120 unique leads so some leads get 2-3 appointments (realistic rebookings)
    const leadId = `lead-${(i % 120) + 1}`

    // Build tracking fields based on status
    const confirmedAt = (status === "confirmed" || status === "completed" || status === "on_the_way" || status === "will_see")
      ? randomDate(3) : undefined
    const confirmedBy = confirmedAt ? agent.id : undefined
    const doneAt = status === "completed" ? randomDate(1) : undefined
    const doneBy = doneAt ? agent.id : undefined
    const cancelledAt = status === "cancelled" ? randomDate(2) : undefined
    const cancelledBy = cancelledAt ? agent.id : undefined
    const cancellationReason = cancelledAt ? randomItem(cancelReasons) : undefined
    const naMarkedAt = status === "no_answer" ? randomDate(2) : undefined
    const naMarkedBy = naMarkedAt ? agent.id : undefined
    const naAttempts = naMarkedAt ? (1 + Math.floor(Math.random() * 4)) : undefined
    const cantReachAt = status === "cant_reach" ? randomDate(2) : undefined
    const cantReachBy = cantReachAt ? agent.id : undefined
    const cantReachReason = cantReachAt ? randomItem(cantReachReasons) : undefined
    const onTheWayAt = status === "on_the_way" ? new Date().toISOString() : undefined
    const onTheWayBy = onTheWayAt ? agent.id : undefined
    const willSeeAt = status === "will_see" ? randomDate(1) : undefined
    const willSeeBy = willSeeAt ? agent.id : undefined

    appointments.push({
      id: `apt-${i + 1}`,
      lead_id: leadId,
      lead: {
        id: leadId,
        first_name: firstName,
        last_name: lastName,
        phone: randomPhone(),
        pipeline_stage: stage,
        nationality: "Kuwaiti",
        is_kuwaiti: true,
        funding_type: funding,
        has_weyay_account: Math.random() > 0.4,
        has_bank_account: Math.random() > 0.3,
        source_category: randomItem(sourceCategories) as Lead["source_category"],
        source: randomItem(sources) as Lead["source"],
        contact_status: randomItem(contactStatuses) as Lead["contact_status"],
        created_at: randomDate(60),
        updated_at: randomDate(2),
      } as Lead,
      appointment_type: appointmentTypes,
      modality: modality,
      scheduled_date: dateInfo.date,
      scheduled_time: timeSlot,
      duration_minutes: primaryType === "retest" ? 60 : 30,
      status: status,
      is_callback: isCallback,
      callback_reason: isCallback ? randomItem(["Student requested callback", "Parent asked to reschedule", "Agent follow-up needed", "No answer - retry"]) : undefined,
      confirmed_at: confirmedAt,
      confirmed_by: confirmedBy,
      done_at: doneAt,
      done_by: doneBy,
      cancelled_at: cancelledAt,
      cancelled_by: cancelledBy,
      cancellation_reason: cancellationReason,
      na_marked_at: naMarkedAt,
      na_marked_by: naMarkedBy,
      na_attempts: naAttempts,
      cant_reach_at: cantReachAt,
      cant_reach_by: cantReachBy,
      cant_reach_reason: cantReachReason,
      on_the_way_at: onTheWayAt,
      on_the_way_marked_by: onTheWayBy,
      will_see_at: willSeeAt,
      will_see_marked_by: willSeeBy,
      notes: randomItem(noteOptions),
      assigned_agent: agent.id,
      assigned_agent_profile: {
        id: agent.id,
        full_name: agent.full_name,
        email: agent.email,
      },
      created_at: randomDate(30),
      updated_at: randomDate(2),
    })
  }

  return appointments.sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())
}

// Pre-generated demo data (cached)
let cachedLeads: Lead[] | null = null
let cachedStudents: Student[] | null = null
let cachedAppointments: Appointment[] | null = null

export function getDemoLeads(): Lead[] {
  if (!cachedLeads) {
    cachedLeads = generateDemoLeads(440) // 40 leads per stage (11 stages)
  }

  // Apply any stored updates from localStorage
  const updates = getDemoLeadUpdates()
  if (Object.keys(updates).length === 0) {
    return cachedLeads
  }

  return cachedLeads.map(lead => {
    const leadUpdates = updates[lead.id]
    if (leadUpdates) {
      return { ...lead, ...leadUpdates }
    }
    return lead
  })
}

export function getDemoStudents(): Student[] {
  if (!cachedStudents) {
    cachedStudents = generateDemoStudents(25)
  }
  return cachedStudents
}

export function getDemoAppointments(): Appointment[] {
  // Regenerate if cache is empty, doesn't have assigned_agent_profile, or doesn't have no-updated appointments
  const hasNoUpdatedAppointments = cachedAppointments && cachedAppointments.some(apt => {
    if (apt.status !== "scheduled") return false
    const now = new Date()
    const aptDateTime = new Date(`${apt.scheduled_date}T${apt.scheduled_time || "23:59:59"}`)
    return aptDateTime < now
  })

  if (!cachedAppointments || (cachedAppointments.length > 0 && !cachedAppointments[0].assigned_agent_profile) || !hasNoUpdatedAppointments) {
    cachedAppointments = generateDemoAppointments(200)
  }

  // Apply any stored updates
  const updates = getDemoAppointmentUpdates()
  const result = cachedAppointments.map(apt => {
    if (updates[apt.id]) {
      return { ...apt, ...updates[apt.id] }
    }
    return apt
  })

  // Include newly created appointments (IDs not in cached list)
  const cachedIds = new Set(cachedAppointments.map(apt => apt.id))
  for (const [id, data] of Object.entries(updates)) {
    if (!cachedIds.has(id)) {
      result.push(data as Appointment)
    }
  }

  // Sort by date descending (matching Supabase query order) so new appointments
  // are positioned correctly and not cut off by limit/slice
  return result.sort((a, b) => {
    const dateCompare = b.scheduled_date.localeCompare(a.scheduled_date)
    if (dateCompare !== 0) return dateCompare
    return (b.scheduled_time || "").localeCompare(a.scheduled_time || "")
  })
}

// Stats helpers
export function getDemoLeadStats() {
  const leads = getDemoLeads()
  const byStage: Record<PipelineStage, number> = {
    new: 0, contacted: 0, visit: 0,
    test: 0, application: 0, applicant: 0, enrolled: 0, withdraw: 0, lost: 0,
    puc_document_submission: 0, puc_application_submission: 0
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  let thisMonth = 0

  leads.forEach(lead => {
    byStage[lead.pipeline_stage]++
    if (new Date(lead.created_at) >= startOfMonth) thisMonth++
  })

  const total = leads.length
  const application = byStage.application
  const conversionRate = total > 0 ? Math.round((application / total) * 100) : 0

  return { total, byStage, thisMonth, conversionRate }
}

export function getDemoStudentStats() {
  const students = getDemoStudents()

  return {
    total: students.length,
    pending: students.filter(s => s.payment_status === "pending").length,
    seatReserved: students.filter(s => s.payment_status === "seat_reserved").length,
    fullTuition: students.filter(s => s.payment_status === "full_tuition").length,
    puc: students.filter(s => s.funding_type === "puc").length,
    selfFunded: students.filter(s => s.funding_type === "self_funded").length,
  }
}

export function getDemoAppointmentStats() {
  const appointments = getDemoAppointments()
  const today = toDateString(new Date())

  return {
    total: appointments.length,
    today: appointments.filter(a => a.scheduled_date === today).length,
    pending: appointments.filter(a => a.status === "scheduled" || a.status === "confirmed").length,
    attended: appointments.filter(a => a.status === "completed").length,
    noShow: appointments.filter(a => a.status === "no_answer" || a.status === "cant_reach").length,
  }
}

// =============================================
// LEAD ACTIVITY TIMELINE (demo)
// =============================================

// Ordered funnel used to synthesize a believable stage history for a lead.
const DEMO_STAGE_FLOW: { stage: PipelineStage; label: string }[] = [
  { stage: "new", label: "New" },
  { stage: "contacted", label: "Contacted" },
  { stage: "visit", label: "Visit" },
  { stage: "test", label: "Test" },
  { stage: "application", label: "File" },
  { stage: "puc_document_submission", label: "Documents" },
  { stage: "puc_application_submission", label: "Submission" },
  { stage: "applicant", label: "Applicant" },
  { stage: "enrolled", label: "Enrolled" },
]

const DEMO_TIMELINE_NOTES = [
  "Called and discussed program details",
  "Parent is supportive, wants regular updates",
  "Sent WhatsApp with brochure and fees",
  "Confirmed interest in Cyber Security track",
  "Followed up after no answer earlier",
  "Reviewed required documents checklist",
  "Discussed scholarship and discount options",
  "Student prefers morning sessions",
]

// Generate a realistic per-lead activity timeline (newest first). Empty in the
// real app means the lead has no logged activities yet; in demo mode we want
// every lead to open with a populated history so the timeline is never blank.
export function getDemoLeadActivities(leadId: string): Activity[] {
  const lead = getDemoLeadById(leadId)
  if (!lead) return []

  const agent = (lead.assigned_agent
    ?? DEMO_AGENTS.find(a => a.id === lead.assigned_to)
    ?? DEMO_AGENTS[2]) as Profile
  const name = `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.trim() || "Lead"

  const currentIdx = DEMO_STAGE_FLOW.findIndex(s => s.stage === lead.pipeline_stage)
  const reached = currentIdx >= 0 ? DEMO_STAGE_FLOW.slice(0, currentIdx + 1) : [DEMO_STAGE_FLOW[0]]

  // Build oldest-first, then assign descending timestamps so the newest entry
  // is the most recent action.
  const built: Omit<Activity, "created_at">[] = []

  built.push({
    id: `${leadId}-act-created`,
    lead_id: leadId,
    activity_type: "lead_created",
    title: "Lead Created",
    description: `${name} added to the pipeline`,
    metadata: { source: lead.source },
    created_by: agent.id,
    created_by_profile: agent,
  })

  for (let i = 1; i < reached.length; i++) {
    built.push({
      id: `${leadId}-act-stage-${i}`,
      lead_id: leadId,
      activity_type: "stage_change",
      title: "Stage Changed",
      description: `${name}: ${reached[i - 1].label} → ${reached[i].label}`,
      metadata: { old_stage: reached[i - 1].stage, new_stage: reached[i].stage },
      created_by: agent.id,
      created_by_profile: agent,
    })
  }

  if (currentIdx >= 1) {
    built.push({
      id: `${leadId}-act-status`,
      lead_id: leadId,
      activity_type: "status_change",
      title: "Status Changed",
      description: `${name}: None → Interested`,
      metadata: { old_status: null, new_status: "interested" },
      created_by: agent.id,
      created_by_profile: agent,
    })
    built.push({
      id: `${leadId}-act-call`,
      lead_id: leadId,
      activity_type: "call",
      title: "Call Logged",
      description: `Spoke with ${name} about next steps`,
      metadata: {},
      created_by: agent.id,
      created_by_profile: agent,
    })
  }

  const noteCount = 2 + Math.floor(Math.random() * 3)
  for (let i = 0; i < noteCount; i++) {
    built.push({
      id: `${leadId}-act-note-${i}`,
      lead_id: leadId,
      activity_type: "note",
      title: "Note Added",
      description: randomItem(DEMO_TIMELINE_NOTES),
      metadata: {},
      created_by: agent.id,
      created_by_profile: agent,
    })
  }

  if (currentIdx >= 4) {
    built.push({
      id: `${leadId}-act-whatsapp`,
      lead_id: leadId,
      activity_type: "whatsapp_sent",
      title: "WhatsApp Sent",
      description: `Sent document reminder to ${name}`,
      metadata: {},
      created_by: agent.id,
      created_by_profile: agent,
    })
  }

  // Newest first with decreasing timestamps (a few hours to a couple days apart).
  const ordered = built.reverse()
  let clock = Date.now()
  return ordered.map(a => {
    clock -= (2 + Math.floor(Math.random() * 30)) * 60 * 60 * 1000
    return { ...a, created_at: new Date(clock).toISOString() } as Activity
  })
}

// =============================================
// DASHBOARD STATS (demo)
// =============================================

const DEMO_INACTIVE_STAGES = new Set<PipelineStage>(["lost", "withdraw", "enrolled"])

export interface DemoCriticalStats {
  activeLeads: number
  totalFiles: number
  pucFiles: number
  sfFiles: number
  todayAppointments: number
  todayCallbacks: number
}

// Critical stat cards for the dashboard. For agents, scope to their own
// assigned leads/appointments; admins see the whole demo dataset.
export function getDemoCriticalStats(opts: { isAdmin: boolean; profileId?: string | null }): DemoCriticalStats {
  const { isAdmin, profileId } = opts
  const today = toDateString(new Date())

  const leads = getDemoLeads().filter(l => isAdmin || l.assigned_to === profileId)
  const appointments = getDemoAppointments().filter(a => isAdmin || a.assigned_agent === profileId)

  const activeLeads = leads.filter(l => !DEMO_INACTIVE_STAGES.has(l.pipeline_stage)).length
  const fileLeads = leads.filter(l => l.pipeline_stage === "application")
  const todayAppts = appointments.filter(a => a.scheduled_date === today)

  return {
    activeLeads,
    totalFiles: fileLeads.length,
    pucFiles: fileLeads.filter(l => l.funding_type === "puc").length,
    sfFiles: fileLeads.filter(l => l.funding_type === "self_funded").length,
    todayAppointments: todayAppts.length,
    todayCallbacks: todayAppts.filter(a => a.is_callback).length,
  }
}

export interface DemoAgentWorkload {
  activeLeads: number
  enrolled: number
  totalAssigned: number
  newThisMonth: number
  overdueFollowUps: number
}

// Per-agent workload aggregates for the admin Team Status grid.
export function getDemoAgentWorkload(): Map<string, DemoAgentWorkload> {
  const result = new Map<string, DemoAgentWorkload>()
  const leads = getDemoLeads()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const overdueCutoff = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)

  for (const agent of DEMO_AGENTS) {
    if (agent.role !== "agent") continue
    const mine = leads.filter(l => l.assigned_to === agent.id)
    result.set(agent.id, {
      activeLeads: mine.filter(l => !DEMO_INACTIVE_STAGES.has(l.pipeline_stage)).length,
      enrolled: mine.filter(l => l.pipeline_stage === "enrolled").length,
      totalAssigned: mine.length,
      newThisMonth: mine.filter(l => new Date(l.created_at) >= startOfMonth).length,
      overdueFollowUps: mine.filter(l =>
        !DEMO_INACTIVE_STAGES.has(l.pipeline_stage) &&
        l.last_contacted_at != null &&
        new Date(l.last_contacted_at) < overdueCutoff
      ).length,
    })
  }

  return result
}

export function getTodayAppointments(): Appointment[] {
  const appointments = getDemoAppointments()
  const today = toDateString(new Date())

  // First get actual today appointments
  const todayApts = appointments.filter(a => a.scheduled_date === today)

  // If we have enough, return them
  if (todayApts.length >= 8) return todayApts

  // Otherwise supplement with some forced-today appointments for a full schedule
  const supplementCount = Math.max(0, 12 - todayApts.length)
  const todayStatuses: Appointment["status"][] = ["scheduled", "confirmed", "confirmed", "on_the_way", "will_see", "completed", "no_answer"]
  const supplemented = appointments
    .filter(a => a.scheduled_date !== today)
    .slice(0, supplementCount)
    .map(apt => ({
      ...apt,
      scheduled_date: today,
      status: randomItem(todayStatuses),
    }))

  return [...todayApts, ...supplemented]
}
