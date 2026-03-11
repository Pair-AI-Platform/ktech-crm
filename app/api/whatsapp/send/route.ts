import { NextResponse } from "next/server"
import twilio from "twilio"
import { withApiHandler } from "@/lib/api-handler"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"

// Lazy-initialize Twilio client
function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token) throw new Error('Twilio credentials not configured')
  return twilio(sid, token)
}

export const POST = withApiHandler(
  { context: 'whatsapp-send' },
  async ({ req, supabase, user, logger }) => {
    const rateLimitResult = await rateLimit(`whatsapp:${user.id}`, RATE_LIMITS.whatsapp)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.resetIn / 1000)) } }
      )
    }

    const body = await req.json()

    const { phone, message, leadId, studentId, templateId } = body

    // Validate required fields
    if (!phone || !message) {
      return NextResponse.json(
        { error: "Phone number and message are required" },
        { status: 400 }
      )
    }

    // Format phone number for WhatsApp (Kuwait country code)
    let formattedPhone = phone.replace(/\D/g, "")
    if (!formattedPhone.startsWith("965") && !formattedPhone.startsWith("+")) {
      formattedPhone = `965${formattedPhone}`
    }
    const whatsappTo = `whatsapp:+${formattedPhone}`
    const whatsappFrom = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`

    // Send WhatsApp message via Twilio
    const twilioMessage = await getTwilioClient().messages.create({
      body: message,
      from: whatsappFrom,
      to: whatsappTo,
    })

    logger.info(`WhatsApp message sent`, { sid: twilioMessage.sid })

    // Log the message to database
    const { error: insertError } = await supabase
      .from("whatsapp_messages")
      .insert({
        twilio_message_sid: twilioMessage.sid,
        direction: "outbound",
        from_number: process.env.TWILIO_WHATSAPP_NUMBER,
        to_number: formattedPhone,
        message_body: message,
        status: twilioMessage.status,
        lead_id: leadId || null,
        student_id: studentId || null,
        template_id: templateId || null,
        agent_id: user.id,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      logger.warn("Failed to log WhatsApp message", { error: insertError.message })
      // Don't fail the request, message was sent successfully
    }

    return NextResponse.json({
      success: true,
      messageSid: twilioMessage.sid,
      status: twilioMessage.status,
    })
  }
)

export async function GET() {
  return NextResponse.json({ status: "ok", service: "whatsapp" })
}
