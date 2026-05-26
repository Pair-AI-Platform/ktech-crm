import type { FoundationLevel, Governorate, QualityTier } from "@/types"

// Inputs the scorer reads from a Lead-shaped object. Kept narrow so callers
// can pass either a full Lead or a freshly-parsed Excel row.
export interface LeadScoringInput {
  gpa?: number | null            // raw 0-100 GPA used by the team (typically grade 12 expected)
  placement_test_raw?: number | null  // raw 0-100 placement score
  gender?: string | null         // 'male' | 'female' (case-insensitive)
  governorate?: Governorate | string | null
}

export interface LeadScoringResult {
  gpa_auto_score: number | null
  placement_test_auto_score: number | null
  foundation_level: FoundationLevel | null
  gender_score: number | null
  governorate_score: number | null
  final_weighted_score: number | null
  quality_tier: QualityTier | null
}

// GPA component score
// Source: Excel formula =IF(Q>=80,5, IF(Q>=70,4, 3)) — only fires when GPA is present.
export function scoreGpa(gpa: number | null | undefined): number | null {
  if (gpa == null || Number.isNaN(gpa)) return null
  if (gpa >= 80) return 5
  if (gpa >= 70) return 4
  return 3
}

// Placement test component score (the "auto" score, not the raw placement value)
// Source: Excel formula =IF(S>=45,3, IF(S>=24,4, IF(S>=25,5, 0)))
// The third clause is unreachable — keeping fidelity with the Excel author's intent.
export function scorePlacementTest(raw: number | null | undefined): number | null {
  if (raw == null || Number.isNaN(raw)) return null
  if (raw >= 45) return 3
  if (raw >= 24) return 4
  return 0
}

// Foundation level the placement test puts a student into
// Source: =IF(S<30,"Not Pass", IF(S<50,"F1", IF(S<70,"F2", "Major")))
export function classifyFoundationLevel(raw: number | null | undefined): FoundationLevel | null {
  if (raw == null || Number.isNaN(raw)) return null
  if (raw < 30) return "not_pass"
  if (raw < 50) return "f1"
  if (raw < 70) return "f2"
  return "major"
}

// Gender component score
// Source: =IF(V="Female",5, IF(V="Male",4, ""))
export function scoreGender(gender: string | null | undefined): number | null {
  if (!gender) return null
  const g = gender.toLowerCase().trim()
  if (g === "female") return 5
  if (g === "male") return 4
  return null
}

// Governorate component score
// Source: =IF(X="Al Asimah",5, IF(X="Hawalli",5, IF(X="Mubarak Al-Kabeer",4,
//          IF(X="Ahmadi",4, IF(X="Al Jahra",3, IF(X="Farwaniya",3, 0))))))
// We map both system-enum slugs (capital, hawalli, ...) and English display names.
const GOVERNORATE_SCORES: Record<string, number> = {
  // System enum slugs
  capital: 5,
  hawalli: 5,
  mubarak_alkabeer: 4,
  ahmadi: 4,
  jahra: 3,
  farwaniya: 3,
  // English display variants (case-insensitive)
  "al asimah": 5,
  "mubarak al-kabeer": 4,
  "mubarak al kabeer": 4,
  "al jahra": 3,
}

export function scoreGovernorate(gov: string | null | undefined): number | null {
  if (!gov) return null
  const key = String(gov).toLowerCase().trim()
  return GOVERNORATE_SCORES[key] ?? 0
}

// Final weighted score
// Source: =R*0.4 + U*0.2 + W*0.3 + Y*0.1
//   R = GPA auto score, U = placement auto score, W = gender score, Y = governorate score
export function computeFinalScore(parts: {
  gpa_auto_score: number | null
  placement_test_auto_score: number | null
  gender_score: number | null
  governorate_score: number | null
}): number | null {
  const { gpa_auto_score, placement_test_auto_score, gender_score, governorate_score } = parts
  // Excel only computes when gender is present; placement is allowed to be missing in our DB though.
  if (gender_score == null) return null
  const gpa = gpa_auto_score ?? 0
  const pt = placement_test_auto_score ?? 0
  const gov = governorate_score ?? 0
  const raw = gpa * 0.4 + pt * 0.2 + gender_score * 0.3 + gov * 0.1
  // Round to 2 decimals to match Excel display precision.
  return Math.round(raw * 100) / 100
}

// Tier classification
// Source: =IF(Z>=4.3,"Tier 1 - Excellent", IF(Z>=3.6,"Tier 2 - Very Good",
//          IF(Z>=3,"Tier 3 - Good", IF(Z>=2,"Tier 4 - Weak", "Tier 5 - Not Eligible"))))
export function classifyTier(finalScore: number | null | undefined): QualityTier | null {
  if (finalScore == null || Number.isNaN(finalScore)) return null
  if (finalScore >= 4.3) return "tier_1_excellent"
  if (finalScore >= 3.6) return "tier_2_very_good"
  if (finalScore >= 3) return "tier_3_good"
  if (finalScore >= 2) return "tier_4_weak"
  return "tier_5_not_eligible"
}

export function calculateLeadQuality(input: LeadScoringInput): LeadScoringResult {
  const gpa_auto_score = scoreGpa(input.gpa)
  const placement_test_auto_score = scorePlacementTest(input.placement_test_raw)
  const foundation_level = classifyFoundationLevel(input.placement_test_raw)
  const gender_score = scoreGender(input.gender)
  const governorate_score = scoreGovernorate(input.governorate)
  const final_weighted_score = computeFinalScore({
    gpa_auto_score,
    placement_test_auto_score,
    gender_score,
    governorate_score,
  })
  const quality_tier = classifyTier(final_weighted_score)

  return {
    gpa_auto_score,
    placement_test_auto_score,
    foundation_level,
    gender_score,
    governorate_score,
    final_weighted_score,
    quality_tier,
  }
}

export const QUALITY_TIER_LABELS: Record<QualityTier, string> = {
  tier_1_excellent: "Tier 1 - Excellent",
  tier_2_very_good: "Tier 2 - Very Good",
  tier_3_good: "Tier 3 - Good",
  tier_4_weak: "Tier 4 - Weak",
  tier_5_not_eligible: "Tier 5 - Not Eligible",
}

export const QUALITY_TIER_ORDER: QualityTier[] = [
  "tier_1_excellent",
  "tier_2_very_good",
  "tier_3_good",
  "tier_4_weak",
  "tier_5_not_eligible",
]
