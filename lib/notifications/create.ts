import type { SupabaseClient } from "@supabase/supabase-js"

export type NotificationType =
  | "new_assignment"
  | "appointment_reminder"
  | "payment_received"
  | "stage_change"
  | "system_alert"
  | "priority_reminder"

interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  body?: string
  leadId?: string
  studentId?: string
  actionUrl?: string
  metadata?: Record<string, unknown>
  createdBy?: string
}

/**
 * Creates a single notification for a user.
 * Fire-and-forget: errors are logged but don't throw.
 */
export async function createNotification(
  supabase: SupabaseClient,
  input: CreateNotificationInput
) {
  const { error } = await supabase.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body || null,
    lead_id: input.leadId || null,
    student_id: input.studentId || null,
    action_url: input.actionUrl || null,
    metadata: input.metadata || {},
    created_by: input.createdBy || null,
  })

  if (error) {
    console.error("[notifications] Failed to create notification:", error.message)
  }

  return { error }
}

/**
 * Creates multiple notifications in a single batch insert.
 */
export async function createBulkNotifications(
  supabase: SupabaseClient,
  inputs: CreateNotificationInput[]
) {
  if (inputs.length === 0) return { error: null }

  const { error } = await supabase.from("notifications").insert(
    inputs.map((input) => ({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body || null,
      lead_id: input.leadId || null,
      student_id: input.studentId || null,
      action_url: input.actionUrl || null,
      metadata: input.metadata || {},
      created_by: input.createdBy || null,
    }))
  )

  if (error) {
    console.error("[notifications] Failed to create bulk notifications:", error.message)
  }

  return { error }
}
