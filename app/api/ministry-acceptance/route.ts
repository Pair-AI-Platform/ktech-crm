import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { MinistryAcceptanceRecord, MinistryAcceptanceResult } from "@/lib/ministry-acceptance-import"
import { GPA_SELF_FUNDED_THRESHOLD } from "@/lib/config/constants"

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
      .select("id, first_name, last_name, first_name_ar, last_name_ar, civil_id, pipeline_stage, status, funding_type, position_in_stage, ministry_assigned")
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
      convertedToSelfFunded: [],
      createdFirstChoice: [],
      createdSecondChoice: [],
      ministryAssigned: [],
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
          const leadName = `${lead.first_name_ar || ""} ${lead.last_name_ar || ""}`

          // Skip if already at applicant/enrolled (don't move backwards)
          if (["applicant", "enrolled"].includes(lead.pipeline_stage)) {
            continue
          }

          // ── GPA CHECK: Auto-convert to self-funded if GPA < threshold ──
          if (record.gpa !== undefined && record.gpa < GPA_SELF_FUNDED_THRESHOLD && lead.funding_type === "puc") {
            const { error: updateError } = await supabase
              .from("leads")
              .update({
                funding_type: "self_funded",
                actual_gpa: record.gpa,
              })
              .eq("id", lead.id)

            if (updateError) {
              result.errors.push({ civilId: record.civil_id, name: leadName, error: "Failed to convert to self-funded" })
              continue
            }

            activities.push({
              lead_id: lead.id,
              activity_type: "funding_change",
              title: "Converted to Self-Funded",
              description: `Automatically converted from PUC to Self-Funded due to GPA ${record.gpa}% (below ${GPA_SELF_FUNDED_THRESHOLD}%). Source: Ministry acceptance import.`,
              metadata: {
                old_funding_type: "puc",
                new_funding_type: "self_funded",
                gpa: record.gpa,
                source: "ministry_acceptance_import",
              },
              created_by: user.id,
            })

            result.convertedToSelfFunded.push({
              leadId: lead.id,
              name: leadName,
              civilId: record.civil_id,
              gpa: record.gpa,
            })
            continue
          }

          // Update actual_gpa from ministry list if provided
          if (record.gpa !== undefined) {
            await supabase
              .from("leads")
              .update({ actual_gpa: record.gpa })
              .eq("id", lead.id)
          }

          if (record.is_accepted_ktech) {
            // Accepted for ktech → move to "applicant"
            // Second choice = الحالة is "تم القبول في الخطة" (didn't choose KTECH first)
            const isSecondChoice = !record.is_first_choice

            const { error: updateError } = await supabase
              .from("leads")
              .update({
                pipeline_stage: "applicant",
                position_in_stage: nextApplicantPosition,
                status: null,
                puc_choice: isSecondChoice ? "2" : "1",
                puc_first_choice_college: isSecondChoice ? (record.accepted_college || null) : null,
                ministry_assigned: isSecondChoice,
                // Clear lost fields if moving from lost
                ...(lead.pipeline_stage === "lost" ? {
                  lost_reason_id: null,
                  lost_reason_notes: null,
                  lost_at_stage: null,
                } : {}),
                ...(record.accepted_major ? { ministry_accepted_major: record.accepted_major } : {}),
                // Highlight second-choice leads with star (important priority)
                ...(isSecondChoice ? {
                  priority: "important",
                  priority_set_by: user.id,
                  priority_set_at: new Date().toISOString(),
                } : {}),
              })
              .eq("id", lead.id)

            if (updateError) {
              result.errors.push({ civilId: record.civil_id, name: leadName, error: "Failed to update to applicant" })
              continue
            }

            nextApplicantPosition++

            const description = isSecondChoice
              ? `Ministry-assigned to ktech. Moved from ${lead.pipeline_stage} to Applicant.`
              : `Accepted by ministry for ktech. Moved from ${lead.pipeline_stage} to Applicant.`

            activities.push({
              lead_id: lead.id,
              activity_type: "stage_change",
              title: isSecondChoice ? "Ministry Assigned to Applicant" : "Moved to Applicant",
              description,
              metadata: {
                old_stage: lead.pipeline_stage,
                new_stage: "applicant",
                source: "ministry_acceptance_import",
                ministry_assigned: isSecondChoice,
                accepted_college: record.accepted_college,
              },
              created_by: user.id,
            })

            result.movedToApplicant.push({ leadId: lead.id, name: leadName, civilId: record.civil_id })

            if (isSecondChoice) {
              result.ministryAssigned.push({
                leadId: lead.id,
                name: leadName,
                civilId: record.civil_id,
                previousStage: lead.pipeline_stage,
              })
            }
          } else {
            // Not accepted for ktech → move to "lost" with PUC Rejected reason
            // Skip if already in lost (no need to re-lose them)
            if (lead.pipeline_stage === "lost") {
              continue
            }

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
                ...(record.accepted_major ? { ministry_accepted_major: record.accepted_major } : {}),
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
          const isFirstChoice = record.is_first_choice
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
              ministry_assigned: !isFirstChoice,
              ...(record.accepted_major ? { ministry_accepted_major: record.accepted_major } : {}),
              // Highlight second-choice leads with star (important priority)
              ...(!isFirstChoice ? {
                priority: "important",
                priority_set_by: user.id,
                priority_set_at: new Date().toISOString(),
              } : {}),
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

          // All newly created leads are ministry-assigned (not in system before)
          result.ministryAssigned.push({
            leadId: newLead.id,
            name: record.student_name || "Unknown",
            civilId: record.civil_id,
            previousStage: "new (not in system)",
          })
        }
      } catch (error) {
        result.errors.push({
          civilId: record.civil_id,
          name: record.student_name || "Unknown",
          error: "Failed to process record",
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
        convertedToSelfFunded: result.convertedToSelfFunded.length,
        createdFirstChoice: result.createdFirstChoice.length,
        createdSecondChoice: result.createdSecondChoice.length,
        ministryAssigned: result.ministryAssigned.length,
        errors: result.errors.length,
      },
    })
  } catch (error: unknown) {
    console.error("[Ministry Acceptance] Error:", error)
    const errorMessage = "Failed to process ministry acceptance import"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
