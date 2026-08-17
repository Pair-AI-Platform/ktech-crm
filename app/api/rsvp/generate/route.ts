import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'

export const runtime = 'edge'

export const POST = withApiHandler(
  { context: 'rsvp-generate' },
  async ({ req, supabase, logger }) => {
    const body = await req.json()
    const { lead_ids, event_title, event_date, event_location, expires_at } = body

    if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
      return NextResponse.json({ error: 'lead_ids is required' }, { status: 400 })
    }

    // Verify all leads are in the applicant stage
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, first_name, last_name, pipeline_stage')
      .in('id', lead_ids)

    if (leadsError) {
      logger.error('Failed to fetch leads', { message: leadsError.message })
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
    }

    const nonApplicants = leads?.filter(l => l.pipeline_stage !== 'applicant') || []
    if (nonApplicants.length > 0) {
      return NextResponse.json({
        error: 'All leads must be in the applicant stage',
        non_applicant_leads: nonApplicants.map(l => `${l.first_name} ${l.last_name}`),
      }, { status: 400 })
    }

    // Create RSVP tokens for each lead
    const tokens = lead_ids.map((lead_id: string) => ({
      lead_id,
      event_title: event_title || 'Orientation Day',
      event_date: event_date || null,
      event_location: event_location || null,
      expires_at: expires_at || null,
    }))

    const { data: rsvpTokens, error: insertError } = await supabase
      .from('rsvp_tokens')
      .insert(tokens)
      .select('id, token, lead_id')

    if (insertError) {
      logger.error('Failed to create RSVP tokens', { message: insertError.message })
      return NextResponse.json({ error: 'Failed to create RSVP tokens' }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin') || ''
    const results = rsvpTokens?.map(t => ({
      lead_id: t.lead_id,
      token: t.token,
      rsvp_url: `${baseUrl}/rsvp/${t.token}`,
    }))

    logger.info(`Generated ${results?.length} RSVP links`)
    return NextResponse.json({ rsvp_links: results })
  }
)
