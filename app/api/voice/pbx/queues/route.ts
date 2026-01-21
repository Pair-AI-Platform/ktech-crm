import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// GET /api/voice/pbx/queues - List all call queues
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: queues, error } = await supabase
      .from("pbx_call_queues")
      .select(`
        *,
        members:pbx_queue_members(
          id,
          priority,
          penalty,
          is_paused,
          pause_reason,
          agent:profiles(id, full_name, email, avatar_url),
          extension:pbx_extensions(id, extension_number, display_name)
        )
      `)
      .eq("is_active", true)
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching queues:", error)
      return NextResponse.json(
        { error: "Failed to fetch queues" },
        { status: 500 }
      )
    }

    // Get waiting call counts for each queue
    const queueIds = (queues || []).map((q) => q.id)

    const { data: queueCalls } = await supabase
      .from("pbx_queue_calls")
      .select("queue_id, status, entered_at")
      .in("queue_id", queueIds)
      .eq("status", "waiting")

    // Calculate stats for each queue
    const queuesWithStats = (queues || []).map((queue) => {
      const waitingCalls = (queueCalls || []).filter((c) => c.queue_id === queue.id)
      const waitTimes = waitingCalls.map((c) => {
        const entered = new Date(c.entered_at)
        return Math.floor((Date.now() - entered.getTime()) / 1000)
      })

      return {
        ...queue,
        waiting_calls_count: waitingCalls.length,
        avg_wait_time: waitTimes.length > 0
          ? Math.floor(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
          : 0,
        longest_wait: waitTimes.length > 0 ? Math.max(...waitTimes) : 0,
      }
    })

    return NextResponse.json({ queues: queuesWithStats })
  } catch (error) {
    console.error("Error in GET /api/voice/pbx/queues:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/voice/pbx/queues - Create a new call queue
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const {
      name,
      name_ar,
      description,
      strategy = "ring_all",
      max_wait_time_seconds = 600,
      max_queue_size = 50,
      moh_audio_url,
      welcome_message,
      welcome_message_ar,
      welcome_audio_url,
      position_announcement_enabled = true,
      position_announcement_interval_seconds = 60,
      position_announcement_text = "You are number {position} in the queue. Estimated wait time is {wait_time} minutes.",
      position_announcement_text_ar,
      overflow_action = "voicemail",
      overflow_target,
      service_level_seconds = 60,
    } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Queue name is required" },
        { status: 400 }
      )
    }

    // Create queue
    const { data: queue, error } = await supabase
      .from("pbx_call_queues")
      .insert({
        name,
        name_ar,
        description,
        strategy,
        max_wait_time_seconds,
        max_queue_size,
        moh_audio_url,
        welcome_message,
        welcome_message_ar,
        welcome_audio_url,
        position_announcement_enabled,
        position_announcement_interval_seconds,
        position_announcement_text,
        position_announcement_text_ar,
        overflow_action,
        overflow_target,
        service_level_seconds,
        is_active: true,
        created_by: user?.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating queue:", error)
      return NextResponse.json(
        { error: "Failed to create queue" },
        { status: 500 }
      )
    }

    return NextResponse.json(queue, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/voice/pbx/queues:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
