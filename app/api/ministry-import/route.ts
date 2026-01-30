import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import {
  type MinistryRecord,
  type MinistryImportResult,
} from "@/lib/ministry-import"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { records, overwriteExisting = false } = body as {
      records: MinistryRecord[]
      overwriteExisting?: boolean
    }

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "No records provided" },
        { status: 400 }
      )
    }

    // Get all civil IDs from records for efficient querying
    const civilIds = records
      .filter(r => r.civil_id)
      .map(r => r.civil_id as string)

    // Fetch all leads with matching civil IDs
    const { data: existingLeads, error: leadsError } = await supabase
      .from("leads")
      .select(`
        id,
        first_name,
        last_name,
        civil_id,
        phone,
        actual_gpa,
        gpa_grade_12_expected,
        school_id,
        school_name_custom,
        school:schools(id, name_en, name_ar)
      `)
      .in("civil_id", civilIds)

    if (leadsError) {
      console.error("[Ministry Import] Failed to fetch leads:", leadsError)
      return NextResponse.json(
        { error: "Failed to fetch existing leads" },
        { status: 500 }
      )
    }

    // Create a map of civil_id to lead for quick lookup
    const leadsByCivilId = new Map(
      (existingLeads || []).map(lead => [lead.civil_id, lead])
    )

    const result: MinistryImportResult = {
      updated: [],
      created: [],
      notFound: [],
      alreadyHasGPA: [],
      errors: [],
    }

    // Process each Ministry record
    for (const record of records) {
      try {
        // Skip records without civil ID
        if (!record.civil_id) {
          result.errors.push({ record, error: "Missing Civil ID" })
          continue
        }

        // Skip records without valid GPA
        if (record.gpa === undefined || record.gpa < 0 || record.gpa > 100) {
          result.errors.push({ record, error: `Invalid GPA: ${record.gpa}` })
          continue
        }

        const existingLead = leadsByCivilId.get(record.civil_id)

        if (existingLead) {
          // Lead exists - check if already has actual GPA
          if (existingLead.actual_gpa !== null && existingLead.actual_gpa !== undefined && !overwriteExisting) {
            result.alreadyHasGPA.push({
              leadId: existingLead.id,
              name: `${existingLead.first_name} ${existingLead.last_name}`,
              existingGPA: existingLead.actual_gpa,
              newGPA: record.gpa,
            })
            continue
          }

          // Update the lead's actual_gpa
          const { error: updateError } = await supabase
            .from("leads")
            .update({
              actual_gpa: record.gpa,
              moe_fetch_status: "success",
              moe_fetched_at: new Date().toISOString(),
            })
            .eq("id", existingLead.id)

          if (updateError) {
            console.error("[Ministry Import] Failed to update lead:", updateError)
            result.errors.push({ record, error: "Failed to update GPA" })
            continue
          }

          // Log activity
          await supabase.from("activities").insert({
            lead_id: existingLead.id,
            activity_type: "gpa_update",
            title: "Ministry GPA Update",
            description: `Actual GPA updated to ${record.gpa}% from Ministry list`,
            metadata: {
              previous_gpa: existingLead.actual_gpa,
              new_gpa: record.gpa,
              source: "ministry_import",
              school_name: record.school_name,
            },
            created_by: user.id,
          })

          result.updated.push({
            leadId: existingLead.id,
            name: `${existingLead.first_name} ${existingLead.last_name}`,
            gpa: record.gpa,
            matchedBy: "civil_id",
          })
        } else {
          // Lead doesn't exist - create new lead
          const { data: newLead, error: createError } = await supabase
            .from("leads")
            .insert({
              first_name: record.first_name,
              last_name: record.last_name || "",
              civil_id: record.civil_id,
              actual_gpa: record.gpa,
              moe_fetch_status: "success",
              moe_fetched_at: new Date().toISOString(),
              school_name_custom: record.school_name,
              source: "gpa_lists",
              source_category: "outreach",
              pipeline_stage: "new",
              grade_level: "12th", // Assume 12th grade since this is graduation data
              phone: "", // Required field - will need to be filled later
            })
            .select()
            .single()

          if (createError) {
            console.error("[Ministry Import] Failed to create lead:", createError)
            result.errors.push({ record, error: "Failed to create new lead" })
            continue
          }

          // Log activity
          await supabase.from("activities").insert({
            lead_id: newLead.id,
            activity_type: "lead_created",
            title: "Lead Created from Ministry List",
            description: `New lead created from Ministry graduate list with GPA ${record.gpa}%`,
            metadata: {
              gpa: record.gpa,
              source: "ministry_import",
              school_name: record.school_name,
            },
            created_by: user.id,
          })

          result.created.push({
            leadId: newLead.id,
            name: `${record.first_name} ${record.last_name || ""}`.trim(),
            gpa: record.gpa,
          })
        }
      } catch (error) {
        console.error("[Ministry Import] Error processing record:", error)
        result.errors.push({
          record,
          error: error instanceof Error ? error.message : "Unknown error"
        })
      }
    }

    return NextResponse.json({
      success: true,
      result,
      summary: {
        total: records.length,
        updated: result.updated.length,
        created: result.created.length,
        alreadyHasGPA: result.alreadyHasGPA.length,
        errors: result.errors.length,
      },
    })
  } catch (error: unknown) {
    console.error("[Ministry Import] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to process Ministry import"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "ministry-import" })
}
