import { NextResponse } from "next/server"
import { withApiHandler } from "@/lib/api-handler"
import { escapeHtml } from "@/lib/utils"

function generateCashReceiptHtml(data: {
  receiptNumber: string
  leadName: string
  civilId: string
  phone: string
  amount: number
  paymentDate: string
  paymentMethod: string
}) {
  const formattedDate = new Date(data.paymentDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
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
.footer{background:#f8f9fa;padding:20px 30px;text-align:center}
.footer p{font-size:12px;color:#6b7280}.footer .logo{font-weight:700;color:#1e3a5f;font-size:14px;margin-top:8px}
</style></head><body><div class="invoice">
<div class="header"><h1>Payment Receipt</h1><p>${escapeHtml(data.paymentMethod)} Payment Confirmation</p><span class="badge">PAID</span></div>
<div class="content">
<div class="section"><div class="section-title">Receipt Details</div><div class="info-grid">
<div><div class="info-label">Receipt Number</div><div class="info-value">${escapeHtml(data.receiptNumber)}</div></div>
<div><div class="info-label">Payment Date</div><div class="info-value">${escapeHtml(formattedDate)}</div></div>
<div><div class="info-label">Payment Method</div><div class="info-value">${escapeHtml(data.paymentMethod)}</div></div>
<div><div class="info-label">Status</div><div class="info-value" style="color:#22c55e">Confirmed</div></div>
</div></div>
<div class="section"><div class="section-title">Student Information</div><div class="info-grid">
<div><div class="info-label">Name</div><div class="info-value">${escapeHtml(data.leadName)}</div></div>
<div><div class="info-label">Civil ID</div><div class="info-value">${escapeHtml(data.civilId)}</div></div>
<div><div class="info-label">Phone</div><div class="info-value">${escapeHtml(data.phone)}</div></div>
</div></div>
<div class="total"><span>Total Paid</span><span>${data.amount} KD</span></div>
</div>
<div class="footer"><p>Thank you for your payment.</p><p class="logo">Kuwait Technical College</p></div>
</div></body></html>`
}

export const POST = withApiHandler(
  { context: "psp-cash-payment" },
  async ({ req, supabase, user, logger }) => {
    const body = await req.json()
    const { leadId, receiptNumber, paymentMethod, amount, fees } = body

    if (!leadId) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 })
    }

    if (!receiptNumber || typeof receiptNumber !== "string" || receiptNumber.trim() === "") {
      return NextResponse.json({ error: "Receipt number is required" }, { status: 400 })
    }

    if (!paymentMethod || !["cash", "knet"].includes(paymentMethod)) {
      return NextResponse.json({ error: "Payment method must be cash or knet" }, { status: 400 })
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 })
    }

    // Fetch lead details
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, first_name, last_name, first_name_ar, last_name_ar, phone, email, civil_id")
      .eq("id", leadId)
      .single()

    if (leadError || !lead) {
      logger.error("Lead not found", { leadId })
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Check for existing completed PSP payment
    const { data: existingPayment } = await supabase
      .from("payment_transactions")
      .select("id, status")
      .eq("lead_id", leadId)
      .eq("status", "completed")
      .ilike("notes", "%PSP%")
      .limit(1)
      .single()

    if (existingPayment) {
      return NextResponse.json({ error: "PSP fee has already been paid" }, { status: 400 })
    }

    // Create payment transaction record
    logger.info("Creating PSP cash/KNET payment", { leadId, paymentMethod, receiptNumber, amount })

    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .insert({
        lead_id: leadId,
        amount,
        currency: "KWD",
        payment_method: paymentMethod === "knet" ? "bank_transfer" : "cash",
        status: "completed",
        cash_invoice_number: receiptNumber.trim(),
        cash_received_by: user.id,
        notes: "PSP Fee Payment",
        created_by: user.id,
        processed_by: user.id,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (txError) {
      logger.error("Failed to create transaction", { leadId, error: txError.message })
      return NextResponse.json({ error: "Failed to create payment transaction" }, { status: 500 })
    }

    // Auto-upload payment receipt to psp_documents for all graduate types
    try {
      const invoiceHtml = generateCashReceiptHtml({
        receiptNumber: receiptNumber.trim(),
        leadName: `${lead.first_name_ar || ""} ${lead.last_name_ar || ""}`,
        civilId: lead.civil_id || "",
        phone: lead.phone,
        amount,
        paymentDate: new Date().toISOString(),
        paymentMethod: paymentMethod === "knet" ? "KNET" : "Cash",
      })

      const storagePath = `leads/${leadId}/psp/invoices/CASH-${receiptNumber.trim()}.html`

      await supabase.storage
        .from("documents")
        .upload(storagePath, new Blob([invoiceHtml], { type: "text/html" }), {
          contentType: "text/html",
          upsert: true,
        })

      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(storagePath)

      const GRADUATE_TYPES = ["gov", "us", "uk", "ksa", "others"]
      for (const gt of GRADUATE_TYPES) {
        const { data: existingDoc } = await supabase
          .from("psp_documents")
          .select("id")
          .eq("lead_id", leadId)
          .eq("document_type", "payment_receipt")
          .eq("graduate_type", gt)
          .single()

        const receiptDocData = {
          file_name: `CASH-${receiptNumber.trim()}.html`,
          file_type: "text/html",
          storage_path: storagePath,
          public_url: urlData?.publicUrl,
          is_verified: true,
          verified_at: new Date().toISOString(),
          verification_notes: `Auto-verified: ${paymentMethod === "knet" ? "KNET" : "Cash"} payment confirmed`,
          uploaded_by: user.id,
        }

        if (existingDoc) {
          await supabase.from("psp_documents").update(receiptDocData).eq("id", existingDoc.id)
        } else {
          await supabase.from("psp_documents").insert({
            lead_id: leadId,
            document_type: "payment_receipt",
            graduate_type: gt,
            ...receiptDocData,
          })
        }
      }
      logger.info("Payment receipt auto-uploaded to documents", { leadId })
    } catch (receiptErr) {
      logger.error("Failed to auto-upload payment receipt", { leadId, error: String(receiptErr) })
    }

    // Log activity
    await supabase.from("activities").insert({
      lead_id: leadId,
      activity_type: "payment_received",
      title: `PSP ${paymentMethod === "knet" ? "KNET" : "Cash"} Payment Received`,
      description: `${paymentMethod === "knet" ? "KNET" : "Cash"} payment of ${amount} KWD received for PSP fees. Receipt: ${receiptNumber}`,
      metadata: {
        transaction_id: transaction.id,
        payment_method: paymentMethod,
        amount,
        receipt_number: receiptNumber,
        fees,
      },
      created_by: user.id,
    })

    logger.info("PSP cash/KNET payment recorded", {
      leadId,
      transactionId: transaction.id,
      paymentMethod,
    })

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      message: `PSP ${paymentMethod === "knet" ? "KNET" : "cash"} payment recorded successfully`,
    })
  }
)

export async function GET() {
  return NextResponse.json({ status: "ok", service: "psp-cash-payment" })
}
