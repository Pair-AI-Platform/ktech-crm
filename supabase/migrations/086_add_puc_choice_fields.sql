-- Migration: Add PUC choice tracking fields for ministry acceptance import
-- puc_choice: 'first' or 'second' - whether ktech was the student's first or second choice
-- puc_first_choice_college: if second choice, stores what college they were originally accepted to
ALTER TABLE leads ADD COLUMN IF NOT EXISTS puc_choice text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS puc_first_choice_college text;
