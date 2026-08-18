import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { createLogger } from "@/lib/logger"
import { sendWhatsAppMessage } from "@/lib/twilio/edge-client"


// Transaction amount is read from the database (supports custom amounts)

const logger = createLogger("Send Payment Link")

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
    const { transactionId } = body

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      )
    }

    // Fetch transaction with lead details
    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .select(`
        *,
        lead:leads(id, first_name, last_name, phone)
      `)
      .eq("id", transactionId)
      .single()

    if (txError || !transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      )
    }

    if (!transaction.myfatoorah_invoice_url) {
      return NextResponse.json(
        { error: "No payment link found for this transaction" },
        { status: 400 }
      )
    }

    const lead = transaction.lead
    if (!lead?.phone) {
      return NextResponse.json(
        { error: "Lead phone number not found" },
        { status: 400 }
      )
    }

    // Format phone number for WhatsApp
    let formattedPhone = lead.phone.replace(/\D/g, "")
    if (!formattedPhone.startsWith("965") && !formattedPhone.startsWith("+")) {
      formattedPhone = `965${formattedPhone}`
    }
    const whatsappTo = `whatsapp:+${formattedPhone}`
    const whatsappFrom = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`

    // Compose payment message
    const message = `مرحباً ${lead.first_name_ar || ""}،

لإتمام عملية التسجيل في كلية الكويت التقنية، يرجى دفع رسوم التسجيل بقيمة ${transaction.amount} د.ك من خلال الرابط التالي:

${transaction.myfatoorah_invoice_url}

---

Hello ${lead.first_name_ar || ""},

To complete your enrollment at Kuwait Technical College, please pay the registration fee of ${transaction.amount} KD using the following link:

${transaction.myfatoorah_invoice_url}

شكراً لكم / Thank you`

    // Send WhatsApp message
    const twilioMessage = await sendWhatsAppMessage({
      body: message,
      from: whatsappFrom,
      to: whatsappTo,
    })

    logger.info("WhatsApp sent", { sid: twilioMessage.sid })

    // Log WhatsApp message
    const { data: messageRecord } = await supabase
      .from("whatsapp_messages")
      .insert({
        twilio_message_sid: twilioMessage.sid,
        direction: "outbound",
        from_number: process.env.TWILIO_WHATSAPP_NUMBER,
        to_number: formattedPhone,
        message_body: message,
        status: twilioMessage.status,
        lead_id: lead.id,
        agent_id: user.id,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single()

    // Update transaction with WhatsApp info
    await supabase
      .from("payment_transactions")
      .update({
        whatsapp_message_id: messageRecord?.id,
        whatsapp_sent_at: new Date().toISOString(),
      })
      .eq("id", transactionId)

    // Log activity
    await supabase.from("activities").insert({
      lead_id: lead.id,
      activity_type: "payment_link_sent",
      title: "Payment Link Sent",
      description: `Payment link for ${transaction.amount} KWD sent via WhatsApp`,
      metadata: {
        transaction_id: transactionId,
        whatsapp_message_sid: twilioMessage.sid,
        invoice_url: transaction.myfatoorah_invoice_url,
      },
      created_by: user.id,
    })

    return NextResponse.json({
      success: true,
      messageSid: twilioMessage.sid,
      message: "Payment link sent via WhatsApp",
    })
  } catch (error: unknown) {
    console.error("[Send Payment Link] Error:", error)
    const errorMessage = "Failed to send payment link"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "send-payment-link" })
}
