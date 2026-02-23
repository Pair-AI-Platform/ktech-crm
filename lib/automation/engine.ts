import { createClient } from "@/lib/supabase/client"
import { createClientLogger } from "@/lib/client-logger"

const logger = createClientLogger("automation-engine")

export type TriggerType = "stage_change" | "lead_created" | "appointment_scheduled" | "payment_received"

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
  action_type: "send_sms" | "assign_lead" | "create_follow_up" | "create_notification" | "change_stage"
  action_config: Record<string, unknown>
  is_active: boolean
  priority: number
}

function matchesConditions(conditions: Record<string, unknown>, leadData: Record<string, unknown>, metadata?: Record<string, unknown>): boolean {
  for (const [key, value] of Object.entries(conditions)) {
    if (key === "new_stage" && metadata) {
      if (metadata.new_stage !== value) return false
    } else if (key === "old_stage" && metadata) {
      if (metadata.old_stage !== value) return false
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
  supabase: ReturnType<typeof createClient>
): Promise<{ success: boolean; result?: Record<string, unknown>; error?: string }> {
  const { action_type, action_config } = rule

  try {
    switch (action_type) {
      case "create_notification": {
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

      case "send_sms": {
        const { template_id, message } = action_config as {
          template_id?: string
          message?: string
        }
        // Fire-and-forget API call to send SMS
        const phone = ctx.leadData.phone as string
        if (!phone) return { success: false, error: "No phone number on lead" }

        const resolvedMessage = (message || "")
          .replace("{lead_name}", `${ctx.leadData.first_name || ""} ${ctx.leadData.last_name || ""}`.trim())

        try {
          const response = await fetch("/api/sms/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone,
              message: resolvedMessage,
              leadId: ctx.leadId,
              templateId: template_id,
            }),
          })

          if (!response.ok) {
            const data = await response.json()
            return { success: false, error: data.error || "SMS send failed" }
          }
          return { success: true, result: { sms_sent_to: phone } }
        } catch (err) {
          return { success: false, error: `SMS request failed: ${err}` }
        }
      }

      case "assign_lead": {
        const { agent_id } = action_config as { agent_id?: string }
        if (!agent_id) return { success: false, error: "No agent_id in action config" }

        const { error } = await supabase
          .from("leads")
          .update({ assigned_to: agent_id })
          .eq("id", ctx.leadId)

        if (error) return { success: false, error: error.message }
        return { success: true, result: { assigned_to: agent_id } }
      }

      case "change_stage": {
        const { target_stage } = action_config as { target_stage?: string }
        if (!target_stage) return { success: false, error: "No target_stage in action config" }

        const { error } = await supabase
          .from("leads")
          .update({ pipeline_stage: target_stage })
          .eq("id", ctx.leadId)

        if (error) return { success: false, error: error.message }
        return { success: true, result: { new_stage: target_stage } }
      }

      default:
        return { success: false, error: `Unknown action type: ${action_type}` }
    }
  } catch (err) {
    return { success: false, error: `Action execution error: ${err}` }
  }
}

export async function executeAutomations(ctx: AutomationContext): Promise<void> {
  const supabase = createClient()

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
      return
    }

    logger.info(`Found ${rules.length} automation rules for trigger: ${ctx.trigger}`, { leadId: ctx.leadId })

    for (const rule of rules as AutomationRule[]) {
      // Check conditions
      if (!matchesConditions(rule.trigger_conditions, ctx.leadData, ctx.metadata)) {
        // Log skipped execution
        await supabase.from("automation_executions").insert({
          rule_id: rule.id,
          lead_id: ctx.leadId,
          status: "skipped",
          result: { reason: "Conditions not met" },
        })
        continue
      }

      // Execute the action
      const result = await executeAction(rule, ctx, supabase)

      // Log execution
      await supabase.from("automation_executions").insert({
        rule_id: rule.id,
        lead_id: ctx.leadId,
        status: result.success ? "success" : "failed",
        result: result.result || {},
        error_message: result.error,
      })

      if (result.success) {
        logger.info(`Automation "${rule.name}" executed successfully`, { ruleId: rule.id, leadId: ctx.leadId })
      } else {
        logger.error(`Automation "${rule.name}" failed`, { ruleId: rule.id, error: result.error })
      }
    }
  } catch (err) {
    logger.error("Failed to execute automations", { trigger: ctx.trigger, error: String(err) })
  }
}
