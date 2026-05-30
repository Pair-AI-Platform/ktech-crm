#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const checks = []
const failures = []

async function record(name, fn) {
  try {
    const result = await fn()
    checks.push({ name, ok: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    checks.push({ name, ok: false, error: message })
    failures.push(`${name}: ${message}`)
  }
}

async function count(table, build = (query) => query) {
  const query = build(supabase.from(table).select("id", { count: "exact", head: true }))
  const { count, error } = await query
  if (error) throw new Error(error.message)
  return count ?? 0
}

async function fetchAll(table, columns, build = (query) => query, pageSize = 1000) {
  const rows = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build(supabase.from(table).select(columns)).range(from, from + pageSize - 1)
    if (error) throw new Error(error.message)
    rows.push(...(data ?? []))
    if (!data || data.length < pageSize) break
  }
  return rows
}

await record("lead actual_lead split", async () => {
  const total = await count("leads")
  const actual = await count("leads", (q) => q.eq("actual_lead", true))
  const nonActual = await count("leads", (q) => q.eq("actual_lead", false))
  const unknown = await count("leads", (q) => q.is("actual_lead", null))

  if (nonActual > 0 || unknown > 0) {
    throw new Error(`expected only actual leads, found ${nonActual} non-actual and ${unknown} unknown`)
  }

  return { total, actual, nonActual, unknown }
})

await record("default leads page scope", async () => ({
  rows: await count("leads", (q) => q.eq("actual_lead", true).neq("pipeline_stage", "lost")),
}))

await record("non-actual assigned workload noise", async () => {
  const rows = await count("leads", (q) => q.eq("actual_lead", false).not("assigned_to", "is", null))
  if (rows > 0) {
    throw new Error(`${rows} non-actual leads still have agent assignments`)
  }
  return { rows }
})

await record("actual stage counts", async () => {
  const stages = [
    "new",
    "contacted",
    "visit",
    "test",
    "application",
    "puc_document_submission",
    "puc_application_submission",
    "applicant",
    "enrolled",
    "lost",
    "withdraw",
  ]

  const byStage = {}
  for (const stage of stages) {
    byStage[stage] = await count("leads", (q) => q.eq("actual_lead", true).eq("pipeline_stage", stage))
  }
  return { byStage }
})

await record("calendar linked leads are actual", async () => {
  const appointments = await fetchAll("appointments", "id, lead_id")
  const appointmentLinks = await fetchAll("appointment_leads", "appointment_id, lead_id")
  const linkedLeadIds = [
    ...new Set([
      ...appointments.map((row) => row.lead_id).filter(Boolean),
      ...appointmentLinks.map((row) => row.lead_id).filter(Boolean),
    ]),
  ]
  const leadActualById = new Map()

  for (let i = 0; i < linkedLeadIds.length; i += 1000) {
    const ids = linkedLeadIds.slice(i, i + 1000)
    if (ids.length === 0) continue
    const { data, error } = await supabase
      .from("leads")
      .select("id, actual_lead")
      .in("id", ids)

    if (error) throw new Error(error.message)
    for (const lead of data ?? []) {
      leadActualById.set(lead.id, lead.actual_lead)
    }
  }

  const nonActualAppointmentLinks = appointmentLinks.filter((row) => leadActualById.get(row.lead_id) === false)
  const nonActualLegacyAppointments = appointments.filter(
    (row) => row.lead_id && leadActualById.get(row.lead_id) === false
  )

  if (nonActualAppointmentLinks.length > 0 || nonActualLegacyAppointments.length > 0) {
    throw new Error(
      `calendar has ${nonActualAppointmentLinks.length} junction links and ${nonActualLegacyAppointments.length} legacy links to non-actual leads`
    )
  }

  return {
    appointments: appointments.length,
    appointmentLinks: appointmentLinks.length,
    linkedLeadIds: linkedLeadIds.length,
  }
})

await record("placeholder profiles", async () => {
  const placeholderNames = new Set(["admin", "agent", "demo", "khalifa", "test"])
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, role, is_active")

  if (error) throw new Error(error.message)

  const summary = {}
  let activeDemoProfiles = 0
  for (const profile of data ?? []) {
    const firstWord = String(profile.full_name ?? "")
      .trim()
      .split(/\s+/)[0]
      ?.toLowerCase()

    if (!placeholderNames.has(firstWord)) continue
    const key = `${firstWord}:${profile.role ?? "unknown"}:${profile.is_active === false ? "inactive" : "active"}`
    summary[key] = (summary[key] ?? 0) + 1
    if (firstWord === "demo" && profile.is_active !== false) {
      activeDemoProfiles += 1
    }
  }

  if (activeDemoProfiles > 0) {
    throw new Error(`${activeDemoProfiles} demo profiles are still active`)
  }

  return { summary, activeDemoProfiles }
})

console.log(JSON.stringify({ ok: failures.length === 0, checks }, null, 2))

if (failures.length > 0) {
  console.error("\nDashboard data-quality audit failed:")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
