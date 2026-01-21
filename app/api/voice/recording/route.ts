import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// Handle recording status callback from Twilio
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const formData = await request.formData()

    const callSid = formData.get("CallSid") as string
    const recordingSid = formData.get("RecordingSid") as string
    const recordingUrl = formData.get("RecordingUrl") as string
    const recordingStatus = formData.get("RecordingStatus") as string
    const recordingDuration = formData.get("RecordingDuration") as string

    console.log(`[Recording] Call ${callSid} recording ${recordingStatus}`)

    if (recordingStatus === "completed" && recordingUrl) {
      // Update call record with recording info
      const { error } = await supabase
        .from("calls")
        .update({
          recording_url: `${recordingUrl}.mp3`,
          recording_sid: recordingSid,
          recording_duration_seconds: parseInt(recordingDuration, 10) || 0,
          updated_at: new Date().toISOString(),
        })
        .eq("twilio_call_sid", callSid)

      if (error) {
        console.error("[Recording] Failed to update call:", error)
      } else {
        console.log(`[Recording] Updated call ${callSid} with recording`)

        // Optionally trigger transcription here
        // await triggerTranscription(callSid, `${recordingUrl}.mp3`)
      }
    }

    return NextResponse.json({ status: "ok" })
  } catch (error) {
    console.error("[Recording] Error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok" })
}
