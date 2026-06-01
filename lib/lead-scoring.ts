import type { FoundationLevel } from "@/types"

// Inputs the foundation-level classifier reads from a Lead-shaped object.
// Kept narrow so callers can pass either a full Lead or a freshly-parsed Excel row.
export interface LeadScoringInput {
  placement_test_raw?: number | null  // raw 0-100 placement score
}

export interface LeadScoringResult {
  foundation_level: FoundationLevel | null
}

// Foundation level the placement test puts a student into.
// Source: =IF(S<30,"Not Pass", IF(S<50,"F1", IF(S<70,"F2", "Major")))
// This is a placement classification, not a ranking — it drives the
// Foundation-level report (see lib/hooks/use-reports.ts).
export function classifyFoundationLevel(raw: number | null | undefined): FoundationLevel | null {
  if (raw == null || Number.isNaN(raw)) return null
  if (raw < 30) return "not_pass"
  if (raw < 50) return "f1"
  if (raw < 70) return "f2"
  return "major"
}

export function calculateLeadQuality(input: LeadScoringInput): LeadScoringResult {
  return {
    foundation_level: classifyFoundationLevel(input.placement_test_raw),
  }
}
