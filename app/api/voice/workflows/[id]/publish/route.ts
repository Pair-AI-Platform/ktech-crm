import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// POST - Publish a workflow
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const body = await request.json().catch(() => ({}))

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch current workflow with all data
    const { data: workflow, error: fetchError } = await supabase
      .from("voice_workflows")
      .select(`
        *,
        steps:voice_workflow_steps(
          *,
          conditions:voice_workflow_conditions(*)
        )
      `)
      .eq("id", id)
      .single()

    if (fetchError || !workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
    }

    // Validate workflow before publishing
    const validationErrors = validateWorkflow(workflow)
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Workflow validation failed", details: validationErrors },
        { status: 400 }
      )
    }

    // Increment version
    const newVersion = workflow.version + 1

    // Create version snapshot
    const { error: versionError } = await supabase
      .from("voice_workflow_versions")
      .insert({
        workflow_id: id,
        version: newVersion,
        workflow_snapshot: {
          id: workflow.id,
          name: workflow.name,
          name_ar: workflow.name_ar,
          description: workflow.description,
          modality: workflow.modality,
          system_prompt_override: workflow.system_prompt_override,
          tags: workflow.tags,
        },
        steps_snapshot: workflow.steps || [],
        conditions_snapshot: workflow.steps?.flatMap((s: { conditions?: unknown[] }) => s.conditions || []) || [],
        change_notes: body.change_notes || `Published version ${newVersion}`,
        published_at: new Date().toISOString(),
        published_by: user.id,
      })

    if (versionError) {
      console.error("[Workflow] Version snapshot error:", versionError)
      // Don't fail, continue with publish
    }

    // Update workflow status to published
    const { data: updatedWorkflow, error: updateError } = await supabase
      .from("voice_workflows")
      .update({
        status: "published",
        version: newVersion,
        published_version: newVersion,
        published_at: new Date().toISOString(),
        published_by: user.id,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(`
        *,
        steps:voice_workflow_steps(
          *,
          conditions:voice_workflow_conditions(*)
        )
      `)
      .single()

    if (updateError) {
      console.error("[Workflow] Publish error:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      ...updatedWorkflow,
      message: `Workflow published successfully as version ${newVersion}`,
    })
  } catch (error) {
    console.error("[Workflow] Unexpected error:", error)
    return NextResponse.json(
      { error: "Failed to publish workflow" },
      { status: 500 }
    )
  }
}

// Validate workflow before publishing
function validateWorkflow(workflow: {
  name?: string
  steps?: Array<{
    name?: string
    message?: string
    is_entry_point?: boolean
    conditions?: Array<{
      target_step_id?: string
    }>
  }>
}): string[] {
  const errors: string[] = []

  // Check workflow has a name
  if (!workflow.name?.trim()) {
    errors.push("Workflow must have a name")
  }

  // Check workflow has at least one step
  if (!workflow.steps || workflow.steps.length === 0) {
    errors.push("Workflow must have at least one step")
  } else {
    // Check for entry point
    const hasEntryPoint = workflow.steps.some(s => s.is_entry_point)
    if (!hasEntryPoint) {
      errors.push("Workflow must have at least one entry point step")
    }

    // Check each step has a message
    workflow.steps.forEach((step, index) => {
      if (!step.message?.trim()) {
        errors.push(`Step ${index + 1} (${step.name || "Unnamed"}) must have a message`)
      }
    })

    // Check for orphaned conditions (pointing to non-existent steps)
    const stepIds = new Set(workflow.steps.map(s => (s as { id?: string }).id).filter(Boolean))
    workflow.steps.forEach((step) => {
      step.conditions?.forEach((condition, condIndex) => {
        if (condition.target_step_id && !stepIds.has(condition.target_step_id)) {
          errors.push(
            `Step "${step.name}" condition ${condIndex + 1} references non-existent step`
          )
        }
      })
    })
  }

  return errors
}
