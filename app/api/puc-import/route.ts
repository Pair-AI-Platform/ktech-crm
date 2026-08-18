import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { PucImportRecord, PucImportResult } from "@/lib/puc-import"
import { getArabicLeadDisplayName, splitArabicFullName } from "@/lib/lead-name-policy"


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
    const { records } = body as { records: PucImportRecord[] }

    const MAX_RECORDS = 2000
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

    // Fetch ALL leads with matching civil IDs (any stage)
    const { data: existingLeads, error: leadsError } = await supabase
      .from("leads")
      .select("id, first_name, last_name, first_name_ar, last_name_ar, civil_id, pipeline_stage, position_in_stage, puc_import_flagged")
      .in("civil_id", civilIds)

    if (leadsError) {
      console.error("[PUC Import] Failed to fetch leads:", leadsError)
      return NextResponse.json({ error: "Failed to fetch existing leads" }, { status: 500 })
    }

    // Create a map of civil_id to lead
    const leadsByCivilId = new Map(
      (existingLeads || []).map(lead => [lead.civil_id, lead])
    )

    // Get next position in "applicant" stage
    const { data: maxPosData } = await supabase
      .from("leads")
      .select("position_in_stage")
      .eq("pipeline_stage", "applicant")
      .order("position_in_stage", { ascending: false })
      .limit(1)
      .single()

    let nextApplicantPosition = (maxPosData?.position_in_stage ?? 0) + 1

    // Fetch active semester for new leads
    const { data: activeSemester } = await supabase
      .from("semesters")
      .select("id")
      .eq("is_active", true)
      .eq("is_open", true)
      .order("start_date", { ascending: true })
      .limit(1)
      .single()

    const result: PucImportResult = {
      matchedSubmission: [],
      matchedOtherStages: [],
      createdNew: [],
      errors: [],
      skipped: [],
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
          const leadName = getArabicLeadDisplayName(lead)

          // Skip if already in applicant or enrolled (don't move backwards)
          if (["applicant", "enrolled"].includes(lead.pipeline_stage)) {
            result.skipped.push({
              leadId: lead.id,
              name: leadName,
              civilId: record.civil_id,
              reason: `Already in ${lead.pipeline_stage}`,
            })
            continue
          }

          if (lead.pipeline_stage === "puc_application_submission") {
            // ── MATCHED IN PUC SUBMISSION → move to applicant (no "2" badge) ──
            const { error: updateError } = await supabase
              .from("leads")
              .update({
                pipeline_stage: "applicant",
                position_in_stage: nextApplicantPosition,
                puc_import_flagged: false,
                actual_lead: true,
                funding_type: "puc",
                status: null,
              })
              .eq("id", lead.id)

            if (updateError) {
              result.errors.push({ civilId: record.civil_id, name: leadName, error: "Failed to move to applicant" })
              continue
            }

            nextApplicantPosition++

            activities.push({
              lead_id: lead.id,
              activity_type: "stage_change",
              title: "PUC Import → Applicant",
              description: `Matched PUC import. Moved from PUC Application Submission to Applicant.`,
              metadata: {
                old_stage: "puc_application_submission",
                new_stage: "applicant",
                source: "puc_import",
                puc_import_flagged: false,
              },
              created_by: user.id,
            })

            result.matchedSubmission.push({
              leadId: lead.id,
              name: leadName,
              civilId: record.civil_id,
            })
          } else {
            // ── IN ANOTHER STAGE → move to applicant + flag with "2" badge ──
            const previousStage = lead.pipeline_stage

            const { error: updateError } = await supabase
              .from("leads")
              .update({
                pipeline_stage: "applicant",
                position_in_stage: nextApplicantPosition,
                puc_import_flagged: true,
                actual_lead: true,
                funding_type: "puc",
                status: null,
                // Clear lost fields if moving from lost
                ...(lead.pipeline_stage === "lost" ? {
                  lost_reason_id: null,
                  lost_reason_notes: null,
                  lost_at_stage: null,
                } : {}),
              })
              .eq("id", lead.id)

            if (updateError) {
              result.errors.push({ civilId: record.civil_id, name: leadName, error: "Failed to move to applicant" })
              continue
            }

            nextApplicantPosition++

            activities.push({
              lead_id: lead.id,
              activity_type: "stage_change",
              title: "PUC Import → Applicant (Type 2)",
              description: `Found in PUC import list but was in "${previousStage}" stage (not PUC Submission). Moved to Applicant and flagged Type 2.`,
              metadata: {
                old_stage: previousStage,
                new_stage: "applicant",
                source: "puc_import",
                puc_import_flagged: true,
              },
              created_by: user.id,
            })

            result.matchedOtherStages.push({
              leadId: lead.id,
              name: leadName,
              civilId: record.civil_id,
              previousStage,
            })
          }
        } else {
          // ── NEW STUDENT (not in system at all) → create + flag with "2" badge ──
          const arabicName = splitArabicFullName(record.student_name)

          if (!arabicName?.first_name) {
            result.errors.push({
              civilId: record.civil_id,
              name: record.student_name || "Missing name",
              error: "Student name must be in Arabic before creating a new lead",
            })
            continue
          }

          const fullName = [arabicName.first_name, arabicName.last_name].filter(Boolean).join(" ")

          const { data: newLead, error: createError } = await supabase
            .from("leads")
            .insert({
              first_name: arabicName.first_name,
              last_name: arabicName.last_name,
              first_name_ar: arabicName.first_name,
              last_name_ar: arabicName.last_name,
              civil_id: record.civil_id,
              phone: "",
              pipeline_stage: "applicant",
              position_in_stage: nextApplicantPosition,
              actual_lead: true,
              funding_type: "puc",
              puc_import_flagged: true,
              source: "gpa_lists",
              source_category: "outreach",
              ...(activeSemester && { semester_id: activeSemester.id }),
            })
            .select("id")
            .single()

          if (createError) {
            result.errors.push({
              civilId: record.civil_id,
              name: fullName,
              error: "Failed to create new lead",
            })
            continue
          }

          nextApplicantPosition++

          activities.push({
            lead_id: newLead.id,
            activity_type: "lead_created",
            title: "New Lead from PUC Import (Type 2)",
            description: `New lead created from PUC import. Not previously in system. Flagged Type 2.`,
            metadata: {
              source: "puc_import",
              puc_import_flagged: true,
            },
            created_by: user.id,
          })

          result.createdNew.push({
            leadId: newLead.id,
            name: fullName,
            civilId: record.civil_id,
          })
        }
      } catch {
        result.errors.push({
          civilId: record.civil_id,
          name: record.student_name || "Missing name",
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
        matchedSubmission: result.matchedSubmission.length,
        matchedOtherStages: result.matchedOtherStages.length,
        createdNew: result.createdNew.length,
        skipped: result.skipped.length,
        errors: result.errors.length,
      },
    })
  } catch (error: unknown) {
    console.error("[PUC Import] Error:", error)
    return NextResponse.json({ error: "Failed to process PUC import" }, { status: 500 })
  }
}
