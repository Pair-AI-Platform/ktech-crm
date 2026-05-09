-- Migration 169: Payment Transaction Immutability + Webhook Idempotency
--
-- Hardens payment_transactions against tampering and race conditions:
--   A) CHECK (amount > 0)
--   B) Currency restricted to 'KWD' (until multi-currency is on the roadmap)
--   C) BEFORE UPDATE trigger that prevents mutation of amount, currency,
--      lead_id, payment_method, and myfatoorah_invoice_id once a row is
--      inserted. Only privileged contexts (service role) bypass.
--   D) Partial UNIQUE index on (myfatoorah_invoice_id) WHERE NOT NULL,
--      so concurrent webhook handlers can't both create or both progress
--      the same MyFatoorah invoice into 'completed'.
--   E) FK on lead_id changed from ON DELETE CASCADE to ON DELETE RESTRICT —
--      a lead may not be hard-deleted while it has payment history.
--      (The recommended path forward is soft-delete; see leads.deleted_at
--      to be added in a follow-up migration once the team confirms the
--      lead-deletion semantics.)
--
-- All sections idempotent.

-- =============================================================================
-- A) amount > 0
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'payment_transactions_amount_positive'
  ) THEN
    ALTER TABLE payment_transactions
      ADD CONSTRAINT payment_transactions_amount_positive
      CHECK (amount > 0);
  END IF;
END $$;

-- =============================================================================
-- B) Currency must be KWD (single-currency operation today)
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'payment_transactions_currency_kwd'
  ) THEN
    ALTER TABLE payment_transactions
      ADD CONSTRAINT payment_transactions_currency_kwd
      CHECK (currency = 'KWD');
  END IF;
END $$;

-- =============================================================================
-- C) Immutability trigger
--
-- The trigger raises if a non-service-role caller attempts to change any
-- column on the immutable list. Service role bypasses RLS but still hits
-- this trigger; we detect service-role context by checking whether
-- auth.uid() returns NULL (service role has no user). This is the
-- standard Supabase idiom.
--
-- Status transitions are still allowed; the trigger only locks the
-- financial-integrity columns.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.payment_transactions_prevent_immutable_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  caller_is_service_role boolean;
BEGIN
  -- Service role: auth.uid() returns NULL because there's no JWT user.
  -- Service role contexts are trusted (webhook handlers, cron jobs).
  caller_is_service_role := (SELECT auth.uid()) IS NULL;

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

DROP TRIGGER IF EXISTS payment_transactions_immutability_trigger ON payment_transactions;

CREATE TRIGGER payment_transactions_immutability_trigger
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.payment_transactions_prevent_immutable_change();

-- =============================================================================
-- D) Partial UNIQUE index on myfatoorah_invoice_id
--
-- Prevents two webhook handlers from inserting (or transitioning to a
-- pre-paired state) the same invoice. The existing
-- idx_payment_transactions_myfatoorah_invoice was a regular index — we
-- need uniqueness, scoped to non-null values (cash payments have NULL).
-- =============================================================================
DROP INDEX IF EXISTS idx_payment_transactions_myfatoorah_invoice;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_transactions_myfatoorah_invoice
  ON payment_transactions (myfatoorah_invoice_id)
  WHERE myfatoorah_invoice_id IS NOT NULL;

-- =============================================================================
-- E) Foreign key: lead_id ON DELETE RESTRICT
--
-- Today: ON DELETE CASCADE — deleting a lead silently destroys payment
-- history. With agents distrusted, this is also a deletion-as-tampering
-- risk (delete the lead → records disappear). Switch to RESTRICT so the
-- DB blocks lead deletion when payments exist.
--
-- Application code that wants to delete a lead must first either:
--   (a) Soft-delete (set leads.deleted_at — add column in a follow-up).
--   (b) Reassign or null payment_transactions.lead_id explicitly.
--
-- This is a behavior change. We log it loud:
--   NOTICE: payment_transactions.lead_id FK now blocks lead hard-delete.
-- =============================================================================
DO $$
DECLARE
  fk_name text;
BEGIN
  SELECT tc.constraint_name INTO fk_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
   AND tc.table_schema = kcu.table_schema
  WHERE tc.table_schema = 'public'
    AND tc.table_name = 'payment_transactions'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'lead_id'
  LIMIT 1;

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE payment_transactions DROP CONSTRAINT %I', fk_name);
  END IF;

  ALTER TABLE payment_transactions
    ADD CONSTRAINT payment_transactions_lead_id_fkey
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE RESTRICT;

  RAISE NOTICE 'payment_transactions.lead_id FK now ON DELETE RESTRICT — lead hard-delete is blocked when payments exist.';
END $$;

COMMENT ON FUNCTION public.payment_transactions_prevent_immutable_change() IS
  'BEFORE UPDATE trigger: blocks mutation of amount, currency, lead_id, payment_method, myfatoorah_invoice_id for any caller that has a JWT user (i.e., not service role).';
