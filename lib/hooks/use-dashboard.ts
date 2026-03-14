"use client"

import { useMemo } from "react"
import { useLeads } from "./use-leads"
import { useTodayAppointments, useAppointmentStats } from "./use-appointments"
import { useAgentTargetProgress } from "./use-reports"
import { useConversionFunnel } from "./use-conversion-funnel"
import { useActivityFeed } from "./use-activity-feed"
import { useInsights } from "./use-insights"
import { getPreviousPeriod, computeDelta } from "./use-period-comparison"
import type { Lead } from "@/types"
import type { DateRange } from "@/components/dashboard/primitives/date-range-picker"

interface UseDashboardOptions {
  dateRange: DateRange
  isAdmin: boolean
  profileId: string | null
}

export function useDashboard({ dateRange, isAdmin, profileId }: UseDashboardOptions) {
  const { leads: allLeads, loading: leadsLoading } = useLeads({ limit: 500 })
  const { appointments: todayAppointments, loading: appointmentsLoading } = useTodayAppointments()
  const { stats: appointmentStats, loading: statsLoading } = useAppointmentStats()
  const { progress: myTargetProgress, allAgentsProgress, loading: targetLoading } =
    useAgentTargetProgress(profileId ?? undefined)

  // Conversion funnel
  const { data: funnelData, loading: funnelLoading } = useConversionFunnel(
    dateRange.start,
    dateRange.end,
    isAdmin ? null : profileId
  )

  // Activity feed
  const { activities, loading: activitiesLoading } = useActivityFeed({
    isAdmin,
    userId: profileId,
  })

  // Filter leads for current user (agent) or all (admin)
  const myLeads = useMemo(() => {
    if (isAdmin || !profileId) return allLeads
    return allLeads.filter((lead) => lead.assigned_to === profileId)
  }, [allLeads, profileId, isAdmin])

  // Filter leads by date range for stats
  const dateFilteredLeads = useMemo(() => {
    return myLeads.filter((l) => {
      const d = new Date(l.created_at)
      return d >= dateRange.start && d <= dateRange.end
    })
  }, [myLeads, dateRange])

  // Previous period leads for comparison
  const { previousStart, previousEnd } = useMemo(
    () => getPreviousPeriod(dateRange.start, dateRange.end),
    [dateRange]
  )

  const previousPeriodLeads = useMemo(() => {
    return myLeads.filter((l) => {
      const d = new Date(l.created_at)
      return d >= previousStart && d <= previousEnd
    })
  }, [myLeads, previousStart, previousEnd])

  // KPI stats
  const kpiStats = useMemo(() => {
    const current = dateFilteredLeads
    const prev = previousPeriodLeads

    const newLeads = current.filter((l) => l.pipeline_stage === "new").length
    const prevNewLeads = prev.filter((l) => l.pipeline_stage === "new").length

    const activeLeads = current.filter((l) => l.pipeline_stage !== "lost").length
    const prevActiveLeads = prev.filter((l) => l.pipeline_stage !== "lost").length

    const applications = current.filter((l) =>
      ["test", "application"].includes(l.pipeline_stage)
    ).length
    const prevApplications = prev.filter((l) =>
      ["test", "application"].includes(l.pipeline_stage)
    ).length

    const enrolled = current.filter((l) => l.pipeline_stage === "enrolled").length
    const prevEnrolled = prev.filter((l) => l.pipeline_stage === "enrolled").length

    const conversionRate =
      current.length > 0 ? Math.round((enrolled / current.length) * 100) : 0
    const prevConversionRate =
      prev.length > 0 ? Math.round((prevEnrolled / prev.length) * 100) : 0

    const needAttention = getNeedAttentionLeads(myLeads, profileId, isAdmin)

    return {
      newLeads: { current: newLeads, previous: prevNewLeads, delta: computeDelta(newLeads, prevNewLeads) },
      activeLeads: { current: activeLeads, previous: prevActiveLeads, delta: computeDelta(activeLeads, prevActiveLeads) },
      appointments: { current: appointmentStats.today, previous: 0, delta: { deltaPercent: 0, direction: "flat" as const } },
      applications: { current: applications, previous: prevApplications, delta: computeDelta(applications, prevApplications) },
      enrolled: { current: enrolled, previous: prevEnrolled, delta: computeDelta(enrolled, prevEnrolled) },
      conversionRate: { current: conversionRate, previous: prevConversionRate, delta: computeDelta(conversionRate, prevConversionRate) },
      needAttention: needAttention.length,
      needAttentionLeads: needAttention,
    }
  }, [dateFilteredLeads, previousPeriodLeads, myLeads, profileId, isAdmin, appointmentStats])

  // Conversion delta for insights
  const conversionDelta = kpiStats.conversionRate.delta.deltaPercent

  // Insights
  const insights = useInsights({
    leads: myLeads,
    isAdmin,
    userId: profileId,
    myTargetProgress,
    allAgentsProgress,
    conversionDelta,
    overdueAppointments: appointmentStats.noUpdated || 0,
    missedCallsCount: 0,
    funnelDropOff: funnelData.all.stages,
  })

  const loading = leadsLoading || appointmentsLoading || statsLoading

  return {
    // Data
    myLeads,
    dateFilteredLeads,
    todayAppointments,
    appointmentStats,
    myTargetProgress,
    allAgentsProgress,
    funnelData,
    activities,
    insights,
    kpiStats,

    // Loading states
    loading,
    leadsLoading,
    appointmentsLoading,
    targetLoading,
    funnelLoading,
    activitiesLoading,
  }
}

function getNeedAttentionLeads(leads: Lead[], profileId: string | null, isAdmin: boolean) {
  const now = new Date()
  const relevantLeads = isAdmin ? leads : leads.filter((l) => l.assigned_to === profileId)

  const priorities: { lead: Lead; reason: string; urgency: "high" | "medium" | "low" }[] = []

  relevantLeads.forEach((lead) => {
    if (lead.pipeline_stage === "lost" || lead.pipeline_stage === "enrolled") return

    const created = new Date(lead.created_at)
    const lastContact = lead.last_contacted_at ? new Date(lead.last_contacted_at) : null
    const daysSinceCreated = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
    const daysSinceContact = lastContact
      ? Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
      : daysSinceCreated

    if (lead.pipeline_stage === "new" && !lastContact) {
      priorities.push({
        lead,
        reason: daysSinceCreated === 0 ? "New today" : `Waiting ${daysSinceCreated}d`,
        urgency: daysSinceCreated > 2 ? "high" : daysSinceCreated > 0 ? "medium" : "low",
      })
    } else if (daysSinceContact >= 3) {
      priorities.push({
        lead,
        reason: `${daysSinceContact}d no contact`,
        urgency: daysSinceContact >= 5 ? "high" : "medium",
      })
    }
  })

  return priorities
    .sort((a, b) => {
      const urgencyOrder = { high: 0, medium: 1, low: 2 }
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
    })
    .slice(0, 8)
}
