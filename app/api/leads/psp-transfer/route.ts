import { NextResponse } from "next/server"
import { withApiHandler } from "@/lib/api-handler"


// GET: count eligible PUC leads (admin only).
export const GET = withApiHandler(
  { context: 'psp-transfer-count', roles: ['admin'] },
  async ({ supabase, logger }) => {
    const { count, error: countError } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("funding_type", "puc")
      .not("pipeline_stage", "in", '("enrolled","lost")')

    if (countError) {
      logger.error("Failed to count eligible PUC leads", { error: countError.message })
      return NextResponse.json({ error: "Failed to count eligible leads" }, { status: 500 })
    }

    return NextResponse.json({ count: count || 0 })
  }
)

// POST: bulk-move eligible PUC leads to the 'applicant' stage (admin only).
// Routed through withApiHandler so the same-origin/CSRF check applies, matching
// the rest of the API.
export const POST = withApiHandler(
  { context: 'psp-transfer', roles: ['admin'] },
  async ({ user, supabase, logger }) => {
    // Fetch all eligible PUC leads (not enrolled or lost).
    const { data: eligibleLeads, error: leadsError } = await supabase
      .from("leads")
      .select("id, first_name, last_name, first_name_ar, last_name_ar, pipeline_stage")
      .eq("funding_type", "puc")
      .not("pipeline_stage", "in", '("enrolled","lost")')

    if (leadsError) {
      logger.error("Failed to fetch eligible PUC leads", { error: leadsError.message })
      return NextResponse.json({ error: "Failed to fetch eligible leads" }, { status: 500 })
    }

    if (!eligibleLeads || eligibleLeads.length === 0) {
      return NextResponse.json({
        success: true,
        transferred: 0,
        skipped: 0,
        total: 0,
        message: "No eligible PUC leads to transfer",
      })
    }

    // Current max position in the applicant stage (maybeSingle: empty stage is
    // a normal null result, not an error).
    const { data: maxPosRow } = await supabase
      .from("leads")
      .select("position_in_stage")
      .eq("pipeline_stage", "applicant")
      .order("position_in_stage", { ascending: false })
      .limit(1)
      .maybeSingle()
    let nextPos = (maxPosRow?.position_in_stage ?? 0) + 1

    // Update each lead with a sequential position; track real successes.
    const transferredLeads: typeof eligibleLeads = []
    const updateErrors: string[] = []
    for (const lead of eligibleLeads) {
      const { error } = await supabase
        .from("leads")
        .update({
          pipeline_stage: "applicant",
          position_in_stage: nextPos,
          updated_at: new Date().toISOString(),
        })
        .eq("id", lead.id)

      if (error) {
        updateErrors.push(error.message)
      } else {
        transferredLeads.push(lead)
        nextPos++
      }
    }

    if (transferredLeads.length === 0) {
      logger.error("PSP transfer: all updates failed", { count: updateErrors.length })
      return NextResponse.json({ error: "Failed to update leads" }, { status: 500 })
    }

    // Log activity for each lead that actually moved.
    const activities = transferredLeads.map((lead) => ({
      lead_id: lead.id,
      activity_type: "stage_change",
      title: "PSP Transfer",
      description: `${lead.first_name_ar || ""} ${lead.last_name_ar || ""}: ${lead.pipeline_stage} → applicant (PSP bulk transfer)`,
      metadata: {
        old_stage: lead.pipeline_stage,
        new_stage: "applicant",
        transfer_type: "psp_bulk",
      },
      created_by: user.id,
    }))

    const batchSize = 100
    for (let i = 0; i < activities.length; i += batchSize) {
      const batch = activities.slice(i, i + batchSize)
      const { error: actError } = await supabase.from("activities").insert(batch)
      if (actError) logger.warn("PSP transfer: activity batch insert failed", { error: actError.message })
    }

    return NextResponse.json({
      success: true,
      transferred: transferredLeads.length,
      skipped: eligibleLeads.length - transferredLeads.length,
      total: eligibleLeads.length,
      message: `Successfully transferred ${transferredLeads.length} PUC lead(s) to the applicant stage`,
    })
  }
)
