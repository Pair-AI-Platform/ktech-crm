import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

// Lazy-initialize service role client (no user context - webhook)
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role not configured')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function validateTwilioSignature(request: NextRequest, params: Record<string, string>): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!authToken) {
    console.error('[SMS Webhook] TWILIO_AUTH_TOKEN is not configured — rejecting request')
    return false
  }

  const signature = request.headers.get('x-twilio-signature')

  if (!signature) {
    console.error('[SMS Webhook] Missing x-twilio-signature header')
    return false
  }

  const webhookUrl = process.env.TWILIO_SMS_WEBHOOK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/sms/webhook`

  return twilio.validateRequest(authToken, signature, webhookUrl, params)
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Convert formData to plain object for Twilio validation
    const params: Record<string, string> = {}
    formData.forEach((value, key) => {
      params[key] = value.toString()
    })

    // Validate Twilio signature
    if (!validateTwilioSignature(request, params)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const messageSid = params['MessageSid']
    const messageStatus = params['MessageStatus']
    const errorCode = params['ErrorCode'] || null
    const errorMessage = params['ErrorMessage'] || null

    if (!messageSid) {
      return NextResponse.json({ error: 'Missing MessageSid' }, { status: 400 })
    }

    // Map Twilio status to our status
    let status: 'pending' | 'sent' | 'delivered' | 'failed' = 'sent'
    if (messageStatus === 'delivered') {
      status = 'delivered'
    } else if (['failed', 'undelivered'].includes(messageStatus)) {
      status = 'failed'
    } else if (['queued', 'sending', 'sent'].includes(messageStatus)) {
      status = 'sent'
    }

    // Update message status
    const updateData: Record<string, unknown> = {
      status,
    }

    if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString()
    }

    if (errorCode || errorMessage) {
      updateData.error_message = `${errorCode || ''}: ${errorMessage || ''}`
    }

    const supabase = getServiceClient()

    const { error } = await supabase
      .from('sms_messages')
      .update(updateData)
      .eq('provider_id', messageSid)

    if (error) {
      console.error('Error updating SMS status:', error)
      return new NextResponse('Database error', { status: 500 })
    }

    // Return 200 to acknowledge receipt
    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new NextResponse('Error', { status: 500 })
  }
}
