-- Self-funded tuition payment exemption.
--
-- SF leads must hit tuition milestones before advancing stages:
--   • Test → File      : at least 150 KWD (seat-reservation deposit)
--   • File → Applicant : the full 550 KWD tuition
--   • → Enrolled       : the full 550 KWD tuition
--
-- An admin can waive this requirement for an individual lead by recording an
-- exemption with a note. The exemption is a blanket waiver of the tuition
-- payment gate (mirrors the existing file_fee_exempted columns) — it does NOT
-- waive the separate File-stage fee gate.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS payment_exempt BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_exempt_note TEXT,
  ADD COLUMN IF NOT EXISTS payment_exempt_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS payment_exempt_at TIMESTAMPTZ;

COMMENT ON COLUMN leads.payment_exempt IS
  'TRUE when an admin has waived the SF tuition-payment requirement for stage transitions (Test→File ≥150 KWD, File→Applicant/Enrolled = 550 KWD).';
COMMENT ON COLUMN leads.payment_exempt_note IS
  'Required admin note explaining why the SF tuition-payment requirement was waived.';
