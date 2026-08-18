import { NextResponse } from "next/server"
import { generateRandomHex } from "@/lib/crypto-utils"
import { withApiHandler } from "@/lib/api-handler"
import { requireLeadOwnership } from "@/lib/auth/lead-ownership"
import { getMissingPspSelfServiceFields } from "@/lib/psp/self-service-requirements"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { getArabicLeadNameParts } from "@/lib/lead-name-policy"
import { sendWhatsAppMessage } from "@/lib/twilio/edge-client"


const TOKEN_TTL_DAYS = 7

/**
 * Generates a fresh PSP self-service token (rotates any existing) and
 * sends the URL to the lead via WhatsApp using the existing Twilio
 * integration. Logs the message in whatsapp_messages for audit.
 *
 * Auth: admin or the lead's assigned agent.
 */
export const POST = withApiHandler(
  { context: "psp-self-service-send-whatsapp" },
  async ({ req, supabase, user, profile, logger }) => {
    let body: { leadId?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const { leadId } = body
    if (!leadId) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 })
    }

    const ownershipBlock = await requireLeadOwnership(
      supabase,
      { userId: user.id, role: profile?.role },
      leadId,
    )
    if (ownershipBlock) return ownershipBlock

    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select("id, first_name, last_name, first_name_ar, civil_id, phone, education_type")
      .eq("id", leadId)
      .single()

    if (leadErr || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }
    const missingFields = getMissingPspSelfServiceFields(lead)
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Complete ${missingFields.join(", ")} before sending the self-service link.` },
        { status: 400 },
      )
    }

    const service = createServiceRoleClient()

    // Rotate active tokens for the lead so older links die immediately.
    const nowIso = new Date().toISOString()
    await service
      .from("psp_self_service_tokens")
      .update({ expires_at: nowIso })
      .eq("lead_id", leadId)
      .gt("expires_at", nowIso)

    const token = generateRandomHex(32)
    const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()

    const { error: insertErr } = await service.from("psp_self_service_tokens").insert({
      token,
      lead_id: leadId,
      expires_at: expiresAt,
      created_by: user.id,
    })

    if (insertErr) {
      logger.error("Failed to insert token", { leadId, error: insertErr.message })
      return NextResponse.json({ error: "Failed to generate link" }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get("origin") || ""
    const url = `${baseUrl}/psp/${token}`

    let formattedPhone = (lead.phone ?? "").replace(/\D/g, "")
    if (!formattedPhone.startsWith("965")) {
      formattedPhone = `965${formattedPhone}`
    }
    const whatsappTo = `whatsapp:+${formattedPhone}`
    const whatsappFrom = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`

    const { firstName: greetingNameAr } = getArabicLeadNameParts(lead)
    const greetingNameEn = greetingNameAr
    const message = `مرحباً ${greetingNameAr}،

لإكمال طلبك في كلية الكويت التقنية، يرجى تعبئة بياناتك ورفع المستندات المطلوبة من الرابط التالي:

${url}

الرابط صالح لمدة 7 أيام.

---

Hello ${greetingNameEn},

Please complete your KTECH application by filling in your info and uploading the required documents:

${url}

This link is valid for 7 days.

شكراً لكم / Thank you`

    let twilioMessageSid: string | undefined
    let twilioStatus: string | undefined
    try {
      const twilioMessage = await sendWhatsAppMessage({
        body: message,
        from: whatsappFrom,
        to: whatsappTo,
      })
      twilioMessageSid = twilioMessage.sid
      twilioStatus = twilioMessage.status
    } catch (err) {
      logger.error("Twilio send failed", { leadId, error: err instanceof Error ? err.message : String(err) })
      return NextResponse.json({ error: "Failed to send WhatsApp message" }, { status: 500 })
    }

    await service.from("whatsapp_messages").insert({
      twilio_message_sid: twilioMessageSid,
      direction: "outbound",
      from_number: process.env.TWILIO_WHATSAPP_NUMBER,
      to_number: formattedPhone,
      message_body: message,
      status: twilioStatus,
      lead_id: leadId,
      agent_id: user.id,
      sent_at: nowIso,
    })

    await service.from("activities").insert({
      lead_id: leadId,
      activity_type: "psp_self_service_link_sent",
      title: "PSP Self-Service Link Sent",
      description: "PSP self-service link sent to student via WhatsApp.",
      metadata: { url, expires_at: expiresAt, whatsapp_message_sid: twilioMessageSid },
      created_by: user.id,
    })

    logger.info("PSP self-service link sent via WhatsApp", { leadId, expiresAt })
    return NextResponse.json({
      success: true,
      url,
      expires_at: expiresAt,
      message: "Self-service link sent via WhatsApp",
    })
  },
)
