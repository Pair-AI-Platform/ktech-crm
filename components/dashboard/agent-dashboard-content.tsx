"use client"

import { useMemo } from "react"
import { useAgentHistory } from "@/lib/hooks/use-agent-history"
import { useAgentTargetHistory, useAgentTargetProgress } from "@/lib/hooks/use-agent-targets"
import { useTodayAppointments, useNoUpdatedAppointments } from "@/lib/hooks/use-appointments"
import { useDashboardStats, type DashboardLead } from "@/lib/hooks/use-dashboard-stats"
import { SectionBoundary } from "@/components/dashboard/section-boundary"
import { NoUpdatedSection } from "@/components/dashboard/sections/no-updated-section"
import { TargetSection } from "@/components/dashboard/sections/target-section"
import { AdminSourcePerformance, SOURCE_LABELS } from "@/components/dashboard/sections/admin-source-performance"
import { BirthdaySection } from "@/components/dashboard/sections/birthday-section"
import { AttentionSection } from "@/components/dashboard/sections/attention-section"
import { AppointmentsSection } from "@/components/dashboard/sections/appointments-section"
import { HistorySection } from "@/components/dashboard/sections/history-section"

interface AgentDashboardContentProps {
  profileId?: string
}

export function AgentDashboardContent({ profileId }: AgentDashboardContentProps) {
  const {
    myLeads,
    attentionPool,
    loading: leadsLoading,
  } = useDashboardStats()
  const { appointments: todayAppointments, loading: appointmentsLoading } = useTodayAppointments({
    enabled: !!profileId,
    agentId: profileId,
  })
  const { appointments: noUpdatedAppointments, loading: noUpdatedLoading, refetch: refetchNoUpdated } = useNoUpdatedAppointments({
    enabled: !!profileId,
    agentId: profileId,
  })
  const { progress: myTargetProgress } = useAgentTargetProgress(profileId, { enabled: !!profileId })
  const { history: targetHistory, loading: targetHistoryLoading } = useAgentTargetHistory(profileId, 6, { enabled: !!profileId })
  const { history: agentHistory, loading: historyLoading } = useAgentHistory(profileId, { enabled: !!profileId })

  const priorityLeads = usePriorityLeads(attentionPool)
  const birthdayLeads = useBirthdayLeads(attentionPool)

  const sourcePerformanceData = useMemo(() => {
    if (myLeads.length === 0) return []
    const sourceMap = new Map<string, { total: number; files: number }>()

    myLeads.forEach(lead => {
      const src = lead.source || "other"
      const current = sourceMap.get(src) || { total: 0, files: 0 }
      current.total++
      if (lead.pipeline_stage === "application") current.files++
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
  }, [myLeads])

  return (
    <>
      <SectionBoundary name="TargetSection">
        <TargetSection
          myTargetProgress={myTargetProgress}
          allAgentsProgress={[]}
          targetHistory={targetHistory}
          targetHistoryLoading={targetHistoryLoading}
          profileId={profileId}
        />
      </SectionBoundary>

      <SectionBoundary name="NoUpdatedSection">
        <NoUpdatedSection
          noUpdatedAppointments={noUpdatedAppointments}
          noUpdatedLoading={noUpdatedLoading}
          refetchNoUpdated={refetchNoUpdated}
        />
      </SectionBoundary>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionBoundary name="AdminSourcePerformance(files)">
          <AdminSourcePerformance sources={sourcePerformanceData} loading={leadsLoading} mode="files" />
        </SectionBoundary>
        <div className="flex flex-col gap-6">
          <SectionBoundary name="BirthdaySection">
            <BirthdaySection birthdayLeads={birthdayLeads} loading={leadsLoading} />
          </SectionBoundary>
          <SectionBoundary name="AttentionSection">
            <AttentionSection priorityLeads={priorityLeads} loading={leadsLoading} />
          </SectionBoundary>
        </div>
      </div>

      <SectionBoundary name="AppointmentsSection">
        <AppointmentsSection todayAppointments={todayAppointments} loading={appointmentsLoading} />
      </SectionBoundary>

      <SectionBoundary name="HistorySection">
        <HistorySection agentHistory={agentHistory} loading={historyLoading} />
      </SectionBoundary>
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
        priorities.push({ lead, reason: `No answer - ${daysSinceContact}d ago`, urgency: daysSinceContact >= 3 ? "high" : "medium" })
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
