import { NextResponse } from "next/server"
import { withApiHandler } from "@/lib/api-handler"

// Common lead fields
const baseLead = {
  nationality: "Kuwaiti",
  is_kuwaiti: true,
  funding_type: "puc",
  education_type: "GOV",
}

// Test leads across ALL pipeline stages
const TEST_LEADS = [
  // New stage
  { ...baseLead, first_name: "عبدالله", last_name: "الرشيدي", phone: "55002001", civil_id: "310000000001", source: "instagram", source_category: "digital", pipeline_stage: "new", gpa_grade_11: 85.0 },
  { ...baseLead, first_name: "مريم", last_name: "الفضلي", phone: "55002002", civil_id: "310000000002", source: "tiktok", source_category: "digital", pipeline_stage: "new", gpa_grade_11: 88.5 },
  { ...baseLead, first_name: "يوسف", last_name: "العجمي", phone: "55002003", civil_id: "310000000003", source: "walk_in", source_category: "direct", pipeline_stage: "new", gpa_grade_11: 79.0 },
  // Contacted stage
  { ...baseLead, first_name: "لطيفة", last_name: "الهاجري", phone: "55002004", civil_id: "310000000004", source: "school_visit", source_category: "events", pipeline_stage: "contacted", contact_status: "interested", gpa_grade_11: 92.0 },
  { ...baseLead, first_name: "فهد", last_name: "الدوسري", phone: "55002005", civil_id: "310000000005", source: "exhibitions", source_category: "events", pipeline_stage: "contacted", contact_status: "callback", gpa_grade_11: 81.0 },
  { ...baseLead, first_name: "هيا", last_name: "المري", phone: "55002006", civil_id: "310000000006", source: "current_student_referral", source_category: "referrals", pipeline_stage: "contacted", contact_status: "interested", gpa_grade_11: 90.5 },
  // Visit stage
  { ...baseLead, first_name: "بدر", last_name: "العنزي", phone: "55002007", civil_id: "310000000007", source: "instagram", source_category: "digital", pipeline_stage: "visit", gpa_grade_11: 86.0 },
  { ...baseLead, first_name: "دانة", last_name: "الصبيح", phone: "55002008", civil_id: "310000000008", source: "walk_in", source_category: "direct", pipeline_stage: "visit", gpa_grade_11: 77.5 },
  { ...baseLead, first_name: "عمر", last_name: "الشريف", phone: "55002009", civil_id: "310000000009", source: "tiktok", source_category: "digital", pipeline_stage: "visit", gpa_grade_11: 83.0 },
  // Test stage
  { ...baseLead, first_name: "ريم", last_name: "الخالدي", phone: "55002010", civil_id: "310000000010", source: "school_visit", source_category: "events", pipeline_stage: "test", gpa_grade_11: 95.0 },
  { ...baseLead, first_name: "سلطان", last_name: "المطوع", phone: "55002011", civil_id: "310000000011", source: "instagram", source_category: "digital", pipeline_stage: "test", gpa_grade_11: 87.0 },
  { ...baseLead, first_name: "نوف", last_name: "البريكي", phone: "55002012", civil_id: "310000000012", source: "exhibitions", source_category: "events", pipeline_stage: "test", gpa_grade_11: 82.5 },
  // File (application) stage
  { ...baseLead, first_name: "محمد", last_name: "الظفيري", phone: "55002013", civil_id: "310000000013", source: "walk_in", source_category: "direct", pipeline_stage: "application", gpa_grade_11: 91.0 },
  { ...baseLead, first_name: "شيخة", last_name: "السبيعي", phone: "55002014", civil_id: "310000000014", source: "current_student_referral", source_category: "referrals", pipeline_stage: "application", gpa_grade_11: 84.0 },
  { ...baseLead, first_name: "حمد", last_name: "الرويلي", phone: "55002015", civil_id: "310000000015", source: "instagram", source_category: "digital", pipeline_stage: "application", gpa_grade_11: 78.0 },
  // Doc Submission stage
  { ...baseLead, first_name: "العنود", last_name: "الفهد", phone: "55002016", civil_id: "310000000016", source: "school_visit", source_category: "events", pipeline_stage: "puc_document_submission", submission_substage: "documents", gpa_grade_11: 89.0 },
  { ...baseLead, first_name: "تركي", last_name: "القحطاني", phone: "55002017", civil_id: "310000000017", source: "tiktok", source_category: "digital", pipeline_stage: "puc_document_submission", submission_substage: "documents", gpa_grade_11: 76.5 },
  { ...baseLead, first_name: "أسماء", last_name: "الحسيني", phone: "55002018", civil_id: "310000000018", source: "exhibitions", source_category: "events", pipeline_stage: "puc_document_submission", submission_substage: "documents", gpa_grade_11: 93.0 },
  // App Submission stage (puc_application_submission)
  { ...baseLead, first_name: "ناصر", last_name: "المالكي", phone: "55002019", civil_id: "310000000019", source: "instagram", source_category: "digital", pipeline_stage: "puc_application_submission", submission_substage: "submissions", gpa_grade_11: 88.0 },
  { ...baseLead, first_name: "سارة", last_name: "العتيبي", phone: "55002020", civil_id: "310000000020", source: "walk_in", source_category: "direct", pipeline_stage: "puc_application_submission", submission_substage: "submissions", gpa_grade_11: 85.5 },
  { ...baseLead, first_name: "عبدالرحمن", last_name: "الحمود", phone: "55002021", civil_id: "310000000021", source: "school_visit", source_category: "events", pipeline_stage: "puc_application_submission", submission_substage: "submissions", gpa_grade_11: 90.0 },
  { ...baseLead, first_name: "غدير", last_name: "النصار", phone: "55002022", civil_id: "310000000022", source: "current_student_referral", source_category: "referrals", pipeline_stage: "puc_application_submission", submission_substage: "submissions", gpa_grade_11: 82.0 },
  { ...baseLead, first_name: "مشعل", last_name: "العازمي", phone: "55002023", civil_id: "310000000023", source: "tiktok", source_category: "digital", pipeline_stage: "puc_application_submission", submission_substage: "submissions", gpa_grade_11: 94.5 },
  // Applicant stage
  { ...baseLead, first_name: "وضحة", last_name: "الشمري", phone: "55002024", civil_id: "310000000024", source: "exhibitions", source_category: "events", pipeline_stage: "applicant", submission_substage: "submissions", gpa_grade_11: 87.0 },
  { ...baseLead, first_name: "أحمد", last_name: "البكر", phone: "55002025", civil_id: "310000000025", source: "instagram", source_category: "digital", pipeline_stage: "applicant", submission_substage: "documents", gpa_grade_11: 91.5 },
  { ...baseLead, first_name: "منيرة", last_name: "الغانم", phone: "55002026", civil_id: "310000000026", source: "walk_in", source_category: "direct", pipeline_stage: "applicant", submission_substage: "documents", gpa_grade_11: 80.0 },
  // Enrolled stage
  { ...baseLead, first_name: "خالد", last_name: "البدر", phone: "55002027", civil_id: "310000000027", source: "school_visit", source_category: "events", pipeline_stage: "enrolled", gpa_grade_11: 93.0 },
  { ...baseLead, first_name: "لولوة", last_name: "الجاسم", phone: "55002028", civil_id: "310000000028", source: "current_student_referral", source_category: "referrals", pipeline_stage: "enrolled", gpa_grade_11: 96.0 },
  { ...baseLead, first_name: "طلال", last_name: "المضف", phone: "55002029", civil_id: "310000000029", source: "tiktok", source_category: "digital", pipeline_stage: "enrolled", gpa_grade_11: 88.5 },
  // Withdraw stage
  { ...baseLead, first_name: "جاسم", last_name: "الأنصاري", phone: "55002030", civil_id: "310000000030", source: "instagram", source_category: "digital", pipeline_stage: "withdraw", withdrawal_reason: "financial", gpa_grade_11: 79.0 },
  { ...baseLead, first_name: "فرح", last_name: "الحداد", phone: "55002031", civil_id: "310000000031", source: "exhibitions", source_category: "events", pipeline_stage: "withdraw", withdrawal_reason: "personal", gpa_grade_11: 85.0 },
]

export const POST = withApiHandler(
  { context: 'seed-test-leads', roles: ['admin'] },
  async ({ supabase, user, logger }) => {
    // Fetch active semester
    const { data: activeSemester } = await supabase
      .from("semesters")
      .select("id")
      .eq("is_active", true)
      .order("start_date", { ascending: false })
      .limit(1)
      .single()

    if (!activeSemester) {
      return NextResponse.json({ error: "No active enrollment cycle found. Create one first." }, { status: 400 })
    }

    // Insert test leads
    const { data, error } = await supabase
      .from("leads")
      .insert(
        TEST_LEADS.map((lead) => ({
          ...lead,
          assigned_to: user.id,
          assigned_at: new Date().toISOString(),
          semester_id: activeSemester.id,
        }))
      )
      .select()

    if (error) {
      logger.error("Error seeding leads", { error: error.message })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${data.length} test leads`,
      leads: data,
    })
  }
)

// Delete test leads
export const DELETE = withApiHandler(
  { context: 'seed-test-leads-delete', roles: ['admin'] },
  async ({ supabase, logger }) => {
    // Delete test leads by their phone numbers
    const testPhones = TEST_LEADS.map((l) => l.phone)
    const { error } = await supabase
      .from("leads")
      .delete()
      .in("phone", testPhones)

    if (error) {
      logger.error("Error deleting test leads", { error: error.message })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Successfully deleted test leads",
    })
  }
)
