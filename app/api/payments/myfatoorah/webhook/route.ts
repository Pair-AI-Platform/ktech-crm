import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { convertLeadToStudent } from "@/lib/enrollment/convert-lead"
import { getPaymentStatus } from "@/lib/myfatoorah/client"
import { ENROLLMENT_PAYMENT_AMOUNT } from "@/types"

// Use service role for webhook (no user session)
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[MyFatoorah Webhook] Received:", JSON.stringify(body))

    // MyFatoorah typically sends InvoiceId in the webhook
    const invoiceId = body.InvoiceId || body.Data?.InvoiceId

    if (!invoiceId) {
      console.error("[MyFatoorah Webhook] No InvoiceId in payload")
      return NextResponse.json(
        { error: "Missing InvoiceId" },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Find the payment transaction by invoice ID
    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .select("*, lead:leads(id, first_name, last_name)")
      .eq("myfatoorah_invoice_id", invoiceId.toString())
      .single()

    if (txError || !transaction) {
      console.error("[MyFatoorah Webhook] Transaction not found for invoice:", invoiceId)
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      )
    }

    // Check if already processed
    if (transaction.status === "completed") {
      console.log("[MyFatoorah Webhook] Transaction already completed:", transaction.id)
      return NextResponse.json({
        success: true,
        message: "Already processed",
      })
    }

    // Get payment status from MyFatoorah API
    const statusResult = await getPaymentStatus(invoiceId.toString())

    if (!statusResult.success) {
      console.error("[MyFatoorah Webhook] Failed to get status:", statusResult.error)
      return NextResponse.json(
        { error: statusResult.error },
        { status: 500 }
      )
    }

    // Update transaction with webhook data
    await supabase
      .from("payment_transactions")
      .update({
        webhook_payload: body,
        webhook_received_at: new Date().toISOString(),
        myfatoorah_payment_id: statusResult.paymentId,
      })
      .eq("id", transaction.id)

    // Handle based on payment status
    if (statusResult.invoiceStatus === "Paid") {
      // Payment successful - enroll the student
      const result = await convertLeadToStudent(supabase, {
        leadId: transaction.lead_id,
        transactionId: transaction.id,
        amountPaid: ENROLLMENT_PAYMENT_AMOUNT,
      })

      if (!result.success) {
        console.error("[MyFatoorah Webhook] Failed to enroll:", result.error)

        // Mark transaction with error but don't fail webhook
        await supabase
          .from("payment_transactions")
          .update({
            status: "completed",
            notes: `Payment successful but enrollment failed: ${result.error}`,
            completed_at: new Date().toISOString(),
          })
          .eq("id", transaction.id)

        return NextResponse.json({
          success: true,
          message: "Payment recorded but enrollment failed",
          error: result.error,
        })
      }

      // Log successful payment activity
      await supabase.from("activities").insert({
        lead_id: transaction.lead_id,
        student_id: result.student?.id,
        activity_type: "payment_received",
        title: "Online Payment Received",
        description: `Payment of ${ENROLLMENT_PAYMENT_AMOUNT} KWD received via MyFatoorah`,
        metadata: {
          transaction_id: transaction.id,
          payment_method: "myfatoorah",
          amount: ENROLLMENT_PAYMENT_AMOUNT,
          invoice_id: invoiceId,
          payment_id: statusResult.paymentId,
        },
      })

      console.log("[MyFatoorah Webhook] Successfully enrolled student:", result.student?.id)

      return NextResponse.json({
        success: true,
        message: "Payment processed and student enrolled",
        studentId: result.student?.id,
      })
    } else if (statusResult.invoiceStatus === "Failed" || statusResult.invoiceStatus === "Expired") {
      // Payment failed
      await supabase
        .from("payment_transactions")
        .update({
          status: "failed",
          notes: `Payment ${statusResult.invoiceStatus?.toLowerCase()}`,
        })
        .eq("id", transaction.id)

      // Log failed payment
      await supabase.from("activities").insert({
        lead_id: transaction.lead_id,
        activity_type: "payment_failed",
        title: "Payment Failed",
        description: `Online payment of ${ENROLLMENT_PAYMENT_AMOUNT} KWD failed - ${statusResult.invoiceStatus}`,
        metadata: {
          transaction_id: transaction.id,
          invoice_id: invoiceId,
          status: statusResult.invoiceStatus,
        },
      })

      return NextResponse.json({
        success: true,
        message: `Payment ${statusResult.invoiceStatus?.toLowerCase()}`,
      })
    } else {
      // Still pending
      await supabase
        .from("payment_transactions")
        .update({ status: "processing" })
        .eq("id", transaction.id)

      return NextResponse.json({
        success: true,
        message: "Payment still pending",
        status: statusResult.invoiceStatus,
      })
    }
  } catch (error: unknown) {
    console.error("[MyFatoorah Webhook] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Webhook processing failed"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// Also handle GET for callback redirects
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const paymentId = searchParams.get("paymentId")
  const error = searchParams.get("error")

  // Redirect to a success/error page
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  if (error) {
    return NextResponse.redirect(`${baseUrl}/payment-error?reason=cancelled`)
  }

  if (paymentId) {
    // Trigger webhook processing
    return NextResponse.redirect(`${baseUrl}/payment-success?paymentId=${paymentId}`)
  }

  return NextResponse.json({ status: "ok", service: "myfatoorah-webhook" })
}
