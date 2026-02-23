import { NextRequest, NextResponse } from "next/server"
import twilio from "twilio"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const VoiceResponse = twilio.twiml.VoiceResponse

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const formData = await request.formData()

    // Extract Twilio parameters
    const callSid = formData.get("CallSid") as string
    const from = formData.get("From") as string
    const to = formData.get("To") as string

    console.log(`[Inbound] Call from ${from} to ${to}, SID: ${callSid}`)

    // Normalize phone number (remove +965 prefix for lookup)
    const normalizedPhone = from.replace(/^\+965/, "").replace(/\D/g, "")

    // Look up lead by phone number
    const { data: lead } = await supabase
      .from("leads")
      .select("id, first_name, last_name, phone, assigned_to")
      .or(`phone.eq.${normalizedPhone},phone.eq.+965${normalizedPhone}`)
      .single()

    const twiml = new VoiceResponse()

    if (lead?.assigned_to) {
      // Check if assigned agent is available
      const { data: agentSettings } = await supabase
        .from("agent_voice_settings")
        .select("twilio_identity, is_available, last_heartbeat")
        .eq("agent_id", lead.assigned_to)
        .single()

      // Check if agent is online (heartbeat within last 2 minutes)
      const isOnline = agentSettings?.last_heartbeat &&
        new Date(agentSettings.last_heartbeat).getTime() > Date.now() - 120000

      if (agentSettings?.is_available && isOnline) {
        console.log(`[Inbound] Routing to agent: ${agentSettings.twilio_identity}`)

        // Create call record
        await supabase.from("calls").insert({
          twilio_call_sid: callSid,
          direction: "inbound",
          from_number: from,
          to_number: to,
          status: "ringing",
          handler: "human",
          lead_id: lead.id,
          agent_id: lead.assigned_to,
          started_at: new Date().toISOString(),
        })

        // Ring the assigned agent
        const dial = twiml.dial({
          callerId: to,
          timeout: 30,
          action: "/api/voice/status",
          method: "POST",
        })

        dial.client(agentSettings.twilio_identity)

        // If agent doesn't answer, go to AI
        twiml.redirect({ method: "POST" }, "/api/voice/ai-fallback")
      } else {
        // Agent not available - route to AI
        console.log(`[Inbound] Agent not available, routing to AI`)
        await routeToAI(twiml, supabase, callSid, from, to, lead?.id)
      }
    } else {
      // No assigned agent - route to AI
      console.log(`[Inbound] No assigned agent, routing to AI`)
      await routeToAI(twiml, supabase, callSid, from, to, lead?.id)
    }

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    })
  } catch (error) {
    console.error("[Inbound] Error:", error)

    // Return a friendly error message
    const twiml = new VoiceResponse()
    twiml.say(
      { voice: "Polly.Joanna" },
      "We're sorry, we're experiencing technical difficulties. Please try again later."
    )
    twiml.hangup()

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    })
  }
}

async function routeToAI(
  twiml: twilio.twiml.VoiceResponse,
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  callSid: string,
  from: string,
  to: string,
  leadId?: string
) {
  // Create call record for AI handling
  await supabase.from("calls").insert({
    twilio_call_sid: callSid,
    direction: "inbound",
    from_number: from,
    to_number: to,
    status: "in_progress",
    handler: "ai",
    lead_id: leadId || null,
    started_at: new Date().toISOString(),
  })

  // Get AI voice agent config
  const { data: aiConfig } = await supabase
    .from("voice_agent_configs")
    .select("*")
    .eq("is_active", true)
    .single()

  const greeting = aiConfig?.greeting_message ||
    "Hello! Thank you for calling Kuwait Technical College. How can I help you today?"

  // Greet the caller
  twiml.say({ voice: "Polly.Joanna" }, greeting)

  // Gather speech input
  const gather = twiml.gather({
    input: ["speech"],
    speechTimeout: "auto",
    action: "/api/voice/ai-respond",
    method: "POST",
    language: "en-US",
  })

  gather.say(
    { voice: "Polly.Joanna" },
    "Please tell me what I can help you with."
  )

  // If no input, prompt again
  twiml.redirect({ method: "POST" }, "/api/voice/ai-fallback")
}

// Handle GET for Twilio webhook verification
export async function GET() {
  return NextResponse.json({ status: "ok" })
}
