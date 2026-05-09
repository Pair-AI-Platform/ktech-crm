-- Tests for migration 169 (payment_transactions immutability + idempotency).
--
-- Verifies:
--   1. amount > 0 CHECK
--   2. currency = 'KWD' CHECK
--   3. BEFORE UPDATE trigger blocks mutation of amount/currency/lead_id/
--      payment_method/myfatoorah_invoice_id for an authenticated agent.
--   4. Same trigger LETS service role mutate (auth.uid() IS NULL).
--   5. UNIQUE on myfatoorah_invoice_id (partial, WHERE NOT NULL).
--   6. payment_transactions.lead_id FK is ON DELETE RESTRICT.
--
-- Run via:
--   psql "$DATABASE_URL" -f supabase/tests/rls/_helpers.sql
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls/02_payment_immutability.sql

\echo '=== Test 02: payment_transactions immutability + idempotency ==='

BEGIN;

DO $setup$
DECLARE
  v_agent_a uuid := gen_random_uuid();
  v_lead_a  uuid := gen_random_uuid();
  v_tx_a    uuid := gen_random_uuid();
BEGIN
  PERFORM set_config('test.agent_a', v_agent_a::text, false);
  PERFORM set_config('test.lead_a',  v_lead_a::text,  false);
  PERFORM set_config('test.tx_a',    v_tx_a::text,    false);

  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role)
  VALUES (v_agent_a, 'pay-agent-' || v_agent_a || '@test.local', '', NOW(), 'authenticated');

  INSERT INTO profiles (id, email, role, full_name)
  VALUES (v_agent_a, 'pay-agent-' || v_agent_a || '@test.local', 'agent', 'Pay Test Agent');

  INSERT INTO leads (id, first_name, last_name, phone, assigned_to, pipeline_stage)
  VALUES (v_lead_a, 'Pay', 'Lead', '50000003', v_agent_a, 'new');
END
$setup$;

-- =============================================================================
-- 1. amount > 0 CHECK
-- =============================================================================
\echo '-- amount > 0 CHECK'
SELECT public.test_assert_throws(
  format(
    $sql$INSERT INTO payment_transactions (lead_id, amount, currency, payment_method)
         VALUES ('%s', 0, 'KWD', 'myfatoorah')$sql$,
    current_setting('test.lead_a')
  ),
  'amount = 0 rejected'
);

SELECT public.test_assert_throws(
  format(
    $sql$INSERT INTO payment_transactions (lead_id, amount, currency, payment_method)
         VALUES ('%s', -10, 'KWD', 'myfatoorah')$sql$,
    current_setting('test.lead_a')
  ),
  'negative amount rejected'
);

-- =============================================================================
-- 2. currency = 'KWD'
-- =============================================================================
\echo '-- currency = KWD CHECK'
SELECT public.test_assert_throws(
  format(
    $sql$INSERT INTO payment_transactions (lead_id, amount, currency, payment_method, civil_id)
         VALUES ('%s', 100, 'USD', 'myfatoorah', '299012345678')$sql$,
    current_setting('test.lead_a')
  ),
  'non-KWD currency rejected'
);

-- =============================================================================
-- Seed a valid transaction (postgres role bypasses RLS).
-- =============================================================================
INSERT INTO payment_transactions (id, lead_id, amount, currency, payment_method, civil_id, myfatoorah_invoice_id, status)
VALUES (
  current_setting('test.tx_a')::uuid,
  current_setting('test.lead_a')::uuid,
  150.000, 'KWD', 'myfatoorah', '299012345678', 'INV-123', 'pending'
);

-- =============================================================================
-- 3. Authenticated agent CANNOT mutate immutable columns
-- =============================================================================
\echo '-- agent UPDATEs to amount/currency/lead_id are blocked by trigger'

SELECT public.test_set_authenticated_user(current_setting('test.agent_a')::uuid);

SELECT public.test_assert_throws(
  format(
    $sql$UPDATE payment_transactions SET amount = 1 WHERE id = '%s'$sql$,
    current_setting('test.tx_a')
  ),
  'agent cannot mutate amount'
);

SELECT public.test_assert_throws(
  format(
    $sql$UPDATE payment_transactions SET currency = 'USD' WHERE id = '%s'$sql$,
    current_setting('test.tx_a')
  ),
  'agent cannot mutate currency'
);

SELECT public.test_assert_throws(
  format(
    $sql$UPDATE payment_transactions SET payment_method = 'cash', cash_invoice_number = 'X' WHERE id = '%s'$sql$,
    current_setting('test.tx_a')
  ),
  'agent cannot mutate payment_method'
);

SELECT public.test_assert_throws(
  format(
    $sql$UPDATE payment_transactions SET myfatoorah_invoice_id = 'INV-OTHER' WHERE id = '%s'$sql$,
    current_setting('test.tx_a')
  ),
  'agent cannot mutate myfatoorah_invoice_id'
);

-- Status + notes ARE mutable (used by app to mark resolved/refunded).
UPDATE payment_transactions
   SET notes = 'Agent A added a note'
 WHERE id = current_setting('test.tx_a')::uuid;

SELECT public.test_assert_eq(
  (SELECT notes FROM payment_transactions WHERE id = current_setting('test.tx_a')::uuid),
  'Agent A added a note'::text,
  'agent can update notes'
);

-- =============================================================================
-- 4. Service role bypasses the immutability trigger
-- =============================================================================
\echo '-- service role can update immutable columns (auth.uid() IS NULL path)'

SELECT public.test_clear_auth();

UPDATE payment_transactions
   SET amount = 200.000
 WHERE id = current_setting('test.tx_a')::uuid;

SELECT public.test_assert_eq(
  (SELECT amount FROM payment_transactions WHERE id = current_setting('test.tx_a')::uuid),
  200.000::decimal(10,3),
  'service role updated amount'
);

-- Restore for downstream tests.
UPDATE payment_transactions SET amount = 150.000 WHERE id = current_setting('test.tx_a')::uuid;

-- =============================================================================
-- 5. UNIQUE partial index on myfatoorah_invoice_id
-- =============================================================================
\echo '-- UNIQUE(myfatoorah_invoice_id) prevents duplicates'

SELECT public.test_assert_throws(
  format(
    $sql$INSERT INTO payment_transactions (lead_id, amount, currency, payment_method, civil_id, myfatoorah_invoice_id, status)
         VALUES ('%s', 150, 'KWD', 'myfatoorah', '299012345678', 'INV-123', 'pending')$sql$,
    current_setting('test.lead_a')
  ),
  'duplicate myfatoorah_invoice_id rejected'
);

-- NULL invoice IDs are still allowed (cash payments).
INSERT INTO payment_transactions (lead_id, amount, currency, payment_method, cash_invoice_number, status)
VALUES (current_setting('test.lead_a')::uuid, 50, 'KWD', 'cash', 'CASH-1', 'completed');

INSERT INTO payment_transactions (lead_id, amount, currency, payment_method, cash_invoice_number, status)
VALUES (current_setting('test.lead_a')::uuid, 75, 'KWD', 'cash', 'CASH-2', 'completed');

SELECT public.test_assert_eq(
  (SELECT count(*)::int FROM payment_transactions WHERE lead_id = current_setting('test.lead_a')::uuid AND myfatoorah_invoice_id IS NULL),
  2, 'two cash payments with NULL invoice_id allowed'
);

-- =============================================================================
-- 6. lead_id FK is ON DELETE RESTRICT
-- =============================================================================
\echo '-- DELETE on lead with payments is blocked (RESTRICT)'

SELECT public.test_assert_throws(
  format(
    $sql$DELETE FROM leads WHERE id = '%s'$sql$,
    current_setting('test.lead_a')
  ),
  'cannot delete lead while payment_transactions reference it'
);

\echo 'OK — 02_payment_immutability all assertions passed'

ROLLBACK;
