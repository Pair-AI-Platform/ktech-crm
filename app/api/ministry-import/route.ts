import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import {
  type MinistryRecord,
  type MinistryImportResult,
} from "@/lib/ministry-import"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"

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
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 })
    }

    const rateLimitResult = await rateLimit(`ministry-import:${user.id}`, RATE_LIMITS['ministry-import'])
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.resetIn / 1000)) } }
      )
    }

    const body = await request.json()
    const { records, overwriteExisting = false } = body as {
      records: MinistryRecord[]
      overwriteExisting?: boolean
    }

    const MAX_RECORDS = 500
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "No records provided" },
        { status: 400 }
      )
    }
    if (records.length > MAX_RECORDS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_RECORDS} records allowed per import` },
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
        seat_number,
        academic_track,
        education_type,
        graduation_year,
        grade_level,
        school:schools(id, name_en, name_ar)
      `)
      .in("civil_id", civilIds)

    // Fetch all schools for fuzzy matching
    const { data: allSchools } = await supabase
      .from("schools")
      .select("id, name_en, name_ar")
      .eq("is_active", true)

    // Helper to match school name to school_id
    const matchSchool = (schoolName?: string): string | undefined => {
      if (!schoolName || !allSchools?.length) return undefined
      const normalized = schoolName.toLowerCase().trim()
      // Exact match first
      const exact = allSchools.find(
        s => s.name_en?.toLowerCase() === normalized || s.name_ar === schoolName.trim()
      )
      if (exact) return exact.id
      // Partial match
      const partial = allSchools.find(
        s => s.name_en?.toLowerCase().includes(normalized) || normalized.includes(s.name_en?.toLowerCase() || '') ||
             s.name_ar?.includes(schoolName.trim()) || schoolName.trim().includes(s.name_ar || '')
      )
      return partial?.id
    }

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

    // Fetch first open term in active cycle for new leads
    const { data: activeSemester } = await supabase
      .from("semesters")
      .select("id")
      .eq("is_active", true)
      .eq("is_open", true)
      .order("start_date", { ascending: true })
      .limit(1)
      .maybeSingle()

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

          // Build update payload with all available fields
          const updatePayload: Record<string, unknown> = {
            actual_gpa: record.gpa,
            moe_fetch_status: "success",
            moe_fetched_at: new Date().toISOString(),
          }
          // Only update additional fields if they have values and the lead doesn't already have them
          if (record.seat_number && !existingLead.seat_number) {
            updatePayload.seat_number = record.seat_number
          }
          if (record.academic_track && !existingLead.academic_track) {
            updatePayload.academic_track = record.academic_track
          }
          if (record.education_type && !existingLead.education_type) {
            updatePayload.education_type = record.education_type
          }
          if (record.graduation_year && !existingLead.graduation_year) {
            updatePayload.graduation_year = record.graduation_year
          }
          if (record.grade_level && !existingLead.grade_level) {
            updatePayload.grade_level = record.grade_level
          }
          // Match school if lead doesn't have one
          if (record.school_name && !existingLead.school_id) {
            const matchedSchoolId = matchSchool(record.school_name)
            if (matchedSchoolId) {
              updatePayload.school_id = matchedSchoolId
            } else {
              updatePayload.school_name_custom = record.school_name
            }
          }

          const { error: updateError } = await supabase
            .from("leads")
            .update(updatePayload)
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
              ...(record.seat_number && { seat_number: record.seat_number }),
              ...(record.academic_track && { academic_track: record.academic_track }),
              ...(record.education_type && { education_type: record.education_type }),
              ...(record.graduation_year && { graduation_year: record.graduation_year }),
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
          const matchedSchoolId = matchSchool(record.school_name)
          const { data: newLead, error: createError } = await supabase
            .from("leads")
            .insert({
              first_name: record.first_name,
              last_name: record.last_name || "",
              civil_id: record.civil_id,
              actual_gpa: record.gpa,
              moe_fetch_status: "success",
              moe_fetched_at: new Date().toISOString(),
              ...(matchedSchoolId
                ? { school_id: matchedSchoolId }
                : { school_name_custom: record.school_name }),
              source: "gpa_lists",
              source_category: "outreach",
              pipeline_stage: "new",
              grade_level: record.grade_level || "12th",
              phone: "", // Required field - will need to be filled later
              ...(record.seat_number && { seat_number: record.seat_number }),
              ...(record.academic_track && { academic_track: record.academic_track }),
              ...(record.education_type && { education_type: record.education_type }),
              ...(record.graduation_year && { graduation_year: record.graduation_year }),
              ...(activeSemester && { semester_id: activeSemester.id }),
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
          error: "Failed to process record"
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
    return NextResponse.json(
      { error: "Failed to process Ministry import" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "ministry-import" })
}
