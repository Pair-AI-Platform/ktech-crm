-- Migration 165: Add course_start_date to semesters
-- The actual day teaching begins (distinct from start_date which is the enrollment window open date).
-- Used by the "Early Withdrawals" report to measure withdrawals in the first 8 weeks of a term.

ALTER TABLE semesters
  ADD COLUMN IF NOT EXISTS course_start_date DATE;

COMMENT ON COLUMN semesters.course_start_date IS
  'Actual day courses begin for this term. Distinct from start_date (enrollment window). Anchor for early-withdrawal analytics.';
