"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useDashboardStats, type DashboardLead } from "@/lib/hooks/use-dashboard-stats"
import { useTodayAppointments, useNoUpdatedAppointments } from "@/lib/hooks/use-appointments"
import { useAgentPresence } from "@/lib/hooks/use-agent-presence"
import { useStageDropoff } from "@/lib/hooks/use-stage-dropoff"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode } from "@/lib/demo-data"
import { queryKeys } from "@/lib/hooks/query-keys"
import { SectionBoundary } from "@/components/dashboard/section-boundary"
import { NoUpdatedSection } from "@/components/dashboard/sections/no-updated-section"
import { PipelineSection } from "@/components/dashboard/sections/pipeline-section"
import { AttentionSection } from "@/components/dashboard/sections/attention-section"
import { BirthdaySection } from "@/components/dashboard/sections/birthday-section"
import { AdminDropoffSection } from "@/components/dashboard/sections/admin-dropoff-section"
import { AdminAgentHeatmap } from "@/components/dashboard/sections/admin-agent-heatmap"
import { AdminAppointmentsSection } from "@/components/dashboard/sections/admin-appointments-section"
import { AdminSourcePerformance, SOURCE_LABELS } from "@/components/dashboard/sections/admin-source-performance"
import { AdminWorkloadSection } from "@/components/dashboard/sections/admin-workload-section"

const TERMINAL_STAGES = ["lost", "enrolled", "withdraw"]

type ActivityCreatedByRow = { created_by: string | null }
type AppointmentAgentRow = { assigned_agent: string | null }
type LeadAssignedToRow = { assigned_to: string | null }

export function AdminDashboardContent() {
  const {
    allLeads,
    sfLeads,
    pucLeads,
    attentionPool,
    loading: leadsLoading,
  } = useDashboardStats()
  const { appointments: todayAppointments, loading: appointmentsLoading } = useTodayAppointments()
  const { appointments: noUpdatedAppointments, loading: noUpdatedLoading, refetch: refetchNoUpdated } = useNoUpdatedAppointments()
  const { agents: agentPresence, loading: presenceLoading } = useAgentPresence()
  const { dropoffData, loading: dropoffLoading } = useStageDropoff()

  const { data: todayChangesMap = new Map<string, number>() } = useQuery({
    queryKey: queryKeys.todayChanges.all,
    queryFn: async () => {
      if (isDemoMode()) return new Map<string, number>()
      const supabase = createClient()
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from("activities")
        .select("created_by")
        .in("activity_type", ["stage_change", "status_change"])
        .gte("created_at", todayStart.toISOString())

      if (error) throw error

      const counts = new Map<string, number>()
      const rows = (data ?? []) as ActivityCreatedByRow[]
      rows.forEach(row => {
        if (row.created_by) counts.set(row.created_by, (counts.get(row.created_by) || 0) + 1)
      })
      return counts
    },
    staleTime: 60_000,
  })

  const { data: agentApptsMap = new Map<string, number>() } = useQuery({
    queryKey: queryKeys.agentAppointmentsToday.all,
    queryFn: async () => {
      if (isDemoMode()) return new Map<string, number>()
      const supabase = createClient()
      const today = new Date().toISOString().split("T")[0]

      const { data, error } = await supabase
        .from("appointments")
        .select("assigned_agent")
        .eq("scheduled_date", today)
        .not("status", "eq", "cancelled")

      if (error) throw error

      const counts = new Map<string, number>()
      const rows = (data ?? []) as AppointmentAgentRow[]
      rows.forEach(row => {
        if (row.assigned_agent) counts.set(row.assigned_agent, (counts.get(row.assigned_agent) || 0) + 1)
      })
      return counts
    },
    staleTime: 60_000,
  })

  const { data: lastMonthMap = new Map<string, number>() } = useQuery({
    queryKey: queryKeys.lastMonthLeadCounts.all,
    queryFn: async () => {
      if (isDemoMode()) return new Map<string, number>()
      const supabase = createClient()
      const now = new Date()
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

      const { data, error } = await supabase
        .from("leads")
        .select("assigned_to")
        .gte("created_at", lastMonthStart.toISOString())
        .lte("created_at", lastMonthEnd.toISOString())

      if (error) throw error

      const counts = new Map<string, number>()
      const rows = (data ?? []) as LeadAssignedToRow[]
      rows.forEach(row => {
        if (row.assigned_to) counts.set(row.assigned_to, (counts.get(row.assigned_to) || 0) + 1)
      })
      return counts
    },
    staleTime: 300_000,
  })

  const priorityLeads = usePriorityLeads(attentionPool)
  const birthdayLeads = useBirthdayLeads(attentionPool)

  const agentHeatmapData = useMemo(() => {
    const leadCounts = new Map<string, number>()
    const monthlyOpenedCounts = new Map<string, number>()
    const enrolledCounts = new Map<string, number>()
    const totalAssignedCounts = new Map<string, number>()
    const overdueFollowUps = new Map<string, number>()
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)

    allLeads.forEach(l => {
      if (!l.assigned_to) return
      totalAssignedCounts.set(l.assigned_to, (totalAssignedCounts.get(l.assigned_to) || 0) + 1)

      if (!TERMINAL_STAGES.includes(l.pipeline_stage)) {
        leadCounts.set(l.assigned_to, (leadCounts.get(l.assigned_to) || 0) + 1)
        const lastContact = l.last_contacted_at ? new Date(l.last_contacted_at) : null
        if (!lastContact || lastContact < fiveDaysAgo) {
          overdueFollowUps.set(l.assigned_to, (overdueFollowUps.get(l.assigned_to) || 0) + 1)
        }
      }

      if (l.pipeline_stage === "enrolled") {
        enrolledCounts.set(l.assigned_to, (enrolledCounts.get(l.assigned_to) || 0) + 1)
      }
      if (l.created_at && new Date(l.created_at) >= monthStart) {
        monthlyOpenedCounts.set(l.assigned_to, (monthlyOpenedCounts.get(l.assigned_to) || 0) + 1)
      }
    })

    return agentPresence.filter(a => leadCounts.has(a.id)).map((a) => {
      const total = totalAssignedCounts.get(a.id) || 0
      const enrolled = enrolledCounts.get(a.id) || 0
      return {
        id: a.id,
        name: a.name,
        status: a.status,
        activeLeadCount: leadCounts.get(a.id) || 0,
        filesOpenedThisMonth: monthlyOpenedCounts.get(a.id) || 0,
        todayChanges: todayChangesMap.get(a.id) || 0,
        conversionRate: total > 0 ? Math.round((enrolled / total) * 100) : 0,
        todayAppointments: agentApptsMap.get(a.id) || 0,
        lastMonthFiles: lastMonthMap.get(a.id) || 0,
        overdueFollowUps: overdueFollowUps.get(a.id) || 0,
      }
    })
  }, [agentPresence, allLeads, todayChangesMap, agentApptsMap, lastMonthMap])

  const sourcePerformanceData = useMemo(() => {
    if (allLeads.length === 0) return []
    const sourceMap = new Map<string, { total: number; files: number }>()

    allLeads.forEach(l => {
      const src = l.source || "other"
      const current = sourceMap.get(src) || { total: 0, files: 0 }
      current.total++
      if (l.pipeline_stage === "application") current.files++
      sourceMap.set(src, current)
    })

    return [...sourceMap.entries()]
      .map(([source, data]) => ({
        source,
        label: SOURCE_LABELS[source] || source.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        total: data.total,
        files: data.files,
        conversionRate: data.total > 0 ? Math.round((data.files / data.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
  }, [allLeads])

  const workloadData = useMemo(() => {
    if (agentPresence.length === 0) return []
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const agentMap = new Map<string, { active: number; newThisMonth: number; enrolled: number }>()
    agentPresence.forEach(a => agentMap.set(a.id, { active: 0, newThisMonth: 0, enrolled: 0 }))

    allLeads.forEach(l => {
      if (!l.assigned_to || !agentMap.has(l.assigned_to)) return
      const data = agentMap.get(l.assigned_to)!
      if (!TERMINAL_STAGES.includes(l.pipeline_stage)) data.active++
      if (l.pipeline_stage === "enrolled") data.enrolled++
      if (l.created_at && new Date(l.created_at) >= monthStart) data.newThisMonth++
    })

    return agentPresence.map(a => {
      const data = agentMap.get(a.id) || { active: 0, newThisMonth: 0, enrolled: 0 }
      return { id: a.id, name: a.name, activeLeads: data.active, newThisMonth: data.newThisMonth, enrolled: data.enrolled }
    }).filter(agent => agent.activeLeads > 0).sort((a, b) => b.activeLeads - a.activeLeads)
  }, [agentPresence, allLeads])

  return (
    <>
      <SectionBoundary name="AdminAgentHeatmap">
        <AdminAgentHeatmap agents={agentHeatmapData} loading={presenceLoading} />
      </SectionBoundary>

      <SectionBoundary name="NoUpdatedSection">
        <NoUpdatedSection
          noUpdatedAppointments={noUpdatedAppointments}
          noUpdatedLoading={noUpdatedLoading}
          refetchNoUpdated={refetchNoUpdated}
        />
      </SectionBoundary>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionBoundary name="AdminSourcePerformance">
          <AdminSourcePerformance sources={sourcePerformanceData} loading={leadsLoading} />
        </SectionBoundary>
        <SectionBoundary name="AdminWorkloadSection">
          <AdminWorkloadSection agents={workloadData} loading={presenceLoading || leadsLoading} />
        </SectionBoundary>
      </div>

      <SectionBoundary name="AdminDropoffSection">
        <AdminDropoffSection dropoffData={dropoffData} loading={dropoffLoading} />
      </SectionBoundary>

      <SectionBoundary name="PipelineSection">
        <PipelineSection sfLeads={sfLeads} pucLeads={pucLeads} loading={leadsLoading} />
      </SectionBoundary>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionBoundary name="AdminAppointmentsSection">
          <AdminAppointmentsSection todayAppointments={todayAppointments} loading={appointmentsLoading} />
        </SectionBoundary>
        <SectionBoundary name="AttentionSection(admin)">
          <AttentionSection priorityLeads={priorityLeads} loading={leadsLoading} />
        </SectionBoundary>
        <SectionBoundary name="BirthdaySection(admin)">
          <BirthdaySection birthdayLeads={birthdayLeads} loading={leadsLoading} />
        </SectionBoundary>
      </div>
    </>
  )
}

function usePriorityLeads(attentionPool: DashboardLead[]) {
  return useMemo(() => {
    if (!attentionPool.length) return []
    const now = new Date()
    const priorities: { lead: DashboardLead; reason: string; urgency: "high" | "medium" | "low" }[] = []

    attentionPool.forEach(lead => {
      if (lead.pipeline_stage === "lost" || lead.pipeline_stage === "enrolled" || lead.pipeline_stage === "withdraw") return
      const created = new Date(lead.created_at)
      const lastContact = lead.last_contacted_at ? new Date(lead.last_contacted_at) : null
      const daysSinceCreated = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
      const daysSinceContact = lastContact
        ? Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
        : daysSinceCreated

      if (lead.priority === "critical") {
        priorities.push({ lead, reason: "CRITICAL", urgency: "high" })
      } else if (lead.priority === "important") {
        priorities.push({ lead, reason: "Important", urgency: daysSinceContact >= 2 ? "high" : "medium" })
      } else if (lead.pipeline_stage === "new" && !lastContact) {
        priorities.push({
          lead,
          reason: daysSinceCreated === 0 ? "New today" : `Waiting ${daysSinceCreated}d`,
          urgency: daysSinceCreated > 2 ? "high" : daysSinceCreated > 0 ? "medium" : "low",
        })
      } else if (lead.pipeline_stage === "contacted" && (lead.status === "interested" || lead.status === "will_see")) {
        priorities.push({
          lead,
          reason: lead.status === "interested" ? "Interested" : "Will See",
          urgency: daysSinceContact >= 3 ? "high" : "medium",
        })
      } else if (lead.status === "callback") {
        priorities.push({ lead, reason: "Callback requested", urgency: daysSinceContact >= 2 ? "high" : "medium" })
      } else if (lead.status === "no_answer" && daysSinceContact >= 1) {
        priorities.push({ lead, reason: `No answer · ${daysSinceContact}d ago`, urgency: daysSinceContact >= 3 ? "high" : "medium" })
      } else if (daysSinceContact >= 3) {
        priorities.push({ lead, reason: `${daysSinceContact}d no contact`, urgency: daysSinceContact >= 5 ? "high" : "medium" })
      } else {
        const daysSinceUpdated = Math.floor((now.getTime() - new Date(lead.updated_at).getTime()) / (1000 * 60 * 60 * 24))
        if (daysSinceUpdated >= 7 && ["contacted", "test"].includes(lead.pipeline_stage)) {
          priorities.push({
            lead,
            reason: `Stale ${daysSinceUpdated}d in ${lead.pipeline_stage}`,
            urgency: daysSinceUpdated >= 14 ? "high" : "medium",
          })
        }
      }
    })

    const urgencyOrder = { high: 0, medium: 1, low: 2 }
    return priorities.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]).slice(0, 5)
  }, [attentionPool])
}

function useBirthdayLeads(attentionPool: DashboardLead[]) {
  return useMemo(() => {
    const today = new Date()
    const results: { lead: DashboardLead; daysUntil: number; isToday: boolean }[] = []

    attentionPool.forEach(lead => {
      if (!lead.date_of_birth) return
      if (lead.pipeline_stage === "lost" || lead.pipeline_stage === "withdraw") return
      const dob = new Date(lead.date_of_birth)
      const thisYearBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
      let diff = Math.floor((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      if (diff < 0) {
        const nextYearBirthday = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate())
        diff = Math.floor((nextYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      }
      if (diff <= 30) results.push({ lead, daysUntil: diff, isToday: diff === 0 })
    })

    return results.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 10)
  }, [attentionPool])
}
