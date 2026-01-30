import { NextRequest, NextResponse } from "next/server"
import twilio from "twilio"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

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

    // Compose PSP fee payment message
    const message = `مرحباً ${lead.first_name}،

لإتمام إجراءات التقديم لبرنامج PSP في كلية الكويت التقنية، يرجى دفع الرسوم المطلوبة (${transaction.amount} د.ك) من خلال الرابط التالي:

${transaction.myfatoorah_invoice_url}

---

Hello ${lead.first_name},

To complete your PSP (PUC Submission Pipeline) application at Kuwait Technical College, please pay the required fees (${transaction.amount} KD) using the following link:

${transaction.myfatoorah_invoice_url}

شكراً لكم / Thank you`

    // Send WhatsApp message
    const twilioMessage = await twilioClient.messages.create({
      body: message,
      from: whatsappFrom,
      to: whatsappTo,
    })

    console.log(`[PSP Payment Link] WhatsApp sent, SID: ${twilioMessage.sid}`)

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
      activity_type: "psp_fee_link_sent",
      title: "PSP Fee Link Sent",
      description: `PSP fee payment link for ${transaction.amount} KWD sent via WhatsApp`,
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
      message: "PSP fee payment link sent via WhatsApp",
    })
  } catch (error: unknown) {
    console.error("[PSP Payment Send Link] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to send payment link"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "psp-payment-send-link" })
}
