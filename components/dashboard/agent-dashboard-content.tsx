"use client"

import { useMemo } from "react"
import { useAgentHistory } from "@/lib/hooks/use-agent-history"
import { useAgentTargetHistory, useAgentTargetProgress } from "@/lib/hooks/use-agent-targets"
import { useTodayAppointments, useNoUpdatedAppointments } from "@/lib/hooks/use-appointments"
import { useDashboardStats, type DashboardLead } from "@/lib/hooks/use-dashboard-stats"
import { SectionBoundary } from "@/components/dashboard/section-boundary"
import { NoUpdatedSection } from "@/components/dashboard/sections/no-updated-section"
import { TargetSection } from "@/components/dashboard/sections/target-section"
import { BirthdaySection } from "@/components/dashboard/sections/birthday-section"
import { AppointmentsSection } from "@/components/dashboard/sections/appointments-section"
import { HistorySection } from "@/components/dashboard/sections/history-section"

interface AgentDashboardContentProps {
  profileId?: string
}

export function AgentDashboardContent({ profileId }: AgentDashboardContentProps) {
  const {
    attentionPool,
    loading: leadsLoading,
  } = useDashboardStats()
  const { appointments: todayAppointments, loading: appointmentsLoading } = useTodayAppointments({
    enabled: !!profileId,
    agentId: profileId,
    compact: true,
    realtime: false,
    limit: 50,
  })
  const { appointments: noUpdatedAppointments, loading: noUpdatedLoading, refetch: refetchNoUpdated } = useNoUpdatedAppointments({
    enabled: !!profileId,
    agentId: profileId,
    compact: true,
    realtime: false,
    limit: 100,
  })
  const { progress: myTargetProgress } = useAgentTargetProgress(profileId, { enabled: !!profileId })
  const { history: targetHistory, loading: targetHistoryLoading } = useAgentTargetHistory(profileId, 6, { enabled: !!profileId })
  const { history: agentHistory, loading: historyLoading } = useAgentHistory(profileId, { enabled: !!profileId })

  const birthdayLeads = useBirthdayLeads(attentionPool)

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

      <SectionBoundary name="BirthdaySection">
        <BirthdaySection birthdayLeads={birthdayLeads} loading={leadsLoading} />
      </SectionBoundary>

      <SectionBoundary name="AppointmentsSection">
        <AppointmentsSection todayAppointments={todayAppointments} loading={appointmentsLoading} />
      </SectionBoundary>

      <SectionBoundary name="HistorySection">
        <HistorySection agentHistory={agentHistory} loading={historyLoading} />
      </SectionBoundary>
    </>
  )
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
