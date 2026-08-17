import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

export const dynamic = 'force-dynamic'

const CHECK_TIMEOUT_MS = 3000

type CheckStatus = 'ok' | 'error' | 'skipped'
type Check = { name: string; status: CheckStatus; latency_ms?: number; note?: string }

function withTimeout<T>(p: Promise<T>, ms = CHECK_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms),
    ),
  ])
}

async function timed<T>(fn: () => Promise<T>): Promise<{ value?: T; ms: number; err?: unknown }> {
  const start = Date.now()
  try {
    const value = await fn()
    return { value, ms: Date.now() - start }
  } catch (err) {
    return { ms: Date.now() - start, err }
  }
}

async function checkDb(): Promise<Check> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    return { name: 'db', status: 'error', note: 'Supabase env not configured' }
  }
  const { ms, err } = await timed(async () => {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const result = await withTimeout(
      Promise.resolve(supabase.from('profiles').select('id').limit(1)),
    )
    if (result.error) throw result.error
    return result
  })
  return err
    ? { name: 'db', status: 'error', latency_ms: ms }
    : { name: 'db', status: 'ok', latency_ms: ms }
}

async function checkUpstash(): Promise<Check> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    return { name: 'upstash', status: 'skipped', note: 'not configured' }
  }
  const { ms, err } = await timed(async () =>
    withTimeout(
      fetch(`${url}/ping`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r
      }),
    ),
  )
  return err
    ? { name: 'upstash', status: 'error', latency_ms: ms }
    : { name: 'upstash', status: 'ok', latency_ms: ms }
}

function checkEnv(name: string, envVar: string): Check {
  const present = Boolean(process.env[envVar])
  return present
    ? { name, status: 'ok', note: 'env present' }
    : { name, status: 'skipped', note: 'not configured' }
}

export async function GET(req: Request) {
  const wantsVerbose =
    new URL(req.url).searchParams.get('verbose') === '1' &&
    req.headers.get('x-health-token') === process.env.HEALTH_TOKEN &&
    Boolean(process.env.HEALTH_TOKEN)

  const [db, upstash] = await Promise.all([checkDb(), checkUpstash()])

  // Presence-only checks for outbound integrations: a real ping would
  // either cost money (Twilio, OpenAI) or risk hitting a webhook endpoint
  // (MyFatoorah), so health verifies configuration, not reachability.
  const myfatoorah = checkEnv('myfatoorah', 'MYFATOORAH_API_KEY')
  const twilio = checkEnv('twilio', 'TWILIO_AUTH_TOKEN')
  const openai = checkEnv('openai', 'OPENAI_API_KEY')
  const anthropic = checkEnv('anthropic', 'ANTHROPIC_API_KEY')
  const sentry = checkEnv('sentry', 'SENTRY_DSN')

  const checks: Check[] = [db, upstash, myfatoorah, twilio, openai, anthropic, sentry]

  // Overall: error if any required check (db) errored. Optional services
  // that are skipped do not flip the overall status.
  const overall: 'ok' | 'error' = db.status === 'error' ? 'error' : 'ok'

  const minimal = {
    status: overall,
    timestamp: new Date().toISOString(),
  }

  if (!wantsVerbose) {
    return NextResponse.json(minimal, { status: overall === 'ok' ? 200 : 503 })
  }

  return NextResponse.json(
    {
      ...minimal,
      checks,
      runtime: {
        env: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
        region: process.env.VERCEL_REGION,
      },
    },
    { status: overall === 'ok' ? 200 : 503 },
  )
}
