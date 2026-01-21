import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// GET - Fetch a single workflow with all steps and conditions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()

    const { data: workflow, error } = await supabase
      .from("voice_workflows")
      .select(`
        *,
        steps:voice_workflow_steps(
          *,
          conditions:voice_workflow_conditions(*)
        ),
        created_by_profile:profiles!voice_workflows_created_by_fkey(id, full_name, avatar_url),
        voice_agent_config:voice_agent_configs(*)
      `)
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
      }
      console.error("[Workflow] Fetch error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Sort steps by step_number
    if (workflow.steps) {
      workflow.steps.sort((a: { step_number: number }, b: { step_number: number }) => a.step_number - b.step_number)
      // Sort conditions by priority within each step
      workflow.steps.forEach((step: { conditions?: { priority: number }[] }) => {
        if (step.conditions) {
          step.conditions.sort((a, b) => a.priority - b.priority)
        }
      })
    }

    return NextResponse.json(workflow)
  } catch (error) {
    console.error("[Workflow] Unexpected error:", error)
    return NextResponse.json(
      { error: "Failed to fetch workflow" },
      { status: 500 }
    )
  }
}

// PUT - Update a workflow and its steps/conditions
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      modality,
      voice_agent_config_id,
      system_prompt_override,
      tags,
      is_active,
      is_default,
      steps,
    } = body

    // Update workflow metadata
    const { error: workflowError } = await supabase
      .from("voice_workflows")
      .update({
        name,
        name_ar,
        description,
        description_ar,
        modality,
        voice_agent_config_id,
        system_prompt_override,
        tags,
        is_active,
        is_default,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (workflowError) {
      console.error("[Workflow] Update error:", workflowError)
      return NextResponse.json({ error: workflowError.message }, { status: 500 })
    }

    // Update steps if provided
    if (steps) {
      // Get existing steps
      const { data: existingSteps } = await supabase
        .from("voice_workflow_steps")
        .select("id")
        .eq("workflow_id", id)

      const existingStepIds = new Set(existingSteps?.map(s => s.id) || [])
      const newStepIds = new Set(steps.filter((s: { id?: string }) => s.id).map((s: { id: string }) => s.id))

      // Delete removed steps
      const stepsToDelete = [...existingStepIds].filter(id => !newStepIds.has(id))
      if (stepsToDelete.length > 0) {
        await supabase
          .from("voice_workflow_steps")
          .delete()
          .in("id", stepsToDelete)
      }

      // Upsert steps
      for (const step of steps) {
        const stepData = {
          workflow_id: id,
          step_number: step.step_number,
          name: step.name,
          name_ar: step.name_ar,
          position_x: step.position_x,
          position_y: step.position_y,
          message: step.message,
          message_ar: step.message_ar,
          is_entry_point: step.is_entry_point,
          is_terminal: step.is_terminal,
          step_type: step.step_type || "message",
          wait_for_response: step.wait_for_response,
          timeout_seconds: step.timeout_seconds,
          timeout_action: step.timeout_action,
          max_retries: step.max_retries,
          retry_message: step.retry_message,
          retry_message_ar: step.retry_message_ar,
          metadata: step.metadata,
        }

        if (step.id && existingStepIds.has(step.id)) {
          // Update existing step
          const { error: stepError } = await supabase
            .from("voice_workflow_steps")
            .update(stepData)
            .eq("id", step.id)

          if (stepError) {
            console.error("[Workflow] Update step error:", stepError)
          }

          // Update conditions for this step
          if (step.conditions) {
            await updateStepConditions(supabase, step.id, step.conditions)
          }
        } else {
          // Insert new step
          const { data: newStep, error: stepError } = await supabase
            .from("voice_workflow_steps")
            .insert(stepData)
            .select()
            .single()

          if (stepError) {
            console.error("[Workflow] Insert step error:", stepError)
          } else if (step.conditions && newStep) {
            // Insert conditions for new step
            await updateStepConditions(supabase, newStep.id, step.conditions)
          }
        }
      }
    }

    // Fetch updated workflow
    const { data: updatedWorkflow } = await supabase
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

    return NextResponse.json(updatedWorkflow)
  } catch (error) {
    console.error("[Workflow] Unexpected error:", error)
    return NextResponse.json(
      { error: "Failed to update workflow" },
      { status: 500 }
    )
  }
}

// DELETE - Archive a workflow (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if hard delete is requested
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get("hard") === "true"

    if (hardDelete) {
      // Hard delete - cascade will handle steps and conditions
      const { error } = await supabase
        .from("voice_workflows")
        .delete()
        .eq("id", id)

      if (error) {
        console.error("[Workflow] Delete error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      // Soft delete - archive the workflow
      const { error } = await supabase
        .from("voice_workflows")
        .update({
          status: "archived",
          is_active: false,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) {
        console.error("[Workflow] Archive error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Workflow] Unexpected error:", error)
    return NextResponse.json(
      { error: "Failed to delete workflow" },
      { status: 500 }
    )
  }
}

// Helper function to update conditions for a step
async function updateStepConditions(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  stepId: string,
  conditions: Array<{
    id?: string
    priority?: number
    condition_label: string
    condition_label_ar?: string
    condition_type: string
    condition_config?: Record<string, unknown>
    action_type: string
    action_value?: string
    action_config?: Record<string, unknown>
    target_step_id?: string
    metadata?: Record<string, unknown>
  }>
) {
  // Get existing conditions
  const { data: existingConditions } = await supabase
    .from("voice_workflow_conditions")
    .select("id")
    .eq("step_id", stepId)

  const existingConditionIds = new Set(existingConditions?.map(c => c.id) || [])
  const newConditionIds = new Set(conditions.filter(c => c.id).map(c => c.id))

  // Delete removed conditions
  const conditionsToDelete = [...existingConditionIds].filter(id => !newConditionIds.has(id))
  if (conditionsToDelete.length > 0) {
    await supabase
      .from("voice_workflow_conditions")
      .delete()
      .in("id", conditionsToDelete)
  }

  // Upsert conditions
  for (let i = 0; i < conditions.length; i++) {
    const condition = conditions[i]
    const conditionData = {
      step_id: stepId,
      priority: condition.priority ?? i,
      condition_label: condition.condition_label,
      condition_label_ar: condition.condition_label_ar,
      condition_type: condition.condition_type,
      condition_config: condition.condition_config,
      action_type: condition.action_type,
      action_value: condition.action_value,
      action_config: condition.action_config,
      target_step_id: condition.target_step_id,
      metadata: condition.metadata,
    }

    if (condition.id && existingConditionIds.has(condition.id)) {
      await supabase
        .from("voice_workflow_conditions")
        .update(conditionData)
        .eq("id", condition.id)
    } else {
      await supabase
        .from("voice_workflow_conditions")
        .insert(conditionData)
    }
  }
}
