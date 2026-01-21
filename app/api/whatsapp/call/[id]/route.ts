import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// GET /api/whatsapp/call/[id] - Get a specific WhatsApp call interaction
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id } = await params

    const { data: interaction, error } = await supabase
      .from("whatsapp_call_interactions")
      .select(`
        *,
        lead:leads(id, first_name, last_name, phone, email),
        student:students(id, first_name, last_name, phone, email),
        agent:profiles(id, full_name, email)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching WhatsApp call interaction:", error)
      return NextResponse.json(
        { error: "Failed to fetch call interaction" },
        { status: 500 }
      )
    }

    if (!interaction) {
      return NextResponse.json(
        { error: "Call interaction not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(interaction)
  } catch (error) {
    console.error("Error in GET /api/whatsapp/call/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT /api/whatsapp/call/[id] - Update a WhatsApp call interaction (e.g., log outcome)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id } = await params
    const body = await request.json()

    const {
      outcome,
      duration_seconds,
      notes,
    } = body

    // Validate outcome if provided
    const validOutcomes = ["answered", "no_answer", "busy", "cancelled", "completed"]
    if (outcome && !validOutcomes.includes(outcome)) {
      return NextResponse.json(
        { error: "Invalid outcome value" },
        { status: 400 }
      )
    }

    // Update interaction
    const { data: interaction, error } = await supabase
      .from("whatsapp_call_interactions")
      .update({
        outcome,
        duration_seconds,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(`
        *,
        lead:leads(id, first_name, last_name, phone),
        agent:profiles(id, full_name, email)
      `)
      .single()

    if (error) {
      console.error("Error updating WhatsApp call interaction:", error)
      return NextResponse.json(
        { error: "Failed to update call interaction" },
        { status: 500 }
      )
    }

    if (!interaction) {
      return NextResponse.json(
        { error: "Call interaction not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(interaction)
  } catch (error) {
    console.error("Error in PUT /api/whatsapp/call/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/whatsapp/call/[id] - Delete a WhatsApp call interaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id } = await params

    const { error } = await supabase
      .from("whatsapp_call_interactions")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting WhatsApp call interaction:", error)
      return NextResponse.json(
        { error: "Failed to delete call interaction" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/whatsapp/call/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
