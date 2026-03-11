-- Update orientation_status column to support new statuses for all applicants
-- Old values: paid, will_pay_later, no_answer, cant_reach, not_interested
-- New values: paid, not_interested, no_answer, will_pay_in_orientation, pay_later, will_see

ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_orientation_status_check;

ALTER TABLE leads
  ADD CONSTRAINT leads_orientation_status_check
  CHECK (orientation_status IS NULL OR orientation_status IN (
    'paid',
    'not_interested',
    'no_answer',
    'will_pay_in_orientation',
    'pay_later',
    'will_see',
    -- Keep old values so existing data remains valid
    'will_pay_later',
    'cant_reach'
  ));
