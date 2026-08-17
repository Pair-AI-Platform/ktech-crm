import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server"
import { calculateLeadQuality } from "@/lib/lead-scoring"
import { assertArabicLeadNameFields } from "@/lib/lead-name-policy"

export const runtime = 'edge'

type IncomingLead = Record<string, unknown> & {
  civil_id?: string | null
  phone?: string | null
}

interface BulkImportBody {
  leads: IncomingLead[]
  // If provided and matches BULK_IMPORT_TOKEN env, bypass user-session auth.
  // Intended for CLI usage during the one-time ETL run.
  token?: string
}

interface BulkImportResult {
  created: number
  updated: number
  skipped: number
  errors: { row: number; reason: string }[]
}

const BATCH_SIZE = 250
const MAX_PER_REQUEST = 5000

// Pipeline-stage progression order for "highest stage wins" upsert logic.
const STAGE_ORDER = [
  "new",
  "contacted",
  "visit",
  "test",
  "application",
  "applicant",
  "enrolled",
  "puc_document_submission",
  "puc_application_submission",
  "withdraw",
  "lost",
]
function stageRank(stage: string | null | undefined): number {
  if (!stage) return -1
  const i = STAGE_ORDER.indexOf(stage)
  return i === -1 ? -1 : i
}

function recomputeScoring(lead: IncomingLead) {
  const scoring = calculateLeadQuality({
    placement_test_raw: (lead.placement_test_raw as number | null)
      ?? (lead.placement_english_score as number | null)
      ?? null,
  })
  return {
    foundation_level: scoring.foundation_level,
  }
}

export async function POST(request: NextRequest) {
  let body: BulkImportBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const leads = Array.isArray(body.leads) ? body.leads : []
  if (leads.length === 0) {
    return NextResponse.json({ error: "No leads provided" }, { status: 400 })
  }
  if (leads.length > MAX_PER_REQUEST) {
    return NextResponse.json(
      { error: `Maximum ${MAX_PER_REQUEST} leads per request` },
      { status: 400 },
    )
  }

  // Auth: either a service-token header (for the one-time ETL) or an admin user.
  const importToken = process.env.BULK_IMPORT_TOKEN
  const usingToken = importToken && body.token && body.token === importToken

  let supabase
  if (usingToken) {
    supabase = createServiceRoleClient()
  } else {
    const userSupabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await userSupabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { data: profile } = await userSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: admin access required" }, { status: 403 })
    }
    supabase = createServiceRoleClient()
  }

  const result: BulkImportResult = { created: 0, updated: 0, skipped: 0, errors: [] }

  // Pre-fetch existing leads keyed by civil_id and phone for upsert decisions.
  const civilIds = Array.from(new Set(leads.map((l) => l.civil_id).filter(Boolean))) as string[]
  const phones = Array.from(new Set(leads.map((l) => l.phone).filter(Boolean))) as string[]

  const existing = new Map<string, { id: string; pipeline_stage: string | null; notes: string | null }>()
  if (civilIds.length) {
    const { data } = await supabase
      .from("leads")
      .select("id, civil_id, phone, pipeline_stage, notes")
      .in("civil_id", civilIds)
    for (const r of data || []) {
      if (r.civil_id) existing.set(`civil:${r.civil_id}`, r)
      if (r.phone) existing.set(`phone:${r.phone}`, r)
    }
  }
  if (phones.length) {
    const { data } = await supabase
      .from("leads")
      .select("id, civil_id, phone, pipeline_stage, notes")
      .in("phone", phones)
    for (const r of data || []) {
      if (r.civil_id) existing.set(`civil:${r.civil_id}`, r)
      if (r.phone) existing.set(`phone:${r.phone}`, r)
    }
  }

  const inserts: IncomingLead[] = []
  const updates: { id: string; patch: IncomingLead }[] = []

  for (let i = 0; i < leads.length; i++) {
    const raw = leads[i]
    if (!raw || typeof raw !== "object") {
      result.errors.push({ row: i, reason: "Not an object" })
      continue
    }
    if (!raw.phone) {
      result.errors.push({ row: i, reason: "Missing phone" })
      continue
    }

    let patched: IncomingLead
    let scoring: ReturnType<typeof recomputeScoring>
    try {
      const normalized = assertArabicLeadNameFields(raw, { requireFirstName: true })
      scoring = recomputeScoring(normalized)
      patched = { ...normalized, ...scoring }
    } catch (error) {
      result.errors.push({
        row: i,
        reason: error instanceof Error ? error.message : "Lead name must be in Arabic",
      })
      continue
    }

    const hit =
      (raw.civil_id && existing.get(`civil:${raw.civil_id}`)) ||
      (raw.phone && existing.get(`phone:${raw.phone}`)) ||
      null

    if (hit) {
      // Upsert rules: keep the higher pipeline stage, append notes, refresh scoring.
      const incomingStageRank = stageRank(patched.pipeline_stage as string | undefined)
      const existingStageRank = stageRank(hit.pipeline_stage)
      const finalStage = incomingStageRank > existingStageRank
        ? (patched.pipeline_stage as string)
        : hit.pipeline_stage ?? patched.pipeline_stage

      const incomingNotes = typeof patched.notes === "string" ? patched.notes : null
      const mergedNotes = [hit.notes, incomingNotes].filter(Boolean).join(" || ").slice(0, 4000)

      updates.push({
        id: hit.id,
        patch: {
          first_name: patched.first_name,
          last_name: patched.last_name,
          first_name_ar: patched.first_name_ar,
          last_name_ar: patched.last_name_ar,
          foundation_level: scoring.foundation_level,
          pipeline_stage: finalStage,
          notes: mergedNotes,
          // Backfill commonly-missing fields when the new row has them
          civil_id: patched.civil_id ?? undefined,
          external_code: patched.external_code ?? undefined,
          placement_test_raw: patched.placement_test_raw ?? undefined,
          gpa_grade_12_expected: patched.gpa_grade_12_expected ?? undefined,
          academic_track: patched.academic_track ?? undefined,
          intended_major: patched.intended_major ?? undefined,
          school_id: patched.school_id ?? undefined,
          governorate: patched.governorate ?? undefined,
          assigned_to: patched.assigned_to ?? undefined,
        },
      })
    } else {
      inserts.push(patched)
    }
  }

  // Apply inserts in batches
  for (let i = 0; i < inserts.length; i += BATCH_SIZE) {
    const batch = inserts.slice(i, i + BATCH_SIZE)
    const { error, count } = await supabase
      .from("leads")
      .insert(batch as never[], { count: "exact" })
    if (error) {
      result.errors.push({ row: i, reason: `Insert batch failed: ${error.message}` })
      result.skipped += batch.length
    } else {
      result.created += count ?? batch.length
    }
  }

  // Apply updates one-by-one (low volume; preserves merge logic per row)
  for (const u of updates) {
    // strip undefined keys
    const patch = Object.fromEntries(
      Object.entries(u.patch).filter(([, v]) => v !== undefined),
    )
    const { error } = await supabase.from("leads").update(patch).eq("id", u.id)
    if (error) {
      result.errors.push({ row: -1, reason: `Update ${u.id} failed: ${error.message}` })
      result.skipped += 1
    } else {
      result.updated += 1
    }
  }

  return NextResponse.json(result)
}
