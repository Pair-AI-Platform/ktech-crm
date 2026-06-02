import type { Lead, PipelineStage } from "@/types"
import { getMissingPucDocumentStageRequirements, type PucDocumentCount } from "@/lib/psp/document-stage-requirements"
import { getMissingPspSelfServiceFields } from "@/lib/psp/self-service-requirements"
import { ENROLLMENT_PAYMENT_AMOUNT, FULL_TUITION_AMOUNT } from "@/lib/config/constants"

export type StageGuardResult =
  | { kind: "allow" }
  | { kind: "lost"; lead: Lead }
  | { kind: "withdraw"; lead: Lead }
  | { kind: "contacted"; lead: Lead }
  | { kind: "file_requirements"; lead: Lead; missingFields: string[] }
  | { kind: "file_fee"; lead: Lead }
  | { kind: "sf_payment"; lead: Lead; required: number; paid: number; targetStage: PipelineStage }
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

  // Self-funded leads pay the 35 KWD file fee (application + test fee) when they
  // first move INTO the Test stage. The fee is one-time and can be exempted, so
  // once file_fee_status is paid/exempt the lead passes straight through.
  if (newStage === "test" && lead.pipeline_stage !== "test") {
    if (
      lead.funding_type === "self_funded" &&
      lead.file_fee_status !== "paid" &&
      lead.file_fee_status !== "exempt"
    ) {
      return { kind: "file_fee", lead }
    }
  }

  if (newStage === "application" && lead.pipeline_stage !== "application") {
    const missingFields = getMissingPspSelfServiceFields(lead)
    if (missingFields.length > 0) {
      return { kind: "file_requirements", lead, missingFields }
    }

    // PUC leads never pay File-stage fees — skip the fee gate entirely.
    if (
      lead.funding_type !== "puc" &&
      lead.file_fee_status !== "paid" &&
      lead.file_fee_status !== "exempt"
    ) {
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

  // --- Self-funded tuition payment milestones ---
  // SF leads must hit payment milestones before advancing, unless an admin has
  // granted a tuition-payment exemption for this lead.
  //   • Test → File      : at least the 150 KWD seat-reservation deposit
  //   • File → Applicant : the full 550 KWD tuition
  //   • → Enrolled       : the full 550 KWD tuition
  if (
    lead.funding_type === "self_funded" &&
    !lead.payment_exempt &&
    !isPucSrjView
  ) {
    if (
      newStage === "application" &&
      lead.pipeline_stage !== "application" &&
      amountPaid < ENROLLMENT_PAYMENT_AMOUNT
    ) {
      return { kind: "sf_payment", lead, required: ENROLLMENT_PAYMENT_AMOUNT, paid: amountPaid, targetStage: newStage }
    }

    if (
      (newStage === "applicant" || newStage === "enrolled") &&
      amountPaid < FULL_TUITION_AMOUNT
    ) {
      return { kind: "sf_payment", lead, required: FULL_TUITION_AMOUNT, paid: amountPaid, targetStage: newStage }
    }
  }

  return { kind: "allow" }
}
