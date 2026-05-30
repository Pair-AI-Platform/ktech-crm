-- Mark existing PUC records as real uploaded/operational leads.
-- The API hides non-actual rows to remove demo/fake records; historical PUC
-- imports were left at the old default actual_lead = false, which hid them.

UPDATE leads
SET actual_lead = true
WHERE funding_type = 'puc'
  AND actual_lead IS DISTINCT FROM true;

