import { NextRequest, NextResponse } from "next/server"
import twilio from "twilio"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const AccessToken = twilio.jwt.AccessToken
const VoiceGrant = AccessToken.VoiceGrant

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Verify authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { agentId } = body

    // Verify the agent ID matches the authenticated user
    if (agentId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get Twilio credentials from environment
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const apiKey = process.env.TWILIO_API_KEY
    const apiSecret = process.env.TWILIO_API_SECRET
    const twimlAppSid = process.env.TWILIO_TWIML_APP_SID

    if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
      console.error("[Voice Token] Missing Twilio credentials")
      return NextResponse.json(
        { error: "Voice service not configured" },
        { status: 500 }
      )
    }

    // Create a unique identity for this agent
    const identity = `agent_${agentId}`

    // Create access token
    const token = new AccessToken(accountSid, apiKey, apiSecret, {
      identity,
      ttl: 3600, // 1 hour
    })

    // Create voice grant
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true,
    })

    token.addGrant(voiceGrant)

    // Update agent voice settings
    await supabase
      .from("agent_voice_settings")
      .upsert({
        agent_id: agentId,
        twilio_identity: identity,
        is_available: true,
        last_heartbeat: new Date().toISOString(),
      }, {
        onConflict: "agent_id",
      })

    console.log(`[Voice Token] Generated token for agent: ${identity}`)

    return NextResponse.json({
      token: token.toJwt(),
      identity,
    })
  } catch (error) {
    console.error("[Voice Token] Error:", error)
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    )
  }
}
