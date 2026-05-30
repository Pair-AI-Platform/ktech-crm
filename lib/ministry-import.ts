// Ministry GPA Import Utility
// Parses Excel files from the Ministry graduate list and matches against existing leads

import { isArabicText } from './string-utils'

export interface MinistryRecord {
  civil_id?: string
  first_name: string
  last_name: string
  full_name?: string
  school_name?: string
  gpa: number
  seat_number?: string
  academic_track?: string
  education_type?: string
  graduation_year?: number
  grade_level?: string
}

export interface MinistryReviewCandidate {
  id: string
  full_name: string
  civil_id?: string | null
  school_name?: string | null
  graduation_year?: number | null
  seat_number?: string | null
}

export interface MinistryImportResult {
  updated: { leadId: string; name: string; gpa: number; matchedBy: 'civil_id' | 'fuzzy' }[]
  created: { leadId: string; name: string; gpa: number; routedTo: 'puc' | 'self_funded' }[]
  notFound: { record: MinistryRecord; reason: string }[]
  alreadyHasGPA: { leadId: string; name: string; existingGPA: number; newGPA: number }[]
  convertedToSelfFunded: {
    leadId: string
    name: string
    civilId?: string
    gpa: number
    previousFundingType: 'puc' | 'self_funded'
    stageRemapped?: { from: string; to: string }
  }[]
  needsReview: { record: MinistryRecord; candidates: MinistryReviewCandidate[] }[]
  errors: { record: MinistryRecord; error: string }[]
}

// Column mappings for Ministry Excel files
// Support both Arabic and English headers
const MINISTRY_COLUMN_MAPPINGS: Record<string, string> = {
  // Civil ID variations
  'civil_id': 'civil_id',
  'civilid': 'civil_id',
  'civil id': 'civil_id',
  'civil': 'civil_id',
  'الرقم المدني': 'civil_id',
  'رقم مدني': 'civil_id',
  'الرقم المدنى': 'civil_id',

  // First name variations
  'first_name': 'first_name',
  'firstname': 'first_name',
  'first name': 'first_name',
  'الاسم الأول': 'first_name',
  'الاسم': 'first_name',

  // Last name variations
  'last_name': 'last_name',
  'lastname': 'last_name',
  'last name': 'last_name',
  'اسم العائلة': 'last_name',
  'العائلة': 'last_name',
  'اللقب': 'last_name',

  // Full name (will be split)
  'full_name': 'full_name',
  'fullname': 'full_name',
  'full name': 'full_name',
  'name': 'full_name',
  'الاسم الكامل': 'full_name',
  'اسم الطالب': 'full_name',
  'student name': 'full_name',
  'اسم': 'full_name',

  // School variations
  'school': 'school_name',
  'school_name': 'school_name',
  'school name': 'school_name',
  'المدرسة': 'school_name',
  'اسم المدرسة': 'school_name',

  // GPA variations
  'gpa': 'gpa',
  'المعدل': 'gpa',
  'معدل': 'gpa',
  'النسبة': 'gpa',
  'نسبة': 'gpa',
  'الدرجة': 'gpa',
  'درجة': 'gpa',
  'grade': 'gpa',
  'average': 'gpa',
  'score': 'gpa',
  'percentage': 'gpa',
  'percent': 'gpa',
  'المجموع': 'gpa',

  // Seat number variations
  'seat_number': 'seat_number',
  'seat number': 'seat_number',
  'seat': 'seat_number',
  'رقم الجلوس': 'seat_number',
  'رقم المقعد': 'seat_number',
  'الرقم التسلسلي': 'seat_number',

  // Academic track variations
  'academic_track': 'academic_track',
  'academic track': 'academic_track',
  'track': 'academic_track',
  'section': 'academic_track',
  'القسم': 'academic_track',
  'التخصص': 'academic_track',
  'المسار': 'academic_track',
  'علمي': 'academic_track',
  'أدبي': 'academic_track',

  // Education type variations
  'education_type': 'education_type',
  'education type': 'education_type',
  'education': 'education_type',
  'curriculum': 'education_type',
  'نوع التعليم': 'education_type',
  'المنهج': 'education_type',
  'النظام': 'education_type',

  // Graduation year variations
  'graduation_year': 'graduation_year',
  'graduation year': 'graduation_year',
  'grad year': 'graduation_year',
  'year': 'graduation_year',
  'سنة التخرج': 'graduation_year',
  'عام التخرج': 'graduation_year',

  // Grade level variations
  'grade_level': 'grade_level',
  'grade level': 'grade_level',
  'class': 'grade_level',
  'الصف': 'grade_level',
  'المرحلة': 'grade_level',
}

// Normalize header for matching
function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/[\s_-]+/g, ' ')
}

// Create header map from row
export function createMinistryHeaderMap(headers: string[]): Map<string, number> {
  const map = new Map<string, number>()

  headers.forEach((header, index) => {
    if (!header) return
    const normalized = normalizeHeader(header)
    const mappedKey = MINISTRY_COLUMN_MAPPINGS[normalized]
    if (mappedKey) {
      map.set(mappedKey, index)
    }
  })

  return map
}

// Parse a single row into a Ministry record
export function parseMinistryRow(row: (string | number)[], headerMap: Map<string, number>): MinistryRecord | null {
  const getValue = (key: string): string | undefined => {
    const index = headerMap.get(key)
    if (index === undefined) return undefined
    const value = row[index]
    if (value === undefined || value === null) return undefined
    return String(value).trim() || undefined
  }

  const getNumericValue = (key: string): number | undefined => {
    const index = headerMap.get(key)
    if (index === undefined) return undefined
    const value = row[index]
    if (value === undefined || value === null) return undefined

    // If it's already a number
    if (typeof value === 'number') {
      return value
    }

    // Parse string to number
    const parsed = parseFloat(String(value).trim())
    return isNaN(parsed) ? undefined : parsed
  }

  // Try to get civil ID
  let civilId = getValue('civil_id')
  if (civilId) {
    // Clean civil ID - keep only digits
    civilId = civilId.replace(/\D/g, '')
    // Validate: should be 12 digits starting with 2 or 3
    if (civilId.length !== 12 || (civilId[0] !== '2' && civilId[0] !== '3')) {
      civilId = undefined
    }
  }

  // Get GPA - this is required
  const gpa = getNumericValue('gpa')
  if (gpa === undefined || gpa < 0 || gpa > 100) {
    return null // Invalid or missing GPA
  }

  // Get names
  let firstName = getValue('first_name')
  let lastName = getValue('last_name')
  const fullName = getValue('full_name')

  // If no separate names, try full name
  if (!firstName && !lastName && fullName) {
    const parts = fullName.split(/\s+/)
    if (parts.length >= 2) {
      firstName = parts[0]
      lastName = parts.slice(1).join(' ')
    } else if (parts.length === 1) {
      firstName = parts[0]
      lastName = ''
    }
  }

  // Must have at least a name to proceed
  if (!firstName) {
    return null
  }

  // Parse academic track - normalize to 'science' or 'arts'
  const rawTrack = getValue('academic_track')
  let academicTrack: string | undefined
  if (rawTrack) {
    const lower = rawTrack.toLowerCase()
    if (lower.includes('علم') || lower.includes('science') || lower === 'sci') {
      academicTrack = 'science'
    } else if (lower.includes('أدب') || lower.includes('art') || lower === 'lit') {
      academicTrack = 'arts'
    }
  }

  // Parse education type - normalize to known values
  const rawEducation = getValue('education_type')
  let educationType: string | undefined
  if (rawEducation) {
    const lower = rawEducation.toLowerCase()
    if (lower.includes('حكوم') || lower.includes('gov')) educationType = 'GOV'
    else if (lower.includes('أمريك') || lower.includes('us') || lower.includes('american')) educationType = 'US'
    else if (lower.includes('بريطان') || lower.includes('uk') || lower.includes('british')) educationType = 'UK'
    else if (lower.includes('سعود') || lower.includes('ksa') || lower.includes('saudi')) educationType = 'KSA'
    else educationType = 'other'
  }

  // Parse graduation year
  const gradYear = getNumericValue('graduation_year')
  const graduationYear = gradYear && gradYear >= 2000 && gradYear <= 2100 ? gradYear : undefined

  // Parse grade level
  const rawGradeLevel = getValue('grade_level')
  let gradeLevel: string | undefined
  if (rawGradeLevel) {
    const lower = rawGradeLevel.toLowerCase().replace(/[^\d\w\u0600-\u06FF]/g, '')
    if (lower.includes('12') || lower.includes('ثاني عشر')) gradeLevel = '12th'
    else if (lower.includes('11') || lower.includes('حادي عشر')) gradeLevel = '11th'
    else if (lower.includes('10') || lower.includes('عاشر')) gradeLevel = '10th'
  }

  return {
    civil_id: civilId,
    first_name: firstName,
    last_name: lastName || '',
    full_name: fullName,
    school_name: getValue('school_name'),
    gpa: gpa,
    seat_number: getValue('seat_number'),
    academic_track: academicTrack,
    education_type: educationType,
    graduation_year: graduationYear,
    grade_level: gradeLevel,
  }
}

// Validate Ministry records
export function validateMinistryRecords(records: MinistryRecord[]): {
  valid: MinistryRecord[]
  invalid: { record: MinistryRecord; reason: string }[]
} {
  const valid: MinistryRecord[] = []
  const invalid: { record: MinistryRecord; reason: string }[] = []

  for (const record of records) {
    if (!record.first_name) {
      invalid.push({ record, reason: 'Missing name' })
    } else if (!isArabicText(record.first_name) || (record.last_name && !isArabicText(record.last_name))) {
      invalid.push({ record, reason: 'Student name must be in Arabic' })
    } else if (record.gpa < 0 || record.gpa > 100) {
      invalid.push({ record, reason: `Invalid GPA: ${record.gpa}` })
    } else {
      // Records without civil_id are still valid — fuzzy matching attempted server-side
      valid.push(record)
    }
  }

  return { valid, invalid }
}

// Name matching utilities - re-exported from shared module
export { normalizeName, namesMatch } from './string-utils'
