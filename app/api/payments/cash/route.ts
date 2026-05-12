import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'
import { convertLeadToStudent, promoteSFLeadToApplicant, canEnrollLead } from '@/lib/enrollment/convert-lead'
import { ENROLLMENT_PAYMENT_AMOUNT, FULL_TUITION_AMOUNT } from '@/lib/config/constants'
import { requireLeadOwnership } from '@/lib/auth/lead-ownership'

export const POST = withApiHandler({ context: 'cash-payment' }, async ({ req, supabase, user, profile, logger }) => {
  const body = await req.json()
  const { leadId, invoiceNumber, notes, amount: rawAmount } = body as {
    leadId?: string
    invoiceNumber?: string
    notes?: string
    amount?: number | string
  }

  if (!leadId) {
    return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
  }

  if (!invoiceNumber || typeof invoiceNumber !== 'string' || invoiceNumber.trim() === '') {
    return NextResponse.json({ error: 'Invoice number is required for cash payments' }, { status: 400 })
  }

  const ownershipBlock = await requireLeadOwnership(supabase, { userId: user.id, role: profile?.role }, leadId)
  if (ownershipBlock) return ownershipBlock

  // Look up the lead first — we need funding_type and stage to decide the flow,
  // and the SF tuition flow needs to bypass the legacy canEnrollLead check
  // (which still expects pipeline_stage = 'application').
  const { data: lead, error: leadErr } = await supabase
    .from('leads')
    .select('funding_type, pipeline_stage')
    .eq('id', leadId)
    .single()

  if (leadErr || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  const isSF = lead.funding_type === 'self_funded'

  // Sum all prior completed payments for this lead so we can compute the
  // outstanding tuition balance and reject overpayment.
  const { data: priorPayments } = await supabase
    .from('payment_transactions')
    .select('amount')
    .eq('lead_id', leadId)
    .eq('status', 'completed')
  const paidSoFar = (priorPayments ?? []).reduce(
    (sum, row) => sum + Number(row.amount || 0),
    0,
  )
  const remaining = isSF ? Math.max(0, FULL_TUITION_AMOUNT - paidSoFar) : ENROLLMENT_PAYMENT_AMOUNT

  let paymentAmount: number
  if (isSF) {
    // SF: amount is client-driven (installment) but capped at the remaining
    // balance. If the client didn't send one, default to the full remaining.
    const parsed = typeof rawAmount === 'number' ? rawAmount : Number(rawAmount)
    const desired = Number.isFinite(parsed) && parsed > 0 ? parsed : remaining
    if (remaining <= 0) {
      return NextResponse.json(
        { error: 'Tuition already fully paid for this lead.' },
        { status: 400 },
      )
    }
    if (desired > remaining) {
      return NextResponse.json(
        { error: `Amount ${desired} KWD exceeds remaining balance of ${remaining} KWD.` },
        { status: 400 },
      )
    }
    paymentAmount = desired
  } else {
    // PUC / non-SF flow: amount is still server-derived. canEnrollLead also
    // gates this (must be in 'application' stage).
    const { canEnroll, reason } = await canEnrollLead(supabase, leadId)
    if (!canEnroll) {
      logger.warn('Lead cannot be enrolled', { leadId, reason })
      return NextResponse.json({ error: reason }, { status: 400 })
    }
    paymentAmount = ENROLLMENT_PAYMENT_AMOUNT
  }

  // Create payment transaction record
  logger.info('Creating cash payment transaction', { leadId, invoiceNumber, amount: paymentAmount })
  const { data: transaction, error: txError } = await supabase
    .from('payment_transactions')
    .insert({
      lead_id: leadId,
      amount: paymentAmount,
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

  // SF flow: decide between stay / promote-to-applicant / enroll based on the
  // cumulative paid total after this transaction.
  if (isSF) {
    const newTotal = paidSoFar + paymentAmount
    const stage = lead.pipeline_stage

    // Always log the payment as an activity for the agent's timeline.
    await supabase.from('activities').insert({
      lead_id: leadId,
      activity_type: 'payment_received',
      title: 'Cash Payment Received',
      description: `Cash payment of ${paymentAmount} KWD received. Invoice: ${invoiceNumber}. Total ${newTotal}/${FULL_TUITION_AMOUNT} KWD.`,
      metadata: {
        transaction_id: transaction.id,
        payment_method: 'cash',
        amount: paymentAmount,
        invoice_number: invoiceNumber,
        total_paid: newTotal,
        remaining: Math.max(0, FULL_TUITION_AMOUNT - newTotal),
      },
      created_by: user.id,
    })

    if (newTotal >= FULL_TUITION_AMOUNT) {
      // Full tuition reached → enroll the lead.
      const result = await convertLeadToStudent(supabase, {
        leadId,
        transactionId: transaction.id,
        amountPaid: newTotal,
        userId: user.id,
      })

      if (!result.success) {
        logger.error('SF enrollment failed after final cash payment', { leadId, error: result.error })
        return NextResponse.json({ error: result.error }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        transactionId: transaction.id,
        studentId: result.student?.id,
        totalPaid: newTotal,
        remaining: 0,
        enrolled: true,
        message: 'Cash payment processed — SF lead fully paid and enrolled',
      })
    }

    if (stage === 'application') {
      // First partial payment → promote File → Applicant (existing flow).
      const sfResult = await promoteSFLeadToApplicant(supabase, {
        leadId,
        transactionId: transaction.id,
        amountPaid: paymentAmount,
        userId: user.id,
      })

      if (!sfResult.success) {
        logger.error('SF promotion failed after cash payment', { leadId, error: sfResult.error })
        return NextResponse.json({ error: sfResult.error }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        transactionId: transaction.id,
        totalPaid: newTotal,
        remaining: FULL_TUITION_AMOUNT - newTotal,
        enrolled: false,
        message: `Cash payment processed — SF lead moved to Applicant (${newTotal}/${FULL_TUITION_AMOUNT} KWD paid)`,
      })
    }

    // Already Applicant, not yet fully paid → just record the installment.
    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      totalPaid: newTotal,
      remaining: FULL_TUITION_AMOUNT - newTotal,
      enrolled: false,
      message: `Cash installment recorded (${newTotal}/${FULL_TUITION_AMOUNT} KWD paid). ${FULL_TUITION_AMOUNT - newTotal} KWD remaining before enrollment.`,
    })
  }

  // Non-SF: convert lead to student (existing behavior)
  const result = await convertLeadToStudent(supabase, {
    leadId,
    transactionId: transaction.id,
    amountPaid: paymentAmount,
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
    description: `Cash payment of ${paymentAmount} KWD received. Invoice: ${invoiceNumber}`,
    metadata: {
      transaction_id: transaction.id,
      payment_method: 'cash',
      amount: paymentAmount,
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
