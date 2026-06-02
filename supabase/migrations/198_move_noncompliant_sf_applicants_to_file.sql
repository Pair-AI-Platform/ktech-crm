-- Migration 198: Move non-compliant self-funded leads out of Applicant → File.
--
-- Business rule: a self-funded lead may only sit in the Applicant stage once it
-- has BOTH
--   (a) paid the full 550 KWD tuition (or holds a tuition-payment exemption), and
--   (b) submitted every SF document (all of sf_*_submitted).
--
-- Many SF leads were bulk-imported straight into Applicant without meeting
-- either condition. This is a one-time cleanup that moves every such lead back
-- to the File (application) stage. The going-forward rule is enforced in the UI
-- stage-transition guard (lib/lead-stage-guards.ts).
--
-- Idempotent: re-running only affects leads that still violate the rule.

WITH paid AS (
  SELECT lead_id, MAX(amount_paid) AS amount_paid
  FROM students
  WHERE lead_id IS NOT NULL
  GROUP BY lead_id
),
violators AS (
  SELECT l.id
  FROM leads l
  LEFT JOIN paid p ON p.lead_id = l.id
  WHERE l.pipeline_stage = 'applicant'
    AND l.funding_type = 'self_funded'
    AND NOT (
      (l.payment_exempt = true OR COALESCE(p.amount_paid, 0) >= 550)
      AND l.sf_declaration_submitted
      AND l.sf_passport_submitted
      AND l.sf_civil_id_submitted
      AND l.sf_payment_receipt_submitted
      AND l.sf_official_transcript_submitted
    )
)
UPDATE leads l
SET
  pipeline_stage = 'application',
  position_in_stage = 0,
  -- Drop Applicant/Enrolled from the completed-stages trail so the pipeline
  -- progress UI reflects the back-move.
  completed_stages = (
    SELECT COALESCE(array_agg(s), ARRAY[]::text[])
    FROM unnest(COALESCE(l.completed_stages, ARRAY[]::text[])) AS s
    WHERE s NOT IN ('applicant', 'enrolled')
  ),
  updated_at = NOW()
FROM violators v
WHERE l.id = v.id;
