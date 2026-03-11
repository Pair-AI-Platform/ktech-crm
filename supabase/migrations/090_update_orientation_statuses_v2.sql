-- Update orientation_status to new values: informed, no_answer, cant_reach, might_withdraw
-- Old values: paid, not_interested, no_answer, will_pay_in_orientation, pay_later, will_see
-- Keep 'paid' as it's auto-set by trigger when amount_paid >= 550

ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_orientation_status_check;

-- Map old values to new ones
UPDATE leads SET orientation_status = 'informed' WHERE orientation_status IN ('not_interested', 'will_pay_in_orientation', 'pay_later', 'will_see');

ALTER TABLE leads
  ADD CONSTRAINT leads_orientation_status_check
  CHECK (orientation_status IS NULL OR orientation_status IN (
    'paid',
    'confirmed',
    'informed',
    'no_answer',
    'cant_reach',
    'might_withdraw'
  ));
