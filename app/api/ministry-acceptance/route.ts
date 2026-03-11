import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { MinistryAcceptanceRecord, MinistryAcceptanceResult } from "@/lib/ministry-acceptance-import"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { records } = body as { records: MinistryAcceptanceRecord[] }

    const MAX_RECORDS = 500
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: "No records provided" }, { status: 400 })
    }
    if (records.length > MAX_RECORDS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_RECORDS} records allowed per import` },
        { status: 400 }
      )
    }

    // Get all civil IDs from records
    const civilIds = records.map(r => r.civil_id)

    // Fetch ALL leads with matching civil IDs (any stage, any funding type)
    const { data: existingLeads, error: leadsError } = await supabase
      .from("leads")
      .select("id, first_name, last_name, civil_id, pipeline_stage, status, funding_type, position_in_stage")
      .in("civil_id", civilIds)

    if (leadsError) {
      console.error("[Ministry Acceptance] Failed to fetch leads:", leadsError)
      return NextResponse.json({ error: "Failed to fetch existing leads" }, { status: 500 })
    }

    // Create a map of civil_id to lead
    const leadsByCivilId = new Map(
      (existingLeads || []).map(lead => [lead.civil_id, lead])
    )

    // Get "PUC Rejected" lost reason ID
    const { data: pucRejectedReason } = await supabase
      .from("lost_reasons")
      .select("id")
      .eq("reason_en", "PUC Rejected")
      .single()

    if (!pucRejectedReason) {
      return NextResponse.json(
        { error: "PUC Rejected lost reason not found. Please run the migration first." },
        { status: 500 }
      )
    }

    // Get next position in "applicant" stage
    const { data: maxPosData } = await supabase
      .from("leads")
      .select("position_in_stage")
      .eq("pipeline_stage", "applicant")
      .order("position_in_stage", { ascending: false })
      .limit(1)
      .single()

    let nextApplicantPosition = (maxPosData?.position_in_stage ?? 0) + 1

    // Get next position in "lost" stage
    const { data: maxLostPosData } = await supabase
      .from("leads")
      .select("position_in_stage")
      .eq("pipeline_stage", "lost")
      .order("position_in_stage", { ascending: false })
      .limit(1)
      .single()

    let nextLostPosition = (maxLostPosData?.position_in_stage ?? 0) + 1

    const result: MinistryAcceptanceResult = {
      movedToApplicant: [],
      movedToLost: [],
      createdFirstChoice: [],
      createdSecondChoice: [],
      errors: [],
    }

    const activities: {
      lead_id: string
      activity_type: string
      title: string
      description: string
      metadata: Record<string, unknown>
      created_by: string
    }[] = []

    for (const record of records) {
      try {
        const lead = leadsByCivilId.get(record.civil_id)

        if (lead) {
          // ── EXISTING LEAD ──
          const leadName = `${lead.first_name} ${lead.last_name}`

          // Skip if already at applicant/enrolled (don't move backwards)
          if (["applicant", "enrolled"].includes(lead.pipeline_stage)) {
            continue
          }

          // Skip if already lost
          if (lead.pipeline_stage === "lost") {
            continue
          }

          if (record.is_accepted_ktech) {
            // Accepted for ktech → move to "applicant"
            const { error: updateError } = await supabase
              .from("leads")
              .update({
                pipeline_stage: "applicant",
                position_in_stage: nextApplicantPosition,
                status: null,
                puc_choice: "1",
                puc_first_choice_college: null,
              })
              .eq("id", lead.id)

            if (updateError) {
              result.errors.push({ civilId: record.civil_id, name: leadName, error: "Failed to update to applicant" })
              continue
            }

            nextApplicantPosition++

            activities.push({
              lead_id: lead.id,
              activity_type: "stage_change",
              title: "Moved to Applicant",
              description: `Accepted by ministry for ktech. Moved from ${lead.pipeline_stage} to Applicant.`,
              metadata: {
                old_stage: lead.pipeline_stage,
                new_stage: "applicant",
                source: "ministry_acceptance_import",
                accepted_college: record.accepted_college,
              },
              created_by: user.id,
            })

            result.movedToApplicant.push({ leadId: lead.id, name: leadName, civilId: record.civil_id })
          } else {
            // Not accepted for ktech → move to "lost" with PUC Rejected reason
            const { error: updateError } = await supabase
              .from("leads")
              .update({
                pipeline_stage: "lost",
                position_in_stage: nextLostPosition,
                lost_reason_id: pucRejectedReason.id,
                lost_reason_notes: record.accepted_college
                  ? `Accepted at ${record.accepted_college} instead`
                  : "Not accepted for ktech",
                lost_at_stage: lead.pipeline_stage,
                status: null,
              })
              .eq("id", lead.id)

            if (updateError) {
              result.errors.push({ civilId: record.civil_id, name: leadName, error: "Failed to update to lost" })
              continue
            }

            nextLostPosition++

            activities.push({
              lead_id: lead.id,
              activity_type: "stage_change",
              title: "Moved to Lost - PUC Rejected",
              description: record.accepted_college
                ? `Not accepted for ktech. Accepted at ${record.accepted_college}. Moved to Lost.`
                : `Not accepted for ktech by ministry. Moved to Lost.`,
              metadata: {
                old_stage: lead.pipeline_stage,
                new_stage: "lost",
                source: "ministry_acceptance_import",
                accepted_college: record.accepted_college,
                lost_reason: "PUC Rejected",
              },
              created_by: user.id,
            })

            result.movedToLost.push({
              leadId: lead.id,
              name: leadName,
              civilId: record.civil_id,
              acceptedCollege: record.accepted_college || "Unknown",
            })
          }
        } else {
          // ── NEW STUDENT (not in system) ──
          // Both first choice and second choice ktech students get created as applicants
          const isFirstChoice = record.is_accepted_ktech
          const nameParts = (record.student_name || "").split(/\s+/)
          const firstName = nameParts[0] || "Unknown"
          const lastName = nameParts.slice(1).join(" ") || ""

          const { data: newLead, error: createError } = await supabase
            .from("leads")
            .insert({
              first_name: firstName,
              last_name: lastName,
              civil_id: record.civil_id,
              phone: "",
              pipeline_stage: "applicant",
              position_in_stage: nextApplicantPosition,
              funding_type: "puc",
              source: "gpa_lists",
              source_category: "outreach",
              puc_choice: isFirstChoice ? "1" : "2",
              puc_first_choice_college: isFirstChoice ? null : (record.accepted_college || null),
            })
            .select("id")
            .single()

          if (createError) {
            result.errors.push({
              civilId: record.civil_id,
              name: record.student_name || "Unknown",
              error: "Failed to create new lead",
            })
            continue
          }

          nextApplicantPosition++

          activities.push({
            lead_id: newLead.id,
            activity_type: "lead_created",
            title: isFirstChoice ? "New Lead - First Choice ktech" : "New Lead - Second Choice ktech",
            description: isFirstChoice
              ? `New PUC lead created from ministry acceptance list. Accepted first choice ktech.`
              : `New PUC lead created from ministry acceptance list. Accepted second choice ktech.`,
            metadata: {
              source: "ministry_acceptance_import",
              accepted_college: record.accepted_college,
              choice: isFirstChoice ? "1" : "2",
            },
            created_by: user.id,
          })

          if (isFirstChoice) {
            result.createdFirstChoice.push({
              leadId: newLead.id,
              name: record.student_name || "Unknown",
              civilId: record.civil_id,
            })
          } else {
            result.createdSecondChoice.push({
              leadId: newLead.id,
              name: record.student_name || "Unknown",
              civilId: record.civil_id,
            })
          }
        }
      } catch (error) {
        result.errors.push({
          civilId: record.civil_id,
          name: record.student_name || "Unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    // Batch insert activities
    if (activities.length > 0) {
      const batchSize = 100
      for (let i = 0; i < activities.length; i += batchSize) {
        const batch = activities.slice(i, i + batchSize)
        await supabase.from("activities").insert(batch)
      }
    }

    return NextResponse.json({
      success: true,
      result,
      summary: {
        total: records.length,
        movedToApplicant: result.movedToApplicant.length,
        movedToLost: result.movedToLost.length,
        createdFirstChoice: result.createdFirstChoice.length,
        createdSecondChoice: result.createdSecondChoice.length,
        errors: result.errors.length,
      },
    })
  } catch (error: unknown) {
    console.error("[Ministry Acceptance] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to process ministry acceptance import"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
