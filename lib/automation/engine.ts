import { createClient } from "@/lib/supabase/client"
import { createClientLogger } from "@/lib/client-logger"
import { tryAcquireAutomationLock, releaseAutomationLock } from "@/lib/automation/lock"
import type { SupabaseClient } from "@supabase/supabase-js"

const logger = createClientLogger("automation-engine")

export type TriggerType = "stage_change" | "lead_created" | "appointment_scheduled" | "payment_received" | "birthday" | "preference_changed"

export interface AutomationContext {
  trigger: TriggerType
  leadId: string
  leadData: Record<string, unknown>
  userId?: string
  metadata?: Record<string, unknown>
}

export interface AutomationRule {
  id: string
  name: string
  description?: string
  trigger_type: TriggerType
  trigger_conditions: Record<string, unknown>
  action_type: "assign_lead" | "create_follow_up" | "create_notification" | "change_stage"
  action_config: Record<string, unknown>
  is_active: boolean
  priority: number
}

export interface AutomationResult {
  ruleId: string
  ruleName: string
  status: "success" | "failed"
  result?: Record<string, unknown>
  error?: string
}

// --- Infinite loop protection ---
// In-memory Set is per-instance only; DB-backed window check below catches
// loops that span instances/tabs.
const executingLeads = new Set<string>()
const MAX_AUTOMATION_DEPTH = 3
const REENTRY_WINDOW_SECONDS = 30
const MAX_EXECUTIONS_IN_WINDOW = 5

/**
 * Looks at recent automation_executions for the same (lead_id, trigger) pair.
 * Returns true if the count exceeds MAX_EXECUTIONS_IN_WINDOW within the
 * REENTRY_WINDOW_SECONDS window — strong signal of a runaway loop.
 */
async function isRunawayLoop(
  supabase: SupabaseClient,
  leadId: string,
  trigger: TriggerType,
): Promise<boolean> {
  const since = new Date(Date.now() - REENTRY_WINDOW_SECONDS * 1000).toISOString()
  const { count, error } = await supabase
    .from("automation_executions")
    .select("id", { count: "exact", head: true })
    .eq("lead_id", leadId)
    .gte("created_at", since)
    .filter("rule_id", "in", `(SELECT id FROM automation_rules WHERE trigger_type = '${trigger}')`)

  if (error) {
    // Best-effort check — don't block automation if this query errors.
    return false
  }
  return (count ?? 0) >= MAX_EXECUTIONS_IN_WINDOW
}

// --- URL helper for server-side fetch ---
function getApiUrl(path: string): string {
  if (typeof window !== "undefined") return path
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  return `${baseUrl}${path}`
}

// --- Runtime config validation ---
function validateConfig<T extends Record<string, unknown>>(
  config: Record<string, unknown>,
  requiredFields: string[]
): config is T {
  return requiredFields.every(field => field in config)
}

function matchesConditions(conditions: Record<string, unknown>, leadData: Record<string, unknown>, metadata?: Record<string, unknown>): boolean {
  for (const [key, value] of Object.entries(conditions)) {
    if (key === "new_stage" && metadata) {
      if (metadata.new_stage !== value) return false
    } else if (key === "old_stage" && metadata) {
      if (metadata.old_stage !== value) return false
    } else if (key === "new_major" && metadata) {
      if (metadata.new_major !== value) return false
    } else if (key === "old_major" && metadata) {
      if (metadata.old_major !== value) return false
    } else if (key === "source") {
      if (leadData.source !== value) return false
    } else if (key === "funding_type") {
      if (leadData.funding_type !== value) return false
    } else if (key === "pipeline_stage") {
      if (leadData.pipeline_stage !== value) return false
    } else {
      // Generic field check
      if (leadData[key] !== value) return false
    }
  }
  return true
}

async function executeAction(
  rule: AutomationRule,
  ctx: AutomationContext,
  supabase: SupabaseClient
): Promise<{ success: boolean; result?: Record<string, unknown>; error?: string }> {
  const { action_type, action_config } = rule

  try {
    switch (action_type) {
      case "create_notification": {
        if (!validateConfig<{ title?: string; body?: string; type?: string }>(action_config, [])) {
          return { success: false, error: "Invalid config for create_notification" }
        }
        const { title, body, type = "system_alert" } = action_config as {
          title?: string
          body?: string
          type?: string
        }
        const targetUserId = (ctx.leadData.assigned_to as string) || ctx.userId
        if (!targetUserId) return { success: false, error: "No target user for notification" }

        const resolvedTitle = (title || "Automation Alert")
          .replace("{lead_name}", `${ctx.leadData.first_name || ""} ${ctx.leadData.last_name || ""}`.trim())
          .replace("{stage}", (ctx.metadata?.new_stage as string) || "")
        const resolvedBody = (body || "")
          .replace("{lead_name}", `${ctx.leadData.first_name || ""} ${ctx.leadData.last_name || ""}`.trim())
          .replace("{stage}", (ctx.metadata?.new_stage as string) || "")

        const { error } = await supabase.from("notifications").insert({
          user_id: targetUserId,
          type,
          title: resolvedTitle,
          body: resolvedBody,
          lead_id: ctx.leadId,
          action_url: `/leads/${ctx.leadId}`,
          created_by: ctx.userId,
        })

        if (error) return { success: false, error: error.message }
        return { success: true, result: { notification_sent_to: targetUserId } }
      }

      case "create_follow_up": {
        if (!validateConfig<{ days_from_now?: number; title?: string; notes?: string }>(action_config, [])) {
          return { success: false, error: "Invalid config for create_follow_up" }
        }
        const { days_from_now = 1, title = "Follow Up", notes = "" } = action_config as {
          days_from_now?: number
          title?: string
          notes?: string
        }
        const targetUserId = (ctx.leadData.assigned_to as string) || ctx.userId
        if (!targetUserId) return { success: false, error: "No target user for follow-up" }

        const dueAt = new Date()
        dueAt.setDate(dueAt.getDate() + days_from_now)
        dueAt.setHours(9, 0, 0, 0)

        const resolvedTitle = title
          .replace("{lead_name}", `${ctx.leadData.first_name || ""} ${ctx.leadData.last_name || ""}`.trim())
        const resolvedNotes = notes
          .replace("{lead_name}", `${ctx.leadData.first_name || ""} ${ctx.leadData.last_name || ""}`.trim())
          .replace("{stage}", (ctx.metadata?.new_stage as string) || "")

        const { error } = await supabase.from("follow_up_reminders").insert({
          lead_id: ctx.leadId,
          assigned_to: targetUserId,
          title: resolvedTitle,
          notes: resolvedNotes,
          due_at: dueAt.toISOString(),
          automation_rule_id: rule.id,
          created_by: ctx.userId,
        })

        if (error) return { success: false, error: error.message }
        return { success: true, result: { follow_up_due: dueAt.toISOString() } }
      }

      case "assign_lead": {
        if (!validateConfig<{ agent_id: string }>(action_config, ["agent_id"])) {
          return { success: false, error: "No agent_id in action config" }
        }
        const { agent_id } = action_config as { agent_id: string }

        const { error } = await supabase
          .from("leads")
          .update({ assigned_to: agent_id })
          .eq("id", ctx.leadId)

        if (error) return { success: false, error: error.message }
        return { success: true, result: { assigned_to: agent_id } }
      }

      case "change_stage": {
        if (!validateConfig<{ target_stage: string }>(action_config, ["target_stage"])) {
          return { success: false, error: "No target_stage in action config" }
        }
        const { target_stage } = action_config as { target_stage: string }

        // Block automated moves to "lost" — lost reason must be chosen manually via the UI dialog
        if (target_stage === "lost") {
          return { success: false, error: "Cannot auto-move to lost stage — lost reason must be selected manually" }
        }

        const oldStage = ctx.leadData.pipeline_stage as string | undefined

        // Parity with updateLeadMutation: shift positions in the target stage
        // so the moved lead lands at the top. Best-effort — if the RPC fails
        // we still proceed with the stage change (position is cosmetic for
        // ordering on the kanban).
        if (oldStage !== target_stage) {
          await supabase.rpc("shift_stage_positions", { target_stage }).then(() => {}, () => {})
        }

        const { error } = await supabase
          .from("leads")
          .update({
            pipeline_stage: target_stage,
            ...(oldStage !== target_stage ? { position_in_stage: 0 } : {}),
          })
          .eq("id", ctx.leadId)

        if (error) return { success: false, error: error.message }

        // Log activity for parity with manual stage changes (which write a
        // 'stage_change' activity from useLeadMutations.updateLeadMutation).
        // Without this, automated moves are invisible in the activity feed.
        await supabase.from("activities").insert({
          lead_id: ctx.leadId,
          activity_type: "stage_change",
          description: `Stage automatically changed${oldStage ? ` from ${oldStage}` : ""} to ${target_stage} by rule "${rule.name}"`,
          metadata: {
            old_stage: oldStage,
            new_stage: target_stage,
            automation_rule_id: rule.id,
            automated: true,
          },
          created_by: ctx.userId,
        })

        // Parity: notify the assigned agent when an automation moves their lead.
        const assignedTo = ctx.leadData.assigned_to as string | undefined
        if (assignedTo && assignedTo !== ctx.userId) {
          await supabase.from("notifications").insert({
            user_id: assignedTo,
            type: "stage_change",
            title: `Lead moved to ${target_stage}`,
            body: `Automation rule "${rule.name}" moved this lead${oldStage ? ` from ${oldStage}` : ""} to ${target_stage}`,
            lead_id: ctx.leadId,
            action_url: `/leads/${ctx.leadId}`,
            created_by: ctx.userId,
          }).then(() => {}, () => {})
        }

        return { success: true, result: { new_stage: target_stage } }
      }

      default:
        return { success: false, error: `Unknown action type: ${action_type}` }
    }
  } catch (err) {
    return { success: false, error: `Action execution error: ${err}` }
  }
}

export async function executeAutomations(
  ctx: AutomationContext,
  supabaseClient?: SupabaseClient,
  depth: number = 0
): Promise<AutomationResult[]> {
  const results: AutomationResult[] = []

  // Infinite loop / re-entry protection — five layers, in priority order:
  //   1) Caller-passed depth (synchronous nested call, rare)
  //   2) In-memory Set (catches re-entry within a single instance)
  //   3) Upstash distributed lock (cross-instance, cross-tab)
  //   4) DB window check (catches loops the lock can't see, e.g. when
  //      Upstash is unconfigured and the loop spans multiple browsers)
  //   5) Action-specific guards (e.g. change_stage refuses 'lost')
  const executionKey = `${ctx.leadId}:${ctx.trigger}`
  if (depth >= MAX_AUTOMATION_DEPTH || executingLeads.has(executionKey)) {
    console.warn(`[Automation] Skipping: max depth or re-entry for ${executionKey}`)
    return results
  }

  const acquired = await tryAcquireAutomationLock(executionKey)
  if (!acquired) {
    console.warn(`[Automation] Skipping: distributed lock held for ${executionKey}`)
    return results
  }

  executingLeads.add(executionKey)
  const supabase = supabaseClient || createClient()

  if (await isRunawayLoop(supabase, ctx.leadId, ctx.trigger)) {
    console.warn(`[Automation] Skipping: runaway-loop window exceeded for ${executionKey}`)
    executingLeads.delete(executionKey)
    await releaseAutomationLock(executionKey)
    return results
  }

  try {
    // Fetch active rules matching this trigger
    const { data: rules, error } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("trigger_type", ctx.trigger)
      .eq("is_active", true)
      .order("priority", { ascending: false })

    if (error || !rules || rules.length === 0) {
      if (error) logger.error("Failed to fetch automation rules", { error: error.message })
      return results
    }

    logger.info(`Found ${rules.length} automation rules for trigger: ${ctx.trigger}`, { leadId: ctx.leadId })

    for (const rule of rules as AutomationRule[]) {
      // Check conditions
      if (!matchesConditions(rule.trigger_conditions, ctx.leadData, ctx.metadata)) {
        continue
      }

      // Execute the action
      const actionResult = await executeAction(rule, ctx, supabase)

      // Log execution (only actual executions, not skipped)
      await supabase.from("automation_executions").insert({
        rule_id: rule.id,
        lead_id: ctx.leadId,
        status: actionResult.success ? "success" : "failed",
        result: actionResult.result || {},
        error_message: actionResult.error,
      })

      const automationResult: AutomationResult = {
        ruleId: rule.id,
        ruleName: rule.name,
        status: actionResult.success ? "success" : "failed",
        result: actionResult.result,
        error: actionResult.error,
      }
      results.push(automationResult)

      if (actionResult.success) {
        logger.info(`Automation "${rule.name}" executed successfully`, { ruleId: rule.id, leadId: ctx.leadId })
      } else {
        logger.error(`Automation "${rule.name}" failed`, { ruleId: rule.id, error: actionResult.error })
      }
    }

    return results
  } catch (err) {
    logger.error("Failed to execute automations", { trigger: ctx.trigger, error: String(err) })
    return results
  } finally {
    executingLeads.delete(executionKey)
    await releaseAutomationLock(executionKey)
  }
}

/**
 * Handles priority change for a lead.
 * When priority is set to important/critical: creates a recurring follow-up reminder.
 * When priority is reset to normal: marks existing recurring reminders as completed.
 */
export async function handlePriorityChange(
  leadId: string,
  priority: "normal" | "important" | "critical",
  assignedTo: string | null,
  userId: string,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || createClient()

  if (priority === "normal") {
    // Mark any existing recurring reminders for this lead as completed
    await supabase
      .from("follow_up_reminders")
      .update({ status: "completed" })
      .eq("lead_id", leadId)
      .eq("is_recurring", true)
      .eq("status", "pending")

    logger.info("Cleared recurring reminders for lead", { leadId })
    return
  }

  const intervalHours = priority === "critical" ? 24 : 48
  const targetUserId = assignedTo || userId

  // Check if a recurring reminder already exists
  const { data: existing } = await supabase
    .from("follow_up_reminders")
    .select("id, recurrence_interval_hours")
    .eq("lead_id", leadId)
    .eq("is_recurring", true)
    .eq("status", "pending")
    .limit(1)

  if (existing && existing.length > 0) {
    // Update existing reminder interval if priority changed
    if (existing[0].recurrence_interval_hours !== intervalHours) {
      await supabase
        .from("follow_up_reminders")
        .update({ recurrence_interval_hours: intervalHours })
        .eq("id", existing[0].id)
    }
    return
  }

  // Create new recurring reminder
  const dueAt = new Date()
  dueAt.setHours(dueAt.getHours() + intervalHours)

  const { error } = await supabase.from("follow_up_reminders").insert({
    lead_id: leadId,
    assigned_to: targetUserId,
    title: `Priority follow-up (${priority})`,
    notes: `Auto-created: lead marked as ${priority} priority`,
    due_at: dueAt.toISOString(),
    is_recurring: true,
    recurrence_interval_hours: intervalHours,
    last_triggered_at: new Date().toISOString(),
    created_by: userId,
  })

  if (error) {
    logger.error("Failed to create recurring reminder", { leadId, error: error.message })
  } else {
    logger.info(`Created recurring reminder for ${priority} lead`, { leadId, intervalHours })
  }
}
