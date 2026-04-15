import type { Lead, PipelineStage } from "@/types"

export type StageGuardResult =
  | { kind: "allow" }
  | { kind: "lost"; lead: Lead }
  | { kind: "withdraw"; lead: Lead }
  | { kind: "contacted"; lead: Lead }
  | { kind: "file_fee"; lead: Lead }
  | { kind: "enrollment_payment"; lead: Lead }

export interface StageGuardInput {
  lead: Lead
  newStage: PipelineStage
  amountPaid?: number
  isPucSrjView?: boolean
}

export function checkStageTransition({
  lead,
  newStage,
  amountPaid = 0,
  isPucSrjView = false,
}: StageGuardInput): StageGuardResult {
  if (newStage === "lost") return { kind: "lost", lead }
  if (newStage === "withdraw") return { kind: "withdraw", lead }
  if (newStage === "contacted") return { kind: "contacted", lead }

  if (newStage === "application") {
    if (lead.file_fee_status !== "paid" && lead.file_fee_status !== "exempt") {
      return { kind: "file_fee", lead }
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