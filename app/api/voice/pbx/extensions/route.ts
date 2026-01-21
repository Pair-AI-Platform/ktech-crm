import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// GET /api/voice/pbx/extensions - List all extensions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: extensions, error } = await supabase
      .from("pbx_extensions")
      .select(`
        *,
        agent:profiles(id, full_name, email, avatar_url)
      `)
      .eq("is_active", true)
      .order("extension_number", { ascending: true })

    if (error) {
      console.error("Error fetching extensions:", error)
      return NextResponse.json(
        { error: "Failed to fetch extensions" },
        { status: 500 }
      )
    }

    return NextResponse.json({ extensions: extensions || [] })
  } catch (error) {
    console.error("Error in GET /api/voice/pbx/extensions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/voice/pbx/extensions - Create a new extension
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    const {
      extension_number,
      agent_id,
      display_name,
      department,
      ring_timeout_seconds = 30,
      voicemail_enabled = true,
      voicemail_greeting_url,
      simultaneous_calls = 1,
    } = body

    // Validate required fields
    if (!extension_number) {
      return NextResponse.json(
        { error: "Extension number is required" },
        { status: 400 }
      )
    }

    // Check if extension number already exists
    const { data: existing } = await supabase
      .from("pbx_extensions")
      .select("id")
      .eq("extension_number", extension_number)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: "Extension number already exists" },
        { status: 400 }
      )
    }

    // Create extension
    const { data: extension, error } = await supabase
      .from("pbx_extensions")
      .insert({
        extension_number,
        agent_id,
        display_name,
        department,
        ring_timeout_seconds,
        voicemail_enabled,
        voicemail_greeting_url,
        simultaneous_calls,
        is_active: true,
      })
      .select(`
        *,
        agent:profiles(id, full_name, email, avatar_url)
      `)
      .single()

    if (error) {
      console.error("Error creating extension:", error)
      return NextResponse.json(
        { error: "Failed to create extension" },
        { status: 500 }
      )
    }

    return NextResponse.json(extension, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/voice/pbx/extensions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
