-- Migration 201: add the follow_up_reminders recurring columns that 098 missed.
--
-- Migration 098 (agent_heartbeat_lead_priority) adds is_recurring,
-- recurrence_interval_hours and last_triggered_at — but it wraps the ALTERs in
-- an `IF EXISTS (table follow_up_reminders)` guard. In production the table was
-- (re)created by migration 141 (ensure_automation_and_notification_tables),
-- which runs AFTER 098. So when 098 executed the table did not yet exist, the
-- guard short-circuited, and the three columns were never created.
--
-- The priority-reminders cron and the automation engine both query these
-- columns, so the cron 500s with:
--   column follow_up_reminders.recurrence_interval_hours does not exist
--
-- This migration re-applies 098's intent unconditionally (the table exists now)
-- and is fully idempotent — ADD COLUMN IF NOT EXISTS is a no-op where the
-- columns already landed.

ALTER TABLE follow_up_reminders ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE follow_up_reminders ADD COLUMN IF NOT EXISTS recurrence_interval_hours INTEGER;
ALTER TABLE follow_up_reminders ADD COLUMN IF NOT EXISTS last_triggered_at TIMESTAMPTZ;

-- Supports the cron's "recurring, not-yet-completed" scan. Completion is tracked
-- by the existing is_completed BOOLEAN column (there is no `status` column).
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_recurring
  ON follow_up_reminders (is_recurring, is_completed)
  WHERE is_recurring = true;

-- Force PostgREST to reload its schema cache so the new columns are queryable
-- immediately (the priority-reminders cron queries them via PostgREST). Matches
-- the pattern in migrations 141/162.
NOTIFY pgrst, 'reload schema';
