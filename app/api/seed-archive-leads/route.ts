import { NextResponse } from "next/server"
import { withApiHandler } from "@/lib/api-handler"
import { requireDemoMode } from "@/lib/demo-mode"

const FIRST_NAMES = [
  "عبدالله", "مريم", "يوسف", "لطيفة", "فهد", "هيا", "بدر", "دانة", "عمر", "ريم",
  "سلطان", "نوف", "محمد", "شيخة", "حمد", "العنود", "تركي", "أسماء", "ناصر", "سارة",
  "عبدالرحمن", "غدير", "مشعل", "وضحة", "أحمد", "منيرة", "خالد", "لولوة", "طلال", "جاسم",
  "فرح", "علي", "نورة", "فيصل", "هند", "بندر", "ديمة", "سعود", "رنا", "ماجد",
  "أمل", "حسين", "جميلة", "راشد", "شهد", "مبارك", "ابتسام", "صالح", "لمياء", "عادل",
  "حصة", "عيسى", "دلال", "جابر", "مها",
]

const LAST_NAMES = [
  "الرشيدي", "الفضلي", "العجمي", "الهاجري", "الدوسري", "المري", "العنزي", "الصبيح",
  "الشريف", "الخالدي", "المطوع", "البريكي", "الظفيري", "السبيعي", "الرويلي", "الفهد",
  "القحطاني", "الحسيني", "المالكي", "العتيبي", "الحمود", "النصار", "العازمي", "الشمري",
  "البكر", "الغانم", "البدر", "الجاسم", "المضف", "الأنصاري", "الحداد", "الكندري",
  "المطيري", "الحربي", "الصباح", "العوضي", "السعيد", "البلوشي", "الفاضل", "بهبهاني",
]

const SOURCES = ["instagram", "walk_in", "school_visit", "exhibitions", "current_student_referral", "website_form", "facebook", "email"] as const
const SOURCE_CATEGORIES: Record<string, string> = {
  instagram: "marketing", facebook: "marketing", website_form: "marketing", email: "direct",
  walk_in: "direct", school_visit: "events", exhibitions: "events", current_student_referral: "referrals",
}

const PIPELINE_STAGES = [
  "new", "contacted", "visit", "test", "application",
  "puc_document_submission", "puc_application_submission", "applicant", "enrolled", "withdraw",
] as const

function generateLeads(count: number, semesterIds: string[], phonePrefix: string) {
  const leads = []
  for (let i = 0; i < count; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length]
    const lastName = LAST_NAMES[i % LAST_NAMES.length]
    const source = SOURCES[i % SOURCES.length]
    const stage = PIPELINE_STAGES[i % PIPELINE_STAGES.length]
    const semesterId = semesterIds[i % semesterIds.length]
    const phone = `9${phonePrefix}${String(i + 1).padStart(4, "0")}`
    const civilId = `3${phonePrefix}${String(i + 1).padStart(8, "0")}`

    leads.push({
      first_name: firstName,
      last_name: lastName,
      phone,
      civil_id: civilId,
      nationality: "Kuwaiti",
      is_kuwaiti: true,
      funding_type: i % 5 === 0 ? "self_funded" : "puc",
      education_type: "GOV",
      source,
      source_category: SOURCE_CATEGORIES[source],
      pipeline_stage: stage,
      contact_status: stage === "new" ? "uncontacted" : "interested",
      semester_id: semesterId,
      gpa_grade_11: Math.round((70 + Math.random() * 30) * 10) / 10,
      ...(stage === "puc_document_submission" ? { submission_substage: "documents" } : {}),
      ...(stage === "puc_application_submission" ? { submission_substage: "submissions" } : {}),
      ...(stage === "withdraw" ? { withdrawal_reason: "personal" } : {}),
    })
  }
  return leads
}

export const POST = withApiHandler(
  { context: "seed-archive-leads", roles: ["admin"] },
  async ({ supabase, user, logger }) => {
    const gateResponse = requireDemoMode()
    if (gateResponse) return gateResponse

    // Fetch all non-active cycles with their semesters
    const { data: cycles, error: cyclesError } = await supabase
      .from("education_cycles")
      .select("id, name, start_year, end_year, is_active, terms:semesters(id, name, term_type)")
      .eq("is_active", false)
      .order("start_year", { ascending: false })

    if (cyclesError) {
      logger.error("Error fetching cycles", { error: cyclesError.message })
      return NextResponse.json({ error: "Failed to fetch cycles" }, { status: 500 })
    }

    if (!cycles || cycles.length === 0) {
      return NextResponse.json({ error: "No inactive (archive) cycles found. Create cycles first." }, { status: 400 })
    }

    const results = []

    for (const cycle of cycles) {
      const semesters = (cycle as any).terms as { id: string; name: string; term_type: string }[]
      if (!semesters || semesters.length === 0) {
        results.push({ cycle: cycle.name, status: "skipped", reason: "no semesters" })
        continue
      }

      const semesterIds = semesters.map((s) => s.id)
      // Use cycle start_year as phone prefix to ensure unique phones per cycle
      const phonePrefix = `6${cycle.start_year.toString().slice(-2)}`
      const leads = generateLeads(50, semesterIds, phonePrefix)

      const { data, error } = await supabase
        .from("leads")
        .insert(
          leads.map((lead) => ({
            ...lead,
            assigned_to: user.id,
            assigned_at: new Date().toISOString(),
          }))
        )
        .select("id")

      if (error) {
        logger.error(`Error seeding leads for cycle ${cycle.name}`, { error: error.message })
        results.push({ cycle: cycle.name, status: "error", error: error.message })
      } else {
        results.push({ cycle: cycle.name, status: "success", count: data.length })
      }
    }

    return NextResponse.json({ success: true, results })
  }
)

// Delete archive seed leads
export const DELETE = withApiHandler(
  { context: "seed-archive-leads-delete", roles: ["admin"] },
  async ({ supabase, logger }) => {
    const gateResponse = requireDemoMode()
    if (gateResponse) return gateResponse

    // Delete leads with the generated phone prefixes
    const prefixes = ["623%", "624%", "625%", "626%"]
    let totalDeleted = 0

    for (const prefix of prefixes) {
      const { data, error } = await supabase
        .from("leads")
        .delete()
        .like("phone", prefix)
        .select("id")

      if (error) {
        logger.error(`Error deleting seed leads with prefix ${prefix}`, { error: error.message })
      } else {
        totalDeleted += (data?.length || 0)
      }
    }

    return NextResponse.json({ success: true, message: `Deleted ${totalDeleted} archive seed leads` })
  }
)
