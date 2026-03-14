import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createServiceRoleClient()

    // Find all recurring, non-completed reminders that are due
    const { data: reminders, error } = await supabase
      .from('follow_up_reminders')
      .select('id, lead_id, assigned_to, recurrence_interval_hours, last_triggered_at, title')
      .eq('is_recurring', true)
      .eq('status', 'pending')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const now = new Date()
    let triggered = 0

    for (const reminder of reminders || []) {
      const lastTriggered = reminder.last_triggered_at ? new Date(reminder.last_triggered_at) : new Date(0)
      const intervalMs = (reminder.recurrence_interval_hours || 24) * 60 * 60 * 1000

      if (now.getTime() - lastTriggered.getTime() < intervalMs) continue

      // Get lead name for the notification
      const { data: lead } = await supabase
        .from('leads')
        .select('first_name, last_name, priority')
        .eq('id', reminder.lead_id)
        .single()

      if (!lead) continue

      // Only continue if lead still has priority
      if (lead.priority === 'normal' || !lead.priority) {
        // Mark reminder as completed since priority was reset
        await supabase
          .from('follow_up_reminders')
          .update({ status: 'completed' })
          .eq('id', reminder.id)
        continue
      }

      const leadName = `${lead.first_name} ${lead.last_name}`.trim()

      // Create notification
      await supabase.from('notifications').insert({
        user_id: reminder.assigned_to,
        type: 'priority_reminder',
        title: `Reminder: ${leadName} is ${lead.priority}`,
        body: `Follow up with ${leadName} — marked as ${lead.priority} priority`,
        lead_id: reminder.lead_id,
        action_url: `/leads/${reminder.lead_id}`,
        metadata: { priority: lead.priority },
      })

      // Update last_triggered_at
      await supabase
        .from('follow_up_reminders')
        .update({ last_triggered_at: now.toISOString() })
        .eq('id', reminder.id)

      triggered++
    }

    return NextResponse.json({ ok: true, triggered })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
