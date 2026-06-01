import type { Lead } from "@/types"
import { getMissingPspSelfServiceFields } from "@/lib/psp/self-service-requirements"

export interface PucDocumentCount {
  uploaded: number
  required: number
}

export function getMissingPucDocumentStageRequirements(
  lead: Lead,
  // documentCount kept for call-site compatibility; documents are no longer
  // gated before entering the Documents stage — the stage exists to collect them.
  _documentCount?: PucDocumentCount,
) {
  // A lead may move from File → Documents as long as the five core fields are
  // filled (first name, last name, Civil ID, phone, document education type).
  return getMissingPspSelfServiceFields(lead)
}
