-- Add orientation_status column to leads table
-- Tracks SF applicant payment/contact status during orientation
-- Note: students table has its own separate orientation_status ENUM (not modified here)

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS orientation_status TEXT
    CHECK (orientation_status IN ('paid', 'will_pay_later', 'no_answer', 'cant_reach', 'not_interested'));

-- Auto-set orientation_status to 'paid' when a student's amount_paid reaches >= 550 KWD
CREATE OR REPLACE FUNCTION set_lead_orientation_paid()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.amount_paid >= 550 AND (OLD IS NULL OR OLD.amount_paid < 550) THEN
    UPDATE leads
    SET orientation_status = 'paid'
    WHERE id = NEW.lead_id
      AND pipeline_stage::text = 'applicant'
      AND funding_type::text = 'self_funded'
      AND orientation_status IS DISTINCT FROM 'paid';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_lead_orientation_paid ON students;

CREATE TRIGGER trg_set_lead_orientation_paid
  AFTER INSERT OR UPDATE OF amount_paid ON students
  FOR EACH ROW
  EXECUTE FUNCTION set_lead_orientation_paid();

-- Backfill: mark existing SF applicants who have already paid >= 550
UPDATE leads l
SET orientation_status = 'paid'
FROM students s
WHERE s.lead_id = l.id
  AND l.pipeline_stage::text = 'applicant'
  AND l.funding_type::text = 'self_funded'
  AND s.amount_paid >= 550
  AND l.orientation_status IS DISTINCT FROM 'paid';
