-- Tests for migration 168 (RLS lockdown).
--
-- Strategy: seed two agent profiles (A, B) and one admin, plus a lead
-- owned by Agent A. For each tightened table, confirm:
--   * Agent A can read/write their own lead's data.
--   * Agent B canNOT read or write Agent A's data.
--   * Admin can read everything.
--
-- Run via:
--   psql "$DATABASE_URL" -f supabase/tests/rls/_helpers.sql
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls/01_rls_lockdown.sql
--
-- Expected: zero ASSERT FAIL output, transaction ROLLBACKs cleanly.

\echo '=== Test 01: RLS lockdown (migration 168) ==='

BEGIN;

-- =============================================================================
-- Setup
-- =============================================================================
-- Seed three users via auth.users + profiles. We use random UUIDs so multiple
-- concurrent test runs don't collide.

DO $setup$
DECLARE
  v_agent_a uuid := gen_random_uuid();
  v_agent_b uuid := gen_random_uuid();
  v_admin   uuid := gen_random_uuid();
  v_lead_a  uuid := gen_random_uuid();
  v_lead_b  uuid := gen_random_uuid();
BEGIN
  -- Stash the IDs in session for later steps.
  PERFORM set_config('test.agent_a',  v_agent_a::text,  false);
  PERFORM set_config('test.agent_b',  v_agent_b::text,  false);
  PERFORM set_config('test.admin',    v_admin::text,    false);
  PERFORM set_config('test.lead_a',   v_lead_a::text,   false);
  PERFORM set_config('test.lead_b',   v_lead_b::text,   false);

  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role)
  VALUES
    (v_agent_a, 'agent-a-' || v_agent_a || '@test.local', '', NOW(), 'authenticated'),
    (v_agent_b, 'agent-b-' || v_agent_b || '@test.local', '', NOW(), 'authenticated'),
    (v_admin,   'admin-'   || v_admin   || '@test.local', '', NOW(), 'authenticated');

  INSERT INTO profiles (id, email, role, full_name)
  VALUES
    (v_agent_a, 'agent-a-' || v_agent_a || '@test.local', 'agent', 'Test Agent A'),
    (v_agent_b, 'agent-b-' || v_agent_b || '@test.local', 'agent', 'Test Agent B'),
    (v_admin,   'admin-'   || v_admin   || '@test.local', 'admin', 'Test Admin');

  INSERT INTO leads (id, first_name, last_name, phone, assigned_to, pipeline_stage)
  VALUES
    (v_lead_a, 'Lead', 'Owned-By-A', '50000001', v_agent_a, 'new'),
    (v_lead_b, 'Lead', 'Owned-By-B', '50000002', v_agent_b, 'new');
END
$setup$;

-- =============================================================================
-- whatsapp_messages: agent-scoped via lead ownership
-- =============================================================================
\echo '-- whatsapp_messages'

-- Seed messages on each lead (postgres role bypasses RLS).
INSERT INTO whatsapp_messages (lead_id, direction, from_number, to_number, message_body)
VALUES
  (current_setting('test.lead_a')::uuid, 'outbound', '12345', '50000001', 'A-message-1'),
  (current_setting('test.lead_b')::uuid, 'outbound', '12345', '50000002', 'B-message-1');

-- Agent A: sees their own message, not B's.
SELECT public.test_set_authenticated_user(current_setting('test.agent_a')::uuid);
SELECT public.test_assert_eq(
  (SELECT count(*)::int FROM whatsapp_messages WHERE message_body = 'A-message-1'),
  1, 'Agent A reads own WhatsApp'
);
SELECT public.test_assert_eq(
  (SELECT count(*)::int FROM whatsapp_messages WHERE message_body = 'B-message-1'),
  0, 'Agent A blocked from Agent B WhatsApp'
);

-- Agent B: opposite.
SELECT public.test_set_authenticated_user(current_setting('test.agent_b')::uuid);
SELECT public.test_assert_eq(
  (SELECT count(*)::int FROM whatsapp_messages WHERE message_body = 'A-message-1'),
  0, 'Agent B blocked from Agent A WhatsApp'
);

-- Admin: sees everything.
SELECT public.test_set_authenticated_user(current_setting('test.admin')::uuid);
SELECT public.test_assert_eq(
  (SELECT count(*)::int FROM whatsapp_messages WHERE message_body IN ('A-message-1','B-message-1')),
  2, 'Admin reads all WhatsApp'
);

-- =============================================================================
-- audit_log: admin-only SELECT
-- =============================================================================
\echo '-- audit_log'

-- audit_log gets populated by triggers on leads INSERT (above). Ensure rows exist.
SELECT public.test_clear_auth();
SELECT public.test_assert_eq(
  (SELECT count(*)::int > 0 FROM audit_log WHERE table_name = 'leads'),
  true, 'audit_log has leads entries (sanity)'
);

-- Agent A: zero rows visible.
SELECT public.test_set_authenticated_user(current_setting('test.agent_a')::uuid);
SELECT public.test_assert_eq(
  (SELECT count(*)::int FROM audit_log),
  0, 'Agent A blocked from audit_log'
);

-- Admin: all rows visible.
SELECT public.test_set_authenticated_user(current_setting('test.admin')::uuid);
SELECT public.test_assert_eq(
  (SELECT count(*)::int > 0 FROM audit_log),
  true, 'Admin reads audit_log'
);

-- =============================================================================
-- appointments: scoped via assigned_agent OR lead ownership
-- =============================================================================
\echo '-- appointments'

SELECT public.test_clear_auth();
INSERT INTO appointments (lead_id, appointment_type, scheduled_date, scheduled_time, duration_minutes, assigned_agent, created_by, status)
VALUES
  (current_setting('test.lead_a')::uuid, 'new_appointment', CURRENT_DATE + 1, '10:00', 30, current_setting('test.agent_a')::uuid, current_setting('test.agent_a')::uuid, 'scheduled'),
  (current_setting('test.lead_b')::uuid, 'new_appointment', CURRENT_DATE + 1, '11:00', 30, current_setting('test.agent_b')::uuid, current_setting('test.agent_b')::uuid, 'scheduled');

SELECT public.test_set_authenticated_user(current_setting('test.agent_a')::uuid);
SELECT public.test_assert_eq(
  (SELECT count(*)::int FROM appointments WHERE lead_id = current_setting('test.lead_a')::uuid),
  1, 'Agent A reads own appointment'
);
SELECT public.test_assert_eq(
  (SELECT count(*)::int FROM appointments WHERE lead_id = current_setting('test.lead_b')::uuid),
  0, 'Agent A blocked from Agent B appointment'
);

-- Agent A inserting an appointment must set assigned_agent or created_by to self.
SELECT public.test_assert_throws(
  format(
    $sql$INSERT INTO appointments (lead_id, appointment_type, scheduled_date, scheduled_time, duration_minutes, assigned_agent, created_by, status)
         VALUES ('%s', 'new_appointment', CURRENT_DATE + 2, '12:00', 30, '%s', '%s', 'scheduled')$sql$,
    current_setting('test.lead_a'),
    current_setting('test.agent_b'),  -- attempt to impersonate Agent B
    current_setting('test.agent_b')
  ),
  'Agent A blocked from inserting appointment as Agent B'
);

-- =============================================================================
-- psp_documents: agent-scoped via lead ownership
-- =============================================================================
\echo '-- psp_documents'

SELECT public.test_clear_auth();
INSERT INTO psp_documents (lead_id, document_type, graduate_type, file_name, storage_path, uploaded_by)
VALUES
  (current_setting('test.lead_a')::uuid, 'passport', 'GOV', 'a-passport.pdf', '/x/a-passport.pdf', current_setting('test.agent_a')::uuid),
  (current_setting('test.lead_b')::uuid, 'passport', 'GOV', 'b-passport.pdf', '/x/b-passport.pdf', current_setting('test.agent_b')::uuid);

SELECT public.test_set_authenticated_user(current_setting('test.agent_a')::uuid);
SELECT public.test_assert_eq(
  (SELECT count(*)::int FROM psp_documents WHERE file_name = 'a-passport.pdf'),
  1, 'Agent A reads own PSP doc'
);
SELECT public.test_assert_eq(
  (SELECT count(*)::int FROM psp_documents WHERE file_name = 'b-passport.pdf'),
  0, 'Agent A blocked from Agent B PSP doc'
);

-- =============================================================================
-- voice_agent_configs: admin-only SELECT
-- =============================================================================
\echo '-- voice_agent_configs'

SELECT public.test_clear_auth();
INSERT INTO voice_agent_configs (id, name, system_prompt)
VALUES (gen_random_uuid(), 'test-config-' || gen_random_uuid()::text, 'You are a test agent.');

SELECT public.test_set_authenticated_user(current_setting('test.agent_a')::uuid);
SELECT public.test_assert_eq(
  (SELECT count(*)::int FROM voice_agent_configs),
  0, 'Agent A blocked from voice_agent_configs'
);

SELECT public.test_set_authenticated_user(current_setting('test.admin')::uuid);
SELECT public.test_assert_eq(
  (SELECT count(*)::int > 0 FROM voice_agent_configs),
  true, 'Admin reads voice_agent_configs'
);

-- =============================================================================
-- notifications: INSERT requires created_by = self (or admin)
-- =============================================================================
\echo '-- notifications'

SELECT public.test_set_authenticated_user(current_setting('test.agent_a')::uuid);

-- Self-INSERT works.
INSERT INTO notifications (user_id, type, title, body, created_by)
VALUES (
  current_setting('test.agent_a')::uuid,
  'system_alert', 'self-test', 'body',
  current_setting('test.agent_a')::uuid
);

-- Insert with created_by NULL is rejected (was the old loophole).
SELECT public.test_assert_throws(
  format(
    $sql$INSERT INTO notifications (user_id, type, title, body, created_by)
         VALUES ('%s', 'system_alert', 'null-created-by', 'body', NULL)$sql$,
    current_setting('test.agent_a')
  ),
  'Agent A blocked from inserting notification with NULL created_by'
);

-- Insert pretending to be Agent B is rejected.
SELECT public.test_assert_throws(
  format(
    $sql$INSERT INTO notifications (user_id, type, title, body, created_by)
         VALUES ('%s', 'system_alert', 'impersonation', 'body', '%s')$sql$,
    current_setting('test.agent_a'),
    current_setting('test.agent_b')
  ),
  'Agent A blocked from inserting notification as Agent B'
);

-- =============================================================================
-- birthday_greetings_sent: SELECT scoped to lead ownership
-- =============================================================================
\echo '-- birthday_greetings_sent'

SELECT public.test_clear_auth();
INSERT INTO birthday_greetings_sent (lead_id, year)
VALUES
  (current_setting('test.lead_a')::uuid, 2025),
  (current_setting('test.lead_b')::uuid, 2025);

SELECT public.test_set_authenticated_user(current_setting('test.agent_a')::uuid);
SELECT public.test_assert_eq(
  (SELECT count(*)::int FROM birthday_greetings_sent WHERE lead_id = current_setting('test.lead_a')::uuid),
  1, 'Agent A reads own birthday greeting'
);
SELECT public.test_assert_eq(
  (SELECT count(*)::int FROM birthday_greetings_sent WHERE lead_id = current_setting('test.lead_b')::uuid),
  0, 'Agent A blocked from Agent B birthday greeting'
);

\echo 'OK — 01_rls_lockdown all assertions passed'

ROLLBACK;
