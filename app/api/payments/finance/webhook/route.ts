import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { withApiHandler } from "@/lib/api-handler"
import { escapeHtml } from "@/lib/utils"
import { PUC_FEE_AMOUNT } from "@/types"
import crypto from "crypto"

/**
 * Finance Department Webhook
 *
 * Called by the finance department system when a student pays the 10 KD PUC fee.
 * Automatically:
 * 1. Looks up the lead by civil_id
 * 2. Records the payment transaction
 * 3. Generates & uploads the payment receipt
 * 4. Attaches receipt as a PSP document (across all graduate types)
 * 5. Updates lead payment status
 *
 * Authentication: HMAC-SHA256 signature via x-finance-signature header
 * Secret: FINANCE_WEBHOOK_SECRET env var
 */

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function verifyFinanceSignature(
  payload: string,
  signature: string | null,
  secret: string | undefined
): boolean {
  if (!signature || !secret) return false
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex")
    )
  } catch {
    return false
  }
}

function generateFinanceReceiptHtml(data: {
  receiptNumber: string
  studentName: string
  civilId: string
  phone: string
  amount: number
  paymentDate: string
  paymentMethod: string
  financeRef?: string
}) {
  const formattedDate = new Date(data.paymentDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;background:#f8f9fa;padding:20px}
.invoice{max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1)}
.header{background:linear-gradient(135deg,#1e3a5f,#2d4a6f);color:white;padding:30px;text-align:center}
.header h1{font-size:24px;margin-bottom:8px}.header p{opacity:.9;font-size:14px}
.badge{display:inline-block;background:#22c55e;color:white;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:600;margin-top:16px}
.content{padding:30px}.section{margin-bottom:24px}
.section-title{font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:600;letter-spacing:.5px;margin-bottom:12px}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.info-label{font-size:12px;color:#6b7280;margin-bottom:4px}
.info-value{font-size:14px;color:#1f2937;font-weight:500}
.total{background:#f8f9fa;padding:16px;border-radius:8px;display:flex;justify-content:space-between;font-weight:700;color:#1e3a5f;font-size:16px}
.source-badge{display:inline-block;background:#3b82f6;color:white;padding:4px 12px;border-radius:12px;font-size:11px;font-weight:600;margin-top:8px}
.footer{background:#f8f9fa;padding:20px 30px;text-align:center}
.footer p{font-size:12px;color:#6b7280}.footer .logo{font-weight:700;color:#1e3a5f;font-size:14px;margin-top:8px}
</style></head><body><div class="invoice">
<div class="header"><h1>Payment Receipt</h1><p>Finance Department Payment Confirmation</p><span class="badge">PAID</span></div>
<div class="content">
<div class="section"><div class="section-title">Receipt Details</div><div class="info-grid">
<div><div class="info-label">Receipt Number</div><div class="info-value">${escapeHtml(data.receiptNumber)}</div></div>
<div><div class="info-label">Payment Date</div><div class="info-value">${escapeHtml(formattedDate)}</div></div>
<div><div class="info-label">Payment Method</div><div class="info-value">${escapeHtml(data.paymentMethod)}</div></div>
<div><div class="info-label">Status</div><div class="info-value" style="color:#22c55e">Confirmed</div></div>
${data.financeRef ? `<div><div class="info-label">Finance Ref</div><div class="info-value">${escapeHtml(data.financeRef)}</div></div>` : ""}
</div><span class="source-badge">Finance Department</span></div>
<div class="section"><div class="section-title">Student Information</div><div class="info-grid">
<div><div class="info-label">Name</div><div class="info-value">${escapeHtml(data.studentName)}</div></div>
<div><div class="info-label">Civil ID</div><div class="info-value">${escapeHtml(data.civilId)}</div></div>
<div><div class="info-label">Phone</div><div class="info-value">${escapeHtml(data.phone)}</div></div>
</div></div>
<div class="total"><span>Total Paid</span><span>${data.amount} KD</span></div>
</div>
<div class="footer"><p>Payment recorded from Finance Department system.</p><p class="logo">Kuwait Technical College</p></div>
</div></body></html>`
}

export const POST = withApiHandler(
  { context: "finance-webhook", requireAuth: false },
  async ({ req, logger }) => {
    const rawBody = await req.text()

    // Verify webhook signature
    const signature = req.headers.get("x-finance-signature")
    const webhookSecret = process.env.FINANCE_WEBHOOK_SECRET

    if (!verifyFinanceSignature(rawBody, signature, webhookSecret)) {
      logger.error("Invalid finance webhook signature")
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      )
    }

    const body = JSON.parse(rawBody)
    const {
      civil_id,
      receipt_number,
      amount,
      payment_method,
      payment_date,
      finance_reference,
      student_name,
    } = body

    // Validate required fields
    if (!civil_id) {
      return NextResponse.json(
        { error: "civil_id is required" },
        { status: 400 }
      )
    }
    if (!receipt_number) {
      return NextResponse.json(
        { error: "receipt_number is required" },
        { status: 400 }
      )
    }

    const paymentAmount = amount || PUC_FEE_AMOUNT
    const method = payment_method || "cash"
    const payDate = payment_date || new Date().toISOString()

    // Validate payment amount against expected fee
    if (typeof amount === 'number' && amount !== PUC_FEE_AMOUNT) {
      logger.warn("Payment amount mismatch", {
        civil_id,
        received: amount,
        expected: PUC_FEE_AMOUNT,
      })
      // Allow processing but log the discrepancy - finance department may have different amounts
    }

    logger.info("Finance webhook received", {
      civil_id,
      receipt_number,
      amount: paymentAmount,
    })

    const supabase = createServiceClient()

    // Look up lead by civil_id
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, first_name, last_name, first_name_ar, last_name_ar, phone, email, civil_id")
      .eq("civil_id", civil_id)
      .single()

    if (leadError || !lead) {
      logger.error("Lead not found for civil_id", { civil_id })
      return NextResponse.json(
        { error: "No lead found with this civil_id" },
        { status: 404 }
      )
    }

    // Idempotency check: exact receipt number match first
    const { data: duplicateReceipt } = await supabase
      .from("payment_transactions")
      .select("id")
      .eq("cash_invoice_number", receipt_number)
      .eq("status", "completed")
      .limit(1)

    if (duplicateReceipt && duplicateReceipt.length > 0) {
      logger.info("Duplicate receipt number - already processed", { receipt_number })
      return NextResponse.json({
        success: true,
        message: "Payment already recorded (duplicate receipt)",
        alreadyPaid: true,
        transactionId: duplicateReceipt[0].id,
      })
    }

    // Check for existing completed PUC/PSP payment for this lead
    const { data: existingPayments } = await supabase
      .from("payment_transactions")
      .select("id")
      .eq("lead_id", lead.id)
      .eq("status", "completed")
      .or("notes.ilike.%PSP%,notes.ilike.%PUC%,notes.ilike.%Finance%")
      .limit(1)

    if (existingPayments && existingPayments.length > 0) {
      logger.info("Payment already exists for lead", { leadId: lead.id })
      return NextResponse.json({
        success: true,
        message: "Payment already recorded",
        alreadyPaid: true,
        transactionId: existingPayments[0].id,
      })
    }

    // Create payment transaction
    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .insert({
        lead_id: lead.id,
        amount: paymentAmount,
        currency: "KWD",
        payment_method: method === "knet" ? "bank_transfer" : "cash",
        status: "completed",
        cash_invoice_number: receipt_number,
        notes: "PSP Fee Payment (Finance Department)",
        completed_at: payDate,
      })
      .select()
      .single()

    if (txError) {
      logger.error("Failed to create transaction", {
        leadId: lead.id,
        error: txError.message,
      })
      return NextResponse.json(
        { error: "Failed to create payment transaction" },
        { status: 500 }
      )
    }

    // Generate and upload payment receipt
    try {
      const leadName =
        student_name || `${lead.first_name_ar || ""} ${lead.last_name_ar || ""}`
      const receiptHtml = generateFinanceReceiptHtml({
        receiptNumber: receipt_number,
        studentName: leadName,
        civilId: civil_id,
        phone: lead.phone || "",
        amount: paymentAmount,
        paymentDate: payDate,
        paymentMethod:
          method === "knet" ? "KNET" : method === "cash" ? "Cash" : method,
        financeRef: finance_reference,
      })

      const storagePath = `leads/${lead.id}/psp/invoices/FINANCE-${receipt_number}.html`

      await supabase.storage
        .from("documents")
        .upload(
          storagePath,
          new Blob([receiptHtml], { type: "text/html" }),
          { contentType: "text/html", upsert: true }
        )

      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(storagePath)

      // Attach receipt as psp_document for all graduate types
      const GRADUATE_TYPES = ["gov", "us", "uk", "ksa", "others"]
      for (const gt of GRADUATE_TYPES) {
        const { data: existingDoc } = await supabase
          .from("psp_documents")
          .select("id")
          .eq("lead_id", lead.id)
          .eq("document_type", "payment_receipt")
          .eq("graduate_type", gt)
          .single()

        const receiptDocData = {
          file_name: `FINANCE-${receipt_number}.html`,
          file_type: "text/html",
          storage_path: storagePath,
          public_url: urlData?.publicUrl,
          is_verified: true,
          verified_at: new Date().toISOString(),
          verification_notes: `Auto-verified: Finance Department ${method === "knet" ? "KNET" : "Cash"} payment confirmed. Ref: ${finance_reference || receipt_number}`,
        }

        if (existingDoc) {
          await supabase
            .from("psp_documents")
            .update(receiptDocData)
            .eq("id", existingDoc.id)
        } else {
          await supabase.from("psp_documents").insert({
            lead_id: lead.id,
            document_type: "payment_receipt",
            graduate_type: gt,
            ...receiptDocData,
          })
        }
      }

      // Also update PUC receipt document type for backwards compatibility
      for (const gt of GRADUATE_TYPES) {
        const { data: existingPucDoc } = await supabase
          .from("psp_documents")
          .select("id")
          .eq("lead_id", lead.id)
          .eq("document_type", "puc_receipt")
          .eq("graduate_type", gt)
          .single()

        const pucDocData = {
          file_name: `FINANCE-${receipt_number}.html`,
          file_type: "text/html",
          storage_path: storagePath,
          public_url: urlData?.publicUrl,
          is_verified: true,
          verified_at: new Date().toISOString(),
          verification_notes: `Auto-verified: Finance Department payment.`,
        }

        if (existingPucDoc) {
          await supabase
            .from("psp_documents")
            .update(pucDocData)
            .eq("id", existingPucDoc.id)
        } else {
          await supabase.from("psp_documents").insert({
            lead_id: lead.id,
            document_type: "puc_receipt",
            graduate_type: gt,
            ...pucDocData,
          })
        }
      }

      logger.info("Payment receipt auto-uploaded", { leadId: lead.id })
    } catch (receiptErr) {
      logger.error("Failed to auto-upload receipt", {
        leadId: lead.id,
        error: String(receiptErr),
      })
      // Don't fail the whole webhook for receipt upload failure
    }

    // Log activity
    await supabase.from("activities").insert({
      lead_id: lead.id,
      activity_type: "payment_received",
      title: "Payment Received (Finance Department)",
      description: `Payment of ${paymentAmount} KWD received from Finance Department. Receipt: ${receipt_number}${finance_reference ? `. Ref: ${finance_reference}` : ""}`,
      metadata: {
        transaction_id: transaction.id,
        payment_method: method,
        amount: paymentAmount,
        receipt_number,
        finance_reference,
        source: "finance_department",
      },
    })

    logger.info("Finance payment recorded successfully", {
      leadId: lead.id,
      transactionId: transaction.id,
    })

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      leadId: lead.id,
      message: "Payment recorded and receipt attached successfully",
    })
  }
)

export async function GET() {
  return NextResponse.json({ status: "ok", service: "finance-webhook" })
}
