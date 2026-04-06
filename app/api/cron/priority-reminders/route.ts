import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

// Simple in-memory guard to prevent duplicate runs within 50 seconds
let lastRunTimestamp = 0

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      console.error('[Priority Reminders] CRON_SECRET is not configured')
      return NextResponse.json(
        { error: 'Server misconfiguration' },
        { status: 500 }
      )
    }

    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Duplicate run protection: skip if last run was less than 50 seconds ago
    // NOTE: This is an in-memory guard and only works within a single instance.
    // For distributed deployments, consider using a database-based lock.
    const runCheckTime = Date.now()
    if (runCheckTime - lastRunTimestamp < 50_000) {
      return NextResponse.json({ ok: true, skipped: true, message: 'Already ran recently' })
    }
    lastRunTimestamp = runCheckTime

    const supabase = createServiceRoleClient()

    // Find all recurring, non-completed reminders that are due
    const { data: reminders, error } = await supabase
      .from('follow_up_reminders')
      .select('id, lead_id, assigned_to, recurrence_interval_hours, last_triggered_at, title')
      .eq('is_recurring', true)
      .eq('status', 'pending')

    if (error) {
      console.error('[Priority Reminders] Failed to fetch reminders:', error.message)
      return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 })
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
    console.error('[Priority Reminders] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
