/**
 * PUC Document Status Auto-Calculation
 * Computes the document status based on substage, document completion, and payment status.
 */

import type { PUCDocumentStatus } from "@/types"
import type { SubmissionSubstage } from "@/types"

/**
 * Compute the auto-calculated PUC document status for a lead.
 *
 * Documents stage priority: Missing Document > Pending Payment > Ready to Apply
 * Submissions stage: Applied
 * Applicant stage: returns null (no status shown)
 */
export function computePUCDocumentStatus(
  substage: SubmissionSubstage | null | undefined,
  allDocsComplete: boolean,
  paymentComplete: boolean,
): PUCDocumentStatus | null {
  const effectiveSubstage = substage || "documents"

  switch (effectiveSubstage) {
    case "documents":
      if (!allDocsComplete) return "missing_document"
      if (!paymentComplete) return "pending_payment"
      return "ready_to_apply"

    case "submissions":
      return "applied"

    default:
      return null
  }
}

/** Color mapping for status badges */
export const STATUS_BADGE_STYLES: Record<PUCDocumentStatus, { bg: string; text: string; border: string }> = {
  missing_document: {
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
  },
  pending_payment: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
  },
  ready_to_apply: {
    bg: "bg-green-50 dark:bg-green-950/30",
    text: "text-green-700 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
  },
  applied: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
}
