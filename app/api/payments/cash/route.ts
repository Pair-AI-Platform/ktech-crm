import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { convertLeadToStudent, promoteSFLeadToApplicant, canEnrollLead } from "@/lib/enrollment/convert-lead"
import { ENROLLMENT_PAYMENT_AMOUNT } from "@/types"

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
    const { leadId, invoiceNumber, notes } = body

    // Validate required fields
    if (!leadId) {
      return NextResponse.json(
        { error: "Lead ID is required" },
        { status: 400 }
      )
    }

    if (!invoiceNumber || typeof invoiceNumber !== 'string' || invoiceNumber.trim() === '') {
      return NextResponse.json(
        { error: "Invoice number is required for cash payments" },
        { status: 400 }
      )
    }

    // Check if lead can be enrolled
    const { canEnroll, reason } = await canEnrollLead(supabase, leadId)
    if (!canEnroll) {
      return NextResponse.json(
        { error: reason },
        { status: 400 }
      )
    }

    // Create payment transaction record
    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .insert({
        lead_id: leadId,
        amount: ENROLLMENT_PAYMENT_AMOUNT,
        currency: "KWD",
        payment_method: "cash",
        status: "completed",
        cash_invoice_number: invoiceNumber.trim(),
        cash_received_by: user.id,
        notes: notes || null,
        created_by: user.id,
        processed_by: user.id,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (txError) {
      console.error("[Cash Payment] Failed to create transaction:", txError)
      return NextResponse.json(
        { error: "Failed to create payment transaction" },
        { status: 500 }
      )
    }

    // Check if lead is SF (self-funded) and in 'application' stage
    const { data: lead } = await supabase
      .from("leads")
      .select("funding_type, pipeline_stage")
      .eq("id", leadId)
      .single()

    const isSFInApplication =
      lead?.funding_type === "self_funded" &&
      lead?.pipeline_stage === "application"

    if (isSFInApplication) {
      // SF lead: promote to 'applicant' instead of enrolling
      const sfResult = await promoteSFLeadToApplicant(supabase, {
        leadId,
        transactionId: transaction.id,
        amountPaid: ENROLLMENT_PAYMENT_AMOUNT,
        userId: user.id,
      })

      if (!sfResult.success) {
        await supabase
          .from("payment_transactions")
          .update({ status: "failed", notes: sfResult.error })
          .eq("id", transaction.id)

        return NextResponse.json(
          { error: sfResult.error },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        transactionId: transaction.id,
        message: "Cash payment processed — SF lead moved to Applicant",
      })
    }

    // Non-SF: convert lead to student (existing behavior)
    const result = await convertLeadToStudent(supabase, {
      leadId,
      transactionId: transaction.id,
      amountPaid: ENROLLMENT_PAYMENT_AMOUNT,
      userId: user.id,
    })

    if (!result.success) {
      // Rollback: mark transaction as failed
      await supabase
        .from("payment_transactions")
        .update({ status: "failed", notes: result.error })
        .eq("id", transaction.id)

      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    // Log activity for cash payment
    await supabase.from("activities").insert({
      lead_id: leadId,
      student_id: result.student?.id,
      activity_type: "payment_received",
      title: "Cash Payment Received",
      description: `Cash payment of ${ENROLLMENT_PAYMENT_AMOUNT} KWD received. Invoice: ${invoiceNumber}`,
      metadata: {
        transaction_id: transaction.id,
        payment_method: "cash",
        amount: ENROLLMENT_PAYMENT_AMOUNT,
        invoice_number: invoiceNumber,
      },
      created_by: user.id,
    })

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      studentId: result.student?.id,
      message: "Cash payment processed and student enrolled successfully",
    })
  } catch (error: unknown) {
    console.error("[Cash Payment] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to process cash payment"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "cash-payments" })
}
