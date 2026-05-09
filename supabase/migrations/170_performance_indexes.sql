-- Migration 170: Performance Indexes
--
-- Adds composite indexes on the dashboard's hottest query paths.
-- Each index is wrapped in DO $$ ... EXCEPTION WHEN OTHERS $$ so a missing
-- table or column just gets a NOTICE — the rest of the migration continues.
-- All indexes use IF NOT EXISTS for idempotency.

DO $idx$
BEGIN
  -- 1. leads(assigned_to, pipeline_stage)
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_leads_assigned_stage
      ON leads (assigned_to, pipeline_stage);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_leads_assigned_stage: %', SQLERRM;
  END;

  -- 2. leads(priority, assigned_to) WHERE priority IN (...)
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_leads_priority_assigned
      ON leads (priority, assigned_to)
      WHERE priority IN ('important', 'critical');
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_leads_priority_assigned: %', SQLERRM;
  END;

  -- 3. appointments(assigned_agent, scheduled_date DESC, scheduled_time DESC)
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_appointments_agent_scheduled
      ON appointments (assigned_agent, scheduled_date DESC, scheduled_time DESC);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_appointments_agent_scheduled: %', SQLERRM;
  END;

  -- 4. automation_executions(created_at DESC)
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_automation_executions_created_at
      ON automation_executions (created_at DESC);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_automation_executions_created_at: %', SQLERRM;
  END;

  -- 5. ai_messages(conversation_id, created_at DESC)
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_ai_messages_conv_created
      ON ai_messages (conversation_id, created_at DESC);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_ai_messages_conv_created: %', SQLERRM;
  END;

  -- 6. notifications(user_id, created_at DESC)
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_notifications_user_created
      ON notifications (user_id, created_at DESC);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_notifications_user_created: %', SQLERRM;
  END;

  -- 7. payment_transactions(lead_id, created_at DESC)
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_payment_transactions_lead_created
      ON payment_transactions (lead_id, created_at DESC);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_payment_transactions_lead_created: %', SQLERRM;
  END;

  -- 8. activities(lead_id, created_at DESC)
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_activities_lead_created
      ON activities (lead_id, created_at DESC);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_activities_lead_created: %', SQLERRM;
  END;

  -- 9. audit_log(table_name, record_id, created_at DESC)
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_audit_log_table_record_created
      ON audit_log (table_name, record_id, created_at DESC);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_audit_log_table_record_created: %', SQLERRM;
  END;
END
$idx$;
