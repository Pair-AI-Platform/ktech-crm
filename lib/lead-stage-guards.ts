import type { Lead, PipelineStage } from "@/types"
import { getMissingPucDocumentStageRequirements, type PucDocumentCount } from "@/lib/psp/document-stage-requirements"
import { getMissingPspSelfServiceFields } from "@/lib/psp/self-service-requirements"

export type StageGuardResult =
  | { kind: "allow" }
  | { kind: "lost"; lead: Lead }
  | { kind: "withdraw"; lead: Lead }
  | { kind: "contacted"; lead: Lead }
  | { kind: "file_requirements"; lead: Lead; missingFields: string[] }
  | { kind: "file_fee"; lead: Lead }
  | { kind: "enrollment_payment"; lead: Lead }
  | { kind: "puc_document_requirements"; lead: Lead; missingFields: string[] }

export interface StageGuardInput {
  lead: Lead
  newStage: PipelineStage
  amountPaid?: number
  isPucSrjView?: boolean
  pucDocumentCount?: PucDocumentCount
}

export function checkStageTransition({
  lead,
  newStage,
  amountPaid = 0,
  isPucSrjView = false,
  pucDocumentCount,
}: StageGuardInput): StageGuardResult {
  if (newStage === "lost") return { kind: "lost", lead }
  if (newStage === "withdraw") return { kind: "withdraw", lead }
  if (newStage === "contacted") return { kind: "contacted", lead }

  if (newStage === "application" && lead.pipeline_stage !== "application") {
    const missingFields = getMissingPspSelfServiceFields(lead)
    if (missingFields.length > 0) {
      return { kind: "file_requirements", lead, missingFields }
    }

    if (lead.file_fee_status !== "paid" && lead.file_fee_status !== "exempt") {
      return { kind: "file_fee", lead }
    }
  }

  if (
    newStage === "puc_document_submission" &&
    lead.pipeline_stage === "application" &&
    lead.funding_type === "puc"
  ) {
    const missingFields = getMissingPucDocumentStageRequirements(lead, pucDocumentCount)
    if (missingFields.length > 0) {
      return { kind: "puc_document_requirements", lead, missingFields }
    }
  }

  if (newStage === "applicant" && !isPucSrjView) {
    if (lead.funding_type !== "puc" && amountPaid < 150) {
      return { kind: "enrollment_payment", lead }
    }
  }

  if (lead.funding_type === "self_funded" && lead.pipeline_stage === "applicant" && amountPaid < 150) {
    return { kind: "enrollment_payment", lead }
  }

  return { kind: "allow" }
}
