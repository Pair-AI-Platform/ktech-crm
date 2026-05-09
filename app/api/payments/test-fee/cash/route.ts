import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'
import { TEST_FEE_AMOUNT } from '@/lib/config/constants'
import { requireLeadOwnership } from '@/lib/auth/lead-ownership'

export const POST = withApiHandler({ context: 'test-fee-cash' }, async ({ req, supabase, user, profile, logger }) => {
  const body = await req.json()
  const { leadId, invoiceNumber, notes } = body

  if (!leadId) {
    return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
  }

  const ownershipBlock = await requireLeadOwnership(supabase, { userId: user.id, role: profile?.role }, leadId)
  if (ownershipBlock) return ownershipBlock

  if (!invoiceNumber || typeof invoiceNumber !== 'string' || invoiceNumber.trim() === '') {
    return NextResponse.json({ error: 'Invoice number is required for cash payments' }, { status: 400 })
  }

  // Verify lead exists and is PUC
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('id, funding_type, pipeline_stage')
    .eq('id', leadId)
    .single()

  if (leadError || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  if (lead.funding_type !== 'puc') {
    return NextResponse.json({ error: 'Test fee payment is only required for PUC leads' }, { status: 400 })
  }

  // Check for existing completed test fee payment (prevent duplicates)
  const { data: existingPayment } = await supabase
    .from('payment_transactions')
    .select('id')
    .eq('lead_id', leadId)
    .eq('payment_purpose', 'test_fee')
    .eq('status', 'completed')
    .maybeSingle()

  if (existingPayment) {
    return NextResponse.json({ error: 'Test fee has already been paid for this lead' }, { status: 409 })
  }

  // Create payment transaction record
  logger.info('Creating test fee cash payment', { leadId, invoiceNumber, amount: TEST_FEE_AMOUNT })
  const { data: transaction, error: txError } = await supabase
    .from('payment_transactions')
    .insert({
      lead_id: leadId,
      amount: TEST_FEE_AMOUNT,
      currency: 'KWD',
      payment_method: 'cash',
      payment_purpose: 'test_fee',
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
    logger.error('Failed to create test fee transaction', { leadId, error: txError.message })
    return NextResponse.json({ error: 'Failed to create payment transaction' }, { status: 500 })
  }

  // Move lead to test stage
  const { error: updateError } = await supabase
    .from('leads')
    .update({
      pipeline_stage: 'test',
      status: null,
      last_contacted_at: new Date().toISOString(),
    })
    .eq('id', leadId)

  if (updateError) {
    logger.error('Failed to move lead to test stage', { leadId, error: updateError.message })
    return NextResponse.json({ error: 'Payment recorded but failed to move lead to Test stage' }, { status: 500 })
  }

  // Log activity
  await supabase.from('activities').insert({
    lead_id: leadId,
    activity_type: 'payment_received',
    title: 'Test Fee Payment Received',
    description: `Test fee payment of ${TEST_FEE_AMOUNT} KWD received (cash). Invoice: ${invoiceNumber}`,
    metadata: {
      transaction_id: transaction.id,
      payment_method: 'cash',
      payment_purpose: 'test_fee',
      amount: TEST_FEE_AMOUNT,
      invoice_number: invoiceNumber,
    },
    created_by: user.id,
  })

  logger.info('Test fee cash payment processed, lead moved to test', {
    leadId,
    transactionId: transaction.id,
  })

  return NextResponse.json({
    success: true,
    transactionId: transaction.id,
    message: 'Test fee payment recorded — lead moved to Test stage',
  })
})
