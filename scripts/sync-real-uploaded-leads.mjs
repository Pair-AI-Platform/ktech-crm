#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"

const APPLY = process.argv.includes("--apply")
const PAGE_SIZE = 1000
const UPDATE_BATCH_SIZE = 50

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function readImportLeads() {
  const files = ["imports/applicants.json", "imports/visit-leads.json"]
  return files.flatMap((file) => {
    const payload = JSON.parse(readFileSync(file, "utf8"))
    return Array.isArray(payload.leads) ? payload.leads : []
  })
}

function chunk(array, size) {
  const chunks = []
  for (let i = 0; i < array.length; i += size) chunks.push(array.slice(i, i + size))
  return chunks
}

async function fetchAllLeads() {
  const rows = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const to = from + PAGE_SIZE - 1
    const { data, error } = await supabase
      .from("leads")
      .select("id, phone, civil_id, actual_lead, source, pipeline_stage")
      .order("created_at", { ascending: true })
      .range(from, to)

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    rows.push(...data)
    if (data.length < PAGE_SIZE) break
  }
  return rows
}

async function updateActualLead(ids, actualLead) {
  for (const idsChunk of chunk(ids, UPDATE_BATCH_SIZE)) {
    const { error } = await supabase
      .from("leads")
      .update({ actual_lead: actualLead })
      .in("id", idsChunk)

    if (error) throw new Error(error.message)
  }
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = String(row[key] ?? "(none)")
    acc[value] = (acc[value] ?? 0) + 1
    return acc
  }, {})
}

const importedLeads = readImportLeads()
const importedPhones = new Set(importedLeads.map((lead) => lead.phone).filter(Boolean))
const importedCivilIds = new Set(importedLeads.map((lead) => lead.civil_id).filter(Boolean))
const dbLeads = await fetchAllLeads()
const dbPhones = new Set(dbLeads.map((lead) => lead.phone).filter(Boolean))
const dbCivilIds = new Set(dbLeads.map((lead) => lead.civil_id).filter(Boolean))

const uploadedRows = []
const nonUploadedRows = []
for (const lead of dbLeads) {
  const matchesUpload =
    (lead.phone && importedPhones.has(lead.phone)) ||
    (lead.civil_id && importedCivilIds.has(lead.civil_id))

  if (matchesUpload) uploadedRows.push(lead)
  else nonUploadedRows.push(lead)
}

const promoteIds = uploadedRows
  .filter((lead) => lead.actual_lead !== true)
  .map((lead) => lead.id)
const hideIds = nonUploadedRows
  .filter((lead) => lead.actual_lead !== false)
  .map((lead) => lead.id)
const missingImportedRows = importedLeads.filter((lead) =>
  !(lead.phone && dbPhones.has(lead.phone)) &&
  !(lead.civil_id && dbCivilIds.has(lead.civil_id))
)

const summary = {
  mode: APPLY ? "apply" : "dry-run",
  importRows: importedLeads.length,
  importUniquePhones: importedPhones.size,
  importUniqueCivilIds: importedCivilIds.size,
  dbTotalLeads: dbLeads.length,
  uploadedRowsInDb: uploadedRows.length,
  missingUploadedRows: missingImportedRows.length,
  nonUploadedRowsInDb: nonUploadedRows.length,
  willMarkUploadedReal: promoteIds.length,
  willMarkNonUploadedHidden: hideIds.length,
  uploadedByStage: countBy(uploadedRows, "pipeline_stage"),
  nonUploadedBySource: countBy(nonUploadedRows, "source"),
}

console.log(JSON.stringify(summary, null, 2))

if (APPLY) {
  for (const rowsChunk of chunk(missingImportedRows, UPDATE_BATCH_SIZE)) {
    const rows = rowsChunk.map((row) => ({ ...row, actual_lead: true }))
    const { error } = await supabase.from("leads").insert(rows)
    if (error) throw new Error(error.message)
  }
  if (promoteIds.length > 0) await updateActualLead(promoteIds, true)
  if (hideIds.length > 0) await updateActualLead(hideIds, false)
  console.log("Applied uploaded-lead visibility sync.")
} else {
  console.log("Dry run only. Re-run with --apply to update Supabase.")
}
