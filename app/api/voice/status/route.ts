import { NextRequest, NextResponse } from "next/server"
import twilio from "twilio"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const VoiceResponse = twilio.twiml.VoiceResponse

// Map Twilio status to our call status
const STATUS_MAP: Record<string, string> = {
  queued: "initiated",
  ringing: "ringing",
  "in-progress": "in_progress",
  completed: "completed",
  busy: "busy",
  failed: "failed",
  "no-answer": "no_answer",
  canceled: "failed",
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const formData = await request.formData()

    // Extract Twilio status parameters
    const callSid = formData.get("CallSid") as string
    const parentCallSid = formData.get("ParentCallSid") as string
    const callStatus = formData.get("CallStatus") as string
    const callDuration = formData.get("CallDuration") as string
    const dialCallStatus = formData.get("DialCallStatus") as string
    const recordingUrl = formData.get("RecordingUrl") as string
    const recordingSid = formData.get("RecordingSid") as string

    // Use dial call status if available (for completed dial legs)
    const status = dialCallStatus || callStatus
    const mappedStatus = STATUS_MAP[status] || status

    console.log(`[Status] Call ${callSid} status: ${status} -> ${mappedStatus}`)

    // Find the call record
    const { data: call } = await supabase
      .from("calls")
      .select("id, status, started_at")
      .or(`twilio_call_sid.eq.${callSid},twilio_call_sid.eq.${parentCallSid}`)
      .single()

    if (call) {
      // Build update object
      const updates: Record<string, unknown> = {
        status: mappedStatus,
        updated_at: new Date().toISOString(),
      }

      // Add duration if call completed
      if (callDuration) {
        updates.duration_seconds = parseInt(callDuration, 10)
        updates.ended_at = new Date().toISOString()
      }

      // Add answered timestamp for in-progress calls
      if (mappedStatus === "in_progress" && !call.status?.includes("in_progress")) {
        updates.answered_at = new Date().toISOString()
      }

      // Add recording URL if available
      if (recordingUrl) {
        updates.recording_url = recordingUrl
        updates.recording_sid = recordingSid
      }

      // Update the call record
      await supabase
        .from("calls")
        .update(updates)
        .eq("id", call.id)

      console.log(`[Status] Updated call ${call.id}`)
    } else {
      console.log(`[Status] Call record not found for SID: ${callSid}`)
    }

    // Return empty TwiML (required by Twilio)
    const twiml = new VoiceResponse()
    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    })
  } catch (error) {
    console.error("[Status] Error:", error)

    const twiml = new VoiceResponse()
    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    })
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok" })
}
