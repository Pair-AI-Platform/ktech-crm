-- Migration: Add payment_purpose column to payment_transactions
-- Distinguishes test fee payments from enrollment payments

ALTER TABLE payment_transactions
  ADD COLUMN IF NOT EXISTS payment_purpose TEXT NOT NULL DEFAULT 'enrollment';

-- Add index for filtering by purpose
CREATE INDEX IF NOT EXISTS idx_payment_transactions_purpose ON payment_transactions(payment_purpose);

COMMENT ON COLUMN payment_transactions.payment_purpose IS 'Purpose of payment: enrollment, test_fee, puc_fee, etc.';
