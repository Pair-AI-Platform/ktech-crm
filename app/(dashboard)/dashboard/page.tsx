"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useDashboardStats } from "@/lib/hooks/use-dashboard-stats"
import type { DashboardLead } from "@/lib/hooks/use-dashboard-stats"
import { useUser } from "@/lib/hooks/use-user"
import { useTodayAppointments, useAppointmentStats, useNoUpdatedAppointments } from "@/lib/hooks/use-appointments"
import { useAgentTargetProgress, useAgentTargetHistory } from "@/lib/hooks/use-reports"
import { useAgentHistory } from "@/lib/hooks/use-agent-history"
import { useAgentPresence } from "@/lib/hooks/use-agent-presence"
import { useStageDropoff } from "@/lib/hooks/use-stage-dropoff"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode } from "@/lib/demo-data"
import { queryKeys } from "@/lib/hooks/query-keys"

// Extracted sections
import { GreetingHeader } from "@/components/dashboard/sections/greeting-header"
import { QuickStatsSection } from "@/components/dashboard/sections/quick-stats-section"
import { NoUpdatedSection } from "@/components/dashboard/sections/no-updated-section"
import { PipelineSection } from "@/components/dashboard/sections/pipeline-section"
import { AppointmentsSection } from "@/components/dashboard/sections/appointments-section"
import { TargetSection } from "@/components/dashboard/sections/target-section"
import { HistorySection } from "@/components/dashboard/sections/history-section"
import { AttentionSection } from "@/components/dashboard/sections/attention-section"
import { BirthdaySection } from "@/components/dashboard/sections/birthday-section"

// Admin sections
import { AdminKpiSection } from "@/components/dashboard/sections/admin-kpi-section"
import { AdminDropoffSection } from "@/components/dashboard/sections/admin-dropoff-section"
import { AdminAgentHeatmap } from "@/components/dashboard/sections/admin-agent-heatmap"
import { AdminAppointmentsSection } from "@/components/dashboard/sections/admin-appointments-section"
import { AdminSourcePerformance, SOURCE_LABELS } from "@/components/dashboard/sections/admin-source-performance"
import { AdminWorkloadSection } from "@/components/dashboard/sections/admin-workload-section"

const TERMINAL_STAGES = ['lost', 'enrolled', 'withdraw']

export default function DashboardPage() {
  const { profile, isAdmin } = useUser()
  const {
    allLeads,
    myLeads,
    sfLeads: mySfLeads,
    pucLeads: myPucLeads,
    attentionPool,
    loading: leadsLoading,
  } = useDashboardStats()
  const { appointments: todayAppointments, loading: appointmentsLoading } = useTodayAppointments()
  const { stats: appointmentStats, loading: statsLoading } = useAppointmentStats()
  const { progress: myTargetProgress, allAgentsProgress } = useAgentTargetProgress(profile?.id)
  const { history: targetHistory, loading: targetHistoryLoading } = useAgentTargetHistory(profile?.id)
  const { history: agentHistory, loading: historyLoading } = useAgentHistory(profile?.id)
  const { appointments: noUpdatedAppointments, loading: noUpdatedLoading, refetch: refetchNoUpdated } = useNoUpdatedAppointments()

  // Admin-specific hooks
  const { agents: agentPresence, loading: presenceLoading } = useAgentPresence()
  const { dropoffData, loading: dropoffLoading } = useStageDropoff()

  // Fetch today's changes count per agent (stage + status changes)
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
      data?.forEach(row => {
        if (row.created_by) {
          counts.set(row.created_by, (counts.get(row.created_by) || 0) + 1)
        }
      })
      return counts
    },
    enabled: isAdmin,
    staleTime: 60_000,
  })

  // Fetch today's appointment count per agent
  const { data: agentApptsMap = new Map<string, number>() } = useQuery({
    queryKey: queryKeys.agentAppointmentsToday.all,
    queryFn: async () => {
      if (isDemoMode()) return new Map<string, number>()

      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from("appointments")
        .select("assigned_agent")
        .eq("scheduled_date", today)
        .not("status", "eq", "cancelled")

      if (error) throw error

      const counts = new Map<string, number>()
      data?.forEach(row => {
        if (row.assigned_agent) {
          counts.set(row.assigned_agent, (counts.get(row.assigned_agent) || 0) + 1)
        }
      })
      return counts
    },
    enabled: isAdmin,
    staleTime: 60_000,
  })

  // Fetch last month's lead opened counts per agent (for trend)
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
      data?.forEach(row => {
        if (row.assigned_to) {
          counts.set(row.assigned_to, (counts.get(row.assigned_to) || 0) + 1)
        }
      })
      return counts
    },
    enabled: isAdmin,
    staleTime: 300_000,
  })

  // Admin today's callbacks count
  const adminTodayCallbacks = useMemo(() => {
    if (!isAdmin) return 0
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    return allLeads.filter(l => l.status === 'callback' && l.callback_date === todayStr).length
  }, [allLeads, isAdmin])

  // Only block on essential data — let admin sections load independently
  const isLoading = leadsLoading || appointmentsLoading || statsLoading

  // Priority leads computation
  const priorityLeads = useMemo(() => {
    if (!attentionPool.length) return []

    const now = new Date()
    const priorities: { lead: DashboardLead; reason: string; urgency: "high" | "medium" | "low" }[] = []

    attentionPool.forEach(lead => {
      if (lead.pipeline_stage === 'lost' || lead.pipeline_stage === 'enrolled' || lead.pipeline_stage === 'withdraw') return

      const created = new Date(lead.created_at)
      const lastContact = lead.last_contacted_at ? new Date(lead.last_contacted_at) : null
      const daysSinceCreated = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
      const daysSinceContact = lastContact
        ? Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
        : daysSinceCreated

      // Critical priority leads always at top
      if (lead.priority === 'critical') {
        priorities.push({
          lead,
          reason: 'CRITICAL',
          urgency: 'high',
        })
        return
      }

      // Important priority leads boosted
      if (lead.priority === 'important') {
        priorities.push({
          lead,
          reason: 'Important',
          urgency: daysSinceContact >= 2 ? 'high' : 'medium',
        })
        return
      }

      // New leads never contacted
      if (lead.pipeline_stage === 'new' && !lastContact) {
        priorities.push({
          lead,
          reason: daysSinceCreated === 0 ? 'New today' : `Waiting ${daysSinceCreated}d`,
          urgency: daysSinceCreated > 2 ? 'high' : daysSinceCreated > 0 ? 'medium' : 'low',
        })
        return
      }

      // Contacted leads with interested/will_see status
      if (lead.pipeline_stage === 'contacted' && (lead.status === 'interested' || lead.status === 'will_see')) {
        const statusLabel = lead.status === 'interested' ? 'Interested' : 'Will See'
        priorities.push({
          lead,
          reason: statusLabel,
          urgency: daysSinceContact >= 3 ? 'high' : 'medium',
        })
        return
      }

      // Callback requested
      if (lead.status === 'callback') {
        priorities.push({
          lead,
          reason: 'Callback requested',
          urgency: daysSinceContact >= 2 ? 'high' : 'medium',
        })
        return
      }

      // No answer leads needing retry
      if (lead.status === 'no_answer' && daysSinceContact >= 1) {
        priorities.push({
          lead,
          reason: `No answer · ${daysSinceContact}d ago`,
          urgency: daysSinceContact >= 3 ? 'high' : 'medium',
        })
        return
      }

      // No contact for 3+ days
      if (daysSinceContact >= 3) {
        priorities.push({
          lead,
          reason: `${daysSinceContact}d no contact`,
          urgency: daysSinceContact >= 5 ? 'high' : 'medium',
        })
        return
      }

      // Stale leads
      const daysSinceUpdated = Math.floor((now.getTime() - new Date(lead.updated_at).getTime()) / (1000 * 60 * 60 * 24))
      if (daysSinceUpdated >= 7 && ['contacted', 'test'].includes(lead.pipeline_stage)) {
        priorities.push({
          lead,
          reason: `Stale ${daysSinceUpdated}d in ${lead.pipeline_stage}`,
          urgency: daysSinceUpdated >= 14 ? 'high' : 'medium',
        })
      }
    })

    return priorities.sort((a, b) => {
      const urgencyOrder = { high: 0, medium: 1, low: 2 }
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
    }).slice(0, 5)
  }, [attentionPool])

  // Birthday leads computation
  const birthdayLeads = useMemo(() => {
    const today = new Date()
    const results: { lead: DashboardLead; daysUntil: number; isToday: boolean }[] = []

    attentionPool.forEach(lead => {
      if (!lead.date_of_birth) return
      if (lead.pipeline_stage === 'lost' || lead.pipeline_stage === 'withdraw') return

      const dob = new Date(lead.date_of_birth)
      const thisYearBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
      let diff = Math.floor((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      if (diff < 0) {
        const nextYearBirthday = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate())
        diff = Math.floor((nextYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      }

      if (diff <= 30) {
        results.push({ lead, daysUntil: diff, isToday: diff === 0 })
      }
    })

    return results.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 10)
  }, [attentionPool])

  // Prepare agent heatmap data (merge presence with lead counts + new metrics)
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

      // Total assigned (for conversion rate)
      totalAssignedCounts.set(l.assigned_to, (totalAssignedCounts.get(l.assigned_to) || 0) + 1)

      // Active leads (non-terminal)
      if (!TERMINAL_STAGES.includes(l.pipeline_stage)) {
        leadCounts.set(l.assigned_to, (leadCounts.get(l.assigned_to) || 0) + 1)

        // Overdue follow-ups: active leads with no contact in 5+ days
        const lastContact = l.last_contacted_at ? new Date(l.last_contacted_at) : null
        if (!lastContact || lastContact < fiveDaysAgo) {
          overdueFollowUps.set(l.assigned_to, (overdueFollowUps.get(l.assigned_to) || 0) + 1)
        }
      }

      // Enrolled count
      if (l.pipeline_stage === 'enrolled') {
        enrolledCounts.set(l.assigned_to, (enrolledCounts.get(l.assigned_to) || 0) + 1)
      }

      // Monthly opened
      if (l.created_at && new Date(l.created_at) >= monthStart) {
        monthlyOpenedCounts.set(l.assigned_to, (monthlyOpenedCounts.get(l.assigned_to) || 0) + 1)
      }
    })

    // Check if any agent actually has matched leads
    const agentIds = new Set(agentPresence.map(a => a.id))
    const anyAgentHasLeads = [...leadCounts.keys()].some(id => agentIds.has(id))
    const anyAgentOnline = agentPresence.some(a => a.status !== 'offline')
    const useDemoData = !anyAgentHasLeads && !anyAgentOnline

    const demoStatuses: Array<"online" | "meeting" | "break" | "offline"> = ["online", "online", "online", "meeting", "break", "offline", "offline", "online", "meeting", "offline", "online"]
    const demoActiveLeads = [18, 12, 24, 9, 15, 6, 21, 14, 7, 11, 16]
    const demoMonthlyOpened = [8, 5, 12, 3, 7, 2, 10, 6, 4, 5, 9]
    const demoTodayChanges = [5, 3, 8, 2, 4, 1, 6, 4, 2, 3, 5]
    const demoConversion = [22, 15, 28, 8, 18, 5, 25, 12, 10, 14, 20]
    const demoAppts = [2, 1, 3, 0, 1, 0, 2, 1, 0, 1, 2]
    const demoOverdue = [1, 3, 0, 2, 1, 4, 0, 2, 3, 1, 0]
    const demoLastMonth = [6, 4, 10, 2, 5, 3, 8, 5, 3, 4, 7]

    return agentPresence.map((a, i) => {
      const total = totalAssignedCounts.get(a.id) || 0
      const enrolled = enrolledCounts.get(a.id) || 0
      const conversionRate = total > 0 ? Math.round((enrolled / total) * 100) : 0

      return {
        id: a.id,
        name: a.name,
        status: useDemoData ? demoStatuses[i % demoStatuses.length] : a.status,
        activeLeadCount: leadCounts.get(a.id) || (useDemoData ? demoActiveLeads[i % demoActiveLeads.length] : 0),
        filesOpenedThisMonth: monthlyOpenedCounts.get(a.id) || (useDemoData ? demoMonthlyOpened[i % demoMonthlyOpened.length] : 0),
        todayChanges: todayChangesMap.get(a.id) || (useDemoData ? demoTodayChanges[i % demoTodayChanges.length] : 0),
        conversionRate: useDemoData ? demoConversion[i % demoConversion.length] : conversionRate,
        todayAppointments: agentApptsMap.get(a.id) || (useDemoData ? demoAppts[i % demoAppts.length] : 0),
        lastMonthFiles: lastMonthMap.get(a.id) || (useDemoData ? demoLastMonth[i % demoLastMonth.length] : 0),
        overdueFollowUps: overdueFollowUps.get(a.id) || (useDemoData ? demoOverdue[i % demoOverdue.length] : 0),
      }
    })
  }, [agentPresence, allLeads, todayChangesMap, agentApptsMap, lastMonthMap])

  // Lead source performance data (admin: all leads, agent: own leads)
  const sourcePerformanceData = useMemo(() => {
    const leads = isAdmin ? allLeads : myLeads
    if (leads.length === 0) return []

    const sourceMap = new Map<string, { total: number; enrolled: number }>()

    leads.forEach(l => {
      const src = l.source || 'other'
      const current = sourceMap.get(src) || { total: 0, enrolled: 0 }
      current.total++
      if (l.pipeline_stage === 'enrolled') current.enrolled++
      sourceMap.set(src, current)
    })

    return [...sourceMap.entries()]
      .map(([source, data]) => ({
        source,
        label: SOURCE_LABELS[source] || source.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        total: data.total,
        enrolled: data.enrolled,
        conversionRate: data.total > 0 ? Math.round((data.enrolled / data.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
  }, [allLeads, myLeads, isAdmin])

  // Agent workload data
  const workloadData = useMemo(() => {
    if (!isAdmin || agentPresence.length === 0) return []

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const agentMap = new Map<string, { active: number; newThisMonth: number; enrolled: number }>()
    agentPresence.forEach(a => agentMap.set(a.id, { active: 0, newThisMonth: 0, enrolled: 0 }))

    allLeads.forEach(l => {
      if (!l.assigned_to || !agentMap.has(l.assigned_to)) return
      const data = agentMap.get(l.assigned_to)!

      if (!TERMINAL_STAGES.includes(l.pipeline_stage)) {
        data.active++
      }
      if (l.pipeline_stage === 'enrolled') {
        data.enrolled++
      }
      if (l.created_at && new Date(l.created_at) >= monthStart) {
        data.newThisMonth++
      }
    })

    return agentPresence.map(a => {
      const data = agentMap.get(a.id) || { active: 0, newThisMonth: 0, enrolled: 0 }
      return {
        id: a.id,
        name: a.name,
        activeLeads: data.active,
        newThisMonth: data.newThisMonth,
        enrolled: data.enrolled,
      }
    }).sort((a, b) => b.activeLeads - a.activeLeads)
  }, [agentPresence, allLeads, isAdmin])

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <GreetingHeader profile={profile} />

      <div className="px-3 py-4 sm:p-6 space-y-4 sm:space-y-6 page-enter">
        {/* Admin KPIs (includes today's appts & callbacks) */}
        {isAdmin && (
          <AdminKpiSection
            allLeads={allLeads}
            loading={leadsLoading}
            todayAppointments={appointmentStats.today}
            todayCallbacks={adminTodayCallbacks}
            appointmentsLoading={appointmentsLoading}
          />
        )}

        {/* Quick Stats (agent only) */}
        {!isAdmin && (
          <QuickStatsSection
            appointmentsLoading={appointmentsLoading}
            leadsLoading={leadsLoading}
            appointmentStats={appointmentStats}
            myLeads={myLeads}
            isLoading={isLoading}
          />
        )}

        {/* Agent: Monthly Target (PUC & SF) */}
        {!isAdmin && (
          <TargetSection
            myTargetProgress={myTargetProgress}
            allAgentsProgress={[]}
            targetHistory={targetHistory}
            targetHistoryLoading={targetHistoryLoading}
            profileId={profile?.id}
          />
        )}

        {/* Admin Agent Heatmap */}
        {isAdmin && (
          <AdminAgentHeatmap agents={agentHeatmapData} loading={presenceLoading} />
        )}

        {/* No Updated Appointments */}
        <NoUpdatedSection
          noUpdatedAppointments={noUpdatedAppointments}
          noUpdatedLoading={noUpdatedLoading}
          refetchNoUpdated={refetchNoUpdated}
        />

        {/* Admin: Source Performance + Workload */}
        {isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AdminSourcePerformance sources={sourcePerformanceData} loading={leadsLoading} />
            <AdminWorkloadSection agents={workloadData} loading={presenceLoading || leadsLoading} />
          </div>
        )}

        {/* Agent: Sources + Birthdays & Needs Attention */}
        {!isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AdminSourcePerformance sources={sourcePerformanceData} loading={leadsLoading} mode="files" />
            <div className="flex flex-col gap-6">
              <BirthdaySection birthdayLeads={birthdayLeads} loading={leadsLoading} />
              <AttentionSection
                priorityLeads={priorityLeads}
                loading={leadsLoading}
              />
            </div>
          </div>
        )}

        {/* Agent: Appointments (full width) */}
        {!isAdmin && (
          <AppointmentsSection
            todayAppointments={todayAppointments}
            loading={appointmentsLoading}
          />
        )}

        {/* Admin Drop-off Chart */}
        {isAdmin && (
          <AdminDropoffSection dropoffData={dropoffData} loading={dropoffLoading} />
        )}

        {/* Pipeline Progress (admin only) */}
        {isAdmin && (
          <PipelineSection
            sfLeads={mySfLeads}
            pucLeads={myPucLeads}
            loading={leadsLoading}
          />
        )}

        {/* Admin: Appointments | Needs Attention | Birthdays */}
        {isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <AdminAppointmentsSection
              todayAppointments={todayAppointments}
              loading={appointmentsLoading}
            />

            <AttentionSection
              priorityLeads={priorityLeads}
              loading={leadsLoading}
            />

            <BirthdaySection
              birthdayLeads={birthdayLeads}
              loading={leadsLoading}
            />
          </div>
        )}

        {/* Agent: History */}
        {!isAdmin && (
          <HistorySection
            agentHistory={agentHistory}
            loading={historyLoading}
          />
        )}
      </div>
    </div>
  )
}
