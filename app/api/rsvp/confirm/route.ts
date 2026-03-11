import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createLogger } from '@/lib/logger'

// Use service role for public RSVP confirmation (no user session)
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const logger = createLogger('rsvp-confirm')

  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Fetch the RSVP token
    const { data: rsvp, error: fetchError } = await supabase
      .from('rsvp_tokens')
      .select('id, lead_id, confirmed_at, expires_at')
      .eq('token', token)
      .single()

    if (fetchError || !rsvp) {
      logger.error('RSVP token not found', { token })
      return NextResponse.json({ error: 'Invalid RSVP link' }, { status: 404 })
    }

    // Check if already confirmed
    if (rsvp.confirmed_at) {
      return NextResponse.json({ message: 'Already confirmed', confirmed_at: rsvp.confirmed_at })
    }

    // Check expiry
    if (rsvp.expires_at && new Date(rsvp.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This RSVP link has expired' }, { status: 410 })
    }

    // Mark RSVP as confirmed
    const { error: updateRsvpError } = await supabase
      .from('rsvp_tokens')
      .update({ confirmed_at: new Date().toISOString() })
      .eq('id', rsvp.id)

    if (updateRsvpError) {
      logger.error('Failed to update RSVP token', { message: updateRsvpError.message })
      return NextResponse.json({ error: 'Failed to confirm' }, { status: 500 })
    }

    // Update the lead's orientation_status to 'confirmed'
    const { error: updateLeadError } = await supabase
      .from('leads')
      .update({ orientation_status: 'confirmed' })
      .eq('id', rsvp.lead_id)
      .eq('pipeline_stage', 'applicant')

    if (updateLeadError) {
      logger.error('Failed to update lead orientation status', { message: updateLeadError.message })
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }

    logger.info('RSVP confirmed', { lead_id: rsvp.lead_id })
    return NextResponse.json({ message: 'Confirmed successfully' })
  } catch (error) {
    logger.error('RSVP confirm error', { message: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
