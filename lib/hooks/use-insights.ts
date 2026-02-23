"use client"

import { useMemo } from "react"
import { computeInsights, type InsightInput, type Insight } from "@/components/dashboard/insights/insights-engine"

/**
 * React hook wrapper around the pure computeInsights function.
 * Memoizes the result to avoid recomputing on every render.
 */
export function useInsights(input: InsightInput): Insight[] {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- explicit deps for fine-grained control
  return useMemo(() => computeInsights(input), [
    input.leads,
    input.isAdmin,
    input.userId,
    input.myTargetProgress,
    input.allAgentsProgress,
    input.conversionDelta,
    input.overdueAppointments,
    input.missedCallsCount,
    input.funnelDropOff,
  ])
}
