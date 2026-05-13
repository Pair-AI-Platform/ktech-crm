#!/usr/bin/env node

const allowPlaceholder = process.argv.includes("--allow-placeholder")

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CRON_SECRET",
  "NEXT_PUBLIC_APP_URL",
]

const optionalButRecommended = [
  "MYFATOORAH_API_KEY",
  "MYFATOORAH_WEBHOOK_SECRET",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "SENTRY_DSN",
]

const failures = []
const warnings = []

function isPlaceholder(value) {
  return /placeholder|your_|example|changeme/i.test(value)
}

for (const key of required) {
  const value = process.env[key]
  if (!value) {
    failures.push(`${key} is required`)
    continue
  }
  if (!allowPlaceholder && isPlaceholder(value)) {
    failures.push(`${key} still looks like a placeholder`)
  }
}

for (const key of optionalButRecommended) {
  const value = process.env[key]
  if (!value) warnings.push(`${key} is not set`)
  else if (!allowPlaceholder && isPlaceholder(value)) warnings.push(`${key} still looks like a placeholder`)
}

for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_APP_URL"]) {
  const value = process.env[key]
  if (!value) continue
  try {
    const url = new URL(value)
    if (url.protocol !== "https:" && key !== "NEXT_PUBLIC_APP_URL") {
      failures.push(`${key} must use https`)
    }
  } catch {
    failures.push(`${key} must be a valid URL`)
  }
}

if (warnings.length > 0) {
  console.warn("Environment warnings:")
  for (const warning of warnings) console.warn(`- ${warning}`)
}

if (failures.length > 0) {
  console.error("Environment check failed:")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("Environment contract OK")
