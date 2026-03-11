// Ministry GPA Import Utility
// Parses Excel files from the Ministry graduate list and matches against existing leads

export interface MinistryRecord {
  civil_id?: string
  first_name: string
  last_name: string
  full_name?: string
  school_name?: string
  gpa: number
}

export interface MinistryImportResult {
  updated: { leadId: string; name: string; gpa: number; matchedBy: string }[]
  created: { leadId: string; name: string; gpa: number }[]
  notFound: { record: MinistryRecord; reason: string }[]
  alreadyHasGPA: { leadId: string; name: string; existingGPA: number; newGPA: number }[]
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

  return {
    civil_id: civilId,
    first_name: firstName,
    last_name: lastName || '',
    full_name: fullName,
    school_name: getValue('school_name'),
    gpa: gpa,
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
    } else if (!record.civil_id) {
      // Civil ID is required for matching
      invalid.push({ record, reason: 'Missing Civil ID - cannot match' })
    } else if (record.gpa < 0 || record.gpa > 100) {
      invalid.push({ record, reason: `Invalid GPA: ${record.gpa}` })
    } else {
      valid.push(record)
    }
  }

  return { valid, invalid }
}

// Name matching utilities - re-exported from shared module
export { normalizeName, namesMatch } from './string-utils'
