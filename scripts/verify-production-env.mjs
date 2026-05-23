const requiredProductionVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CRON_SECRET",
  "MYFATOORAH_WEBHOOK_SECRET",
  "AI_TRANSFER_WEBHOOK_SECRET",
  "TWILIO_AUTH_TOKEN",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "NEXT_PUBLIC_SENTRY_DSN",
]

const warnings = []
const errors = []

for (const key of requiredProductionVars) {
  if (!process.env[key]) errors.push(`${key} is not set`)
}

if (process.env.DEMO_MODE_ENABLED === "true") {
  errors.push("DEMO_MODE_ENABLED must not be true for production releases")
}

if (process.env.ENABLE_MIGRATION_API === "true") {
  errors.push("ENABLE_MIGRATION_API must not be true for production releases")
}

if (!process.env.SENTRY_ORG || !process.env.SENTRY_PROJECT) {
  warnings.push("SENTRY_ORG/SENTRY_PROJECT are not both set; source-map upload may be disabled")
}

if (warnings.length > 0) {
  console.warn("[verify-production-env] warnings:")
  for (const warning of warnings) console.warn(`  - ${warning}`)
}

if (errors.length > 0) {
  console.error("[verify-production-env] production release checks failed:")
  for (const error of errors) console.error(`  - ${error}`)
  console.error("\nTip: run `vercel env pull .env.production.local --environment=production` before this check.")
  process.exit(1)
}

console.log("[verify-production-env] production environment checks passed")
