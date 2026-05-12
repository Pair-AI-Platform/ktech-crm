import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createPaymentLink, validateCivilId } from "@/lib/myfatoorah/client"
import { canEnrollLead } from "@/lib/enrollment/convert-lead"
import { ENROLLMENT_PAYMENT_AMOUNT, FULL_TUITION_AMOUNT } from "@/lib/config/constants"
import { requireLeadOwnership } from "@/lib/auth/lead-ownership"

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
    const { leadId, civilId, amount: rawAmount } = body as {
      leadId?: string
      civilId?: string
      amount?: number | string
    }

    // Validate required fields
    if (!leadId) {
      return NextResponse.json(
        { error: "Lead ID is required" },
        { status: 400 }
      )
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single()
    const ownershipBlock = await requireLeadOwnership(supabase, { userId: user.id, role: profile?.role as 'admin' | 'agent' | undefined }, leadId)
    if (ownershipBlock) return ownershipBlock

    if (!civilId) {
      return NextResponse.json(
        { error: "Civil ID is required for online payment" },
        { status: 400 }
      )
    }

    // Validate civil ID format
    if (!validateCivilId(civilId)) {
      return NextResponse.json(
        { error: "Invalid civil ID format. Must be 12 digits starting with 2 or 3." },
        { status: 400 }
      )
    }

    // Fetch lead details for payment link + flow decisions.
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("first_name, last_name, first_name_ar, last_name_ar, phone, email, funding_type, pipeline_stage")
      .eq("id", leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      )
    }

    const isSF = lead.funding_type === "self_funded"

    // For non-SF (PUC) leads, keep the legacy stage gate: must be in
    // 'application' to create an enrollment invoice. SF leads can pay
    // tuition from either 'application' or 'applicant'.
    if (!isSF) {
      const { canEnroll, reason } = await canEnrollLead(supabase, leadId)
      if (!canEnroll) {
        return NextResponse.json({ error: reason }, { status: 400 })
      }
    }

    // Check for existing pending payment (idempotency)
    const { data: existingPending } = await supabase
      .from('payment_transactions')
      .select('id')
      .eq('lead_id', leadId)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingPending) {
      return NextResponse.json(
        { error: 'A pending payment already exists for this lead' },
        { status: 409 }
      )
    }

    // SF: payment can be any installment up to the remaining tuition balance.
    // PUC: still locked to ENROLLMENT_PAYMENT_AMOUNT.
    let paymentAmount: number
    if (isSF) {
      const { data: priorPayments } = await supabase
        .from('payment_transactions')
        .select('amount')
        .eq('lead_id', leadId)
        .eq('status', 'completed')
      const paidSoFar = (priorPayments ?? []).reduce(
        (sum, row) => sum + Number(row.amount || 0),
        0,
      )
      const remaining = Math.max(0, FULL_TUITION_AMOUNT - paidSoFar)
      if (remaining <= 0) {
        return NextResponse.json(
          { error: 'Tuition already fully paid for this lead.' },
          { status: 400 },
        )
      }
      const parsed = typeof rawAmount === 'number' ? rawAmount : Number(rawAmount)
      const desired = Number.isFinite(parsed) && parsed > 0 ? parsed : remaining
      if (desired > remaining) {
        return NextResponse.json(
          { error: `Amount ${desired} KWD exceeds remaining balance of ${remaining} KWD.` },
          { status: 400 },
        )
      }
      paymentAmount = desired
    } else {
      paymentAmount = ENROLLMENT_PAYMENT_AMOUNT
    }

    // Create MyFatoorah payment link
    const paymentResult = await createPaymentLink({
      customerName: `${lead.first_name_ar || ""} ${lead.last_name_ar || ""}`,
      customerEmail: lead.email || undefined,
      customerMobile: lead.phone,
      customerCivilId: civilId,
      invoiceValue: paymentAmount,
      displayCurrencyIso: "KWD",
      language: "en",
      customerReference: leadId,
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
        lead_id: leadId,
        amount: paymentAmount,
        currency: "KWD",
        payment_method: "myfatoorah",
        status: "pending",
        civil_id: civilId,
        myfatoorah_invoice_id: paymentResult.invoiceId,
        myfatoorah_invoice_url: paymentResult.invoiceUrl,
        created_by: user.id,
      })
      .select()
      .single()

    if (txError) {
      console.error("[MyFatoorah] Failed to create transaction:", txError)
      return NextResponse.json(
        { error: "Failed to create payment transaction" },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.from("activities").insert({
      lead_id: leadId,
      activity_type: "payment_link_created",
      title: "Payment Link Created",
      description: `Payment link for ${paymentAmount} KWD created via MyFatoorah`,
      metadata: {
        transaction_id: transaction.id,
        invoice_id: paymentResult.invoiceId,
        amount: paymentAmount,
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
    console.error("[MyFatoorah Create] Error:", error)
    const errorMessage = "Failed to create payment link"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "myfatoorah-create" })
}
