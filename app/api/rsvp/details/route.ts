import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createLogger } from '@/lib/logger'


// Use service role for public access (no user session)
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  const logger = createLogger('rsvp-details')
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  try {
    const supabase = createServiceClient()

    const { data: rsvp, error } = await supabase
      .from('rsvp_tokens')
      .select('id, event_title, event_date, event_location, confirmed_at, expires_at, lead_id')
      .eq('token', token)
      .single()

    if (error || !rsvp) {
      return NextResponse.json({ error: 'Invalid RSVP link' }, { status: 404 })
    }

    // Check expiry
    if (rsvp.expires_at && new Date(rsvp.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This RSVP link has expired' }, { status: 410 })
    }

    // Fetch lead name
    const { data: lead } = await supabase
      .from('leads')
      .select('first_name, last_name, first_name_ar, last_name_ar')
      .eq('id', rsvp.lead_id)
      .single()

    return NextResponse.json({
      event_title: rsvp.event_title,
      event_date: rsvp.event_date,
      event_location: rsvp.event_location,
      lead_name: lead ? `${lead.first_name_ar || ""} ${lead.last_name_ar || ""}` : '',
      already_confirmed: !!rsvp.confirmed_at,
    })
  } catch (err) {
    logger.error('Failed to fetch RSVP details', { message: String(err) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
