import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  let status: 'ok' | 'error' = 'ok'

  // Internal DB connectivity check (result not exposed to client)
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { error } = await supabase.from('profiles').select('id').limit(1)
      if (error) {
        status = 'error'
      }
    } else {
      status = 'error'
    }
  } catch {
    status = 'error'
  }

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
    },
    { status: status === 'ok' ? 200 : 503 }
  )
}
