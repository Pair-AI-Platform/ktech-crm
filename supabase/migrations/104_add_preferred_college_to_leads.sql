-- Add preferred_college field to leads
-- Tracks the college a lead changed their preference to after applying

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS preferred_college TEXT;
