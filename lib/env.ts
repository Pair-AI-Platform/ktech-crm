/**
 * Environment variable validation
 *
 * Validates required environment variables at import time so missing vars
 * are caught early (at startup) rather than at runtime when a code path runs.
 *
 * Usage: import '@/lib/env' in the root layout or instrumentation file.
 */

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function optional(name: string, defaultValue?: string): string | undefined {
  return process.env[name] || defaultValue
}

// Core Supabase (always required)
export const env = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: required('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: required('SUPABASE_SERVICE_ROLE_KEY'),

  // App
  NEXT_PUBLIC_APP_URL: optional('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),

  // Twilio (optional — features degrade gracefully)
  TWILIO_ACCOUNT_SID: optional('TWILIO_ACCOUNT_SID'),
  TWILIO_AUTH_TOKEN: optional('TWILIO_AUTH_TOKEN'),
  TWILIO_PHONE_NUMBER: optional('TWILIO_PHONE_NUMBER'),

  // MyFatoorah (optional)
  MYFATOORAH_API_KEY: optional('MYFATOORAH_API_KEY'),
  MYFATOORAH_BASE_URL: optional('MYFATOORAH_BASE_URL', 'https://apitest.myfatoorah.com'),

  // Moodle (optional)
  MOODLE_BASE_URL: optional('MOODLE_BASE_URL'),
  MOODLE_API_TOKEN: optional('MOODLE_API_TOKEN'),

  // Webhooks (mandatory when their features are active)
  AVAYA_WEBHOOK_SECRET: optional('AVAYA_WEBHOOK_SECRET'),
  MYFATOORAH_WEBHOOK_SECRET: optional('MYFATOORAH_WEBHOOK_SECRET'),

  // CRON
  CRON_SECRET: optional('CRON_SECRET'),

  // OpenAI
  OPENAI_API_KEY: optional('OPENAI_API_KEY'),

  // Upstash Redis (rate limiting)
  UPSTASH_REDIS_REST_URL: optional('UPSTASH_REDIS_REST_URL'),
  UPSTASH_REDIS_REST_TOKEN: optional('UPSTASH_REDIS_REST_TOKEN'),
} as const

// In production, enforce critical security secrets
if (typeof window === 'undefined') {
  const isProduction = process.env.NODE_ENV === 'production'
  const warnings: string[] = []
  const errors: string[] = []

  if (!env.CRON_SECRET) {
    if (isProduction) {
      errors.push('CRON_SECRET must be set in production — scheduled jobs are unprotected')
    } else {
      warnings.push('CRON_SECRET not set — scheduled jobs will fail')
    }
  }
  if (!env.MYFATOORAH_WEBHOOK_SECRET) {
    if (isProduction) {
      errors.push('MYFATOORAH_WEBHOOK_SECRET must be set in production — payment webhooks are unprotected')
    } else {
      warnings.push('MYFATOORAH_WEBHOOK_SECRET not set — payment webhook signature validation disabled')
    }
  }
  if (!env.AVAYA_WEBHOOK_SECRET) {
    if (isProduction) {
      errors.push('AVAYA_WEBHOOK_SECRET must be set in production — Avaya webhooks are unprotected')
    } else {
      warnings.push('AVAYA_WEBHOOK_SECRET not set — Avaya webhooks will be rejected')
    }
  }
  if (!env.TWILIO_AUTH_TOKEN) {
    warnings.push('TWILIO_AUTH_TOKEN not set — SMS and webhook validation disabled')
  }
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    if (isProduction) {
      errors.push('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in production — rate limiting is disabled')
    } else {
      warnings.push('Upstash Redis not configured — rate limiting disabled (all requests allowed)')
    }
  }

  if (errors.length > 0) {
    throw new Error(`[env] Missing required production environment variables:\n${errors.map(e => `  - ${e}`).join('\n')}`)
  }

  if (warnings.length > 0) {
    console.warn('[env] Missing recommended environment variables:')
    warnings.forEach(w => console.warn(`  - ${w}`))
  }
}
