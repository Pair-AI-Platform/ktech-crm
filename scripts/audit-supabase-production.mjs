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

const requiredTables = [
  "profiles",
  "leads",
  "students",
  "appointments",
  "activities",
  "payment_transactions",
  "campaigns",
  "campaign_contacts",
  "webhook_events",
  "system_settings",
]

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

for (const table of requiredTables) {
  await record(`table:${table}`, async () => {
    const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true })
    if (error) throw new Error(error.message)
    return { count }
  })
}

await record("admin profiles exist", async () => {
  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
  if (error) throw new Error(error.message)
  if (!count || count < 1) throw new Error("no admin profile found")
  return { count }
})

await record("PUC payment transaction columns", async () => {
  const { error } = await supabase
    .from("payment_transactions")
    .select("id, lead_id, student_id, amount, status, payment_purpose, notes")
    .limit(1)
  if (error) throw new Error(error.message)
  return {}
})

await record("PUC student fee columns", async () => {
  const { error } = await supabase
    .from("students")
    .select("id, lead_id, puc_fee_paid")
    .limit(1)
  if (error) throw new Error(error.message)
  return {}
})

await record("campaign read path", async () => {
  const { count, error } = await supabase
    .from("campaigns")
    .select("id", { count: "exact", head: true })
    .eq("type", "whatsapp")
  if (error) throw new Error(error.message)
  return { whatsappCampaigns: count ?? 0 }
})

console.log(JSON.stringify({ ok: failures.length === 0, checks }, null, 2))

if (failures.length > 0) {
  console.error("\nDatabase audit failed:")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
