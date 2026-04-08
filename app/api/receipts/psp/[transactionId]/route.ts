import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { escapeHtml } from "@/lib/utils"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params
    const supabase = await createServerSupabaseClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch transaction with lead details
    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .select(
        "id, amount, currency, payment_method, status, cash_invoice_number, myfatoorah_invoice_id, myfatoorah_payment_id, notes, completed_at, created_at, lead:leads(id, first_name, last_name, first_name_ar, last_name_ar, civil_id, phone, email)"
      )
      .eq("id", transactionId)
      .single()

    if (txError || !transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    if (transaction.status !== "completed") {
      return NextResponse.json({ error: "Payment has not been completed yet" }, { status: 400 })
    }

    const lead = transaction.lead as unknown as {
      id: string
      first_name: string
      last_name: string
      first_name_ar: string | null
      last_name_ar: string | null
      civil_id: string | null
      phone: string | null
      email: string | null
    }

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Determine payment method display
    let paymentMethodLabel = "Online Payment"
    let paymentMethodLabelAr = "دفع إلكتروني"
    if (transaction.payment_method === "cash") {
      paymentMethodLabel = "Cash"
      paymentMethodLabelAr = "نقدي"
    } else if (transaction.payment_method === "bank_transfer") {
      paymentMethodLabel = "KNET"
      paymentMethodLabelAr = "كي نت"
    }

    const receiptNumber =
      transaction.cash_invoice_number ||
      transaction.myfatoorah_invoice_id ||
      `PSP-${transactionId.substring(0, 8).toUpperCase()}`

    const paymentDate = transaction.completed_at
      ? new Date(transaction.completed_at).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })

    const paymentTime = transaction.completed_at
      ? new Date(transaction.completed_at).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : ""

    const receiptHtml = `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt - ${escapeHtml(lead.first_name_ar || "")} ${escapeHtml(lead.last_name_ar || "")}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f0f2f5;
      padding: 24px;
      color: #1a1a2e;
      -webkit-font-smoothing: antialiased;
    }

    .receipt-wrapper {
      max-width: 520px;
      margin: 0 auto;
    }

    .receipt {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.06);
      overflow: hidden;
    }

    /* Header */
    .header {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      color: white;
      padding: 32px 28px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -30%;
      width: 200px;
      height: 200px;
      background: rgba(255,255,255,0.03);
      border-radius: 50%;
    }

    .header::after {
      content: '';
      position: absolute;
      bottom: -40%;
      left: -20%;
      width: 160px;
      height: 160px;
      background: rgba(255,255,255,0.02);
      border-radius: 50%;
    }

    .logo-text {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }

    .logo-text-ar {
      font-size: 15px;
      font-weight: 400;
      opacity: 0.85;
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    }

    .receipt-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.12);
      backdrop-filter: blur(10px);
      padding: 8px 18px;
      border-radius: 100px;
      margin-top: 16px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }

    .receipt-badge svg {
      width: 16px;
      height: 16px;
    }

    /* Content */
    .content {
      padding: 28px;
    }

    /* Receipt Meta */
    .receipt-meta {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      padding-bottom: 20px;
      border-bottom: 1px dashed #e2e5e9;
      margin-bottom: 20px;
    }

    .meta-item {
      text-align: center;
    }

    .meta-label {
      font-size: 10px;
      font-weight: 600;
      color: #8b95a5;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 4px;
    }

    .meta-value {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a2e;
    }

    /* Applicant Details */
    .section {
      margin-bottom: 20px;
    }

    .section-title {
      font-size: 11px;
      font-weight: 600;
      color: #8b95a5;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 12px;
    }

    .details-card {
      background: #f8f9fb;
      border-radius: 10px;
      padding: 16px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
    }

    .detail-row:not(:last-child) {
      border-bottom: 1px solid #eef0f3;
    }

    .detail-label {
      font-size: 13px;
      color: #6b7685;
    }

    .detail-value {
      font-size: 13px;
      font-weight: 500;
      color: #1a1a2e;
      text-align: right;
    }

    /* Amount Section */
    .amount-card {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border: 1px solid #a7f3d0;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin-bottom: 20px;
    }

    .amount-label {
      font-size: 12px;
      font-weight: 600;
      color: #047857;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 6px;
    }

    .amount-value {
      font-size: 38px;
      font-weight: 700;
      color: #047857;
      line-height: 1.1;
    }

    .amount-currency {
      font-size: 16px;
      font-weight: 500;
      margin-left: 4px;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 10px;
      color: #047857;
      font-weight: 600;
      font-size: 14px;
    }

    .status-badge svg {
      width: 18px;
      height: 18px;
    }

    /* Payment Method Chip */
    .method-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 12px;
      border-radius: 100px;
      font-size: 12px;
      font-weight: 500;
      background: #f0f2f5;
      color: #4a5568;
      margin-top: 8px;
    }

    /* Footer */
    .footer {
      text-align: center;
      padding: 20px 28px;
      border-top: 1px solid #eef0f3;
      background: #fafbfc;
    }

    .footer p {
      font-size: 11px;
      color: #8b95a5;
      margin-bottom: 4px;
      line-height: 1.5;
    }

    .footer .thanks {
      font-size: 13px;
      font-weight: 600;
      color: #1a1a2e;
      margin-top: 12px;
    }

    /* Print Styles */
    @media print {
      body {
        background: white;
        padding: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .receipt {
        box-shadow: none;
        border-radius: 0;
      }
      .no-print { display: none !important; }
    }

    /* Print Button */
    .actions {
      display: flex;
      gap: 10px;
      max-width: 520px;
      margin: 16px auto 0;
    }

    .btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 20px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .btn-primary {
      background: #1a1a2e;
      color: white;
    }

    .btn-primary:hover {
      background: #16213e;
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: white;
      color: #1a1a2e;
      border: 1px solid #e2e5e9;
    }

    .btn-secondary:hover {
      background: #f8f9fb;
    }

    .btn svg {
      width: 18px;
      height: 18px;
    }
  </style>
</head>
<body>
  <div class="receipt-wrapper">
    <div class="receipt">
      <div class="header">
        <div class="logo-text">Kuwait Technical College</div>
        <div class="logo-text-ar">كلية الكويت التقنية</div>
        <div class="receipt-badge">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          Payment Receipt / إيصال دفع
        </div>
      </div>

      <div class="content">
        <div class="receipt-meta">
          <div class="meta-item">
            <div class="meta-label">Receipt No.</div>
            <div class="meta-value">${escapeHtml(receiptNumber)}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Date</div>
            <div class="meta-value">${escapeHtml(paymentDate)}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Method</div>
            <div class="meta-value">${escapeHtml(paymentMethodLabel)}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Applicant Information</div>
          <div class="details-card">
            <div class="detail-row">
              <span class="detail-label">Name</span>
              <span class="detail-value">${escapeHtml(lead.first_name_ar || "")} ${escapeHtml(lead.last_name_ar || "")}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Civil ID</span>
              <span class="detail-value" style="font-family: 'SF Mono', 'Fira Code', monospace; letter-spacing: 0.5px;">${escapeHtml(lead.civil_id || "N/A")}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Phone</span>
              <span class="detail-value">${escapeHtml(lead.phone || "N/A")}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email</span>
              <span class="detail-value">${escapeHtml(lead.email || "N/A")}</span>
            </div>
          </div>
        </div>

        <div class="amount-card">
          <div class="amount-label">Amount Paid / المبلغ المدفوع</div>
          <div class="amount-value">
            ${transaction.amount}<span class="amount-currency">KWD</span>
          </div>
          <div class="status-badge">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Payment Confirmed / تم التأكيد
          </div>
          <div class="method-chip">
            ${paymentMethodLabel} / ${paymentMethodLabelAr}${paymentTime ? ` &middot; ${paymentTime}` : ""}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Payment Description</div>
          <div class="details-card">
            <div class="detail-row">
              <span class="detail-label">Description</span>
              <span class="detail-value">PSP Application Fees</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Currency</span>
              <span class="detail-value">${transaction.currency}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Transaction ID</span>
              <span class="detail-value" style="font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px;">${transactionId.substring(0, 8).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>This is an official receipt for PSP application fees.</p>
        <p>هذا إيصال رسمي لرسوم طلب التقديم</p>
        <p>For inquiries, contact the admissions office.</p>
        <p class="thanks">Thank you / شكراً لكم</p>
      </div>
    </div>

    <div class="actions no-print">
      <button class="btn btn-primary" onclick="window.print()">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
        Print Receipt
      </button>
      <button class="btn btn-secondary" onclick="window.close()">
        Close
      </button>
    </div>
  </div>
</body>
</html>
    `

    return new NextResponse(receiptHtml, {
      headers: {
        "Content-Type": "text/html",
      },
    })
  } catch (error: unknown) {
    console.error("[PSP Receipt] Error:", error)
    const errorMessage = "Failed to generate receipt"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
