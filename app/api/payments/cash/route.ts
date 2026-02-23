import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'
import { convertLeadToStudent, promoteSFLeadToApplicant, canEnrollLead } from '@/lib/enrollment/convert-lead'
import { ENROLLMENT_PAYMENT_AMOUNT } from '@/types'

export const POST = withApiHandler({ context: 'cash-payment' }, async ({ req, supabase, user, logger }) => {
  const body = await req.json()
  const { leadId, invoiceNumber, notes } = body

  if (!leadId) {
    return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
  }

  if (!invoiceNumber || typeof invoiceNumber !== 'string' || invoiceNumber.trim() === '') {
    return NextResponse.json({ error: 'Invoice number is required for cash payments' }, { status: 400 })
  }

  // Check if lead can be enrolled
  const { canEnroll, reason } = await canEnrollLead(supabase, leadId)
  if (!canEnroll) {
    logger.warn('Lead cannot be enrolled', { leadId, reason })
    return NextResponse.json({ error: reason }, { status: 400 })
  }

  // Create payment transaction record
  logger.info('Creating cash payment transaction', { leadId, invoiceNumber })
  const { data: transaction, error: txError } = await supabase
    .from('payment_transactions')
    .insert({
      lead_id: leadId,
      amount: ENROLLMENT_PAYMENT_AMOUNT,
      currency: 'KWD',
      payment_method: 'cash',
      status: 'completed',
      cash_invoice_number: invoiceNumber.trim(),
      cash_received_by: user.id,
      notes: notes || null,
      created_by: user.id,
      processed_by: user.id,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (txError) {
    logger.error('Failed to create transaction', { leadId, error: txError.message })
    return NextResponse.json({ error: 'Failed to create payment transaction' }, { status: 500 })
  }

  // Check if lead is SF (self-funded) and in 'application' stage
  const { data: lead } = await supabase
    .from('leads')
    .select('funding_type, pipeline_stage')
    .eq('id', leadId)
    .single()

  const isSFInApplication =
    lead?.funding_type === 'self_funded' &&
    lead?.pipeline_stage === 'application'

  if (isSFInApplication) {
    // SF lead: promote to 'applicant' instead of enrolling
    const sfResult = await promoteSFLeadToApplicant(supabase, {
      leadId,
      transactionId: transaction.id,
      amountPaid: ENROLLMENT_PAYMENT_AMOUNT,
      userId: user.id,
    })

    if (!sfResult.success) {
      await supabase
        .from('payment_transactions')
        .update({ status: 'failed', notes: sfResult.error })
        .eq('id', transaction.id)

      logger.error('SF promotion failed after cash payment', { leadId, error: sfResult.error })
      return NextResponse.json({ error: sfResult.error }, { status: 500 })
    }

    logger.info('SF lead promoted to applicant via cash payment', { leadId, transactionId: transaction.id })
    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      message: 'Cash payment processed — SF lead moved to Applicant',
    })
  }

  // Non-SF: convert lead to student (existing behavior)
  const result = await convertLeadToStudent(supabase, {
    leadId,
    transactionId: transaction.id,
    amountPaid: ENROLLMENT_PAYMENT_AMOUNT,
    userId: user.id,
  })

  if (!result.success) {
    await supabase
      .from('payment_transactions')
      .update({ status: 'failed', notes: result.error })
      .eq('id', transaction.id)

    logger.error('Enrollment failed after cash payment', { leadId, error: result.error })
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  // Log activity for cash payment
  await supabase.from('activities').insert({
    lead_id: leadId,
    student_id: result.student?.id,
    activity_type: 'payment_received',
    title: 'Cash Payment Received',
    description: `Cash payment of ${ENROLLMENT_PAYMENT_AMOUNT} KWD received. Invoice: ${invoiceNumber}`,
    metadata: {
      transaction_id: transaction.id,
      payment_method: 'cash',
      amount: ENROLLMENT_PAYMENT_AMOUNT,
      invoice_number: invoiceNumber,
    },
    created_by: user.id,
  })

  logger.info('Cash payment processed and student enrolled', {
    leadId,
    transactionId: transaction.id,
    studentId: result.student?.id,
  })

  return NextResponse.json({
    success: true,
    transactionId: transaction.id,
    studentId: result.student?.id,
    message: 'Cash payment processed and student enrolled successfully',
  })
})

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'cash-payments' })
}
