import { NextRequest, NextResponse } from "next/server"
import twilio from "twilio"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PUC_FEE_AMOUNT } from "@/types"

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

    // Fetch transaction with student details
    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .select(`
        *,
        student:students(id, first_name, last_name, phone)
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

    const student = transaction.student
    if (!student?.phone) {
      return NextResponse.json(
        { error: "Student phone number not found" },
        { status: 400 }
      )
    }

    // Format phone number for WhatsApp
    let formattedPhone = student.phone.replace(/\D/g, "")
    if (!formattedPhone.startsWith("965") && !formattedPhone.startsWith("+")) {
      formattedPhone = `965${formattedPhone}`
    }
    const whatsappTo = `whatsapp:+${formattedPhone}`
    const whatsappFrom = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`

    // Compose PUC fee payment message
    const message = `مرحباً ${student.first_name}،

لإتمام متطلبات ديوان الخدمة المدنية (PUC) في كلية الكويت التقنية، يرجى دفع رسوم ${PUC_FEE_AMOUNT} د.ك من خلال الرابط التالي:

${transaction.myfatoorah_invoice_url}

---

Hello ${student.first_name},

To complete the Public Universities Council (PUC) requirements at Kuwait Technical College, please pay the ${PUC_FEE_AMOUNT} KD fee using the following link:

${transaction.myfatoorah_invoice_url}

شكراً لكم / Thank you`

    // Send WhatsApp message
    const twilioMessage = await twilioClient.messages.create({
      body: message,
      from: whatsappFrom,
      to: whatsappTo,
    })

    console.log(`[PUC Fee Link] WhatsApp sent, SID: ${twilioMessage.sid}`)

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
        student_id: student.id,
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
      student_id: student.id,
      activity_type: "puc_fee_link_sent",
      title: "PUC Fee Link Sent",
      description: `PUC fee payment link for ${PUC_FEE_AMOUNT} KWD sent via WhatsApp`,
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
      message: "PUC fee payment link sent via WhatsApp",
    })
  } catch (error: unknown) {
    console.error("[PUC Fee Send Link] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to send payment link"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "puc-fee-send-link" })
}
