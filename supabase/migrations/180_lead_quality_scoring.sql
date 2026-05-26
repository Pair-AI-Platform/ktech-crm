-- Migration 180: Lead quality scoring
-- Replaces the team's home-grown Excel scoring (GPA × Placement × Gender × Governorate → Final → Tier)
-- with native columns on the leads table. Formula lives in lib/lead-scoring.ts.

-- =============================================
-- Enums
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quality_tier') THEN
    CREATE TYPE quality_tier AS ENUM (
      'tier_1_excellent',
      'tier_2_very_good',
      'tier_3_good',
      'tier_4_weak',
      'tier_5_not_eligible'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'foundation_level') THEN
    CREATE TYPE foundation_level AS ENUM (
      'not_pass',
      'f1',
      'f2',
      'major'
    );
  END IF;
END$$;

-- =============================================
-- Scoring columns on leads
-- =============================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS quality_tier quality_tier,
  ADD COLUMN IF NOT EXISTS final_weighted_score NUMERIC(3,2)
    CHECK (final_weighted_score IS NULL OR (final_weighted_score >= 0 AND final_weighted_score <= 5)),
  ADD COLUMN IF NOT EXISTS gpa_auto_score SMALLINT
    CHECK (gpa_auto_score IS NULL OR (gpa_auto_score >= 0 AND gpa_auto_score <= 5)),
  ADD COLUMN IF NOT EXISTS placement_test_auto_score SMALLINT
    CHECK (placement_test_auto_score IS NULL OR (placement_test_auto_score >= 0 AND placement_test_auto_score <= 5)),
  ADD COLUMN IF NOT EXISTS foundation_level foundation_level,
  ADD COLUMN IF NOT EXISTS gender_score SMALLINT
    CHECK (gender_score IS NULL OR (gender_score >= 0 AND gender_score <= 5)),
  ADD COLUMN IF NOT EXISTS governorate_score SMALLINT
    CHECK (governorate_score IS NULL OR (governorate_score >= 0 AND governorate_score <= 5)),
  ADD COLUMN IF NOT EXISTS quality_score_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS placement_test_raw NUMERIC(5,2)
    CHECK (placement_test_raw IS NULL OR (placement_test_raw >= 0 AND placement_test_raw <= 100)),
  ADD COLUMN IF NOT EXISTS external_code VARCHAR(32);

-- Indexes for reporting queries
CREATE INDEX IF NOT EXISTS idx_leads_quality_tier ON leads(quality_tier) WHERE quality_tier IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_final_weighted_score ON leads(final_weighted_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_leads_external_code ON leads(external_code) WHERE external_code IS NOT NULL;

COMMENT ON COLUMN leads.quality_tier IS 'Computed tier 1-5 from College Applicant Quality Scale (see lib/lead-scoring.ts).';
COMMENT ON COLUMN leads.final_weighted_score IS 'gpa*0.4 + placement*0.2 + gender*0.3 + governorate*0.1';
COMMENT ON COLUMN leads.external_code IS 'Original Excel Code No. for cross-reference during ingestion.';
