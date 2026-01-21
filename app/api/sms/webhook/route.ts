import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role for webhook (no user context)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const messageSid = formData.get('MessageSid') as string
    const messageStatus = formData.get('MessageStatus') as string
    const errorCode = formData.get('ErrorCode') as string | null
    const errorMessage = formData.get('ErrorMessage') as string | null

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

    const { error } = await supabase
      .from('sms_messages')
      .update(updateData)
      .eq('provider_id', messageSid)

    if (error) {
      console.error('Error updating SMS status:', error)
    }

    // Return 200 to acknowledge receipt
    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new NextResponse('Error', { status: 500 })
  }
}
