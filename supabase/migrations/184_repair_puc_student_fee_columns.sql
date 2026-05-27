-- Repair drift: migration 026 is recorded remotely, but some environments
-- are missing the PUC student fee columns it introduced.

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS puc_payment_receipt_submitted BOOLEAN DEFAULT false;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS puc_fee_paid BOOLEAN DEFAULT false;

COMMENT ON COLUMN students.puc_payment_receipt_submitted IS
  'PUC required document: 10 KD fee payment receipt';

COMMENT ON COLUMN students.puc_fee_paid IS
  'PUC fee (10 KD) has been paid';
