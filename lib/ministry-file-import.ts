// Ministry File Import Utility
// Parses Excel files from the Ministry containing civil IDs
// Used to cross-reference with PUC Application Submission leads
// and move matching leads to "applicant" stage

export interface MinistryFileRecord {
  civil_id: string
  student_name?: string
}

export interface MinistryFileResult {
  // Leads that were in PUC Application Submission → moved to Applicant (no star)
  matchedSubmission: { leadId: string; name: string; civilId: string }[]
  // Leads found in OTHER stages → moved to Applicant + flagged with star
  matchedOtherStages: { leadId: string; name: string; civilId: string; previousStage: string }[]
  // Leads NOT in system → created in Applicant + flagged with star
  createdNew: { leadId: string; name: string; civilId: string }[]
  // Errors during processing
  errors: { civilId: string; name: string; error: string }[]
  // Leads already in applicant/enrolled (skipped)
  skipped: { leadId: string; name: string; civilId: string; reason: string }[]
}

// Column mappings - support Arabic and English headers
const COLUMN_MAPPINGS: Record<string, string> = {
  // Civil ID variations
  'civil_id': 'civil_id',
  'civilid': 'civil_id',
  'civil id': 'civil_id',
  'civil': 'civil_id',
  'الرقم المدني': 'civil_id',
  'رقم مدني': 'civil_id',
  'الرقم المدنى': 'civil_id',
  'رقم المدني': 'civil_id',

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
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/[\s_-]+/g, ' ')
}

export function createMinistryFileHeaderMap(headers: string[]): Map<string, number> {
  const map = new Map<string, number>()

  headers.forEach((header, index) => {
    if (!header) return
    const normalized = normalizeHeader(header)
    const mappedKey = COLUMN_MAPPINGS[normalized]
    if (mappedKey) {
      map.set(mappedKey, index)
    }
  })

  return map
}

export function parseMinistryFileRow(
  row: (string | number)[],
  headerMap: Map<string, number>
): MinistryFileRecord | null {
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

  return {
    civil_id: civilId,
    student_name: studentName,
  }
}

export function validateMinistryFileRecords(records: MinistryFileRecord[]): {
  valid: MinistryFileRecord[]
  invalid: { record: MinistryFileRecord; reason: string }[]
} {
  const valid: MinistryFileRecord[] = []
  const invalid: { record: MinistryFileRecord; reason: string }[] = []
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
