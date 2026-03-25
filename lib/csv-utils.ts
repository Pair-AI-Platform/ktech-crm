import type { Lead, LeadFormData, LeadSource, LeadSourceCategory, FundingType, School, GradeLevel, AcademicTrack, IntendedMajor } from "@/types"

// CSV column definitions for leads
export const LEAD_CSV_COLUMNS: { key: string; label: string; required?: boolean }[] = [
  { key: "first_name", label: "First Name", required: true },
  { key: "last_name", label: "Last Name", required: true },
  { key: "phone", label: "Phone", required: true },
  { key: "phone_secondary", label: "Secondary Phone", required: false },
  { key: "email", label: "Email", required: false },
  { key: "civil_id", label: "Civil ID", required: false },
  { key: "date_of_birth", label: "Date of Birth", required: false },
  { key: "gender", label: "Gender", required: false },
  { key: "nationality", label: "Nationality", required: false },
  { key: "is_kuwaiti", label: "Is Kuwaiti", required: false },
  { key: "school", label: "School", required: false },
  { key: "school_name_custom", label: "School Name", required: false },
  { key: "grade_level", label: "Grade Level", required: false },
  { key: "academic_track", label: "Academic Track", required: false },
  { key: "graduation_year", label: "Graduation Year", required: false },
  { key: "gpa_grade_10", label: "GPA Grade 10", required: false },
  { key: "gpa_grade_11", label: "GPA Grade 11", required: false },
  { key: "gpa_grade_12_expected", label: "GPA Grade 12 (Expected)", required: false },
  { key: "intended_major", label: "ktech Intended Major", required: false },
  { key: "funding_type", label: "Funding Type", required: false },
  { key: "has_weyay_account", label: "Has Weyay Account", required: false },
  { key: "has_bank_account", label: "Has Bank Account", required: false },
  { key: "source_category", label: "Source Category", required: false },
  { key: "source", label: "Source", required: false },
  { key: "source_detail", label: "Source Detail", required: false },
  { key: "notes", label: "Notes", required: false },
]

// Valid values for enum fields
const VALID_SOURCES: LeadSource[] = [
  "walk_in", "call_center", "whatsapp", "email",
  "school_visit", "expo", "exhibitions", "karnival",
  "website_form", "facebook", "instagram",
  "current_student_referral", "staff_referral", "friend_referral",
  "old_contacts", "paaet_rejected", "gpa_lists"
]

const VALID_SOURCE_CATEGORIES: LeadSourceCategory[] = [
  "direct", "events", "marketing", "referrals", "outreach"
]

const VALID_FUNDING_TYPES: FundingType[] = ["self_funded", "puc"]

// School validation is handled by the School type (150+ values).
// Instead of maintaining a duplicate list, accept any non-empty string
// and let the database/type system enforce valid values.

const VALID_GRADE_LEVELS: GradeLevel[] = ["10th", "11th", "12th"]

const VALID_ACADEMIC_TRACKS: AcademicTrack[] = ["science", "arts"]

const VALID_MAJORS: IntendedMajor[] = [
  "cyber_security", "cis", "marketing", "accounting", "network_security", "other"
]

// Export leads to CSV string
export function exportLeadsToCSV(leads: Lead[]): string {
  // Create header row
  const headers = LEAD_CSV_COLUMNS.map(col => col.label)

  // Create data rows
  const rows = leads.map(lead => {
    return LEAD_CSV_COLUMNS.map(col => {
      const value = lead[col.key as keyof Lead]

      // Handle boolean values
      if (typeof value === "boolean") {
        return value ? "Yes" : "No"
      }

      // Handle null/undefined
      if (value === null || value === undefined) {
        return ""
      }

      // Handle objects (like school)
      if (typeof value === "object") {
        return ""
      }

      // Escape quotes and wrap in quotes if contains comma or quote
      const stringValue = String(value)
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }

      return stringValue
    })
  })

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n")

  return csvContent
}

// Download CSV file
export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Parse CSV string to rows
export function parseCSV(csvContent: string): string[][] {
  const lines = csvContent.split(/\r\n|\n/)
  const rows: string[][] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const row: string[] = []
    let inQuotes = false
    let currentValue = ""

    for (let j = 0; j < line.length; j++) {
      const char = line[j]

      if (char === '"') {
        if (inQuotes && line[j + 1] === '"') {
          currentValue += '"'
          j++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === "," && !inQuotes) {
        row.push(currentValue.trim())
        currentValue = ""
      } else {
        currentValue += char
      }
    }

    row.push(currentValue.trim())
    rows.push(row)
  }

  return rows
}

// Validate and parse a single lead from CSV row
interface ParsedLead {
  data: LeadFormData | null
  errors: string[]
}

export function parseLeadFromCSV(row: string[], headerMap: Map<string, number>): ParsedLead {
  const errors: string[] = []

  const getValue = (key: string): string => {
    const index = headerMap.get(key)
    return index !== undefined ? (row[index] || "").trim() : ""
  }

  const getBoolean = (key: string): boolean => {
    const value = getValue(key).toLowerCase()
    return value === "yes" || value === "true" || value === "1"
  }

  const getNumber = (key: string): number | undefined => {
    const value = getValue(key)
    if (!value) return undefined
    const num = parseFloat(value)
    return isNaN(num) ? undefined : num
  }

  // Required fields validation
  const firstName = getValue("first_name")
  const lastName = getValue("last_name")
  const phone = getValue("phone").replace(/[^0-9]/g, "")

  if (!firstName) errors.push("First name is required")
  if (!lastName) errors.push("Last name is required")
  if (!phone) errors.push("Phone is required")
  if (phone && phone.length !== 8) errors.push("Phone must be 8 digits")

  // Source validation
  let source = getValue("source").toLowerCase().replace(/[\s-]/g, "_") as LeadSource
  let sourceCategory = getValue("source_category").toLowerCase().replace(/[\s-]/g, "_") as LeadSourceCategory

  // Default source if not provided
  if (!source || !VALID_SOURCES.includes(source)) {
    source = "walk_in"
    errors.push(`Invalid source, defaulting to 'walk_in'`)
  }
  if (!sourceCategory || !VALID_SOURCE_CATEGORIES.includes(sourceCategory)) {
    sourceCategory = "direct"
  }

  // Funding type validation
  let fundingType = getValue("funding_type").toLowerCase().replace(/[\s-]/g, "_") as FundingType
  if (!fundingType || !VALID_FUNDING_TYPES.includes(fundingType)) {
    fundingType = "self_funded"
  }

  // School validation - accept any non-empty value (full list is in the School type)
  let school = getValue("school").toLowerCase().replace(/[\s-]/g, "_") as School | undefined
  if (!school) {
    school = undefined
  }

  // Grade level validation
  let gradeLevel = getValue("grade_level") as GradeLevel | undefined
  if (gradeLevel && !VALID_GRADE_LEVELS.includes(gradeLevel)) {
    gradeLevel = undefined
  }

  // Academic track validation
  let academicTrack = getValue("academic_track").toLowerCase() as AcademicTrack | undefined
  if (academicTrack && !VALID_ACADEMIC_TRACKS.includes(academicTrack)) {
    academicTrack = undefined
  }

  // Major validation
  let intendedMajor = getValue("intended_major").toLowerCase().replace(/[\s-]/g, "_") as IntendedMajor | undefined
  if (intendedMajor && !VALID_MAJORS.includes(intendedMajor)) {
    intendedMajor = undefined
  }

  // If there are critical errors, return null
  if (!firstName || !lastName || !phone || phone.length !== 8) {
    return { data: null, errors }
  }

  // Parse secondary phone (optional)
  const phoneSecondary = getValue("phone_secondary").replace(/[^0-9]/g, "")
  if (phoneSecondary && phoneSecondary.length !== 8) {
    errors.push("Secondary phone must be 8 digits")
  }

  const leadData: LeadFormData = {
    first_name: firstName,
    last_name: lastName,
    phone,
    phone_secondary: phoneSecondary && phoneSecondary.length === 8 ? phoneSecondary : undefined,
    email: getValue("email") || undefined,
    civil_id: getValue("civil_id").replace(/[^0-9]/g, "") || undefined,
    date_of_birth: getValue("date_of_birth") || undefined,
    gender: getValue("gender") || undefined,
    nationality: getValue("nationality") || undefined,
    is_kuwaiti: getBoolean("is_kuwaiti"),
    school,
    school_name_custom: getValue("school_name_custom") || undefined,
    grade_level: gradeLevel,
    academic_track: academicTrack,
    graduation_year: getNumber("graduation_year"),
    gpa_grade_10: getNumber("gpa_grade_10"),
    gpa_grade_11: getNumber("gpa_grade_11"),
    gpa_grade_12_expected: getNumber("gpa_grade_12_expected"),
    intended_major: intendedMajor,
    funding_type: fundingType,
    has_weyay_account: getBoolean("has_weyay_account"),
    has_bank_account: getBoolean("has_bank_account"),
    source_category: sourceCategory,
    source,
    source_detail: getValue("source_detail") || undefined,
    notes: getValue("notes") || undefined,
  }

  return { data: leadData, errors }
}

// Create header map from first row
export function createHeaderMap(headerRow: string[]): Map<string, number> {
  const map = new Map<string, number>()

  headerRow.forEach((header, index) => {
    // Normalize header name
    const normalized = header.toLowerCase().trim()
      .replace(/[\s\-]/g, "_")
      .replace(/[()]/g, "")

    // Map common variations to our column keys
    const mappings: Record<string, string> = {
      "first_name": "first_name",
      "firstname": "first_name",
      "first": "first_name",
      "last_name": "last_name",
      "lastname": "last_name",
      "last": "last_name",
      "phone": "phone",
      "mobile": "phone",
      "phone_number": "phone",
      "phone_secondary": "phone_secondary",
      "secondary_phone": "phone_secondary",
      "phone2": "phone_secondary",
      "alt_phone": "phone_secondary",
      "alternate_phone": "phone_secondary",
      "email": "email",
      "civil_id": "civil_id",
      "civilid": "civil_id",
      "date_of_birth": "date_of_birth",
      "dob": "date_of_birth",
      "birthday": "date_of_birth",
      "gender": "gender",
      "nationality": "nationality",
      "is_kuwaiti": "is_kuwaiti",
      "kuwaiti": "is_kuwaiti",
      "school_type": "school",
      "school_name": "school_name_custom",
      "school_name_custom": "school_name_custom",
      "grade_level": "grade_level",
      "grade": "grade_level",
      "academic_track": "academic_track",
      "track": "academic_track",
      "graduation_year": "graduation_year",
      "grad_year": "graduation_year",
      "gpa_grade_10": "gpa_grade_10",
      "gpa_10": "gpa_grade_10",
      "gpa_grade_11": "gpa_grade_11",
      "gpa_11": "gpa_grade_11",
      "gpa_grade_12_expected": "gpa_grade_12_expected",
      "gpa_12": "gpa_grade_12_expected",
      "intended_major": "intended_major",
      "major": "intended_major",
      "funding_type": "funding_type",
      "funding": "funding_type",
      "has_weyay_account": "has_weyay_account",
      "weyay": "has_weyay_account",
      "has_bank_account": "has_bank_account",
      "bank_account": "has_bank_account",
      "source_category": "source_category",
      "source": "source",
      "lead_source": "source",
      "source_detail": "source_detail",
      "notes": "notes",
    }

    const key = mappings[normalized]
    if (key) {
      map.set(key, index)
    }
  })

  return map
}

// Generate CSV template
export function generateCSVTemplate(): string {
  const headers = LEAD_CSV_COLUMNS.map(col => col.label)
  const exampleRow = [
    "Laila", "Khalifa",
    "55512345", "66612345",
    "laila@example.com", "123456789012",
    "2005-06-15", "Female", "Kuwaiti", "Yes",
    "Hawalli", "Kuwait National School", "12th", "Science", "2024",
    "85.5", "88.0", "90.0", "cyber_security",
    "self_funded", "Yes", "Yes",
    "direct", "walk_in", "Referred by friend", "Interested in Cyber Security program"
  ]

  return [headers.join(","), exampleRow.join(",")].join("\n")
}
