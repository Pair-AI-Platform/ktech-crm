import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createPaymentLink, validateCivilId } from '@/lib/myfatoorah/client'
import { FILE_APPLICATION_FEE_AMOUNT, FILE_TEST_FEE_AMOUNT } from '@/lib/config/constants'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { leadId, civilId, testFeeAmount } = body

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    if (!civilId) {
      return NextResponse.json({ error: 'Civil ID is required for online payment' }, { status: 400 })
    }

    if (!validateCivilId(civilId)) {
      return NextResponse.json(
        { error: 'Invalid civil ID format. Must be 12 digits starting with 2 or 3.' },
        { status: 400 }
      )
    }

    const testFee = typeof testFeeAmount === 'number' && testFeeAmount >= 0 ? testFeeAmount : FILE_TEST_FEE_AMOUNT
    const totalAmount = FILE_APPLICATION_FEE_AMOUNT + testFee

    // Verify lead exists
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, first_name, last_name, first_name_ar, last_name_ar, phone, email, file_fee_status')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    if (lead.file_fee_status === 'paid' || lead.file_fee_status === 'exempt') {
      return NextResponse.json({ error: 'File fees have already been handled for this lead' }, { status: 409 })
    }

    // Check for existing pending file fee payment (idempotency)
    const { data: existingPending } = await supabase
      .from('payment_transactions')
      .select('id')
      .eq('lead_id', leadId)
      .eq('payment_purpose', 'file_fee')
      .eq('status', 'pending')
      .maybeSingle()

    if (existingPending) {
      return NextResponse.json(
        { error: 'A pending file fee payment already exists for this lead' },
        { status: 409 }
      )
    }

    // Create MyFatoorah payment link
    const paymentResult = await createPaymentLink({
      customerName: `${lead.first_name_ar || ''} ${lead.last_name_ar || ''}`,
      customerEmail: lead.email || undefined,
      customerMobile: lead.phone,
      customerCivilId: civilId,
      invoiceValue: totalAmount,
      displayCurrencyIso: 'KWD',
      language: 'en',
      customerReference: `file-fee-${leadId}`,
    })

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: paymentResult.error || 'Failed to create payment link' },
        { status: 500 }
      )
    }

    // Create payment transaction record
    const { data: transaction, error: txError } = await supabase
      .from('payment_transactions')
      .insert({
        lead_id: leadId,
        amount: totalAmount,
        currency: 'KWD',
        payment_method: 'myfatoorah',
        payment_purpose: 'file_fee',
        status: 'pending',
        civil_id: civilId,
        myfatoorah_invoice_id: paymentResult.invoiceId,
        myfatoorah_invoice_url: paymentResult.invoiceUrl,
        notes: `Application fee: ${FILE_APPLICATION_FEE_AMOUNT} KWD, Test fee: ${testFee} KWD`,
        created_by: user.id,
      })
      .select()
      .single()

    if (txError) {
      console.error('[File Fee] Failed to create transaction:', txError)
      return NextResponse.json({ error: 'Failed to create payment transaction' }, { status: 500 })
    }

    // Update lead with fee details and status
    await supabase
      .from('leads')
      .update({
        file_fee_status: 'pending',
        file_application_fee: FILE_APPLICATION_FEE_AMOUNT,
        file_test_fee: testFee,
      })
      .eq('id', leadId)

    // Log activity
    await supabase.from('activities').insert({
      lead_id: leadId,
      activity_type: 'payment_link_created',
      title: 'File Fee Payment Link Created',
      description: `File fee payment link for ${totalAmount} KWD created (Application: ${FILE_APPLICATION_FEE_AMOUNT} KWD + Test: ${testFee} KWD)`,
      metadata: {
        transaction_id: transaction.id,
        invoice_id: paymentResult.invoiceId,
        payment_purpose: 'file_fee',
        application_fee: FILE_APPLICATION_FEE_AMOUNT,
        test_fee: testFee,
        total_amount: totalAmount,
      },
      created_by: user.id,
    })

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      invoiceId: paymentResult.invoiceId,
      invoiceUrl: paymentResult.invoiceUrl,
    })
  } catch (error: unknown) {
    console.error('[File Fee Create] Error:', error)
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 })
  }
}
