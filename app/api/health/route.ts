import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const startTime = Date.now()
  const checks: Record<string, { status: 'ok' | 'error'; latencyMs?: number; error?: string }> = {}

  // Check Supabase connectivity
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      checks.supabase = { status: 'error', error: 'Missing Supabase configuration' }
    } else {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const dbStart = Date.now()
      const { error } = await supabase.from('profiles').select('id').limit(1)
      const dbLatency = Date.now() - dbStart

      if (error) {
        checks.supabase = { status: 'error', latencyMs: dbLatency, error: error.message }
      } else {
        checks.supabase = { status: 'ok', latencyMs: dbLatency }
      }
    }
  } catch (err) {
    checks.supabase = {
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }

  // Check configured integrations
  const integrations = {
    myfatoorah: !!process.env.MYFATOORAH_API_KEY,
    twilio: !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN,
    moodle: !!process.env.MOODLE_API_TOKEN,
    openai: !!process.env.OPENAI_API_KEY,
    cronSecret: !!process.env.CRON_SECRET,
    webhookSecret: !!process.env.MYFATOORAH_WEBHOOK_SECRET,
  }

  const allHealthy = Object.values(checks).every(c => c.status === 'ok')

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      checks,
      integrations,
      totalLatencyMs: Date.now() - startTime,
    },
    { status: allHealthy ? 200 : 503 }
  )
}
