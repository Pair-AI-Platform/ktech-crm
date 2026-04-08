import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { civilIds } = body as { civilIds: string[] }

    if (!Array.isArray(civilIds) || civilIds.length === 0) {
      return NextResponse.json({ error: "No Civil IDs provided" }, { status: 400 })
    }

    if (civilIds.length > 1000) {
      return NextResponse.json({ error: "Maximum 1000 records allowed per import" }, { status: 400 })
    }

    // Fetch leads matching these civil IDs
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("id, first_name, last_name, civil_id, pipeline_stage")
      .in("civil_id", civilIds)

    if (leadsError) {
      return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 })
    }

    const leadMap = new Map((leads || []).map(l => [l.civil_id, l]))

    const result = {
      enrolled: [] as { leadId: string; name: string; civilId: string }[],
      notFound: [] as string[],
      wrongStage: [] as { civilId: string; name: string; stage: string }[],
      alreadyEnrolled: [] as { civilId: string; name: string }[],
      errors: [] as string[],
    }

    const toEnroll: string[] = []

    for (const civilId of civilIds) {
      const lead = leadMap.get(civilId)
      if (!lead) {
        result.notFound.push(civilId)
        continue
      }

      const name = `${lead.first_name} ${lead.last_name}`.trim()

      if (lead.pipeline_stage === "enrolled") {
        result.alreadyEnrolled.push({ civilId, name })
        continue
      }

      if (lead.pipeline_stage !== "applicant") {
        result.wrongStage.push({ civilId, name, stage: lead.pipeline_stage })
        continue
      }

      toEnroll.push(lead.id)
      result.enrolled.push({ leadId: lead.id, name, civilId })
    }

    // Bulk update to enrolled
    if (toEnroll.length > 0) {
      const { error: updateError } = await supabase
        .from("leads")
        .update({ pipeline_stage: "enrolled", enrolled_at: new Date().toISOString() })
        .in("id", toEnroll)

      if (updateError) {
        return NextResponse.json({ error: "Failed to update leads" }, { status: 500 })
      }

      // Log activity for each enrolled lead
      const activities = toEnroll.map(leadId => ({
        lead_id: leadId,
        activity_type: "stage_change",
        title: "Stage Changed to Enrolled",
        description: "Lead enrolled via bulk enrollment list",
        metadata: { from: "applicant", to: "enrolled", source: "enroll_from_list" },
        created_by: user.id,
      }))

      await supabase.from("activities").insert(activities)
    }

    return NextResponse.json({
      success: true,
      result,
      summary: {
        total: civilIds.length,
        enrolled: result.enrolled.length,
        notFound: result.notFound.length,
        wrongStage: result.wrongStage.length,
        alreadyEnrolled: result.alreadyEnrolled.length,
      },
    })
  } catch (error) {
    console.error("[Enroll from List] Error:", error)
    return NextResponse.json({ error: "Failed to process enrollment" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "enroll-from-list" })
}
