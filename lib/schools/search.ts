export interface SchoolSearchEntity {
  id: string
  name_en: string
  name_ar: string
}

const ENGLISH_STOP_WORDS = new Set([
  "a",
  "al",
  "and",
  "for",
  "in",
  "of",
  "the",
])

export function normalizeSchoolSearchText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u064b-\u065f\u0670]/g, "")
    .replace(/ـ/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, " ")
    .trim()
}

function getEnglishInitials(name: string) {
  return normalizeSchoolSearchText(name)
    .split(" ")
    .filter(token => token && /[a-z0-9]/.test(token) && !ENGLISH_STOP_WORDS.has(token))
    .map(token => token[0])
    .join("")
}

function getSchoolSearchParts(school: SchoolSearchEntity) {
  const normalizedEn = normalizeSchoolSearchText(school.name_en)
  const normalizedAr = normalizeSchoolSearchText(school.name_ar)
  const normalizedId = normalizeSchoolSearchText(school.id.replace(/_/g, " "))
  const compactEn = normalizedEn.replace(/\s+/g, "")
  const compactAr = normalizedAr.replace(/\s+/g, "")
  const initials = getEnglishInitials(school.name_en)

  return {
    normalizedEn,
    normalizedAr,
    normalizedId,
    compactEn,
    compactAr,
    initials,
    text: `${normalizedEn} ${normalizedAr} ${normalizedId} ${compactEn} ${compactAr} ${initials}`,
  }
}

export function schoolMatchesSearch(school: SchoolSearchEntity, rawSearch: string) {
  const query = normalizeSchoolSearchText(rawSearch)
  if (!query) return true

  const compactQuery = query.replace(/\s+/g, "")
  const parts = getSchoolSearchParts(school)

  return (
    parts.text.includes(query) ||
    parts.compactEn.includes(compactQuery) ||
    parts.compactAr.includes(compactQuery) ||
    parts.initials.includes(compactQuery)
  )
}

export function compareSchoolsBySearch(rawSearch: string) {
  const query = normalizeSchoolSearchText(rawSearch)
  const compactQuery = query.replace(/\s+/g, "")

  return (a: SchoolSearchEntity, b: SchoolSearchEntity) => {
    if (!query) return 0

    const getRank = (school: SchoolSearchEntity) => {
      const parts = getSchoolSearchParts(school)
      if (parts.initials === compactQuery) return 0
      if (parts.normalizedEn.startsWith(query)) return 1
      if (parts.normalizedAr.startsWith(query)) return 2
      if (parts.normalizedEn.includes(query)) return 3
      if (parts.normalizedAr.includes(query)) return 4
      if (parts.compactEn.includes(compactQuery) || parts.compactAr.includes(compactQuery)) return 5
      if (parts.initials.includes(compactQuery)) return 6
      return 7
    }

    return getRank(a) - getRank(b)
  }
}
