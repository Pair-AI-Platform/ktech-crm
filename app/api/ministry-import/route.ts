import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import {
  type MinistryRecord,
  type MinistryImportResult,
  type MinistryReviewCandidate,
} from "@/lib/ministry-import"
import { namesMatch } from "@/lib/string-utils"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { GPA_SELF_FUNDED_THRESHOLD } from "@/lib/config/constants"
import { assertArabicLeadNameFields, getArabicLeadDisplayName } from "@/lib/lead-name-policy"


type SchoolRow = { id: string; name_en: string | null; name_ar: string | null; school_type: string | null }

// The school's school_type is the source of truth for a lead's education_type.
const SCHOOL_TYPE_TO_EDUCATION: Record<string, string> = { gov: 'GOV', us: 'US', uk: 'UK', ksa: 'KSA', others: 'other' }

type ExistingLeadRow = {
  id: string
  first_name: string | null
  last_name: string | null
  first_name_ar: string | null
  last_name_ar: string | null
  civil_id: string | null
  phone: string | null
  actual_gpa: number | null
  funding_type: 'puc' | 'self_funded' | null
  pipeline_stage: string | null
  school_id: string | null
  school_name_custom: string | null
  seat_number: string | null
  academic_track: string | null
  education_type: string | null
  graduation_year: number | null
  grade_level: string | null
  school?: { id: string; name_en: string | null; name_ar: string | null } | null
}

const PUC_ONLY_STAGES = new Set(['puc_document_submission', 'puc_application_submission'])

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
      return NextResponse.json({ error: "No records provided" }, { status: 400 })
    }
    if (records.length > MAX_RECORDS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_RECORDS} records allowed per import` },
        { status: 400 }
      )
    }

    // Fetch all schools for fuzzy matching
    const { data: allSchools } = await supabase
      .from("schools")
      .select("id, name_en, name_ar, school_type")
      .eq("is_active", true)

    const schools: SchoolRow[] = allSchools || []
    const educationTypeBySchool = new Map<string, string>()
    for (const s of schools) {
      const eduType = s.school_type ? SCHOOL_TYPE_TO_EDUCATION[s.school_type] : undefined
      if (eduType) educationTypeBySchool.set(s.id, eduType)
    }

    const matchSchool = (schoolName?: string): string | undefined => {
      if (!schoolName || schools.length === 0) return undefined
      const normalized = schoolName.toLowerCase().trim()
      const exact = schools.find(
        s => s.name_en?.toLowerCase() === normalized || s.name_ar === schoolName.trim()
      )
      if (exact) return exact.id
      const partial = schools.find(
        s => s.name_en?.toLowerCase().includes(normalized) || normalized.includes(s.name_en?.toLowerCase() || '') ||
             s.name_ar?.includes(schoolName.trim()) || schoolName.trim().includes(s.name_ar || '')
      )
      return partial?.id
    }

    // Pre-compute matched school IDs per record (used by both Tier 1 update path and Tier 2)
    const recordSchoolIds = new Map<MinistryRecord, string | undefined>()
    for (const r of records) {
      recordSchoolIds.set(r, matchSchool(r.school_name))
    }

    // ---------- TIER 1: Civil ID match ----------
    const civilIds = records
      .filter(r => r.civil_id)
      .map(r => r.civil_id as string)

    const leadSelect = `
      id, first_name, last_name, first_name_ar, last_name_ar, civil_id, phone, actual_gpa, funding_type, pipeline_stage,
      school_id, school_name_custom, seat_number, academic_track, education_type, graduation_year, grade_level,
      school:schools(id, name_en, name_ar)
    ` as const

    let tier1Leads: ExistingLeadRow[] = []
    if (civilIds.length > 0) {
      const { data, error: leadsError } = await supabase
        .from("leads")
        .select(leadSelect)
        .in("civil_id", civilIds)

      if (leadsError) {
        console.error("[Ministry Import] Failed to fetch leads:", leadsError)
        return NextResponse.json({ error: "Failed to fetch existing leads" }, { status: 500 })
      }
      tier1Leads = (data || []) as unknown as ExistingLeadRow[]
    }

    const leadsByCivilId = new Map<string, ExistingLeadRow>()
    for (const lead of tier1Leads) {
      if (lead.civil_id) leadsByCivilId.set(lead.civil_id, lead)
    }

    // ---------- TIER 2: Fuzzy candidate prefetch ----------
    // For records that did NOT match Tier 1, gather a candidate pool of leads
    // sharing matched school IDs with no actual GPA yet.
    const tier2Records = records.filter(r => {
      if (!r.civil_id) return true
      return !leadsByCivilId.has(r.civil_id)
    })

    const fuzzySchoolIds = new Set<string>()
    for (const r of tier2Records) {
      const sid = recordSchoolIds.get(r)
      if (sid) fuzzySchoolIds.add(sid)
    }

    let fuzzyCandidatePool: ExistingLeadRow[] = []
    if (fuzzySchoolIds.size > 0) {
      const { data, error: fuzzyError } = await supabase
        .from("leads")
        .select(leadSelect)
        .in("school_id", Array.from(fuzzySchoolIds))
        .is("actual_gpa", null)

      if (fuzzyError) {
        console.error("[Ministry Import] Failed to fetch fuzzy candidate pool:", fuzzyError)
      } else {
        fuzzyCandidatePool = (data || []) as unknown as ExistingLeadRow[]
      }
    }

    // Track which lead IDs have already been claimed by a Tier 2 match in this batch
    // so two records can't both claim the same lead.
    const claimedLeadIds = new Set<string>()
    for (const lead of tier1Leads) claimedLeadIds.add(lead.id)

    const findFuzzyCandidates = (record: MinistryRecord): ExistingLeadRow[] => {
      const schoolId = recordSchoolIds.get(record)
      const recName = `${record.first_name} ${record.last_name || ''}`.trim()
      if (!recName) return []

      const candidates: ExistingLeadRow[] = []
      for (const lead of fuzzyCandidatePool) {
        if (claimedLeadIds.has(lead.id)) continue

        // Must share school (Tier 2 only runs when school matched)
        if (schoolId && lead.school_id !== schoolId) continue
        if (!schoolId) continue

        // Optional graduation year filter — if both sides have it, must match
        if (record.graduation_year && lead.graduation_year && lead.graduation_year !== record.graduation_year) {
          continue
        }

        // Optional seat number boost — exact match short-circuits to a confident hit
        if (record.seat_number && lead.seat_number && record.seat_number === lead.seat_number) {
          candidates.push(lead)
          continue
        }

        // Name similarity required
        const leadName = getArabicLeadDisplayName(lead)
        if (!leadName) continue
        if (namesMatch(recName, leadName)) {
          candidates.push(lead)
        }
      }
      return candidates
    }

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
      convertedToSelfFunded: [],
      needsReview: [],
      errors: [],
    }

    // Helper: apply update/conversion logic to an existing lead matched by either tier
    const updateExistingLead = async (
      existingLead: ExistingLeadRow,
      record: MinistryRecord,
      matchedBy: 'civil_id' | 'fuzzy',
    ) => {
      // Skip if already has GPA and not overwriting
      if (existingLead.actual_gpa !== null && existingLead.actual_gpa !== undefined && !overwriteExisting) {
        result.alreadyHasGPA.push({
          leadId: existingLead.id,
          name: getArabicLeadDisplayName(existingLead),
          existingGPA: existingLead.actual_gpa,
          newGPA: record.gpa,
        })
        return
      }

      const updatePayload: Record<string, unknown> = {
        actual_gpa: record.gpa,
        actual_lead: true,
        moe_fetch_status: "success",
        moe_fetched_at: new Date().toISOString(),
      }
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
      if (record.school_name && !existingLead.school_id) {
        const matchedSchoolId = recordSchoolIds.get(record)
        if (matchedSchoolId) {
          updatePayload.school_id = matchedSchoolId
          // Derive education_type from the matched school when not already set.
          const eduType = educationTypeBySchool.get(matchedSchoolId)
          if (eduType && !existingLead.education_type && !updatePayload.education_type) {
            updatePayload.education_type = eduType
          }
        } else {
          updatePayload.school_name_custom = record.school_name
        }
      }
      // For Tier 2 matches: write civil_id back so re-imports use Tier 1
      if (matchedBy === 'fuzzy' && record.civil_id && !existingLead.civil_id) {
        updatePayload.civil_id = record.civil_id
      }

      const { error: updateError } = await supabase
        .from("leads")
        .update(updatePayload)
        .eq("id", existingLead.id)

      if (updateError) {
        console.error("[Ministry Import] Failed to update lead:", updateError)
        result.errors.push({ record, error: "Failed to update GPA" })
        return
      }

      await supabase.from("activities").insert({
        lead_id: existingLead.id,
        activity_type: "gpa_update",
        title: matchedBy === 'fuzzy' ? "Ministry GPA Update (Fuzzy Match)" : "Ministry GPA Update",
        description: matchedBy === 'fuzzy'
          ? `Actual GPA updated to ${record.gpa}% from Ministry list. Matched by name + school (no Civil ID on record).`
          : `Actual GPA updated to ${record.gpa}% from Ministry list`,
        metadata: {
          previous_gpa: existingLead.actual_gpa,
          new_gpa: record.gpa,
          source: "ministry_import",
          matched_by: matchedBy,
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
        name: getArabicLeadDisplayName(existingLead),
        gpa: record.gpa,
        matchedBy,
      })

      // Auto-demote PUC → Self-Funded when actual GPA < threshold
      if (record.gpa < GPA_SELF_FUNDED_THRESHOLD && existingLead.funding_type === "puc") {
        const fundingUpdate: Record<string, unknown> = { funding_type: "self_funded" }
        let stageRemapped: { from: string; to: string } | undefined
        // PUC-specific stages have no Self-Funded equivalent — remap to File stage
        if (existingLead.pipeline_stage && PUC_ONLY_STAGES.has(existingLead.pipeline_stage)) {
          fundingUpdate.pipeline_stage = 'application'
          stageRemapped = { from: existingLead.pipeline_stage, to: 'application' }
        }

        const { error: fundingError } = await supabase
          .from("leads")
          .update(fundingUpdate)
          .eq("id", existingLead.id)

        if (fundingError) {
          console.error("[Ministry Import] Failed to convert to self-funded:", fundingError)
        } else {
          await supabase.from("activities").insert({
            lead_id: existingLead.id,
            activity_type: "funding_change",
            title: "Demoted to Self-Funded",
            description: stageRemapped
              ? `Automatically demoted from PUC to Self-Funded due to GPA ${record.gpa}% (below ${GPA_SELF_FUNDED_THRESHOLD}%). Stage remapped ${stageRemapped.from} → ${stageRemapped.to}. Source: Ministry GPA import.`
              : `Automatically demoted from PUC to Self-Funded due to GPA ${record.gpa}% (below ${GPA_SELF_FUNDED_THRESHOLD}%). Source: Ministry GPA import.`,
            metadata: {
              old_funding_type: "puc",
              new_funding_type: "self_funded",
              gpa: record.gpa,
              source: "ministry_import",
              ...(stageRemapped && { stage_remapped: stageRemapped }),
            },
            created_by: user.id,
          })

          result.convertedToSelfFunded.push({
            leadId: existingLead.id,
            name: getArabicLeadDisplayName(existingLead),
            ...(record.civil_id && { civilId: record.civil_id }),
            gpa: record.gpa,
            previousFundingType: "puc",
            ...(stageRemapped && { stageRemapped }),
          })
        }
      }
    }

    // ---------- Main processing loop ----------
    for (const record of records) {
      try {
        if (record.gpa === undefined || record.gpa < 0 || record.gpa > 100) {
          result.errors.push({ record, error: `Invalid GPA: ${record.gpa}` })
          continue
        }

        // Tier 1: civil_id exact match
        const tier1Lead = record.civil_id ? leadsByCivilId.get(record.civil_id) : undefined
        if (tier1Lead) {
          await updateExistingLead(tier1Lead, record, 'civil_id')
          continue
        }

        // Tier 2: fuzzy match by name + school (+ graduation year + seat number when available)
        const candidates = findFuzzyCandidates(record)
        if (candidates.length === 1) {
          const match = candidates[0]
          claimedLeadIds.add(match.id)
          await updateExistingLead(match, record, 'fuzzy')
          continue
        }
        if (candidates.length > 1) {
          const reviewCandidates: MinistryReviewCandidate[] = candidates.map(c => ({
            id: c.id,
            full_name: getArabicLeadDisplayName(c),
            civil_id: c.civil_id,
            school_name: c.school?.name_en || c.school?.name_ar || c.school_name_custom || null,
            graduation_year: c.graduation_year,
            seat_number: c.seat_number,
          }))
          result.needsReview.push({ record, candidates: reviewCandidates })
          continue
        }

        // No match — create new lead, routed by GPA
        const normalizedName = assertArabicLeadNameFields(
          { first_name: record.first_name, last_name: record.last_name || "" },
          { requireFirstName: true },
        )
        const matchedSchoolId = recordSchoolIds.get(record)
        const isLowGpa = record.gpa < GPA_SELF_FUNDED_THRESHOLD
        const routedTo: 'puc' | 'self_funded' = isLowGpa ? 'self_funded' : 'puc'

        const { data: newLead, error: createError } = await supabase
          .from("leads")
          .insert({
            first_name: normalizedName.first_name,
            last_name: normalizedName.last_name || "",
            first_name_ar: normalizedName.first_name,
            last_name_ar: normalizedName.last_name || "",
            ...(record.civil_id && { civil_id: record.civil_id }),
            actual_gpa: record.gpa,
            moe_fetch_status: "success",
            moe_fetched_at: new Date().toISOString(),
            ...(matchedSchoolId
              ? { school_id: matchedSchoolId }
              : record.school_name && { school_name_custom: record.school_name }),
            source: "gpa_lists",
            source_category: "outreach",
            pipeline_stage: "new",
            grade_level: record.grade_level || "12th",
            phone: "",
            funding_type: routedTo,
            actual_lead: true,
            ...(record.seat_number && { seat_number: record.seat_number }),
            ...(record.academic_track && { academic_track: record.academic_track }),
            ...((record.education_type || (matchedSchoolId && educationTypeBySchool.get(matchedSchoolId)))
              ? { education_type: record.education_type || educationTypeBySchool.get(matchedSchoolId!) }
              : {}),
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

        await supabase.from("activities").insert({
          lead_id: newLead.id,
          activity_type: "lead_created",
          title: "Lead Created from Ministry List",
          description: `New lead created from Ministry graduate list with GPA ${record.gpa}%. Routed to ${routedTo === 'puc' ? 'PUC' : 'Self-Funded'} pipeline.`,
          metadata: {
            gpa: record.gpa,
            source: "ministry_import",
            school_name: record.school_name,
            funding_type: routedTo,
            reason: isLowGpa ? "gpa_below_70" : "gpa_at_or_above_70",
          },
          created_by: user.id,
        })

        result.created.push({
          leadId: newLead.id,
          name: getArabicLeadDisplayName(newLead),
          gpa: record.gpa,
          routedTo,
        })
      } catch (error) {
        console.error("[Ministry Import] Error processing record:", error)
        result.errors.push({ record, error: "Failed to process record" })
      }
    }

    return NextResponse.json({
      success: true,
      result,
      summary: {
        total: records.length,
        updated: result.updated.length,
        updatedByCivilId: result.updated.filter(u => u.matchedBy === 'civil_id').length,
        updatedByFuzzy: result.updated.filter(u => u.matchedBy === 'fuzzy').length,
        created: result.created.length,
        createdAsPuc: result.created.filter(c => c.routedTo === 'puc').length,
        createdAsSelfFunded: result.created.filter(c => c.routedTo === 'self_funded').length,
        alreadyHasGPA: result.alreadyHasGPA.length,
        convertedToSelfFunded: result.convertedToSelfFunded.length,
        needsReview: result.needsReview.length,
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
