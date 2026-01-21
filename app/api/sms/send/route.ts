import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendSMS, replaceTemplateVariables } from '@/lib/sms/provider'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      phone,
      message,
      leadId,
      studentId,
      templateId,
      variables
    } = body

    if (!phone || !message) {
      return NextResponse.json(
        { error: 'Phone and message are required' },
        { status: 400 }
      )
    }

    // Process message with template variables if provided
    let finalMessage = message
    if (variables && Object.keys(variables).length > 0) {
      finalMessage = replaceTemplateVariables(message, variables)
    }

    // Send SMS
    const result = await sendSMS(phone, finalMessage)

    // Store in database
    const { data: smsRecord, error: insertError } = await supabase
      .from('sms_messages')
      .insert({
        lead_id: leadId || null,
        student_id: studentId || null,
        phone_number: phone,
        content: finalMessage,
        template_id: templateId || null,
        status: result.success ? 'sent' : 'failed',
        provider_id: result.messageId || null,
        error_message: result.error || null,
        sent_by: user.id,
        sent_at: result.success ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error storing SMS:', insertError)
    }

    // Log activity if lead or student
    if (leadId || studentId) {
      await supabase.from('activities').insert({
        lead_id: leadId || null,
        student_id: studentId || null,
        activity_type: 'sms_sent',
        title: 'SMS Sent',
        description: finalMessage.substring(0, 100) + (finalMessage.length > 100 ? '...' : ''),
        metadata: {
          phone,
          status: result.success ? 'sent' : 'failed',
          message_id: smsRecord?.id
        },
        created_by: user.id,
      })
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, record: smsRecord },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      record: smsRecord
    })
  } catch (error) {
    console.error('SMS send error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
