import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'
import { FILE_APPLICATION_FEE_AMOUNT, FILE_TEST_FEE_AMOUNT } from '@/lib/config/constants'
import { requireLeadOwnership } from '@/lib/auth/lead-ownership'

export const POST = withApiHandler({ context: 'file-fee-cash' }, async ({ req, supabase, user, profile, logger }) => {
  const body = await req.json()
  const { leadId, invoiceNumber, testFeeAmount, notes } = body

  if (!leadId) {
    return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
  }

  const ownershipBlock = await requireLeadOwnership(supabase, { userId: user.id, role: profile?.role }, leadId)
  if (ownershipBlock) return ownershipBlock

  if (!invoiceNumber || typeof invoiceNumber !== 'string' || invoiceNumber.trim() === '') {
    return NextResponse.json({ error: 'Invoice number is required for cash payments' }, { status: 400 })
  }

  const testFee = typeof testFeeAmount === 'number' && testFeeAmount >= 0 ? testFeeAmount : FILE_TEST_FEE_AMOUNT
  const totalAmount = FILE_APPLICATION_FEE_AMOUNT + testFee

  // Verify lead exists
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('id, first_name, last_name, pipeline_stage, file_fee_status')
    .eq('id', leadId)
    .single()

  if (leadError || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  if (lead.file_fee_status === 'paid' || lead.file_fee_status === 'exempt') {
    return NextResponse.json({ error: 'File fees have already been handled for this lead' }, { status: 409 })
  }

  // Create payment transaction record
  logger.info('Creating file fee cash payment', { leadId, invoiceNumber, totalAmount })
  const { data: transaction, error: txError } = await supabase
    .from('payment_transactions')
    .insert({
      lead_id: leadId,
      amount: totalAmount,
      currency: 'KWD',
      payment_method: 'cash',
      payment_purpose: 'file_fee',
      status: 'completed',
      cash_invoice_number: invoiceNumber.trim(),
      cash_received_by: user.id,
      notes: notes || `Application fee: ${FILE_APPLICATION_FEE_AMOUNT} KWD, Test fee: ${testFee} KWD`,
      created_by: user.id,
      processed_by: user.id,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (txError) {
    logger.error('Failed to create file fee transaction', { leadId, error: txError.message })
    return NextResponse.json({ error: 'Failed to create payment transaction' }, { status: 500 })
  }

  // Move lead to application (file) stage and update fee status
  const { error: updateError } = await supabase
    .from('leads')
    .update({
      pipeline_stage: 'application',
      status: null,
      last_contacted_at: new Date().toISOString(),
      file_fee_status: 'paid',
      file_application_fee: FILE_APPLICATION_FEE_AMOUNT,
      file_test_fee: testFee,
    })
    .eq('id', leadId)

  if (updateError) {
    logger.error('Failed to move lead to file stage', { leadId, error: updateError.message })
    return NextResponse.json({ error: 'Payment recorded but failed to move lead to File stage' }, { status: 500 })
  }

  // Log activity
  await supabase.from('activities').insert({
    lead_id: leadId,
    activity_type: 'payment_received',
    title: 'File Fee Payment Received',
    description: `File fee payment of ${totalAmount} KWD received (cash). Application: ${FILE_APPLICATION_FEE_AMOUNT} KWD, Test: ${testFee} KWD. Invoice: ${invoiceNumber}`,
    metadata: {
      transaction_id: transaction.id,
      payment_method: 'cash',
      payment_purpose: 'file_fee',
      application_fee: FILE_APPLICATION_FEE_AMOUNT,
      test_fee: testFee,
      total_amount: totalAmount,
      invoice_number: invoiceNumber,
    },
    created_by: user.id,
  })

  logger.info('File fee cash payment processed, lead moved to file stage', {
    leadId,
    transactionId: transaction.id,
  })

  return NextResponse.json({
    success: true,
    transactionId: transaction.id,
    message: 'File fee payment recorded — lead moved to File stage',
  })
})
