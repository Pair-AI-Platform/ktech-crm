import { NextResponse } from "next/server"
import { withApiHandler } from "@/lib/api-handler"

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
      .select("id, first_name, last_name, phone, email, civil_id")
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
