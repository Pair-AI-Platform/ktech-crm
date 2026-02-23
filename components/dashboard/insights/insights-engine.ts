import type { Lead } from "@/types"
import type { AgentTargetProgress } from "@/lib/hooks/use-reports"
import type { FunnelStage } from "@/lib/hooks/use-conversion-funnel"
import { INSIGHT_RULES, type InsightSeverity } from "./insight-rules"

export interface InsightInput {
  leads: Lead[]
  isAdmin: boolean
  userId?: string | null
  myTargetProgress?: AgentTargetProgress | null
  allAgentsProgress?: AgentTargetProgress[]
  conversionDelta?: number
  overdueAppointments: number
  missedCallsCount: number
  funnelDropOff?: FunnelStage[]
}

export interface Insight {
  id: string
  severity: InsightSeverity
  title: string
  description: string
  cta?: { label: string; href: string }
}

const SEVERITY_ORDER: Record<InsightSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
  success: 3,
}

/**
 * Pure function: takes dashboard data, runs all rule definitions, returns sorted insights.
 * No API calls - purely client-side computation.
 */
export function computeInsights(input: InsightInput): Insight[] {
  const insights: Insight[] = []

  for (const rule of INSIGHT_RULES) {
    // Skip rules not relevant to current role
    if (rule.audience === "admin" && !input.isAdmin) continue
    if (rule.audience === "agent" && input.isAdmin) continue

    const result = rule.evaluate(input)
    if (result) {
      insights.push(result)
    }
  }

  // Sort by severity (critical first)
  return insights.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
}
