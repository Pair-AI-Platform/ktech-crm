import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'
import { sendSMS, replaceTemplateVariables } from '@/lib/sms/provider'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export const POST = withApiHandler({ context: 'sms-send' }, async ({ req, supabase, user, logger }) => {
  const rateLimitResult = await rateLimit(`sms:${user.id}`, RATE_LIMITS.sms)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.resetIn / 1000)) } }
    )
  }

  const body = await req.json()
  const { phone, message, leadId, studentId, templateId, variables } = body

  if (!phone || !message) {
    return NextResponse.json({ error: 'Phone and message are required' }, { status: 400 })
  }

  // Process message with template variables if provided
  let finalMessage = message
  if (variables && Object.keys(variables).length > 0) {
    finalMessage = replaceTemplateVariables(message, variables)
  }

  // Send SMS
  logger.info('Sending SMS', { phone, leadId, templateId })
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
    logger.error('Failed to store SMS record', { error: insertError.message })
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
        message_id: smsRecord?.id,
      },
      created_by: user.id,
    })
  }

  if (!result.success) {
    logger.warn('SMS send failed', { phone, error: result.error })
    return NextResponse.json({ error: result.error, record: smsRecord }, { status: 400 })
  }

  logger.info('SMS sent successfully', { phone, messageId: result.messageId })
  return NextResponse.json({
    success: true,
    messageId: result.messageId,
    record: smsRecord,
  })
})
