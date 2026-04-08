import { PIPELINE_STAGES, LEAD_STATUSES, LOCKED_STAGES } from '@/types'
import type { PipelineStage } from '@/types'

/**
 * Returns the full display name for a lead.
 * Prefers Arabic name, falls back to English name, then phone.
 */
export function getLeadDisplayName(lead: { first_name?: string | null; last_name?: string | null; first_name_ar?: string | null; last_name_ar?: string | null; phone?: string | null }): string {
  const arName = [lead.first_name_ar, lead.last_name_ar].filter(Boolean).join(' ')
  if (arName) return arName
  const enName = [lead.first_name, lead.last_name].filter(Boolean).join(' ')
  if (enName) return enName
  return lead.phone || 'Unknown'
}

/**
 * Returns initials (first letter of first and last name).
 * Prefers Arabic, falls back to English.
 */
export function getLeadInitials(lead: { first_name?: string | null; last_name?: string | null; first_name_ar?: string | null; last_name_ar?: string | null }): string {
  const first = (lead.first_name_ar || lead.first_name)?.charAt(0) ?? ''
  const last = (lead.last_name_ar || lead.last_name)?.charAt(0) ?? ''
  return `${first}${last}` || '?'
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
