-- Migration 117: Drop the old 5-param overload of check_lead_duplicates
-- The 6-param version (with p_semester_id) from migration 116 is the canonical one.
DROP FUNCTION IF EXISTS check_lead_duplicates(VARCHAR, VARCHAR, VARCHAR, VARCHAR, UUID);
