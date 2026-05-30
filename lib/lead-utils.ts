import { PIPELINE_STAGES, LEAD_STATUSES, LOCKED_STAGES } from '@/types'
import type { PipelineStage } from '@/types'
import { getArabicLeadDisplayName, getArabicLeadInitials } from '@/lib/lead-name-policy'

/**
 * Returns the full display name for a lead.
 * Lead names are Arabic-only. If Arabic name data is missing, show a clear
 * Arabic placeholder instead of falling back to English transliterations.
 */
export function getLeadDisplayName(lead: { first_name?: string | null; last_name?: string | null; first_name_ar?: string | null; last_name_ar?: string | null; phone?: string | null }): string {
  return getArabicLeadDisplayName(lead)
}

/**
 * Returns initials (first letter of first and last name).
 * Uses Arabic name fields only.
 */
export function getLeadInitials(lead: { first_name?: string | null; last_name?: string | null; first_name_ar?: string | null; last_name_ar?: string | null }): string {
  return getArabicLeadInitials(lead)
}

/**
 * Returns true if the lead's pipeline stage is considered active
 * (not lost, withdrawn, or enrolled).
 */
export function isLeadActive(stage: string): boolean {
  const inactiveStages: string[] = ['lost', 'withdraw', 'enrolled']
  return !inactiveStages.includes(stage)
}

/**
 * Returns the human-readable label for a pipeline stage value.
 */
export function getStageLabel(stage: string): string {
  return PIPELINE_STAGES.find((s) => s.value === stage)?.label ?? stage
}

/**
 * Returns the human-readable label for a lead status value.
 */
export function getStatusLabel(status: string): string {
  return LEAD_STATUSES.find((s) => s.value === status)?.label ?? status
}

/**
 * Returns true if the stage is locked (cannot be changed by agents).
 */
export function isLockedStage(stage: string): boolean {
  return LOCKED_STAGES.includes(stage as PipelineStage)
}
