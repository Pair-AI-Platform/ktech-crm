export interface PspSelfServiceRequirementLead {
  first_name?: string | null
  last_name?: string | null
  civil_id?: string | null
  phone?: string | null
  education_type?: string | null
}

export function getMissingPspSelfServiceFields(lead: PspSelfServiceRequirementLead) {
  const missing: string[] = []
  const civilId = lead.civil_id?.trim() ?? ""

  if (!lead.first_name?.trim()) missing.push("first name")
  if (!lead.last_name?.trim()) missing.push("last name")
  if (!civilId) {
    missing.push("Civil ID")
  } else if (!/^\d{12}$/.test(civilId)) {
    missing.push("valid Civil ID")
  }
  if (!lead.phone?.trim()) missing.push("phone number")
  if (!lead.education_type?.trim()) missing.push("document education type")

  return missing
}
