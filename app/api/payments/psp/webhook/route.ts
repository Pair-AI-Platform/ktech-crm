import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getPaymentStatus, verifyWebhookSignature } from "@/lib/myfatoorah/client"
import { escapeHtml } from "@/lib/utils"
import { recordWebhookEvent, markWebhookProcessed, markWebhookFailed, hashPayload } from "@/lib/webhook-events"
import { createLogger } from "@/lib/logger"
import { sendWhatsAppMessage } from "@/lib/twilio/edge-client"


const logger = createLogger("PSP Payment Webhook")

// Use service role for webhook (no user session)
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Generate invoice HTML for PDF/image generation
function generateInvoiceHtml(data: {
  invoiceNumber: string
  leadName: string
  civilId: string
  phone: string
  email?: string
  amount: number
  paymentDate: string
  paymentMethod: string
  fees?: { label: string; amount: number }[]
}) {
  const formattedDate = new Date(data.paymentDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return `
<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8f9fa; padding: 20px; }
    .invoice { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { font-size: 24px; margin-bottom: 8px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .badge { display: inline-block; background: #22c55e; color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 16px; }
    .content { padding: 30px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 12px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-item { }
    .info-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
    .info-value { font-size: 14px; color: #1f2937; font-weight: 500; }
    .fees-table { width: 100%; border-collapse: collapse; }
    .fees-table th, .fees-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .fees-table th { font-size: 12px; color: #6b7280; font-weight: 600; }
    .fees-table td { font-size: 14px; color: #1f2937; }
    .fees-table .amount { text-align: right; font-weight: 500; }
    .total-row { background: #f8f9fa; }
    .total-row td { font-weight: 700; color: #1e3a5f; font-size: 16px; }
    .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; }
    .footer p { font-size: 12px; color: #6b7280; }
    .footer .logo { font-weight: 700; color: #1e3a5f; font-size: 14px; margin-top: 8px; }
    @media print {
      body { padding: 0; background: white; }
      .invoice { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <h1>Payment Receipt</h1>
      <p>PSP Fee Payment Confirmation</p>
      <span class="badge">PAID</span>
    </div>
    <div class="content">
      <div class="section">
        <div class="section-title">Receipt Details</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Receipt Number</div>
            <div class="info-value">${escapeHtml(data.invoiceNumber)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Payment Date</div>
            <div class="info-value">${escapeHtml(formattedDate)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Payment Method</div>
            <div class="info-value">${escapeHtml(data.paymentMethod)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Status</div>
            <div class="info-value" style="color: #22c55e;">Confirmed</div>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Student Information</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Name</div>
            <div class="info-value">${escapeHtml(data.leadName)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Civil ID</div>
            <div class="info-value">${escapeHtml(data.civilId)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Phone</div>
            <div class="info-value">${escapeHtml(data.phone)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Email</div>
            <div class="info-value">${escapeHtml(data.email || 'N/A')}</div>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Payment Summary</div>
        <table class="fees-table">
          <thead>
            <tr>
              <th>Description</th>
              <th class="amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${data.fees?.map(fee => `
              <tr>
                <td>${escapeHtml(fee.label)}</td>
                <td class="amount">${fee.amount} KD</td>
              </tr>
            `).join('') || `
              <tr>
                <td>PSP Application Fees</td>
                <td class="amount">${data.amount} KD</td>
              </tr>
            `}
            <tr class="total-row">
              <td>Total Paid</td>
              <td class="amount">${data.amount} KD</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="footer">
      <p>Thank you for your payment. This receipt confirms your PSP fee payment.</p>
      <p class="logo">Kuwait Technical College</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()

    // Verify webhook signature
    const signature = request.headers.get('x-myfatoorah-signature')
    const webhookSecret = process.env.MYFATOORAH_WEBHOOK_SECRET

    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error("[PSP Payment Webhook] Invalid signature")
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      )
    }

    const body = JSON.parse(rawBody)

    logger.info("Received", { transactionId: body?.transactionId, status: body?.status })

    // MyFatoorah typically sends InvoiceId in the webhook
    const invoiceId = body.InvoiceId || body.Data?.InvoiceId

    if (!invoiceId) {
      console.error("[PSP Payment Webhook] No InvoiceId in payload")
      return NextResponse.json(
        { error: "Missing InvoiceId" },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Idempotency / replay protection: record this delivery before doing any work.
    const eventId = `psp:${invoiceId}`
    const dedup = await recordWebhookEvent(supabase, "myfatoorah", eventId, await hashPayload(rawBody), null)
    if (!dedup.ok) {
      logger.info("Deduplicated", { reason: dedup.reason, eventId })
      return NextResponse.json({ success: true, message: `Webhook ${dedup.reason}` })
    }

    let response: NextResponse
    try {
      response = await processPspWebhookBody(supabase, body, invoiceId)
      await markWebhookProcessed(supabase, "myfatoorah", eventId)
    } catch (procErr) {
      await markWebhookFailed(supabase, "myfatoorah", eventId, procErr instanceof Error ? procErr.message : String(procErr))
      throw procErr
    }
    return response
  } catch (error: unknown) {
    console.error("[PSP Payment Webhook] Error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function processPspWebhookBody(
  supabase: ReturnType<typeof createServiceClient>,
  body: { InvoiceId?: number | string; Data?: { InvoiceId?: number | string } },
  invoiceId: number | string,
): Promise<NextResponse> {
    // Find the payment transaction by invoice ID
    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .select("*, lead:leads(id, first_name, last_name, first_name_ar, last_name_ar, phone, email, civil_id)")
      .eq("myfatoorah_invoice_id", invoiceId.toString())
      .eq("notes", "PSP Fee Payment")
      .single()

    if (txError || !transaction) {
      console.error("[PSP Payment Webhook] Transaction not found for invoice:", invoiceId)
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      )
    }

    // Check if already processed
    if (transaction.status === "completed") {
      logger.info("Transaction already completed", { transactionId: transaction.id })
      return NextResponse.json({
        success: true,
        message: "Already processed",
      })
    }

    // Get payment status from MyFatoorah API
    const statusResult = await getPaymentStatus(invoiceId.toString())

    if (!statusResult.success) {
      console.error("[PSP Payment Webhook] Failed to get status:", statusResult.error)
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
      const lead = transaction.lead

      // Update transaction as completed
      await supabase
        .from("payment_transactions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      // Generate invoice number
      const invoiceNumber = `PSP-${invoiceId}-${Date.now().toString(36).toUpperCase()}`

      // Generate invoice HTML
      const invoiceHtml = generateInvoiceHtml({
        invoiceNumber,
        leadName: `${lead.first_name_ar || ""} ${lead.last_name_ar || ""}`,
        civilId: lead.civil_id || transaction.civil_id,
        phone: lead.phone,
        email: lead.email,
        amount: transaction.amount,
        paymentDate: new Date().toISOString(),
        paymentMethod: "Online Payment (MyFatoorah)",
      })

      // Store invoice as a document in psp_documents table
      const storagePath = `leads/${lead.id}/psp/invoices/${invoiceNumber}.html`

      // Upload invoice HTML to storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(storagePath, new Blob([invoiceHtml], { type: "text/html" }), {
          contentType: "text/html",
          upsert: true,
        })

      if (uploadError) {
        console.error("[PSP Payment Webhook] Failed to upload invoice:", uploadError)
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(storagePath)

      // Insert payment receipt into psp_documents for all graduate types
      // so it appears in the document checklist regardless of which type is selected
      const GRADUATE_TYPES = ["gov", "us", "uk", "ksa", "others"]
      const receiptDocData = {
        file_name: `${invoiceNumber}.html`,
        file_type: "text/html",
        storage_path: storagePath,
        public_url: urlData?.publicUrl,
        is_verified: true,
        verified_at: new Date().toISOString(),
        verification_notes: "Auto-verified: Payment confirmed via MyFatoorah",
      }

      for (const gt of GRADUATE_TYPES) {
        // Upsert payment_receipt for each graduate type
        const { data: existingDoc } = await supabase
          .from("psp_documents")
          .select("id")
          .eq("lead_id", lead.id)
          .eq("document_type", "payment_receipt")
          .eq("graduate_type", gt)
          .single()

        if (existingDoc) {
          await supabase
            .from("psp_documents")
            .update(receiptDocData)
            .eq("id", existingDoc.id)
        } else {
          await supabase
            .from("psp_documents")
            .insert({
              lead_id: lead.id,
              document_type: "payment_receipt",
              graduate_type: gt,
              ...receiptDocData,
            })
        }
      }

      // Log successful payment activity
      await supabase.from("activities").insert({
        lead_id: lead.id,
        activity_type: "psp_payment_received",
        title: "PSP Payment Received",
        description: `PSP fee payment of ${transaction.amount} KWD received via MyFatoorah. Invoice: ${invoiceNumber}`,
        metadata: {
          transaction_id: transaction.id,
          payment_method: "myfatoorah",
          amount: transaction.amount,
          invoice_id: invoiceId,
          payment_id: statusResult.paymentId,
          invoice_number: invoiceNumber,
        },
      })

      // Auto-send receipt to student via WhatsApp
      try {
        let formattedPhone = lead.phone.replace(/\D/g, "")
        if (!formattedPhone.startsWith("965") && !formattedPhone.startsWith("+")) {
          formattedPhone = `965${formattedPhone}`
        }
        const whatsappTo = `whatsapp:+${formattedPhone}`
        const whatsappFrom = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`

        const receiptMessage = `مرحباً ${lead.first_name_ar || ""}،

تم استلام دفعتكم بنجاح ✅

رقم الإيصال: ${invoiceNumber}
المبلغ: ${transaction.amount} د.ك
الطريقة: دفع إلكتروني (MyFatoorah)

${urlData?.publicUrl ? `رابط الإيصال: ${urlData.publicUrl}` : ""}

---

Hello ${lead.first_name_ar || ""},

Your payment has been received successfully ✅

Receipt Number: ${invoiceNumber}
Amount: ${transaction.amount} KD
Method: Online Payment (MyFatoorah)

${urlData?.publicUrl ? `Receipt Link: ${urlData.publicUrl}` : ""}

شكراً لكم / Thank you
Kuwait Technical College`

        const twilioMessage = await sendWhatsAppMessage({
          body: receiptMessage,
          from: whatsappFrom,
          to: whatsappTo,
        })

        // Log the WhatsApp receipt message
        await supabase.from("whatsapp_messages").insert({
          twilio_message_sid: twilioMessage.sid,
          direction: "outbound",
          from_number: process.env.TWILIO_WHATSAPP_NUMBER,
          to_number: formattedPhone,
          message_body: receiptMessage,
          status: twilioMessage.status,
          lead_id: lead.id,
          sent_at: new Date().toISOString(),
        })

        logger.info("Receipt sent via WhatsApp", { sid: twilioMessage.sid })
      } catch (whatsappError) {
        // Don't fail the webhook if WhatsApp sending fails
        console.error("[PSP Payment Webhook] Failed to send receipt via WhatsApp:", whatsappError)
      }

      logger.info("Successfully processed payment", { leadId: lead.id })

      return NextResponse.json({
        success: true,
        message: "Payment processed, invoice generated, and receipt sent via WhatsApp",
        invoiceNumber,
      })
    } else if (statusResult.invoiceStatus === "Failed" || statusResult.invoiceStatus === "Expired") {
      // Payment failed
      await supabase
        .from("payment_transactions")
        .update({
          status: "failed",
          notes: `PSP Fee Payment - ${statusResult.invoiceStatus}`,
        })
        .eq("id", transaction.id)

      // Log failed payment
      await supabase.from("activities").insert({
        lead_id: transaction.lead_id,
        activity_type: "psp_payment_failed",
        title: "PSP Payment Failed",
        description: `PSP fee payment of ${transaction.amount} KWD failed - ${statusResult.invoiceStatus}`,
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
}

// Handle GET for callback redirects
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const paymentId = searchParams.get("paymentId")
  const error = searchParams.get("error")

  // Redirect to a success/error page
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  if (error) {
    return NextResponse.redirect(`${baseUrl}/payment-error?reason=cancelled&type=psp`)
  }

  if (paymentId) {
    return NextResponse.redirect(`${baseUrl}/payment-success?paymentId=${paymentId}&type=psp`)
  }

  return NextResponse.json({ status: "ok", service: "psp-payment-webhook" })
}
