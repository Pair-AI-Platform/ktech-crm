import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createPaymentLink, validateCivilId } from "@/lib/myfatoorah/client"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { PSP_FEE_AMOUNT } from "@/lib/config/constants"
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

    const rateLimitResult = await rateLimit(`payment:${user.id}`, RATE_LIMITS.payment)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.resetIn / 1000)) } }
      )
    }

    const body = await request.json()
    const { leadId, amount: requestedAmount, fees, civilId } = body

    // Validate required fields
    if (!leadId) {
      return NextResponse.json(
        { error: "Lead ID is required" },
        { status: 400 }
      )
    }

    // Resolve profile once for ownership + admin override checks.
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single()

    const ownershipBlock = await requireLeadOwnership(supabase, { userId: user.id, role: profile?.role as 'admin' | 'agent' | undefined }, leadId)
    if (ownershipBlock) return ownershipBlock

    // Amount is server-derived. Non-admins always pay the standard PSP fee.
    // Admins may override via the request body for one-off corrections.
    const isAdmin = profile?.role === "admin"
    const amount: number = isAdmin && typeof requestedAmount === "number" && requestedAmount > 0
      ? requestedAmount
      : PSP_FEE_AMOUNT
    if (!isAdmin && typeof requestedAmount === "number" && requestedAmount !== PSP_FEE_AMOUNT) {
      console.warn("[PSP Payment Create] Non-admin tried to override PSP fee", { leadId, requestedAmount, expected: PSP_FEE_AMOUNT })
      return NextResponse.json(
        { error: "PSP fee amount override is admin-only" },
        { status: 403 }
      )
    }

    // Fetch lead details
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, first_name, last_name, first_name_ar, last_name_ar, phone, email, civil_id")
      .eq("id", leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      )
    }

    // Check for existing pending or completed payment
    const { data: existingPayment } = await supabase
      .from("payment_transactions")
      .select("id, status, amount")
      .eq("lead_id", leadId)
      .eq("notes", "PSP Fee Payment")
      .in("status", ["pending", "processing", "completed"])
      .single()

    if (existingPayment?.status === "completed") {
      return NextResponse.json(
        { error: "PSP fee has already been paid" },
        { status: 400 }
      )
    }

    // Use provided civil ID or lead's civil ID
    const leadCivilId = civilId || lead.civil_id

    if (!leadCivilId) {
      return NextResponse.json(
        { error: "Civil ID is required for online payment" },
        { status: 400 }
      )
    }

    // Validate civil ID format
    if (!validateCivilId(leadCivilId)) {
      return NextResponse.json(
        { error: "Invalid civil ID format. Must be 12 digits starting with 2 or 3." },
        { status: 400 }
      )
    }

    if (!lead.phone) {
      return NextResponse.json(
        { error: "Lead phone number is required" },
        { status: 400 }
      )
    }

    // Create MyFatoorah payment link for PSP fees
    const paymentResult = await createPaymentLink({
      customerName: `${lead.first_name_ar || ""} ${lead.last_name_ar || ""}`,
      customerEmail: lead.email || undefined,
      customerMobile: lead.phone,
      customerCivilId: leadCivilId,
      invoiceValue: amount,
      displayCurrencyIso: "KWD",
      language: "en",
      customerReference: `PSP-${leadId}`,
      callBackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/psp/webhook`,
      errorUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/psp/webhook?error=true`,
    })

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: paymentResult.error || "Failed to create payment link" },
        { status: 500 }
      )
    }

    // If there's an existing pending payment, update it instead of creating new
    if (existingPayment && existingPayment.status === "pending") {
      const { error: updateError } = await supabase
        .from("payment_transactions")
        .update({
          amount: amount,
          myfatoorah_invoice_id: paymentResult.invoiceId,
          myfatoorah_invoice_url: paymentResult.invoiceUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingPayment.id)

      if (updateError) {
        console.error("[PSP Payment] Failed to update transaction:", updateError)
      }

      return NextResponse.json({
        success: true,
        transactionId: existingPayment.id,
        invoiceId: paymentResult.invoiceId,
        invoiceUrl: paymentResult.invoiceUrl,
        updated: true,
      })
    }

    // Create payment transaction record
    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .insert({
        lead_id: leadId,
        amount: amount,
        currency: "KWD",
        payment_method: "myfatoorah",
        status: "pending",
        civil_id: leadCivilId,
        myfatoorah_invoice_id: paymentResult.invoiceId,
        myfatoorah_invoice_url: paymentResult.invoiceUrl,
        notes: "PSP Fee Payment",
        created_by: user.id,
      })
      .select()
      .single()

    if (txError) {
      console.error("[PSP Payment] Failed to create transaction:", txError)
      return NextResponse.json(
        { error: "Failed to create payment transaction" },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.from("activities").insert({
      lead_id: leadId,
      activity_type: "psp_fee_link_created",
      title: "PSP Fee Payment Link Created",
      description: `Payment link for ${amount} KWD PSP fees created via MyFatoorah`,
      metadata: {
        transaction_id: transaction.id,
        invoice_id: paymentResult.invoiceId,
        amount: amount,
        fees: fees,
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
    console.error("[PSP Payment Create] Error:", error)
    const errorMessage = "Failed to create payment link"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "psp-payment-create" })
}
