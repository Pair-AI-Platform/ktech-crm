import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"

export const runtime = 'edge'

const MAX_IDS = 5000

const normalizeCivilId = (raw: unknown): string =>
  String(raw ?? "").replace(/\D/g, "")

export interface EnrollFromListLead {
  id: string
  first_name: string
  last_name: string
  civil_id: string | null
  pipeline_stage: string
  assigned_to: string | null
  source: string | null
  funding_type: string | null
}

export interface EnrollFromListResult {
  enrolled: { id: string; name: string; civilId: string; lead: EnrollFromListLead }[]
  reported: { id: string; name: string; civilId: string; currentStage: string }[]
  unmatched: { civilId: string }[]
  errors: { civilId: string; error: string }[]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: admin access required" },
        { status: 403 }
      )
    }

    const rl = await rateLimit(
      `enroll-from-list:${user.id}`,
      RATE_LIMITS["enroll-from-list"]
    )
    if (!rl.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(rl.resetIn / 1000)) },
        }
      )
    }

    const body = await request.json().catch(() => null) as { civilIds?: unknown } | null
    const rawIds = Array.isArray(body?.civilIds) ? body!.civilIds : null

    if (!rawIds || rawIds.length === 0) {
      return NextResponse.json(
        { error: "No civil IDs provided" },
        { status: 400 }
      )
    }
    if (rawIds.length > MAX_IDS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_IDS} civil IDs per run` },
        { status: 400 }
      )
    }

    const normalizedIds = Array.from(
      new Set(rawIds.map(normalizeCivilId).filter((id) => id.length > 0))
    )

    if (normalizedIds.length === 0) {
      return NextResponse.json(
        { error: "No valid civil IDs after normalization" },
        { status: 400 }
      )
    }

    const { data: matchedLeads, error: leadsError } = await supabase
      .from("leads")
      .select(
        "id, first_name, last_name, civil_id, pipeline_stage, assigned_to, source, funding_type"
      )
      .in("civil_id", normalizedIds)

    if (leadsError) {
      console.error("[Enroll From List] Failed to fetch leads:", leadsError)
      return NextResponse.json(
        { error: "Failed to fetch leads" },
        { status: 500 }
      )
    }

    const matchedByCivilId = new Map<string, EnrollFromListLead>()
    for (const lead of matchedLeads || []) {
      if (lead.civil_id) matchedByCivilId.set(lead.civil_id, lead as EnrollFromListLead)
    }

    const result: EnrollFromListResult = {
      enrolled: [],
      reported: [],
      unmatched: [],
      errors: [],
    }

    for (const civilId of normalizedIds) {
      if (!matchedByCivilId.has(civilId)) {
        result.unmatched.push({ civilId })
      }
    }

    const toEnroll: EnrollFromListLead[] = []
    for (const lead of matchedByCivilId.values()) {
      const fullName = `${lead.first_name} ${lead.last_name}`.trim()
      if (lead.pipeline_stage === "applicant") {
        toEnroll.push(lead)
      } else {
        result.reported.push({
          id: lead.id,
          name: fullName,
          civilId: lead.civil_id || "",
          currentStage: lead.pipeline_stage,
        })
      }
    }

    if (toEnroll.length > 0) {
      // Shift existing 'enrolled' positions down so newly enrolled leads land at the top
      await supabase.rpc("shift_stage_positions", { target_stage: "enrolled" })

      let nextPos = 0
      for (const lead of toEnroll) {
        const fullName = `${lead.first_name} ${lead.last_name}`.trim()
        const { error: updateError } = await supabase
          .from("leads")
          .update({
            pipeline_stage: "enrolled",
            position_in_stage: nextPos,
            last_contacted_at: new Date().toISOString(),
          })
          .eq("id", lead.id)

        if (updateError) {
          result.errors.push({
            civilId: lead.civil_id || "",
            error: updateError.message,
          })
          continue
        }

        await supabase.from("activities").insert({
          lead_id: lead.id,
          activity_type: "stage_change",
          title: "Enrolled from List",
          description: `${fullName}: Applicant → Enrolled`,
          metadata: {
            old_stage: "applicant",
            new_stage: "enrolled",
            old_stage_label: "Applicant",
            new_stage_label: "Enrolled",
            source: "enroll_from_list",
          },
          created_by: user.id,
        })

        if (lead.assigned_to && lead.assigned_to !== user.id) {
          supabase
            .from("notifications")
            .insert({
              user_id: lead.assigned_to,
              type: "stage_change",
              title: "Lead moved to Enrolled",
              body: `${fullName} was moved from Applicant to Enrolled via Enroll from List`,
              lead_id: lead.id,
              action_url: `/leads/${lead.id}`,
              created_by: user.id,
            })
            .then(
              () => {},
              () => {},
            )
        }

        result.enrolled.push({
          id: lead.id,
          name: fullName,
          civilId: lead.civil_id || "",
          lead: { ...lead, pipeline_stage: "enrolled" },
        })

        nextPos++
      }
    }

    return NextResponse.json({
      success: true,
      result,
      summary: {
        total: normalizedIds.length,
        enrolled: result.enrolled.length,
        reported: result.reported.length,
        unmatched: result.unmatched.length,
        errors: result.errors.length,
      },
    })
  } catch (error) {
    console.error("[Enroll From List] Error:", error)
    return NextResponse.json(
      { error: "Failed to process enrollment list" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "enroll-from-list" })
}
