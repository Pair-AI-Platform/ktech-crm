import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createPaymentLink, validateCivilId } from '@/lib/myfatoorah/client'
import { TEST_FEE_AMOUNT } from '@/lib/config/constants'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { leadId, civilId } = body

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

    // Verify lead exists and is PUC
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, first_name, last_name, first_name_ar, last_name_ar, phone, email, funding_type')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    if (lead.funding_type !== 'puc') {
      return NextResponse.json({ error: 'Test fee payment is only required for PUC leads' }, { status: 400 })
    }

    // Check for existing pending test fee payment (idempotency)
    const { data: existingPending } = await supabase
      .from('payment_transactions')
      .select('id')
      .eq('lead_id', leadId)
      .eq('payment_purpose', 'test_fee')
      .eq('status', 'pending')
      .maybeSingle()

    if (existingPending) {
      return NextResponse.json(
        { error: 'A pending test fee payment already exists for this lead' },
        { status: 409 }
      )
    }

    // Check for existing completed test fee payment
    const { data: existingCompleted } = await supabase
      .from('payment_transactions')
      .select('id')
      .eq('lead_id', leadId)
      .eq('payment_purpose', 'test_fee')
      .eq('status', 'completed')
      .maybeSingle()

    if (existingCompleted) {
      return NextResponse.json(
        { error: 'Test fee has already been paid for this lead' },
        { status: 409 }
      )
    }

    // Create MyFatoorah payment link
    const paymentResult = await createPaymentLink({
      customerName: `${lead.first_name_ar || ''} ${lead.last_name_ar || ''}`,
      customerEmail: lead.email || undefined,
      customerMobile: lead.phone,
      customerCivilId: civilId,
      invoiceValue: TEST_FEE_AMOUNT,
      displayCurrencyIso: 'KWD',
      language: 'en',
      customerReference: `test-fee-${leadId}`,
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
        amount: TEST_FEE_AMOUNT,
        currency: 'KWD',
        payment_method: 'myfatoorah',
        payment_purpose: 'test_fee',
        status: 'pending',
        civil_id: civilId,
        myfatoorah_invoice_id: paymentResult.invoiceId,
        myfatoorah_invoice_url: paymentResult.invoiceUrl,
        created_by: user.id,
      })
      .select()
      .single()

    if (txError) {
      console.error('[Test Fee] Failed to create transaction:', txError)
      return NextResponse.json({ error: 'Failed to create payment transaction' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activities').insert({
      lead_id: leadId,
      activity_type: 'payment_link_created',
      title: 'Test Fee Payment Link Created',
      description: `Test fee payment link for ${TEST_FEE_AMOUNT} KWD created via MyFatoorah`,
      metadata: {
        transaction_id: transaction.id,
        invoice_id: paymentResult.invoiceId,
        payment_purpose: 'test_fee',
        amount: TEST_FEE_AMOUNT,
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
    console.error('[Test Fee Create] Error:', error)
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 })
  }
}
