import { isArabicText } from "@/lib/string-utils"

export const MISSING_ARABIC_NAME_LABEL = "الاسم العربي مفقود"

export type LeadNameFields = {
  first_name?: unknown
  last_name?: unknown
  first_name_ar?: unknown
  last_name_ar?: unknown
  phone?: unknown
}

const NAME_FIELD_LABELS: Record<Exclude<keyof LeadNameFields, "phone">, string> = {
  first_name: "First name",
  last_name: "Last name",
  first_name_ar: "Arabic first name",
  last_name_ar: "Arabic last name",
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : ""
}

export function isArabicNameValue(value: unknown): boolean {
  const cleaned = cleanText(value)
  return cleaned.length > 0 && isArabicText(cleaned)
}

export function getArabicLeadNameParts(lead: LeadNameFields): {
  firstName: string
  lastName: string
  fullName: string
} {
  const primaryFirst = cleanText(lead.first_name)
  const primaryLast = cleanText(lead.last_name)
  const arabicFirst = cleanText(lead.first_name_ar)
  const arabicLast = cleanText(lead.last_name_ar)

  const firstName = isArabicNameValue(arabicFirst)
    ? arabicFirst
    : isArabicNameValue(primaryFirst)
      ? primaryFirst
      : ""
  const lastName = isArabicNameValue(arabicLast)
    ? arabicLast
    : isArabicNameValue(primaryLast)
      ? primaryLast
      : ""
  const fullName = [firstName, lastName].filter(Boolean).join(" ")

  return { firstName, lastName, fullName }
}

export function getArabicLeadDisplayName(lead: LeadNameFields): string {
  return getArabicLeadNameParts(lead).fullName || MISSING_ARABIC_NAME_LABEL
}

export function getArabicLeadShortDisplayName(lead: LeadNameFields): string {
  const { fullName } = getArabicLeadNameParts(lead)
  const tokens = fullName.split(/\s+/).filter(Boolean).slice(0, 2)
  return tokens.join(" ") || MISSING_ARABIC_NAME_LABEL
}

export function getArabicLeadInitials(lead: LeadNameFields): string {
  const { firstName, lastName } = getArabicLeadNameParts(lead)
  return [firstName, lastName].filter(Boolean).map((part) => part.charAt(0)).join("") || "؟"
}

export function splitArabicFullName(fullName: unknown): { first_name: string; last_name: string } | null {
  const cleaned = cleanText(fullName)
  if (!cleaned || !isArabicText(cleaned)) return null

  const parts = cleaned.split(/\s+/).filter(Boolean)
  return {
    first_name: parts[0] || "",
    last_name: parts.slice(1).join(" "),
  }
}

export function normalizeArabicLeadNameFields<T extends LeadNameFields>(fields: T): T {
  const next = { ...fields }
  const { firstName, lastName } = getArabicLeadNameParts(fields)

  if (firstName) {
    next.first_name = firstName
    next.first_name_ar = firstName
  }

  if (lastName) {
    next.last_name = lastName
    next.last_name_ar = lastName
  }

  return next
}

export function getArabicLeadNameErrors(
  fields: LeadNameFields,
  options: { requireFirstName?: boolean; requireLastName?: boolean } = {},
): string[] {
  const errors: string[] = []

  for (const key of ["first_name", "last_name", "first_name_ar", "last_name_ar"] as const) {
    const value = cleanText(fields[key])
    if (value && !isArabicText(value)) {
      errors.push(`${NAME_FIELD_LABELS[key]} must be in Arabic`)
    }
  }

  const { firstName, lastName } = getArabicLeadNameParts(fields)
  if (options.requireFirstName && !firstName) {
    errors.push("First name must be in Arabic")
  }
  if (options.requireLastName && !lastName) {
    errors.push("Last name must be in Arabic")
  }

  return errors
}

export function assertArabicLeadNameFields<T extends LeadNameFields>(
  fields: T,
  options: { requireFirstName?: boolean; requireLastName?: boolean } = {},
): T {
  const normalized = normalizeArabicLeadNameFields(fields)
  const errors = getArabicLeadNameErrors(normalized, options)
  if (errors.length > 0) {
    throw new Error(errors.join("; "))
  }
  return normalized
}
