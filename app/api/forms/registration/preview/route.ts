import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'
import { createServiceRoleClient } from '@/lib/supabase/server'

const BUCKET = 'registration-forms'
const ALLOWED = new Set(['Application.pdf', 'Preferences.pdf'])

export const GET = withApiHandler(
  { context: 'registration-forms-preview' },
  async ({ req, logger }) => {
    const { searchParams } = new URL(req.url)
    const name = searchParams.get('name') || ''
    if (!ALLOWED.has(name)) {
      return NextResponse.json({ error: 'Unknown form' }, { status: 400 })
    }

    const service = createServiceRoleClient()
    const { data, error } = await service.storage
      .from(BUCKET)
      .createSignedUrl(name, 300) // 5-minute preview link

    if (error || !data?.signedUrl) {
      logger.error('Failed to sign registration form URL', {
        name,
        error: error?.message,
      })
      return NextResponse.json({ error: 'Form unavailable' }, { status: 500 })
    }

    return NextResponse.json({ url: data.signedUrl })
  }
)
