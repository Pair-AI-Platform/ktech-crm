import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// GET /api/whatsapp/call - Get WhatsApp call history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)

    const leadId = searchParams.get("lead_id")
    const agentId = searchParams.get("agent_id")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("whatsapp_call_interactions")
      .select(`
        *,
        lead:leads(id, first_name, last_name, phone),
        student:students(id, first_name, last_name, phone),
        agent:profiles(id, full_name, email)
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (leadId) {
      query = query.eq("lead_id", leadId)
    }

    if (agentId) {
      query = query.eq("agent_id", agentId)
    }

    const { data: interactions, error, count } = await query

    if (error) {
      console.error("Error fetching WhatsApp call interactions:", error)
      return NextResponse.json(
        { error: "Failed to fetch call history" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      interactions: interactions || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error in GET /api/whatsapp/call:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/whatsapp/call - Log a WhatsApp call interaction
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const {
      lead_id,
      student_id,
      phone_number,
      interaction_type,
      notes,
    } = body

    // Validate required fields
    if (!phone_number) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      )
    }

    if (!interaction_type) {
      return NextResponse.json(
        { error: "Interaction type is required" },
        { status: 400 }
      )
    }

    // Format phone number
    let formattedPhone = phone_number.replace(/\D/g, "")
    if (!formattedPhone.startsWith("965") && formattedPhone.length === 8) {
      formattedPhone = `965${formattedPhone}`
    }

    // Generate WhatsApp link
    const whatsappLink = `https://wa.me/${formattedPhone}`

    // Create interaction record
    const { data: interaction, error } = await supabase
      .from("whatsapp_call_interactions")
      .insert({
        lead_id,
        student_id,
        agent_id: user?.id,
        phone_number: formattedPhone,
        interaction_type,
        whatsapp_link: whatsappLink,
        notes,
      })
      .select(`
        *,
        lead:leads(id, first_name, last_name, phone),
        agent:profiles(id, full_name, email)
      `)
      .single()

    if (error) {
      console.error("Error creating WhatsApp call interaction:", error)
      return NextResponse.json(
        { error: "Failed to log call interaction" },
        { status: 500 }
      )
    }

    return NextResponse.json(interaction, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/whatsapp/call:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
