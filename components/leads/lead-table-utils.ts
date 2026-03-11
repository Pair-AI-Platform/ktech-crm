import { Flame, Thermometer, Snowflake } from "lucide-react"
import { PIPELINE_STAGES } from "@/types"
import type { Lead } from "@/types"

// PUC pipeline stages shown in the Stage column dropdown (all stages)
export const PUC_PIPELINE_STAGES = PIPELINE_STAGES

export type SortField = "name" | "pipeline_stage" | "source" | "school" | "expected_gpa" | "actual_gpa"
export type SortDirection = "asc" | "desc"
export type LeadTemperature = "hot" | "warm" | "cold"

export const PROGRESS_MAX = 10
export const CIRCLE_RADIUS = 14
export const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS

// Calculate lead temperature based on activity and pipeline stage
export function getLeadTemperature(lead: Lead): { temperature: LeadTemperature; description: string } {
  const now = Date.now()
  const daysSinceContact = lead.last_contacted_at
    ? Math.floor((now - new Date(lead.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24))
    : null

  // HOT: contacted in last 3 days AND in advanced pipeline stages
  if (
    daysSinceContact !== null &&
    daysSinceContact <= 3 &&
    ["test", "application"].includes(lead.pipeline_stage)
  ) {
    return {
      temperature: "hot",
      description: "Recently contacted (last 3 days) and actively progressing through the pipeline. High priority for follow-up."
    }
  }

  // WARM: contacted in last 7 days OR in early active stages with recent contact
  if (
    daysSinceContact !== null &&
    daysSinceContact <= 7 &&
    ["test"].includes(lead.pipeline_stage)
  ) {
    return {
      temperature: "warm",
      description: "Engaged within the past week and showing interest. Good candidate for nurturing and next steps."
    }
  }

  // COLD: no contact OR not contacted in 14+ days OR stuck in new/lost
  if (
    daysSinceContact === null ||
    daysSinceContact > 14 ||
    ["new", "lost"].includes(lead.pipeline_stage)
  ) {
    return {
      temperature: "cold",
      description: "No recent contact (14+ days) or never contacted. Needs re-engagement or may be unresponsive."
    }
  }

  // Default to warm for anything in between
  return {
    temperature: "warm",
    description: "Moderately engaged. Consider scheduling follow-up to maintain momentum."
  }
}

export const temperatureConfig = {
  hot: {
    icon: Flame,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    ring: "ring-orange-500",
    ringBg: "ring-orange-500/30",
    stroke: "#f97316"
  },
  warm: {
    icon: Thermometer,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    ring: "ring-amber-500",
    ringBg: "ring-amber-500/30",
    stroke: "#f59e0b"
  },
  cold: {
    icon: Snowflake,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
    ring: "ring-blue-400",
    ringBg: "ring-blue-400/30",
    stroke: "#60a5fa"
  }
}

// Document requirements by graduate type (must match PSP wizard / document-rules.ts)
export const DOCUMENTS_BY_TYPE: Record<string, { id: string; required: boolean }[]> = {
  gov: [
    { id: "passport", required: true },
    { id: "civil_id", required: true },
    { id: "parent_civil_id", required: true },
    { id: "hs_certificate", required: true },
    { id: "nationality", required: true },
    { id: "puc_receipt", required: true },
    { id: "acceptance_letter", required: true },
  ],
  us: [
    { id: "civil_id", required: true },
    { id: "passport", required: true },
    { id: "nationality", required: true },
    { id: "transcript_moh", required: true },
    { id: "sequence", required: true },
    { id: "equivalency", required: true },
    { id: "puc_receipt", required: true },
    { id: "acceptance_letter", required: true },
  ],
  uk: [
    { id: "civil_id", required: true },
    { id: "gcse", required: true },
    { id: "equivalency", required: true },
    { id: "passport", required: true },
    { id: "nationality", required: true },
    { id: "puc_receipt", required: true },
    { id: "acceptance_letter", required: true },
  ],
  ksa: [
    { id: "civil_id", required: true },
    { id: "shahada", required: true },
    { id: "qiyas", required: true },
    { id: "passport", required: true },
    { id: "nationality", required: true },
    { id: "puc_receipt", required: true },
    { id: "acceptance_letter", required: true },
  ],
  other: [
    { id: "civil_id", required: true },
    { id: "hs_certificate", required: true },
    { id: "equivalency", required: true },
    { id: "passport", required: true },
    { id: "nationality", required: true },
    { id: "puc_receipt", required: true },
    { id: "acceptance_letter", required: true },
  ],
}

// Check if all required documents are uploaded for a lead
export function checkAllDocumentsUploaded(leadId: string): boolean {
  // Check all graduate types to find which one has documents
  const graduateTypes = ['gov', 'us', 'uk', 'ksa', 'other']

  for (const graduateType of graduateTypes) {
    const storageKey = `psp-documents-${leadId}-${graduateType}`
    const stored = localStorage.getItem(storageKey)

    if (stored) {
      try {
        const savedDocs = JSON.parse(stored) as { id: string; file?: unknown }[]
        const requiredDocs = DOCUMENTS_BY_TYPE[graduateType]

        // Check if all required documents have files uploaded
        const allUploaded = requiredDocs.every(reqDoc => {
          const savedDoc = savedDocs.find(d => d.id === reqDoc.id)
          return savedDoc?.file !== undefined
        })

        if (allUploaded && requiredDocs.length > 0) {
          return true
        }
      } catch (e) {
        console.error('Failed to parse document status:', e)
      }
    }
  }

  return false
}
