import type { Lead, Student, Appointment, Profile, PipelineStage, AppointmentType } from "@/types"

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
    email: "i.naajji@ktech.edu.kw",
    full_name: "Iyad Naajji",
    role: "agent",
    avatar_url: undefined,
    is_active: true,
    monthly_target: 40,
    created_at: "2024-01-15T08:00:00Z",
    updated_at: "2024-01-15T08:00:00Z",
  },
  {
    id: "agent-2",
    email: "f.alzamel@ktech.edu.kw",
    full_name: "Fatema AlZamel",
    role: "agent",
    avatar_url: undefined,
    is_active: true,
    monthly_target: 40,
    created_at: "2024-01-15T08:00:00Z",
    updated_at: "2024-01-15T08:00:00Z",
  },
  {
    id: "agent-3",
    email: "m.almasri@ktech.edu.kw",
    full_name: "Maram AlMasri",
    role: "agent",
    avatar_url: undefined,
    is_active: true,
    monthly_target: 40,
    created_at: "2024-01-15T08:00:00Z",
    updated_at: "2024-01-15T08:00:00Z",
  },
  {
    id: "agent-4",
    email: "o.asfour@ktech.edu.kw",
    full_name: "Omar Asfour",
    role: "agent",
    avatar_url: undefined,
    is_active: true,
    monthly_target: 40,
    created_at: "2024-01-15T08:00:00Z",
    updated_at: "2024-01-15T08:00:00Z",
  },
  {
    id: "agent-5",
    email: "l.abualakhras@ktech.edu.kw",
    full_name: "Lamiss AbuAlakhras",
    role: "agent",
    avatar_url: undefined,
    is_active: true,
    monthly_target: 40,
    created_at: "2024-01-15T08:00:00Z",
    updated_at: "2024-01-15T08:00:00Z",
  },
  {
    id: "agent-6",
    email: "m.alhamed@ktech.edu.kw",
    full_name: "Mays AlHamed",
    role: "agent",
    avatar_url: undefined,
    is_active: true,
    monthly_target: 40,
    created_at: "2024-01-15T08:00:00Z",
    updated_at: "2024-01-15T08:00:00Z",
  },
  {
    id: "agent-7",
    email: "l.altibawi@ktech.edu.kw",
    full_name: "Laith Altibawi",
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
const schools = ["salmiya_secondary_boys", "hawally_secondary_girls", "sabah_alsalem_secondary", "jahra_secondary", "other"]
const tracks = ["science", "arts"]
const majors = ["cyber_security", "cis", "marketing", "accounting", "mis", "network_security", "other"]
const fundingTypes = ["self_funded", "puc"]
const contactStatuses = ["uncontacted", "interested", "not_interested", "no_answer", "callback", "will_see"]
const gradeLevels = ["10th", "11th", "12th"]
const stages: PipelineStage[] = ["new", "contacted", "visit", "appointment", "test", "application", "submission", "enrolled", "lost"]

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
    visit: 4,
    test: 5,
    application: 6,
    submission: 7,
    enrolled: 8,
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
    // For submission stage, ~60% are blocked to demonstrate the red highlighting
    const isSubmissionBlocked = stage === 'submission' && Math.random() > 0.4
    const selectedBlockReason = isSubmissionBlocked ? randomItem(blockReasons) : undefined

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
      funding_type: stage === 'submission' ? 'puc' : randomItem(fundingTypes) as Lead["funding_type"],
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

// Generate demo appointments
export function generateDemoAppointments(count: number = 30): Appointment[] {
  const appointments: Appointment[] = []
  const types: AppointmentType[] = ["new_appointment", "puc_documents", "puc_application", "retest", "sf_appointment"]
  const statuses: Appointment["status"][] = ["scheduled", "no_answer", "confirmed", "on_the_way", "postponed", "cant_reach", "completed", "cancelled"]

  for (let i = 0; i < count; i++) {
    const isMale = Math.random() > 0.5
    const firstName = randomItem(isMale ? firstNamesM : firstNamesF)
    const lastName = randomItem(lastNames)
    const agent = randomItem(DEMO_AGENTS)
    const type = randomItem(types)

    // First 6 appointments are past with "scheduled" status (no updates - need attention)
    const isNoUpdated = i < 6
    const isPast = isNoUpdated || Math.random() > 0.5

    let appointmentDate: string
    let status: Appointment["status"]

    if (isNoUpdated) {
      // Past appointments with no status update - these need attention
      const daysAgo = 1 + Math.floor(Math.random() * 7) // 1-7 days ago
      const date = new Date()
      date.setDate(date.getDate() - daysAgo)
      appointmentDate = date.toISOString()
      status = "no_answer" // Needs follow-up
    } else if (isPast) {
      appointmentDate = randomDate(14)
      status = randomItem(["confirmed", "no_answer", "cant_reach"] as Appointment["status"][])
    } else {
      appointmentDate = randomFutureDate(14)
      status = randomItem(["no_answer", "confirmed", "postponed"] as Appointment["status"][])
    }

    appointments.push({
      id: `apt-${i + 1}`,
      lead_id: `lead-${i + 1}`,
      lead: {
        id: `lead-${i + 1}`,
        first_name: firstName,
        last_name: lastName,
        phone: randomPhone(),
        pipeline_stage: "visit",
        nationality: "Kuwaiti",
        is_kuwaiti: true,
        funding_type: "self_funded",
        has_weyay_account: false,
        has_bank_account: false,
        source_category: "digital",
        source: "instagram",
        contact_status: "interested",
        created_at: randomDate(30),
        updated_at: randomDate(2),
      } as Lead,
      appointment_type: [type],
      scheduled_date: appointmentDate.split("T")[0],
      scheduled_time: `${9 + Math.floor(Math.random() * 8)}:${Math.random() > 0.5 ? "00" : "30"}`,
      duration_minutes: type === "retest" || type === "sf_retest" ? 60 : 30,
      status: status,
      is_callback: Math.random() > 0.9,
      notes: Math.random() > 0.7 ? "Student requested afternoon slot" : undefined,
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
    cachedAppointments = generateDemoAppointments(30)
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
    test: 0, application: 0, submission: 0, enrolled: 0, lost: 0
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
    attended: 0, // 'done' status removed
    noShow: appointments.filter(a => a.status === "no_answer" || a.status === "cant_reach").length, // No Answer + Can't Reach = No Show
  }
}

export function getTodayAppointments(): Appointment[] {
  const appointments = getDemoAppointments()
  const today = new Date().toISOString().split("T")[0]

  // Return some appointments for today regardless of actual date for demo
  return appointments.slice(0, 5).map(apt => ({
    ...apt,
    scheduled_date: today,
    status: randomItem(["scheduled", "confirmed"] as Appointment["status"][])
  }))
}
