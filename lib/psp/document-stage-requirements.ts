import type { Lead } from "@/types"
import { getMissingPspSelfServiceFields } from "@/lib/psp/self-service-requirements"

export interface PucDocumentCount {
  uploaded: number
  required: number
}

export function getMissingPucDocumentStageRequirements(
  lead: Lead,
  documentCount?: PucDocumentCount,
) {
  const missing = getMissingPspSelfServiceFields(lead)

  if (!documentCount || documentCount.required <= 0) {
    missing.push("required documents")
  } else if (documentCount.uploaded < documentCount.required) {
    missing.push(`required documents (${documentCount.uploaded}/${documentCount.required})`)
  }

  return missing
}
