import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PUC_FEE_AMOUNT } from "@/types"

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

    const body = await request.json()
    const { studentId, receiptNumber, notes } = body

    // Validate required fields
    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      )
    }

    if (!receiptNumber) {
      return NextResponse.json(
        { error: "Receipt number is required" },
        { status: 400 }
      )
    }

    // Fetch student
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, first_name, last_name, funding_type, puc_fee_paid")
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

    // Create payment transaction record for cash payment
    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .insert({
        student_id: studentId,
        amount: PUC_FEE_AMOUNT,
        currency: "KWD",
        payment_method: "cash",
        status: "completed",
        cash_invoice_number: receiptNumber,
        cash_received_by: user.id,
        notes: notes || "PUC Fee Cash Payment",
        created_by: user.id,
        processed_by: user.id,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (txError) {
      console.error("[PUC Fee Cash] Failed to create transaction:", txError)
      return NextResponse.json(
        { error: "Failed to create payment transaction" },
        { status: 500 }
      )
    }

    // Update student puc_fee_paid status
    const { error: updateError } = await supabase
      .from("students")
      .update({
        puc_fee_paid: true,
        puc_payment_receipt_submitted: true,
      })
      .eq("id", studentId)

    if (updateError) {
      console.error("[PUC Fee Cash] Failed to update student:", updateError)
      return NextResponse.json(
        { error: "Failed to update student record" },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.from("activities").insert({
      student_id: studentId,
      activity_type: "puc_fee_paid",
      title: "PUC Fee Paid (Cash)",
      description: `PUC fee of ${PUC_FEE_AMOUNT} KWD paid via cash. Receipt: ${receiptNumber}`,
      metadata: {
        transaction_id: transaction.id,
        receipt_number: receiptNumber,
        amount: PUC_FEE_AMOUNT,
        payment_method: "cash",
      },
      created_by: user.id,
    })

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      message: "PUC fee cash payment recorded successfully",
    })
  } catch (error: unknown) {
    console.error("[PUC Fee Cash] Error:", error)
    const errorMessage = "Failed to record cash payment"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "puc-fee-cash" })
}
