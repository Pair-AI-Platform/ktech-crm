import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { tryClaimCronRun } from "@/lib/cron-lock"

// In-memory fallback guard — only useful within a single instance.
// Distributed dedup happens via tryClaimCronRun() (Upstash SETNX EX).
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

    // Cross-instance dedup via Upstash. When Upstash isn't configured,
    // falls back to allow + in-memory check below.
    const claimed = await tryClaimCronRun('priority-reminders', 50)
    if (!claimed) {
      return NextResponse.json({ ok: true, skipped: true, message: 'Another instance already ran' })
    }
    const runCheckTime = Date.now()
    if (runCheckTime - lastRunTimestamp < 50_000) {
      return NextResponse.json({ ok: true, skipped: true, message: 'Already ran recently (in-memory)' })
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
        .select('first_name, last_name, first_name_ar, last_name_ar, priority')
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

      const leadName = `${lead.first_name_ar || ''} ${lead.last_name_ar || ''}`.trim()

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
