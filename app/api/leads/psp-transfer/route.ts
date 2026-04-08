import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user and verify admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    // Count eligible PUC leads (not in submission, enrolled, or lost stages)
    const { count, error: countError } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("funding_type", "puc")
      .not("pipeline_stage", "in", '("enrolled","lost")')

    if (countError) {
      console.error("[PSP Transfer] Count error:", countError)
      return NextResponse.json(
        { error: "Failed to count eligible leads" },
        { status: 500 }
      )
    }

    return NextResponse.json({ count: count || 0 })
  } catch (err) {
    console.error("[PSP Transfer] Error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user and verify admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    // Fetch all eligible PUC leads (not in submission, enrolled, or lost stages)
    const { data: eligibleLeads, error: leadsError } = await supabase
      .from("leads")
      .select("id, first_name, last_name, first_name_ar, last_name_ar, pipeline_stage")
      .eq("funding_type", "puc")
      .not("pipeline_stage", "in", '("enrolled","lost")')

    if (leadsError) {
      console.error("[PSP Transfer] Failed to fetch leads:", leadsError)
      return NextResponse.json(
        { error: "Failed to fetch eligible leads" },
        { status: 500 }
      )
    }

    if (!eligibleLeads || eligibleLeads.length === 0) {
      return NextResponse.json({
        success: true,
        transferred: 0,
        skipped: 0,
        total: 0,
        message: "No eligible PUC leads to transfer"
      })
    }

    const leadIds = eligibleLeads.map(l => l.id)

    // Get current max position in submission stage
    const { data: maxPosRow } = await supabase
      .from("leads")
      .select("position_in_stage")
      .eq("pipeline_stage", "applicant")
      .order("position_in_stage", { ascending: false })
      .limit(1)
      .single()
    let nextPos = (maxPosRow?.position_in_stage ?? 0) + 1

    // Update each lead individually with sequential positions
    const updateErrors: string[] = []
    for (const id of leadIds) {
      const { error } = await supabase
        .from("leads")
        .update({
          pipeline_stage: "applicant",
          position_in_stage: nextPos,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)

      if (error) {
        updateErrors.push(error.message)
      } else {
        nextPos++
      }
    }

    if (updateErrors.length === leadIds.length) {
      console.error("[PSP Transfer] Update errors:", updateErrors)
      return NextResponse.json(
        { error: "Failed to update leads" },
        { status: 500 }
      )
    }

    // Log activity for each transferred lead
    const activities = eligibleLeads.map(lead => ({
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

    // Insert activities in batches to avoid potential limits
    const batchSize = 100
    for (let i = 0; i < activities.length; i += batchSize) {
      const batch = activities.slice(i, i + batchSize)
      await supabase.from("activities").insert(batch)
    }

    return NextResponse.json({
      success: true,
      transferred: eligibleLeads.length,
      total: eligibleLeads.length,
      message: `Successfully transferred ${eligibleLeads.length} PUC leads to submission stage`
    })
  } catch (err) {
    console.error("[PSP Transfer] Error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
