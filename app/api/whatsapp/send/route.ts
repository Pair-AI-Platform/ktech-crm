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
    const body = await request.json()

    const { phone, message, leadId, studentId, templateId, agentId } = body

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
    const twilioMessage = await twilioClient.messages.create({
      body: message,
      from: whatsappFrom,
      to: whatsappTo,
    })

    console.log(`[WhatsApp] Message sent, SID: ${twilioMessage.sid}`)

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
        agent_id: agentId || null,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error("[WhatsApp] Failed to log message:", insertError)
      // Don't fail the request, message was sent successfully
    }

    return NextResponse.json({
      success: true,
      messageSid: twilioMessage.sid,
      status: twilioMessage.status,
    })
  } catch (error: unknown) {
    console.error("[WhatsApp] Send error:", error)

    const errorMessage = error instanceof Error ? error.message : "Failed to send WhatsApp message"

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "whatsapp" })
}
