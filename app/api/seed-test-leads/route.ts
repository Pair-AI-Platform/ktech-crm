import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// Test leads to showcase submission stages
const TEST_LEADS = [
  {
    first_name: "سارة",
    last_name: "العلي",
    phone: "55001001",
    civil_id: "301234567891",
    nationality: "Kuwaiti",
    is_kuwaiti: true,
    source: "instagram",
    source_category: "digital",
    pipeline_stage: "applicant",
    submission_substage: "submissions",
    funding_type: "puc",
    gpa_grade_10: 85.5,
    gpa_grade_11: 87.2,
    gpa_grade_12_expected: 88.0,
  },
  {
    first_name: "أحمد",
    last_name: "المطيري",
    phone: "55001002",
    civil_id: "302234567892",
    nationality: "Kuwaiti",
    is_kuwaiti: true,
    source: "school_visit",
    source_category: "events",
    pipeline_stage: "applicant",
    submission_substage: "submissions",
    funding_type: "puc",
    gpa_grade_10: 90.0,
    gpa_grade_11: 89.5,
    gpa_grade_12_expected: 91.0,
  },
  {
    first_name: "نورة",
    last_name: "الشمري",
    phone: "55001003",
    civil_id: "303234567893",
    nationality: "Kuwaiti",
    is_kuwaiti: true,
    source: "current_student_referral",
    source_category: "referrals",
    pipeline_stage: "applicant",
    submission_substage: "documents",
    funding_type: "puc",
    gpa_grade_10: 82.0,
    gpa_grade_11: 84.5,
    gpa_grade_12_expected: 86.0,
  },
  {
    first_name: "خالد",
    last_name: "الحربي",
    phone: "55001004",
    civil_id: "304234567894",
    nationality: "Kuwaiti",
    is_kuwaiti: true,
    source: "walk_in",
    source_category: "direct",
    pipeline_stage: "applicant",
    submission_substage: "documents",
    funding_type: "puc",
    gpa_grade_10: 78.0,
    gpa_grade_11: 80.0,
    gpa_grade_12_expected: 82.0,
  },
  {
    first_name: "فاطمة",
    last_name: "الكندري",
    phone: "55001005",
    civil_id: "305234567895",
    nationality: "Kuwaiti",
    is_kuwaiti: true,
    source: "exhibitions",
    source_category: "events",
    pipeline_stage: "applicant",
    submission_substage: "documents",
    funding_type: "puc",
    gpa_grade_10: 75.0,
    gpa_grade_11: 77.5,
    gpa_grade_12_expected: 79.0,
  },
]

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Insert test leads
    const { data, error } = await supabase
      .from("leads")
      .insert(
        TEST_LEADS.map((lead) => ({
          ...lead,
          assigned_to: user.id,
          assigned_at: new Date().toISOString(),
        }))
      )
      .select()

    if (error) {
      console.error("Error seeding leads:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${data.length} test leads`,
      leads: data,
    })
  } catch (error) {
    console.error("Error in seed-test-leads:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// Delete test leads
export async function DELETE() {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete test leads by their phone numbers
    const testPhones = TEST_LEADS.map((l) => l.phone)
    const { error } = await supabase
      .from("leads")
      .delete()
      .in("phone", testPhones)

    if (error) {
      console.error("Error deleting test leads:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Successfully deleted test leads",
    })
  } catch (error) {
    console.error("Error in delete test leads:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
