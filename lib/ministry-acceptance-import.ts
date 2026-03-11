// Ministry Acceptance Import Utility
// Parses Excel files from the Ministry with acceptance results for PUC leads
// Matches leads by civil ID and moves them to "applicant" or "lost" based on acceptance

export interface MinistryAcceptanceRecord {
  civil_id: string
  student_name?: string
  accepted_college?: string // The college they were accepted to
  is_accepted_ktech: boolean // Whether they were accepted for KTECH
}

export interface MinistryAcceptanceResult {
  movedToApplicant: { leadId: string; name: string; civilId: string }[]
  movedToLost: { leadId: string; name: string; civilId: string; acceptedCollege: string }[]
  createdFirstChoice: { leadId: string; name: string; civilId: string }[]
  createdSecondChoice: { leadId: string; name: string; civilId: string }[]
  errors: { civilId: string; name: string; error: string }[]
}

// Column mappings for Ministry acceptance Excel files
// Support both Arabic and English headers
const ACCEPTANCE_COLUMN_MAPPINGS: Record<string, string> = {
  // Civil ID variations
  'civil_id': 'civil_id',
  'civilid': 'civil_id',
  'civil id': 'civil_id',
  'civil': 'civil_id',
  'الرقم المدني': 'civil_id',
  'رقم مدني': 'civil_id',
  'الرقم المدنى': 'civil_id',

  // Student name variations
  'name': 'student_name',
  'student_name': 'student_name',
  'student name': 'student_name',
  'full_name': 'student_name',
  'full name': 'student_name',
  'الاسم': 'student_name',
  'اسم الطالب': 'student_name',
  'الاسم الكامل': 'student_name',
  'اسم': 'student_name',

  // Accepted college/institution variations
  'college': 'accepted_college',
  'institution': 'accepted_college',
  'accepted_college': 'accepted_college',
  'accepted college': 'accepted_college',
  'university': 'accepted_college',
  'الكلية': 'accepted_college',
  'الجامعة': 'accepted_college',
  'المؤسسة': 'accepted_college',
  'جهة القبول': 'accepted_college',
  'الجهة': 'accepted_college',
  'القبول': 'accepted_college',
  'مكان القبول': 'accepted_college',
  'accepted': 'accepted_college',
  'placement': 'accepted_college',
}

// KTECH identification patterns in the accepted college field
const KTECH_PATTERNS = [
  'ktech',
  'k-tech',
  'k tech',
  'kuwait technical',
  'kuwait college',
  'كي تك',
  'كيتك',
  'الكلية التقنية',
  'كلية الكويت التقنية',
]

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/[\s_-]+/g, ' ')
}

export function createAcceptanceHeaderMap(headers: string[]): Map<string, number> {
  const map = new Map<string, number>()

  headers.forEach((header, index) => {
    if (!header) return
    const normalized = normalizeHeader(header)
    const mappedKey = ACCEPTANCE_COLUMN_MAPPINGS[normalized]
    if (mappedKey) {
      map.set(mappedKey, index)
    }
  })

  return map
}

export function isKtechAccepted(collegeName: string): boolean {
  if (!collegeName) return false
  const normalized = collegeName.toLowerCase().trim()
  return KTECH_PATTERNS.some(pattern => normalized.includes(pattern))
}

export function parseAcceptanceRow(
  row: (string | number)[],
  headerMap: Map<string, number>
): MinistryAcceptanceRecord | null {
  const getValue = (key: string): string | undefined => {
    const index = headerMap.get(key)
    if (index === undefined) return undefined
    const value = row[index]
    if (value === undefined || value === null) return undefined
    return String(value).trim() || undefined
  }

  // Get civil ID - required
  let civilId = getValue('civil_id')
  if (!civilId) return null

  // Clean civil ID - keep only digits
  civilId = civilId.replace(/\D/g, '')
  // Validate: should be 12 digits starting with 2 or 3
  if (civilId.length !== 12 || (civilId[0] !== '2' && civilId[0] !== '3')) {
    return null
  }

  const studentName = getValue('student_name') || ''
  const acceptedCollege = getValue('accepted_college') || ''

  return {
    civil_id: civilId,
    student_name: studentName,
    accepted_college: acceptedCollege,
    is_accepted_ktech: isKtechAccepted(acceptedCollege),
  }
}

export function validateAcceptanceRecords(records: MinistryAcceptanceRecord[]): {
  valid: MinistryAcceptanceRecord[]
  invalid: { record: MinistryAcceptanceRecord; reason: string }[]
} {
  const valid: MinistryAcceptanceRecord[] = []
  const invalid: { record: MinistryAcceptanceRecord; reason: string }[] = []
  const seenCivilIds = new Set<string>()

  for (const record of records) {
    if (!record.civil_id) {
      invalid.push({ record, reason: 'Missing Civil ID' })
    } else if (seenCivilIds.has(record.civil_id)) {
      invalid.push({ record, reason: 'Duplicate Civil ID' })
    } else {
      seenCivilIds.add(record.civil_id)
      valid.push(record)
    }
  }

  return { valid, invalid }
}
