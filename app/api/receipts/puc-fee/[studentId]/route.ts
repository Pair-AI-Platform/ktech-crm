import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { escapeHtml } from "@/lib/utils"
import { PUC_FEE_AMOUNT } from "@/types"


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params
    const supabase = await createServerSupabaseClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Fetch student details
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, first_name, last_name, civil_id, phone, email, puc_fee_paid, created_at")
      .eq("id", studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      )
    }

    if (!student.puc_fee_paid) {
      return NextResponse.json(
        { error: "PUC fee has not been paid yet" },
        { status: 400 }
      )
    }

    // Fetch payment transaction
    const { data: transaction } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("student_id", studentId)
      .eq("status", "completed")
      .ilike("notes", "%PUC%")
      .order("completed_at", { ascending: false })
      .limit(1)
      .single()

    const paymentDate = transaction?.completed_at
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

    const receiptNumber = transaction?.cash_invoice_number ||
      transaction?.myfatoorah_invoice_id ||
      `PUC-${studentId.substring(0, 8).toUpperCase()}`

    // Generate HTML receipt
    const receiptHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PUC Fee Receipt - ${escapeHtml(student.first_name)} ${escapeHtml(student.last_name)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .receipt {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 24px;
      margin-bottom: 5px;
    }
    .header p {
      opacity: 0.9;
      font-size: 14px;
    }
    .badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 8px 16px;
      border-radius: 20px;
      margin-top: 15px;
      font-weight: 600;
    }
    .content {
      padding: 30px;
    }
    .receipt-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 25px;
      padding-bottom: 20px;
      border-bottom: 1px dashed #e5e7eb;
    }
    .receipt-info div {
      text-align: center;
    }
    .receipt-info label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .receipt-info span {
      display: block;
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin-top: 4px;
    }
    .student-details {
      background: #f9fafb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 25px;
    }
    .student-details h3 {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-row label {
      color: #6b7280;
    }
    .detail-row span {
      font-weight: 500;
      color: #111827;
    }
    .amount-section {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border-radius: 8px;
      padding: 25px;
      text-align: center;
      margin-bottom: 25px;
    }
    .amount-section label {
      font-size: 14px;
      color: #047857;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .amount-section .amount {
      font-size: 42px;
      font-weight: 700;
      color: #047857;
      margin-top: 5px;
    }
    .amount-section .currency {
      font-size: 18px;
      font-weight: 500;
    }
    .status {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #047857;
      font-weight: 600;
      margin-top: 10px;
    }
    .status svg {
      width: 20px;
      height: 20px;
    }
    .footer {
      text-align: center;
      padding: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 12px;
    }
    .footer p {
      margin-bottom: 5px;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .receipt {
        box-shadow: none;
        border-radius: 0;
      }
      .no-print {
        display: none;
      }
    }
    .print-btn {
      display: block;
      max-width: 600px;
      margin: 20px auto;
      padding: 12px 24px;
      background: #7c3aed;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }
    .print-btn:hover {
      background: #6d28d9;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>Kuwait Technical College</h1>
      <p>كلية الكويت التقنية</p>
      <div class="badge">PUC Fee Receipt</div>
    </div>

    <div class="content">
      <div class="receipt-info">
        <div>
          <label>Receipt No.</label>
          <span>${escapeHtml(receiptNumber)}</span>
        </div>
        <div>
          <label>Date</label>
          <span>${escapeHtml(paymentDate)}</span>
        </div>
        <div>
          <label>Payment Method</label>
          <span>${transaction?.payment_method === 'cash' ? 'Cash' : 'Online'}</span>
        </div>
      </div>

      <div class="student-details">
        <h3>Student Information</h3>
        <div class="detail-row">
          <label>Name</label>
          <span>${escapeHtml(student.first_name)} ${escapeHtml(student.last_name)}</span>
        </div>
        <div class="detail-row">
          <label>Civil ID</label>
          <span>${escapeHtml(student.civil_id || 'N/A')}</span>
        </div>
        <div class="detail-row">
          <label>Phone</label>
          <span>${escapeHtml(student.phone || 'N/A')}</span>
        </div>
        <div class="detail-row">
          <label>Email</label>
          <span>${escapeHtml(student.email || 'N/A')}</span>
        </div>
      </div>

      <div class="amount-section">
        <label>Amount Paid</label>
        <div class="amount">
          ${PUC_FEE_AMOUNT} <span class="currency">KWD</span>
        </div>
        <div class="status">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Payment Confirmed
        </div>
      </div>

      <div class="footer">
        <p>This is an official receipt for the PUC (Public Universities Council) fee.</p>
        <p>For inquiries, please contact the admissions office.</p>
        <p style="margin-top: 15px; font-weight: 500;">Thank you / شكراً لكم</p>
      </div>
    </div>
  </div>

  <button class="print-btn no-print" onclick="window.print()">
    Print Receipt
  </button>
</body>
</html>
    `

    return new NextResponse(receiptHtml, {
      headers: {
        "Content-Type": "text/html",
      },
    })
  } catch (error: unknown) {
    console.error("[PUC Fee Receipt] Error:", error)
    const errorMessage = "Failed to generate receipt"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
