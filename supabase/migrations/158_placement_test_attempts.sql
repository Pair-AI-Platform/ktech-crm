-- Migration 158: Add placement test attempt tracking
-- Students can take each placement test up to 2 times.
-- The system stores attempt count and individual scores, using the highest score.

-- English attempts
ALTER TABLE leads ADD COLUMN IF NOT EXISTS placement_english_attempts INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS placement_english_score_1 DECIMAL(5,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS placement_english_score_2 DECIMAL(5,2);

-- Math attempts
ALTER TABLE leads ADD COLUMN IF NOT EXISTS placement_math_attempts INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS placement_math_score_1 DECIMAL(5,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS placement_math_score_2 DECIMAL(5,2);

-- Computer attempts
ALTER TABLE leads ADD COLUMN IF NOT EXISTS placement_computer_attempts INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS placement_computer_score_1 DECIMAL(5,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS placement_computer_score_2 DECIMAL(5,2);

-- Last sync timestamp
ALTER TABLE leads ADD COLUMN IF NOT EXISTS placement_lms_synced_at TIMESTAMPTZ;
