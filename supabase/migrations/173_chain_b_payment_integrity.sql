-- Migration 173: CHAIN B payment integrity hardening
--
-- Two changes:
--
--   A) webhook_events.source CHECK
--      - Drop 'twilio_sms' (SMS feature removed in migration 172)
--      - Add 'finance' (finance department webhook)
--      - Add 'ai_transfer' (n8n AI transfer webhook)
--
--   B) payment_transactions immutability trigger
--      Migration 169 used `auth.uid() IS NULL` to detect service-role context,
--      but auth.uid() also returns NULL for the `anon` role. Any caller hitting
--      the table without a JWT (anon, malformed JWT, etc.) bypasses the
--      financial-integrity guard. Replace with `auth.role() = 'service_role'`
--      so only the privileged service role bypasses.
--
-- All sections idempotent.

BEGIN;

-- =============================================================================
-- A) Update webhook_events.source CHECK
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhook_events') THEN
    -- Drop SMS rows (we no longer process SMS webhooks).
    DELETE FROM webhook_events WHERE source = 'twilio_sms';

    EXECUTE 'ALTER TABLE webhook_events DROP CONSTRAINT IF EXISTS webhook_events_source_check';
    EXECUTE 'ALTER TABLE webhook_events ADD CONSTRAINT webhook_events_source_check CHECK (source IN (''myfatoorah'', ''twilio_voice'', ''twilio_whatsapp'', ''finance'', ''ai_transfer''))';
  END IF;
END $$;

-- =============================================================================
-- B) Tighten payment_transactions immutability trigger
-- =============================================================================
CREATE OR REPLACE FUNCTION public.payment_transactions_prevent_immutable_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  caller_is_service_role boolean;
BEGIN
  -- Service role: auth.role() returns 'service_role' for the service-role JWT.
  -- This is the correct check; auth.uid() IS NULL also matches the `anon` role,
  -- which was the bypass exploited by migration 169's earlier definition.
  caller_is_service_role := (auth.role() = 'service_role');

  IF caller_is_service_role THEN
    RETURN NEW;
  END IF;

  IF NEW.amount IS DISTINCT FROM OLD.amount THEN
    RAISE EXCEPTION 'payment_transactions.amount is immutable after creation';
  END IF;

  IF NEW.currency IS DISTINCT FROM OLD.currency THEN
    RAISE EXCEPTION 'payment_transactions.currency is immutable after creation';
  END IF;

  IF NEW.lead_id IS DISTINCT FROM OLD.lead_id THEN
    RAISE EXCEPTION 'payment_transactions.lead_id is immutable after creation';
  END IF;

  IF NEW.payment_method IS DISTINCT FROM OLD.payment_method THEN
    RAISE EXCEPTION 'payment_transactions.payment_method is immutable after creation';
  END IF;

  IF NEW.myfatoorah_invoice_id IS DISTINCT FROM OLD.myfatoorah_invoice_id THEN
    RAISE EXCEPTION 'payment_transactions.myfatoorah_invoice_id is immutable after creation';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.payment_transactions_prevent_immutable_change() IS
  'BEFORE UPDATE trigger: blocks mutation of amount, currency, lead_id, payment_method, myfatoorah_invoice_id for any caller other than service_role. Tightened in migration 173 to fix anon-role bypass.';

COMMIT;
