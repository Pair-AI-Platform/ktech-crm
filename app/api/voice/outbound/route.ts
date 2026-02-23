import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createLogger } from '@/lib/logger'

const VoiceResponse = twilio.twiml.VoiceResponse

// This endpoint is called by Twilio when an agent initiates an outbound call
export async function POST(request: NextRequest) {
  const logger = createLogger('voice-outbound')

  try {
    const supabase = await createServerSupabaseClient()
    const formData = await request.formData()

    const to = formData.get('To') as string
    const from = formData.get('From') as string
    const callSid = formData.get('CallSid') as string
    const leadId = formData.get('LeadId') as string
    const agentId = formData.get('AgentId') as string

    logger.info('Outbound call initiated', { to, agentId, callSid })

    // Validate phone number
    if (!to || !to.startsWith('+')) {
      const twiml = new VoiceResponse()
      twiml.say({ voice: 'Polly.Joanna' }, 'Invalid phone number.')
      twiml.hangup()
      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' },
      })
    }

    // Create call record in database
    const { error: insertError } = await supabase
      .from('calls')
      .insert({
        twilio_call_sid: callSid,
        direction: 'outbound',
        from_number: process.env.TWILIO_PHONE_NUMBER || from,
        to_number: to,
        status: 'initiated',
        handler: 'human',
        lead_id: leadId || null,
        agent_id: agentId || null,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      logger.error('Failed to create call record', { callSid, error: insertError.message })
    }

    // Build TwiML to dial the recipient
    const twiml = new VoiceResponse()

    const dial = twiml.dial({
      callerId: process.env.TWILIO_PHONE_NUMBER || from,
      timeout: 30,
      record: 'record-from-answer-dual',
      recordingStatusCallback: '/api/voice/recording',
      recordingStatusCallbackMethod: 'POST',
      action: '/api/voice/status',
      method: 'POST',
    })

    dial.number(to)

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    })
  } catch (error) {
    logger.error('Outbound call failed', {
      error: error instanceof Error ? error.message : String(error),
    })

    const twiml = new VoiceResponse()
    twiml.say(
      { voice: 'Polly.Joanna' },
      'Sorry, we couldn\'t complete your call. Please try again.'
    )
    twiml.hangup()

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
