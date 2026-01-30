import type { Lead, Student, Appointment, Profile, PipelineStage, AppointmentType, MinistryBlockReason } from "@/types"

// Check if we're in demo mode
export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem("ktech-demo-mode") === "true"
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

// Demo agents - Real ktech team members
export const DEMO_AGENTS: Profile[] = [
  // Admins
  {
    id: "admin-1",
    email: "a.ghazal@ktech.edu.kw",
    full_name: "Adel Ghazal",
    role: "admin",
    avatar_url: undefined,
    is_active: true,
    monthly_target: 50,
    created_at: "2024-01-01T08:00:00Z",
    updated_at: "2024-01-01T08:00:00Z",
  },
  {
    id: "admin-2",
    email: "a.ali@ktech.edu.kw",
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
    email: "a.boodai@ktech.edu.kw",
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
    email: "sarah.jones@ktech.edu.kw",
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
    email: "ahmed.hassan@ktech.edu.kw",
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
    email: "nora.khalid@ktech.edu.kw",
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
    email: "omar.farid@ktech.edu.kw",
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
    email: "lina.mahmoud@ktech.edu.kw",
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
    email: "khalid.nasser@ktech.edu.kw",
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
    email: "dana.ali@ktech.edu.kw",
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
    email: "faisal.khaled@ktech.edu.kw",
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
    email: "reem.salem@ktech.edu.kw",
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
    email: "yousef.ward@ktech.edu.kw",
    full_name: "Yousef Ward",
    role: "agent",
    avatar_url: undefined,
    is_active: true,
    monthly_target: 40,
    created_at: "2024-01-15T08:00:00Z",
    updated_at: "2024-01-15T08:00:00Z",
  },
]

// Kuwaiti names for realistic data (Arabic)
const firstNamesM = ["أحمد", "محمد", "عبدالله", "خالد", "فيصل", "عمر", "سالم", "يوسف", "حسن", "علي", "ناصر", "بدر", "فهد", "حمد", "صالح"]
const firstNamesF = ["فاطمة", "مريم", "سارة", "نورة", "هيا", "دانة", "لولوة", "دلال", "ريم", "أسيل", "شيخة", "لطيفة", "مها", "أمل", "حصة"]
const lastNames = ["الصباح", "الرشيد", "الأحمد", "المطيري", "الشمري", "العنزي", "الحربي", "الكندري", "الفيلكاوي", "القطان", "السعيد", "الهاجري", "الدوسري", "العازمي", "العتيبي"]

const sources = ["instagram", "school_visit", "current_student_referral", "walk_in", "exhibitions", "snapchat", "facebook", "whatsapp", "call_center", "website_form"]
const sourceCategories = ["digital", "events", "referrals", "direct", "outreach"]
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
const stages: PipelineStage[] = ["new", "contacted", "appointment", "visit", "test", "application", "applicant", "enrolled", "withdraw", "lost"]

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

function randomFutureDate(daysAhead: number): string {
  const date = new Date()
  date.setDate(date.getDate() + Math.floor(Math.random() * daysAhead))
  return date.toISOString()
}

// Generate realistic activity notes for a lead
function generateActivityNotes(stage: PipelineStage, firstName: string): string {
  const now = new Date()
  const notes: string[] = []

  // Call notes
  const callNotes = [
    `[Call] Spoke with ${firstName}, very interested in the program`,
    `[Call] Left voicemail, will try again tomorrow`,
    `[Call] ${firstName} asked about scholarship options`,
    `[Call] Discussed course curriculum and career paths`,
    `[Call] Parent answered, ${firstName} was at school. Callback scheduled`,
    `[Call] Quick chat - confirmed interest, sending brochure`,
    `[Call] ${firstName} wants to visit campus next week`,
    `[Call] Answered questions about admission requirements`,
  ]

  // Meeting notes
  const meetingNotes = [
    `[Meeting] Campus tour completed - ${firstName} loved the facilities`,
    `[Meeting] Met with ${firstName} and parent. Very positive meeting`,
    `[Meeting] Orientation session attended`,
    `[Meeting] Had coffee with ${firstName}, discussed major options`,
    `[Meeting] Career counseling session - interested in IT field`,
  ]

  // Follow-up notes
  const followUpNotes = [
    `[Follow-up] Sent program details via WhatsApp`,
    `[Follow-up] ${firstName} requested more time to decide`,
    `[Follow-up] Reminded about application deadline`,
    `[Follow-up] Sent scholarship application form`,
    `[Follow-up] Checking on document submission status`,
    `[Follow-up] ${firstName} confirmed will submit documents this week`,
  ]

  // Email notes
  const emailNotes = [
    `[Email] Sent welcome email with program brochure`,
    `[Email] Shared admission requirements document`,
    `[Email] Sent campus map and parking info for visit`,
    `[Email] Application confirmation sent`,
  ]

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
    appointment: 3,
    visit: 3,
    test: 5,
    application: 6,
    applicant: 7,
    enrolled: 8,
    withdraw: 3,
    lost: 3,
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

    // Pick note type based on stage and randomness
    let note: string
    const rand = Math.random()

    if (i === 0 && stage !== 'new') {
      // Most recent note is usually a call or follow-up
      note = randomItem([...callNotes, ...followUpNotes])
    } else if (rand < 0.35) {
      note = randomItem(callNotes)
    } else if (rand < 0.5 && ['visit', 'test', 'application'].includes(stage)) {
      note = randomItem(meetingNotes)
    } else if (rand < 0.7) {
      note = randomItem(followUpNotes)
    } else if (rand < 0.85) {
      note = randomItem(emailNotes)
    } else {
      note = randomItem(generalNotes)
    }

    notes.push(`[${timestamp}] ${note}`)
  }

  // Return notes in chronological order (oldest first)
  return notes.reverse().join('\n\n')
}

// Generate demo leads with even distribution across all stages
export function generateDemoLeads(count: number = 50): Lead[] {
  const leads: Lead[] = []

  // Ensure even distribution across stages
  // Each stage gets roughly equal leads, with some variation
  const leadsPerStage = Math.ceil(count / stages.length)

  // Counter for submission stage leads to distribute substages evenly
  let submissionLeadCounter = 0

  for (let i = 0; i < count; i++) {
    const isMale = Math.random() > 0.5
    const firstName = randomItem(isMale ? firstNamesM : firstNamesF)
    const lastName = randomItem(lastNames)
    // Distribute evenly across stages
    const stageIndex = i % stages.length
    const stage = stages[stageIndex]
    const agent = randomItem(DEMO_AGENTS)

    const statuses: Lead["status"][] = ["no_answer", "callback", "not_interested", "switched_off", "busy", "confirmed", "wrong_number", "will_see", "postponed", "by_mistake", "disconnected", "hanged_up"]

    // Ministry block reasons for submission stage leads
    const blockReasons: Lead["ministry_block_reasons"] = ['ku', 'paaet', 'abroad', 'aasu', 'paci', 'puc', 'gpa']

    // Submission substages for even distribution of colors
    const submissionSubstages: Lead["submission_substage"][] = ['pending', 'submitted', 'blocked', 'ready', 'documents', 'lost']

    // For submission stage leads, assign substage in round-robin for even distribution
    let submissionSubstage: Lead["submission_substage"] | undefined = undefined
    let isSubmissionBlocked = false
    let selectedBlockReason: MinistryBlockReason | undefined = undefined

    if (stage === 'applicant') {
      // Distribute substages evenly among applicant leads using dedicated counter
      const substageIndex = submissionLeadCounter % submissionSubstages.length
      submissionSubstage = submissionSubstages[substageIndex]
      submissionLeadCounter++

      // Only set ministry_blocked for 'blocked' substage leads
      isSubmissionBlocked = submissionSubstage === 'blocked'
      selectedBlockReason = isSubmissionBlocked ? randomItem(blockReasons) : undefined
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
      school: randomItem(schools) as Lead["school"],
      source_category: randomItem(sourceCategories) as Lead["source_category"],
      source: randomItem(sources) as Lead["source"],
      pipeline_stage: stage,
      status: stage === "visit" ? undefined : randomItem(statuses),
      contact_status: randomItem(contactStatuses) as Lead["contact_status"],
      grade_level: randomItem(gradeLevels) as Lead["grade_level"],
      academic_track: randomItem(tracks) as Lead["academic_track"],
      gpa_grade_10: randomGPA(),
      gpa_grade_11: randomGPA(),
      gpa_grade_12_expected: stage !== "new" ? randomGPA() : undefined,
      intended_major: randomItem(majors) as Lead["intended_major"],
      funding_type: randomItem(fundingTypes) as Lead["funding_type"],
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
      ministry_blocked: isSubmissionBlocked,
      ministry_block_reasons: isSubmissionBlocked ? [selectedBlockReason!] : undefined,
      submission_substage: submissionSubstage,
    })
  }

  return leads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

// Generate demo students
export function generateDemoStudents(count: number = 20): Student[] {
  const students: Student[] = []
  const placementLevels = ["foundation_1", "foundation_2", "majors"]
  const pucStages = ["application", "submitted", "approved", "enrolled"]

  for (let i = 0; i < count; i++) {
    const isMale = Math.random() > 0.5
    const firstName = randomItem(isMale ? firstNamesM : firstNamesF)
    const lastName = randomItem(lastNames)
    const agent = randomItem(DEMO_AGENTS)
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
      discount_type: Math.random() > 0.7 ? randomItem(["sibling", "early_bird", "scholarship"]) as Student["discount_type"] : undefined,
      discount_percentage: Math.random() > 0.7 ? randomItem([5, 10, 15, 20]) : undefined,
      placement_level: randomItem(placementLevels) as Student["placement_level"],
      placement_test_passed: Math.random() > 0.3,
      placement_test_exempted: Math.random() > 0.8,
      placement_test_date: randomDate(30),
      semester_id: "sem-1",
      is_withdrawn: false,
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
  }

  return students.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

// Generate demo appointments - large realistic dataset
export function generateDemoAppointments(count: number = 200): Appointment[] {
  const appointments: Appointment[] = []
  const types: AppointmentType[] = ["new_appointment", "puc_documents", "puc_application", "retest", "sf_appointment", "sf_retest"]
  const allStatuses: Appointment["status"][] = ["scheduled", "no_answer", "confirmed", "on_the_way", "postponed", "cant_reach", "will_see", "completed", "cancelled"]
  const modalities: ("campus" | "online")[] = ["campus", "online"]

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
    return d.toISOString().split("T")[0]
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
    if (r < 0.90) return "sf_appointment"
    return "sf_retest"
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
      case "new_appointment": return randomItem(["contacted", "appointment"] as Lead["pipeline_stage"][])
      case "puc_documents": return "applicant"
      case "puc_application": return "application"
      case "retest": return "test"
      case "sf_appointment": return randomItem(["appointment", "visit"] as Lead["pipeline_stage"][])
      case "sf_retest": return "test"
      default: return "appointment"
    }
  }

  // Funding type matched to appointment type
  function fundingForType(type: AppointmentType): Lead["funding_type"] {
    if (type === "puc_documents" || type === "puc_application") return "puc"
    if (type === "sf_appointment" || type === "sf_retest") return "self_funded"
    return Math.random() > 0.5 ? "puc" : "self_funded"
  }

  // First 10 appointments are "no updated" (past with "scheduled" status)
  for (let i = 0; i < count; i++) {
    const isMale = Math.random() > 0.5
    const firstName = randomItem(isMale ? firstNamesM : firstNamesF)
    const lastName = randomItem(lastNames)
    const agent = randomItem(DEMO_AGENTS)
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
    const leadId = `lead-${(i % 360) + 1}`

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
      duration_minutes: (primaryType === "retest" || primaryType === "sf_retest") ? 60 : 30,
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
    cachedLeads = generateDemoLeads(360) // 40 leads per stage (9 stages)
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
  return cachedAppointments.map(apt => {
    if (updates[apt.id]) {
      return { ...apt, ...updates[apt.id] }
    }
    return apt
  })
}

// Stats helpers
export function getDemoLeadStats() {
  const leads = getDemoLeads()
  const byStage: Record<PipelineStage, number> = {
    new: 0, contacted: 0, appointment: 0, visit: 0,
    test: 0, application: 0, applicant: 0, enrolled: 0, withdraw: 0, lost: 0
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
  const today = new Date().toISOString().split("T")[0]

  return {
    total: appointments.length,
    today: appointments.filter(a => a.scheduled_date === today).length,
    pending: appointments.filter(a => a.status === "scheduled" || a.status === "confirmed").length,
    attended: appointments.filter(a => a.status === "completed").length,
    noShow: appointments.filter(a => a.status === "no_answer" || a.status === "cant_reach").length,
  }
}

export function getTodayAppointments(): Appointment[] {
  const appointments = getDemoAppointments()
  const today = new Date().toISOString().split("T")[0]

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
