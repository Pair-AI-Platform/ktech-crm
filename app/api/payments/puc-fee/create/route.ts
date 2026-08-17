import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createPaymentLink, validateCivilId } from "@/lib/myfatoorah/client"
import { PUC_FEE_AMOUNT } from "@/types"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const rateLimitResult = await rateLimit(`payment:${user.id}`, RATE_LIMITS.payment)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.resetIn / 1000)) } }
      )
    }

    const body = await request.json()
    const { studentId, civilId } = body

    // Validate required fields
    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      )
    }

    // Fetch student details
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, lead_id, first_name, last_name, phone, email, civil_id, funding_type, puc_fee_paid")
      .eq("id", studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      )
    }

    // Check if student is PUC type
    if (student.funding_type !== "puc") {
      return NextResponse.json(
        { error: "PUC fee is only applicable for PUC students" },
        { status: 400 }
      )
    }

    // Check if already paid
    if (student.puc_fee_paid) {
      return NextResponse.json(
        { error: "PUC fee has already been paid" },
        { status: 400 }
      )
    }

    if (!student.lead_id) {
      return NextResponse.json(
        { error: "Student is not linked to a lead; cannot record PUC fee payment" },
        { status: 409 }
      )
    }

    // Use provided civil ID or student's civil ID
    const studentCivilId = civilId || student.civil_id

    if (!studentCivilId) {
      return NextResponse.json(
        { error: "Civil ID is required for online payment" },
        { status: 400 }
      )
    }

    // Validate civil ID format
    if (!validateCivilId(studentCivilId)) {
      return NextResponse.json(
        { error: "Invalid civil ID format. Must be 12 digits starting with 2 or 3." },
        { status: 400 }
      )
    }

    // Create MyFatoorah payment link for PUC fee
    const paymentResult = await createPaymentLink({
      customerName: `${student.first_name} ${student.last_name}`,
      customerEmail: student.email || undefined,
      customerMobile: student.phone,
      customerCivilId: studentCivilId,
      invoiceValue: PUC_FEE_AMOUNT,
      displayCurrencyIso: "KWD",
      language: "en",
      customerReference: `PUC-${studentId}`,
      callBackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/myfatoorah/webhook`,
      errorUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/myfatoorah/webhook?error=true`,
    })

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: paymentResult.error || "Failed to create payment link" },
        { status: 500 }
      )
    }

    // Create payment transaction record
    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .insert({
        lead_id: student.lead_id,
        student_id: studentId,
        amount: PUC_FEE_AMOUNT,
        currency: "KWD",
        payment_method: "myfatoorah",
        payment_purpose: "puc_fee",
        status: "pending",
        civil_id: studentCivilId,
        myfatoorah_invoice_id: paymentResult.invoiceId,
        myfatoorah_invoice_url: paymentResult.invoiceUrl,
        notes: "PUC Fee Payment",
        created_by: user.id,
      })
      .select()
      .single()

    if (txError) {
      console.error("[PUC Fee] Failed to create transaction:", txError)
      return NextResponse.json(
        { error: "Failed to create payment transaction" },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.from("activities").insert({
      lead_id: student.lead_id,
      student_id: studentId,
      activity_type: "puc_fee_link_created",
      title: "PUC Fee Payment Link Created",
      description: `Payment link for ${PUC_FEE_AMOUNT} KWD PUC fee created via MyFatoorah`,
      metadata: {
        transaction_id: transaction.id,
        invoice_id: paymentResult.invoiceId,
        amount: PUC_FEE_AMOUNT,
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
    console.error("[PUC Fee Create] Error:", error)
    const errorMessage = "Failed to create payment link"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "puc-fee-create" })
}
