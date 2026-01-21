// PUC (Public Universities Council) Import Utility
// Parses Excel files from the ministry and matches against existing leads

export interface PUCRecord {
  civil_id?: string
  first_name: string
  last_name: string
  school_name?: string
  // Additional fields that might be in the ministry list
  puc_reference?: string
  decision_date?: string
}

export interface PUCImportResult {
  enrolled: { leadId: string; studentId: string; name: string; matchedBy: string }[]
  notFound: { record: PUCRecord; reason: string }[]
  alreadyEnrolled: { leadId: string; name: string }[]
  errors: { record: PUCRecord; error: string }[]
}

// Column mappings for PUC Excel files
// Support both Arabic and English headers
const PUC_COLUMN_MAPPINGS: Record<string, string> = {
  // Civil ID variations
  'civil_id': 'civil_id',
  'civilid': 'civil_id',
  'civil id': 'civil_id',
  'الرقم المدني': 'civil_id',
  'رقم مدني': 'civil_id',

  // First name variations
  'first_name': 'first_name',
  'firstname': 'first_name',
  'first name': 'first_name',
  'الاسم الأول': 'first_name',
  'الاسم': 'first_name',
  'name': 'first_name',

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
  'الاسم الكامل': 'full_name',
  'اسم الطالب': 'full_name',
  'student name': 'full_name',

  // School variations
  'school': 'school_name',
  'school_name': 'school_name',
  'school name': 'school_name',
  'المدرسة': 'school_name',
  'اسم المدرسة': 'school_name',

  // PUC reference
  'puc_reference': 'puc_reference',
  'reference': 'puc_reference',
  'رقم المرجع': 'puc_reference',
  'مرجع': 'puc_reference',

  // Decision date
  'decision_date': 'decision_date',
  'date': 'decision_date',
  'تاريخ القرار': 'decision_date',
  'التاريخ': 'decision_date',
}

// Normalize header for matching
function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/[\s_-]+/g, ' ')
}

// Create header map from row
export function createPUCHeaderMap(headers: string[]): Map<string, number> {
  const map = new Map<string, number>()

  headers.forEach((header, index) => {
    const normalized = normalizeHeader(header)
    const mappedKey = PUC_COLUMN_MAPPINGS[normalized]
    if (mappedKey) {
      map.set(mappedKey, index)
    }
  })

  return map
}

// Parse a single row into a PUC record
export function parsePUCRow(row: string[], headerMap: Map<string, number>): PUCRecord | null {
  const getValue = (key: string): string | undefined => {
    const index = headerMap.get(key)
    if (index === undefined) return undefined
    const value = row[index]?.trim()
    return value || undefined
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

  // Get names
  let firstName = getValue('first_name')
  let lastName = getValue('last_name')

  // If no separate names, try full name
  if (!firstName && !lastName) {
    const fullName = getValue('full_name')
    if (fullName) {
      const parts = fullName.split(/\s+/)
      if (parts.length >= 2) {
        firstName = parts[0]
        lastName = parts.slice(1).join(' ')
      } else if (parts.length === 1) {
        firstName = parts[0]
        lastName = ''
      }
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
    school_name: getValue('school_name'),
    puc_reference: getValue('puc_reference'),
    decision_date: getValue('decision_date'),
  }
}

// Validate PUC records
export function validatePUCRecords(records: PUCRecord[]): {
  valid: PUCRecord[]
  invalid: { record: PUCRecord; reason: string }[]
} {
  const valid: PUCRecord[] = []
  const invalid: { record: PUCRecord; reason: string }[] = []

  for (const record of records) {
    if (!record.first_name) {
      invalid.push({ record, reason: 'Missing first name' })
    } else if (!record.civil_id && !record.school_name) {
      // Need either civil_id OR school for matching
      invalid.push({ record, reason: 'No civil ID and no school - cannot match' })
    } else {
      valid.push(record)
    }
  }

  return { valid, invalid }
}

// Normalize name for comparison
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Remove common Arabic prefixes
    .replace(/^(ال|عبد\s*ال)/g, '')
    // Remove diacritics
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
}

// Check if two names match (fuzzy)
export function namesMatch(name1: string, name2: string): boolean {
  const n1 = normalizeName(name1)
  const n2 = normalizeName(name2)

  // Exact match
  if (n1 === n2) return true

  // One contains the other
  if (n1.includes(n2) || n2.includes(n1)) return true

  // Check if first few characters match (for typos)
  if (n1.length > 3 && n2.length > 3) {
    const prefix1 = n1.substring(0, 3)
    const prefix2 = n2.substring(0, 3)
    if (prefix1 === prefix2) {
      // Calculate similarity
      const longer = n1.length > n2.length ? n1 : n2
      const shorter = n1.length > n2.length ? n2 : n1
      const similarity = shorter.length / longer.length
      if (similarity > 0.7) return true
    }
  }

  return false
}
