#!/usr/bin/env node
// One-shot importer for the JSON files produced by scripts/ingest-excel-data.mjs.
// Mirrors the upsert logic in app/api/leads/bulk-import/route.ts but talks to
// Supabase directly via service role so it can run from CLI without the API.
//
// Usage:
//   node --env-file=.env.local --max-old-space-size=4096 \
//     scripts/apply-imports.mjs imports/applicants.json [--limit N] [--dry-run]

import { createClient } from "@supabase/supabase-js"
import { readFile } from "node:fs/promises"
import process from "node:process"

const args = process.argv.slice(2)
const file = args.find((a) => !a.startsWith("--"))
const LIMIT = (() => {
  const i = args.indexOf("--limit")
  if (i === -1) return null
  return parseInt(args[i + 1], 10) || null
})()
const DRY_RUN = args.includes("--dry-run")

if (!file) {
  console.error("Usage: apply-imports.mjs <file.json> [--limit N] [--dry-run]")
  process.exit(1)
}

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}
const supabase = createClient(url, key, { auth: { persistSession: false } })

const BATCH_SIZE = 200

const STAGE_ORDER = [
  "new", "contacted", "visit", "test", "application", "applicant",
  "enrolled", "puc_document_submission", "puc_application_submission",
  "withdraw", "lost",
]
function stageRank(s) {
  if (!s) return -1
  const i = STAGE_ORDER.indexOf(s)
  return i === -1 ? -1 : i
}

async function main() {
  const raw = await readFile(file, "utf8")
  const json = JSON.parse(raw)
  let leads = json.leads || []
  if (!Array.isArray(leads)) {
    console.error("Expected { leads: [...] }")
    process.exit(1)
  }
  if (LIMIT) leads = leads.slice(0, LIMIT)
  console.log(`Loaded ${leads.length} leads from ${file}`)

  // Pre-fetch existing leads by civil_id and phone (chunked to keep .in() small)
  const civilIds = [...new Set(leads.map((l) => l.civil_id).filter(Boolean))]
  const phones = [...new Set(leads.map((l) => l.phone).filter(Boolean))]
  const existing = new Map()

  async function loadExisting(field, values) {
    for (let i = 0; i < values.length; i += 500) {
      const batch = values.slice(i, i + 500)
      const { data, error } = await supabase
        .from("leads")
        .select("id, civil_id, phone, pipeline_stage, notes")
        .in(field, batch)
      if (error) throw new Error(`Lookup ${field} failed: ${error.message}`)
      for (const r of data) {
        if (r.civil_id) existing.set(`civil:${r.civil_id}`, r)
        if (r.phone) existing.set(`phone:${r.phone}`, r)
      }
    }
  }
  if (civilIds.length) await loadExisting("civil_id", civilIds)
  if (phones.length) await loadExisting("phone", phones)
  console.log(`Pre-loaded ${existing.size} existing-lead keys for dedupe`)

  const inserts = []
  const updates = []
  const errors = []

  for (let idx = 0; idx < leads.length; idx++) {
    const lead = leads[idx]
    if (!lead || typeof lead !== "object") {
      errors.push({ idx, reason: "Not an object" })
      continue
    }
    if (!lead.phone) {
      errors.push({ idx, reason: "Missing phone" })
      continue
    }

    const hit =
      (lead.civil_id && existing.get(`civil:${lead.civil_id}`)) ||
      (lead.phone && existing.get(`phone:${lead.phone}`)) ||
      null

    if (hit) {
      const incomingRank = stageRank(lead.pipeline_stage)
      const existingRank = stageRank(hit.pipeline_stage)
      const finalStage = incomingRank > existingRank ? lead.pipeline_stage : (hit.pipeline_stage ?? lead.pipeline_stage)
      const mergedNotes = [hit.notes, lead.notes].filter(Boolean).join(" || ").slice(0, 4000)
      const patch = {
        quality_tier: lead.quality_tier,
        final_weighted_score: lead.final_weighted_score,
        gpa_auto_score: lead.gpa_auto_score,
        placement_test_auto_score: lead.placement_test_auto_score,
        foundation_level: lead.foundation_level,
        gender_score: lead.gender_score,
        governorate_score: lead.governorate_score,
        quality_score_updated_at: lead.quality_score_updated_at ?? new Date().toISOString(),
        pipeline_stage: finalStage,
        notes: mergedNotes,
        civil_id: lead.civil_id ?? undefined,
        external_code: lead.external_code ?? undefined,
        placement_test_raw: lead.placement_test_raw ?? undefined,
        gpa_grade_12_expected: lead.gpa_grade_12_expected ?? undefined,
        academic_track: lead.academic_track ?? undefined,
        intended_major: lead.intended_major ?? undefined,
        school_id: lead.school_id ?? undefined,
        governorate: lead.governorate ?? undefined,
        assigned_to: lead.assigned_to ?? undefined,
      }
      // Strip undefined keys
      const cleanPatch = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined))
      updates.push({ id: hit.id, patch: cleanPatch })
    } else {
      inserts.push(lead)
    }
  }

  console.log(`Plan: ${inserts.length} insert, ${updates.length} update, ${errors.length} errors`)

  if (DRY_RUN) {
    console.log("Dry-run — no DB writes. Done.")
    return
  }

  let inserted = 0
  let updated = 0

  // Inserts in batches
  for (let i = 0; i < inserts.length; i += BATCH_SIZE) {
    const batch = inserts.slice(i, i + BATCH_SIZE)
    const { error, count } = await supabase
      .from("leads")
      .insert(batch, { count: "exact" })
    if (error) {
      console.error(`Insert batch [${i},${i + batch.length}) failed: ${error.message}`)
      errors.push({ idx: i, reason: error.message, batchSize: batch.length })
    } else {
      inserted += count ?? batch.length
      process.stdout.write(`  inserted ${inserted}/${inserts.length}\r`)
    }
  }
  console.log(`\nInserts done: ${inserted}`)

  // Updates one-by-one (lower volume; preserves merge logic)
  for (let i = 0; i < updates.length; i++) {
    const u = updates[i]
    const { error } = await supabase.from("leads").update(u.patch).eq("id", u.id)
    if (error) {
      console.error(`Update ${u.id} failed: ${error.message}`)
      errors.push({ id: u.id, reason: error.message })
    } else {
      updated++
    }
    if (i % 100 === 0) process.stdout.write(`  updated ${updated}/${updates.length}\r`)
  }
  console.log(`\nUpdates done: ${updated}`)

  console.log("\n=== RESULT ===")
  console.log(JSON.stringify({ inserted, updated, errors: errors.length }, null, 2))
  if (errors.length) {
    console.log("First 10 errors:")
    console.log(JSON.stringify(errors.slice(0, 10), null, 2))
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
