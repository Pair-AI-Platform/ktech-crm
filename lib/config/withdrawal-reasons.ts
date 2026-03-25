// Shared withdrawal reasons used by both withdraw dialogs and reports

export const WITHDRAWAL_REASONS = [
  { id: "payment_issue", label: "Payment Issue", labelAr: "مشكلة في الدفع" },
  { id: "far_away", label: "Far Away", labelAr: "بعيد" },
  { id: "language_issues", label: "Language Issues", labelAr: "مشاكل لغوية" },
  { id: "academic_reason", label: "Academic Reason", labelAr: "سبب أكاديمي" },
  { id: "accepted_second_choice", label: "Accepted Second Choice", labelAr: "قُبل في الخيار الثاني" },
  { id: "personal_reasons", label: "Personal Reasons", labelAr: "أسباب شخصية" },
  { id: "medical_travel_abroad", label: "Medical Travel Abroad", labelAr: "سفر علاجي للخارج" },
  { id: "traveling", label: "Traveling", labelAr: "مسافر" },
  { id: "studying_abroad", label: "Studying Abroad", labelAr: "الدراسة في الخارج" },
] as const

export const COMPETITOR_OPTIONS = [
  { id: "competitor_acm", label: "ACM" },
  { id: "competitor_aum", label: "AUM" },
  { id: "competitor_auk", label: "AUK" },
  { id: "competitor_gust", label: "GUST" },
  { id: "competitor_paaet", label: "PAAET" },
  { id: "competitor_ku", label: "KU" },
  { id: "competitor_kilaw", label: "KILAW" },
  { id: "competitor_iuk", label: "IUK" },
  { id: "competitor_cat", label: "CAT" },
  { id: "competitor_kcst", label: "KCST" },
  { id: "competitor_cck", label: "CCK" },
  { id: "competitor_aou", label: "AOU" },
  { id: "competitor_aiu", label: "AIU" },
  { id: "competitor_au", label: "AU" },
  { id: "competitor_boxhill", label: "BOXHILL" },
] as const

export const MILITARY_SECURITY_OPTIONS = [
  { id: "military", label: "Military" },
  { id: "police", label: "Police" },
  { id: "fire_force", label: "Fire Force" },
  { id: "army", label: "Army" },
  { id: "national_guard", label: "National Guard" },
] as const

// All reason IDs mapped to display labels — used by reports
export const ALL_REASON_LABELS: Record<string, string> = Object.fromEntries([
  ...WITHDRAWAL_REASONS.map(r => [r.id, r.label]),
  ...COMPETITOR_OPTIONS.map(r => [r.id, r.label]),
  ...MILITARY_SECURITY_OPTIONS.map(r => [r.id, r.label]),
])