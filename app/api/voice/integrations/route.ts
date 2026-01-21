import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// GET - List all available workflow integrations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)

    const category = searchParams.get("category")
    const actionType = searchParams.get("action_type")

    let query = supabase
      .from("voice_workflow_integrations")
      .select("*")
      .eq("is_active", true)
      .order("category")
      .order("display_name")

    if (category) {
      query = query.eq("category", category)
    }

    if (actionType) {
      query = query.eq("action_type", actionType)
    }

    const { data, error } = await query

    if (error) {
      console.error("[Integrations] List error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by category for easier consumption
    const grouped = (data || []).reduce((acc, integration) => {
      const cat = integration.category
      if (!acc[cat]) {
        acc[cat] = []
      }
      acc[cat].push(integration)
      return acc
    }, {} as Record<string, typeof data>)

    return NextResponse.json({
      integrations: data || [],
      grouped,
      categories: Object.keys(grouped),
    })
  } catch (error) {
    console.error("[Integrations] Unexpected error:", error)
    return NextResponse.json(
      { error: "Failed to fetch integrations" },
      { status: 500 }
    )
  }
}
