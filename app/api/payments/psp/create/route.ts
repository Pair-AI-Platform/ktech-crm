import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createPaymentLink, validateCivilId } from "@/lib/myfatoorah/client"

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
    const { leadId, amount, fees, civilId } = body

    // Validate required fields
    if (!leadId) {
      return NextResponse.json(
        { error: "Lead ID is required" },
        { status: 400 }
      )
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 }
      )
    }

    // Fetch lead details
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, first_name, last_name, phone, email, civil_id")
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
      customerName: `${lead.first_name} ${lead.last_name}`,
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
    const errorMessage = error instanceof Error ? error.message : "Failed to create payment link"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "psp-payment-create" })
}
