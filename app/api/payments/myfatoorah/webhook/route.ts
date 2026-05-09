import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { convertLeadToStudent, promoteSFLeadToApplicant } from '@/lib/enrollment/convert-lead'
import { getPaymentStatus, verifyWebhookSignature } from '@/lib/myfatoorah/client'
import { ENROLLMENT_PAYMENT_AMOUNT } from '@/types'
import { TEST_FEE_AMOUNT } from '@/lib/config/constants'
import { createLogger } from '@/lib/logger'
import { recordWebhookEvent, markWebhookProcessed, markWebhookFailed, hashPayload } from '@/lib/webhook-events'

// Use service role for webhook (no user session)
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const logger = createLogger('myfatoorah-webhook')

  try {
    const rawBody = await request.text()

    // Verify webhook signature
    const signature = request.headers.get('x-myfatoorah-signature')
    const webhookSecret = process.env.MYFATOORAH_WEBHOOK_SECRET

    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      logger.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
    }

    const body = JSON.parse(rawBody)
    const invoiceId = body.InvoiceId || body.Data?.InvoiceId

    if (!invoiceId) {
      logger.error('No InvoiceId in payload')
      return NextResponse.json({ error: 'Missing InvoiceId' }, { status: 400 })
    }

    logger.info('Webhook received', { invoiceId })
    const supabase = createServiceClient()

    // Idempotency / replay protection: record this delivery before doing any work.
    const eventId = `enroll:${invoiceId}`
    const dedup = await recordWebhookEvent(supabase, 'myfatoorah', eventId, hashPayload(rawBody), null)
    if (!dedup.ok) {
      logger.info('Webhook deduplicated', { reason: dedup.reason, eventId })
      return NextResponse.json({ success: true, message: `Webhook ${dedup.reason}` })
    }

    let response: NextResponse
    try {
      response = await processEnrollmentInvoice(supabase, body, invoiceId, logger)
      await markWebhookProcessed(supabase, 'myfatoorah', eventId)
    } catch (procErr) {
      await markWebhookFailed(supabase, 'myfatoorah', eventId, procErr instanceof Error ? procErr.message : String(procErr))
      throw procErr
    }
    return response
  } catch (error: unknown) {
    logger.error('Webhook processing failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

type WebhookLogger = ReturnType<typeof createLogger>

async function processEnrollmentInvoice(
  supabase: ReturnType<typeof createServiceClient>,
  body: { InvoiceId?: number | string; Data?: { InvoiceId?: number | string } },
  invoiceId: number | string,
  logger: WebhookLogger,
): Promise<NextResponse> {
    // Find the payment transaction by invoice ID with row lock to prevent race conditions
    // Using RPC to get SELECT ... FOR UPDATE (Supabase JS doesn't support FOR UPDATE)
    const { data: transactions, error: txError } = await supabase
      .from('payment_transactions')
      .select('*, lead:leads(id, first_name, last_name)')
      .eq('myfatoorah_invoice_id', invoiceId.toString())
      .limit(1)

    const transaction = transactions?.[0]

    if (txError || !transaction) {
      logger.error('Transaction not found', { invoiceId })
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Idempotency check: if already completed, return early
    if (transaction.status === 'completed') {
      logger.info('Transaction already completed (idempotent)', { transactionId: transaction.id })
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    // Idempotency: mark as 'processing' to prevent concurrent handling
    const { error: lockError } = await supabase
      .from('payment_transactions')
      .update({ status: 'processing' })
      .eq('id', transaction.id)
      .eq('status', transaction.status) // Optimistic lock: only update if status hasn't changed
      .select('id')
      .single()

    if (lockError) {
      // Another webhook call is already processing this transaction
      logger.info('Transaction already being processed by another request', { transactionId: transaction.id })
      return NextResponse.json({ success: true, message: 'Already being processed' })
    }

    // Get payment status from MyFatoorah API
    const statusResult = await getPaymentStatus(invoiceId.toString())

    if (!statusResult.success) {
      logger.error('Failed to get payment status', { invoiceId, error: statusResult.error })
      return NextResponse.json({ error: statusResult.error }, { status: 500 })
    }

    // Update transaction with webhook data
    await supabase
      .from('payment_transactions')
      .update({
        webhook_payload: body,
        webhook_received_at: new Date().toISOString(),
        myfatoorah_payment_id: statusResult.paymentId,
      })
      .eq('id', transaction.id)

    // Handle based on payment status
    if (statusResult.invoiceStatus === 'Paid') {
      // Handle test fee payments — move lead to test stage
      if (transaction.payment_purpose === 'test_fee') {
        const { error: updateError } = await supabase
          .from('leads')
          .update({
            pipeline_stage: 'test',
            status: null,
            last_contacted_at: new Date().toISOString(),
          })
          .eq('id', transaction.lead_id)

        await supabase
          .from('payment_transactions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', transaction.id)

        await supabase.from('activities').insert({
          lead_id: transaction.lead_id,
          activity_type: 'payment_received',
          title: 'Test Fee Payment Received',
          description: `Test fee payment of ${TEST_FEE_AMOUNT} KWD received via MyFatoorah`,
          metadata: {
            transaction_id: transaction.id,
            payment_method: 'myfatoorah',
            payment_purpose: 'test_fee',
            amount: TEST_FEE_AMOUNT,
            invoice_id: invoiceId,
            payment_id: statusResult.paymentId,
          },
        })

        if (updateError) {
          logger.error('Test fee paid but failed to move lead to test stage', {
            leadId: transaction.lead_id,
            error: updateError.message,
          })
          return NextResponse.json({
            success: true,
            message: 'Test fee payment recorded but stage update failed — flagged for review',
          })
        }

        logger.info('Test fee paid, lead moved to test stage', { leadId: transaction.lead_id })
        return NextResponse.json({
          success: true,
          message: 'Test fee payment processed — lead moved to Test stage',
        })
      }

      // Handle file fee payments — move lead to application (file) stage
      if (transaction.payment_purpose === 'file_fee') {
        const { error: updateError } = await supabase
          .from('leads')
          .update({
            pipeline_stage: 'application',
            status: null,
            last_contacted_at: new Date().toISOString(),
            file_fee_status: 'paid',
          })
          .eq('id', transaction.lead_id)

        await supabase
          .from('payment_transactions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', transaction.id)

        await supabase.from('activities').insert({
          lead_id: transaction.lead_id,
          activity_type: 'payment_received',
          title: 'File Fee Payment Received',
          description: `File fee payment of ${transaction.amount} KWD received via MyFatoorah`,
          metadata: {
            transaction_id: transaction.id,
            payment_method: 'myfatoorah',
            payment_purpose: 'file_fee',
            amount: transaction.amount,
            invoice_id: invoiceId,
            payment_id: statusResult.paymentId,
          },
        })

        if (updateError) {
          logger.error('File fee paid but failed to move lead to file stage', {
            leadId: transaction.lead_id,
            error: updateError.message,
          })
          return NextResponse.json({
            success: true,
            message: 'File fee payment recorded but stage update failed — flagged for review',
          })
        }

        logger.info('File fee paid, lead moved to file stage', { leadId: transaction.lead_id })
        return NextResponse.json({
          success: true,
          message: 'File fee payment processed — lead moved to File stage',
        })
      }

      const { data: lead } = await supabase
        .from('leads')
        .select('funding_type, pipeline_stage')
        .eq('id', transaction.lead_id)
        .single()

      const isSFInApplication =
        lead?.funding_type === 'self_funded' &&
        lead?.pipeline_stage === 'application'

      if (isSFInApplication) {
        const sfResult = await promoteSFLeadToApplicant(supabase, {
          leadId: transaction.lead_id,
          transactionId: transaction.id,
          amountPaid: ENROLLMENT_PAYMENT_AMOUNT,
        })

        if (!sfResult.success) {
          logger.error('CRITICAL: SF promotion failed after payment', {
            leadId: transaction.lead_id,
            error: sfResult.error,
          })

          await supabase
            .from('payment_transactions')
            .update({
              status: 'completed',
              notes: `SF_PROMOTION_FAILED: Payment successful but SF promotion failed: ${sfResult.error}`,
              completed_at: new Date().toISOString(),
            })
            .eq('id', transaction.id)

          await supabase.from('activities').insert({
            lead_id: transaction.lead_id,
            activity_type: 'enrollment_failed',
            title: 'SF Promotion Failed After Payment',
            description: `CRITICAL: Payment of ${ENROLLMENT_PAYMENT_AMOUNT} KWD succeeded but SF lead promotion failed: ${sfResult.error}. Manual intervention required.`,
            metadata: {
              transaction_id: transaction.id,
              payment_method: 'myfatoorah',
              amount: ENROLLMENT_PAYMENT_AMOUNT,
              invoice_id: invoiceId,
              error: sfResult.error,
              requires_manual_intervention: true,
            },
          })

          return NextResponse.json({
            success: true,
            message: 'Payment recorded but SF promotion failed — flagged for admin review',
            error: sfResult.error,
          })
        }

        logger.info('SF lead promoted to applicant', { leadId: transaction.lead_id })
        return NextResponse.json({
          success: true,
          message: 'Payment processed — SF lead moved to Applicant',
        })
      }

      // Non-SF: enroll the student
      const result = await convertLeadToStudent(supabase, {
        leadId: transaction.lead_id,
        transactionId: transaction.id,
        amountPaid: ENROLLMENT_PAYMENT_AMOUNT,
      })

      if (!result.success) {
        logger.error('CRITICAL: Enrollment failed after payment', {
          leadId: transaction.lead_id,
          error: result.error,
        })

        await supabase
          .from('payment_transactions')
          .update({
            status: 'completed',
            notes: `ENROLLMENT_FAILED: Payment successful but enrollment failed: ${result.error}`,
            completed_at: new Date().toISOString(),
          })
          .eq('id', transaction.id)

        await supabase.from('activities').insert({
          lead_id: transaction.lead_id,
          activity_type: 'enrollment_failed',
          title: 'Enrollment Failed After Payment',
          description: `CRITICAL: Payment of ${ENROLLMENT_PAYMENT_AMOUNT} KWD succeeded but enrollment conversion failed: ${result.error}. Manual intervention required.`,
          metadata: {
            transaction_id: transaction.id,
            payment_method: 'myfatoorah',
            amount: ENROLLMENT_PAYMENT_AMOUNT,
            invoice_id: invoiceId,
            error: result.error,
            requires_manual_intervention: true,
          },
        })

        return NextResponse.json({
          success: true,
          message: 'Payment recorded but enrollment failed — flagged for admin review',
          error: result.error,
        })
      }

      // Log successful payment activity
      await supabase.from('activities').insert({
        lead_id: transaction.lead_id,
        student_id: result.student?.id,
        activity_type: 'payment_received',
        title: 'Online Payment Received',
        description: `Payment of ${ENROLLMENT_PAYMENT_AMOUNT} KWD received via MyFatoorah`,
        metadata: {
          transaction_id: transaction.id,
          payment_method: 'myfatoorah',
          amount: ENROLLMENT_PAYMENT_AMOUNT,
          invoice_id: invoiceId,
          payment_id: statusResult.paymentId,
        },
      })

      logger.info('Student enrolled successfully', { studentId: result.student?.id, invoiceId })
      return NextResponse.json({
        success: true,
        message: 'Payment processed and student enrolled',
        studentId: result.student?.id,
      })
    } else if (statusResult.invoiceStatus === 'Failed' || statusResult.invoiceStatus === 'Expired') {
      await supabase
        .from('payment_transactions')
        .update({
          status: 'failed',
          notes: `Payment ${statusResult.invoiceStatus?.toLowerCase()}`,
        })
        .eq('id', transaction.id)

      await supabase.from('activities').insert({
        lead_id: transaction.lead_id,
        activity_type: 'payment_failed',
        title: 'Payment Failed',
        description: `Online payment of ${transaction.payment_purpose === 'test_fee' ? TEST_FEE_AMOUNT : ENROLLMENT_PAYMENT_AMOUNT} KWD failed - ${statusResult.invoiceStatus}`,
        metadata: {
          transaction_id: transaction.id,
          invoice_id: invoiceId,
          status: statusResult.invoiceStatus,
        },
      })

      logger.info('Payment failed/expired', { invoiceId, status: statusResult.invoiceStatus })
      return NextResponse.json({
        success: true,
        message: `Payment ${statusResult.invoiceStatus?.toLowerCase()}`,
      })
    } else {
      await supabase
        .from('payment_transactions')
        .update({ status: 'processing' })
        .eq('id', transaction.id)

      logger.info('Payment still pending', { invoiceId, status: statusResult.invoiceStatus })
      return NextResponse.json({
        success: true,
        message: 'Payment still pending',
        status: statusResult.invoiceStatus,
      })
    }
}

// Also handle GET for callback redirects
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const paymentId = searchParams.get('paymentId')
  const error = searchParams.get('error')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (error) {
    return NextResponse.redirect(`${baseUrl}/payment-error?reason=cancelled`)
  }

  if (paymentId) {
    return NextResponse.redirect(`${baseUrl}/payment-success?paymentId=${paymentId}`)
  }

  return NextResponse.json({ status: 'ok', service: 'myfatoorah-webhook' })
}
