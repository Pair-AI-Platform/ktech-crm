import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { VoiceWorkflow, VoiceWorkflowStep, WorkflowStatus } from "@/types"

// GET - List all workflows with optional filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get("status") as WorkflowStatus | null
    const search = searchParams.get("search")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("voice_workflows")
      .select(`
        *,
        steps:voice_workflow_steps(
          *,
          conditions:voice_workflow_conditions(*)
        ),
        created_by_profile:profiles!voice_workflows_created_by_fkey(id, full_name, avatar_url)
      `)
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq("status", status)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error("[Workflows] List error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      workflows: data || [],
      total: count || data?.length || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error("[Workflows] Unexpected error:", error)
    return NextResponse.json(
      { error: "Failed to fetch workflows" },
      { status: 500 }
    )
  }
}

// POST - Create a new workflow
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      name,
      name_ar,
      description,
      description_ar,
      modality = "voice",
      voice_agent_config_id,
      system_prompt_override,
      tags,
      steps = [],
    } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    // Create workflow
    const { data: workflow, error: workflowError } = await supabase
      .from("voice_workflows")
      .insert({
        name,
        name_ar,
        description,
        description_ar,
        modality,
        voice_agent_config_id,
        system_prompt_override,
        tags,
        status: "draft",
        version: 1,
        is_default: false,
        is_active: true,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (workflowError) {
      console.error("[Workflows] Create error:", workflowError)
      return NextResponse.json({ error: workflowError.message }, { status: 500 })
    }

    // Create steps if provided
    if (steps.length > 0) {
      const stepsToInsert = steps.map((step: Partial<VoiceWorkflowStep>, index: number) => ({
        workflow_id: workflow.id,
        step_number: index + 1,
        name: step.name || `Step ${index + 1}`,
        name_ar: step.name_ar,
        position_x: step.position_x || 250,
        position_y: step.position_y || index * 150 + 50,
        message: step.message || "",
        message_ar: step.message_ar,
        is_entry_point: index === 0,
        is_terminal: false,
        step_type: step.step_type || "message",
        wait_for_response: step.wait_for_response ?? true,
        timeout_seconds: step.timeout_seconds || 30,
        max_retries: step.max_retries || 2,
      }))

      const { error: stepsError } = await supabase
        .from("voice_workflow_steps")
        .insert(stepsToInsert)

      if (stepsError) {
        console.error("[Workflows] Create steps error:", stepsError)
        // Don't fail the whole request, just log the error
      }
    }

    // Fetch the complete workflow with steps
    const { data: completeWorkflow } = await supabase
      .from("voice_workflows")
      .select(`
        *,
        steps:voice_workflow_steps(
          *,
          conditions:voice_workflow_conditions(*)
        )
      `)
      .eq("id", workflow.id)
      .single()

    return NextResponse.json(completeWorkflow, { status: 201 })
  } catch (error) {
    console.error("[Workflows] Unexpected error:", error)
    return NextResponse.json(
      { error: "Failed to create workflow" },
      { status: 500 }
    )
  }
}
