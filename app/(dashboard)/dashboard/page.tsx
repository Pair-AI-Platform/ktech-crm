"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import {
  Phone,
  PhoneMissed,
  Calendar,
  Users,
  Target,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  UserPlus,
  CalendarPlus,
  BarChart3,
  Layers,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { APPOINTMENT_TYPES, PIPELINE_STAGES } from "@/types"
import { useLeads } from "@/lib/hooks/use-leads"
import { useUser } from "@/lib/hooks/use-user"
import { useTodayAppointments, useAppointmentStats } from "@/lib/hooks/use-appointments"
import { useAgentTargetProgress } from "@/lib/hooks/use-reports"
import { useMissedCalls } from "@/lib/hooks/use-calls"
import type { Lead } from "@/types"
import { cn } from "@/lib/utils"

// Import Notion-style components
import {
  StaticBlock,
  StatGrid,
  ListBlock,
  PipelineBlock,
  QuickActionsBlock,
  PipelineVertical,
} from "@/components/dashboard/notion"

export default function DashboardPage() {
  const router = useRouter()
  const { profile, isAdmin } = useUser()
  const { leads: allLeads, loading: leadsLoading } = useLeads({ limit: 200 })
  const { appointments: todayAppointments, loading: appointmentsLoading } = useTodayAppointments()
  const { stats: appointmentStats, loading: statsLoading } = useAppointmentStats()
  const { progress: myTargetProgress, allAgentsProgress } = useAgentTargetProgress(profile?.id)
  const { calls: missedCalls, loading: missedCallsLoading } = useMissedCalls()

  // Filter leads assigned to current agent
  const myLeads = useMemo(() => {
    if (!profile?.id) return allLeads
    return allLeads.filter(lead => lead.assigned_to === profile.id)
  }, [allLeads, profile])

  // Get priority leads that need attention
  // Admins see all leads; agents see only their own
  const attentionPool = isAdmin ? allLeads : myLeads

  const priorityLeads = useMemo(() => {
    if (!attentionPool.length) return []

    const now = new Date()
    const priorities: { lead: Lead; reason: string; urgency: "high" | "medium" | "low" }[] = []

    attentionPool.forEach(lead => {
      if (lead.pipeline_stage === 'lost' || lead.pipeline_stage === 'enrolled' || lead.pipeline_stage === 'withdraw') return

      const created = new Date(lead.created_at)
      const lastContact = lead.last_contacted_at ? new Date(lead.last_contacted_at) : null
      const daysSinceCreated = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
      const daysSinceContact = lastContact
        ? Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
        : daysSinceCreated

      // New leads never contacted
      if (lead.pipeline_stage === 'new' && !lastContact) {
        priorities.push({
          lead,
          reason: daysSinceCreated === 0 ? 'New today' : `Waiting ${daysSinceCreated}d`,
          urgency: daysSinceCreated > 2 ? 'high' : daysSinceCreated > 0 ? 'medium' : 'low',
        })
        return
      }

      // Leads with callback status — need a follow-up
      if (lead.status === 'callback') {
        priorities.push({
          lead,
          reason: 'Callback requested',
          urgency: daysSinceContact >= 2 ? 'high' : 'medium',
        })
        return
      }

      // Leads with no_answer — need retry
      if (lead.status === 'no_answer' && daysSinceContact >= 1) {
        priorities.push({
          lead,
          reason: `No answer · ${daysSinceContact}d ago`,
          urgency: daysSinceContact >= 3 ? 'high' : 'medium',
        })
        return
      }

      // Leads with no contact for 3+ days
      if (daysSinceContact >= 3) {
        priorities.push({
          lead,
          reason: `${daysSinceContact}d no contact`,
          urgency: daysSinceContact >= 5 ? 'high' : 'medium',
        })
        return
      }

      // Stale leads — stuck in the same stage for 7+ days with no recent updates
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

  // Stats calculations
  const stats = useMemo(() => {
    const newLeads = myLeads.filter(l => l.pipeline_stage === 'new').length
    const activeLeads = myLeads.filter(l => l.pipeline_stage !== 'lost').length
    const appointedLeads = myLeads.filter(l => l.pipeline_stage === 'test').length
    const applicationThisMonth = myLeads.filter(l => {
      if (l.pipeline_stage !== 'application') return false
      const now = new Date()
      const createdAt = new Date(l.created_at)
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()
    }).length

    return { newLeads, activeLeads, appointedLeads, applicationThisMonth }
  }, [myLeads])

  // Pipeline progress data
  const pipelineProgress = useMemo(() => {
    const stages = [
      { key: 'new', label: 'New', color: 'var(--info)' },
      { key: 'contacted', label: 'Contacted', color: 'var(--primary)' },
      { key: 'test', label: 'Test', color: 'var(--warning)' },
      { key: 'application', label: 'Applied', color: '#F97316' },
      { key: 'applicant', label: 'Applicant', color: '#14B8A6' },
      { key: 'enrolled', label: 'Enrolled', color: 'var(--success)' },
    ]

    const activeLeads = myLeads.filter(l => l.pipeline_stage !== 'lost' && l.pipeline_stage !== 'withdraw')
    const total = activeLeads.length

    const stageData = stages.map(s => ({
      ...s,
      count: activeLeads.filter(l => l.pipeline_stage === s.key).length,
    }))

    const enrolled = stageData.find(s => s.key === 'enrolled')?.count || 0
    const conversionRate = total > 0 ? Math.round((enrolled / total) * 100) : 0

    return { stages: stageData, total, conversionRate }
  }, [myLeads])

  const firstName = profile?.full_name?.split(' ')[0] || ''
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const isLoading = leadsLoading || appointmentsLoading || statsLoading

  // Transform appointments for ListBlock
  const appointmentItems = useMemo(() => {
    return todayAppointments.slice(0, 5).map((apt) => {
      const aptLeads = apt.appointment_leads?.map(al => al.lead).filter(Boolean) || []
      const leadName = aptLeads.length > 0
        ? aptLeads.length === 1
          ? `${aptLeads[0]!.first_name} ${aptLeads[0]!.last_name}`
          : `${aptLeads[0]!.first_name} ${aptLeads[0]!.last_name} +${aptLeads.length - 1}`
        : apt.lead
        ? `${apt.lead.first_name} ${apt.lead.last_name}`
        : 'Unknown'
      const typeInfo = APPOINTMENT_TYPES.find(t => apt.appointment_type.includes(t.value))

      return {
        id: apt.id,
        title: leadName,
        subtitle: typeInfo?.label || apt.appointment_type.join(', '),
        metadata: apt.scheduled_time?.slice(0, 5),
        badge: (
          <Badge
            variant={apt.status === 'confirmed' ? 'success' : apt.status === 'on_the_way' ? 'info' : apt.status === 'no_answer' || apt.status === 'cant_reach' ? 'warning' : 'outline'}
            size="sm"
          >
            {apt.status}
          </Badge>
        ),
        icon: (
          <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
            <span className="text-sm font-bold text-[var(--primary)]">
              {apt.scheduled_time?.slice(0, 2)}
            </span>
          </div>
        ),
        onClick: () => router.push(`/leads/${apt.appointment_leads?.[0]?.lead_id || apt.lead_id}`),
      }
    })
  }, [todayAppointments, router])

  // Transform priority leads for ListBlock
  const priorityLeadItems = useMemo(() => {
    return priorityLeads.map((item) => {
      const stageInfo = PIPELINE_STAGES.find(s => s.value === item.lead.pipeline_stage)
      const urgencyColors = {
        high: "bg-[var(--error)]",
        medium: "bg-[var(--warning)]",
        low: "bg-[var(--info)]",
      }

      return {
        id: item.lead.id,
        title: `${item.lead.first_name} ${item.lead.last_name}`,
        subtitle: stageInfo?.label || item.lead.pipeline_stage,
        metadata: item.reason,
        badge: <span className={cn("w-2 h-2 rounded-full", urgencyColors[item.urgency])} />,
        icon: (
          <Avatar className="w-9 h-9">
            <AvatarFallback className="text-xs font-medium bg-[var(--warning)]/10 text-[var(--warning)]">
              {item.lead.first_name?.[0]}{item.lead.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
        ),
        onClick: () => router.push(`/leads/${item.lead.id}`),
        actions: [
          {
            label: "Call",
            icon: <Phone className="w-4 h-4" />,
            onClick: () => window.location.href = `tel:${item.lead.phone}`,
          },
        ],
      }
    })
  }, [priorityLeads, router])

  // Transform missed calls for ListBlock
  const missedCallItems = useMemo(() => {
    return missedCalls.slice(0, 5).map((call) => {
      const now = new Date()
      const callTime = new Date(call.created_at)
      const diffMs = now.getTime() - callTime.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const timeAgo = diffMins < 60 ? `${diffMins}m ago` : `${diffHours}h ago`
      const isAvaya = call.source === "avaya" || call.avaya_call_id

      return {
        id: call.id,
        title: call.from_number,
        subtitle: isAvaya ? "Avaya PBX" : "Twilio",
        metadata: timeAgo,
        icon: (
          <div className="w-9 h-9 rounded-full bg-[var(--error)]/10 flex items-center justify-center">
            <PhoneMissed className="w-4 h-4 text-[var(--error)]" />
          </div>
        ),
        actions: [
          {
            label: "Call back",
            icon: <Phone className="w-4 h-4" />,
            onClick: () => window.location.href = `tel:${call.from_number}`,
          },
        ],
      }
    })
  }, [missedCalls])

  // Quick action items
  const quickActions = [
    {
      id: "add-lead",
      label: "Add Lead",
      icon: <UserPlus className="w-5 h-5 text-[var(--primary)]" />,
      onClick: () => router.push("/leads?new=true"),
    },
    {
      id: "book-appt",
      label: "Book Appt",
      icon: <CalendarPlus className="w-5 h-5 text-[var(--success)]" />,
      onClick: () => router.push("/calendar"),
    },
    {
      id: "view-leads",
      label: "All Leads",
      icon: <Users className="w-5 h-5 text-[var(--info)]" />,
      onClick: () => router.push("/leads"),
    },
    {
      id: "reports",
      label: "Reports",
      icon: <BarChart3 className="w-5 h-5 text-[var(--warning)]" />,
      onClick: () => router.push("/reports"),
    },
  ]

  // Stats for StatGrid
  const statItems = [
    {
      id: "today-appts",
      value: appointmentsLoading ? "..." : appointmentStats.today,
      label: "Today's Appts",
      icon: <Calendar className="w-5 h-5 text-[var(--primary)]" />,
      iconBg: "bg-[var(--primary)]/10",
      onClick: () => router.push("/calendar"),
    },
    {
      id: "needs-attention",
      value: leadsLoading ? "..." : priorityLeads.length,
      label: "Need Attention",
      icon: <AlertTriangle className="w-5 h-5 text-[var(--warning)]" />,
      iconBg: "bg-[var(--warning)]/10",
      onClick: () => router.push("/leads"),
    },
    {
      id: "active-leads",
      value: leadsLoading ? "..." : stats.activeLeads,
      label: "Active Leads",
      icon: <Users className="w-5 h-5 text-[var(--info)]" />,
      iconBg: "bg-[var(--info)]/10",
      onClick: () => router.push("/leads"),
    },
    {
      id: "applications",
      value: leadsLoading ? "..." : stats.applicationThisMonth,
      label: "Applications (Month)",
      icon: <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />,
      iconBg: "bg-[var(--success)]/10",
      onClick: () => router.push("/leads?stage=application"),
    },
  ]

  // Mini pipeline for sidebar
  const miniPipelineStages = [
    { key: 'new', label: 'New', color: 'var(--info)', count: myLeads.filter(l => l.pipeline_stage === 'new').length },
    { key: 'test', label: 'Test', color: 'var(--warning)', count: myLeads.filter(l => l.pipeline_stage === 'test').length },
    { key: 'application', label: 'Application', color: 'var(--success)', count: myLeads.filter(l => l.pipeline_stage === 'application').length },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Header
        user={profile}
        title={`${greeting}${firstName ? `, ${firstName}` : ''}`}
        subtitle="Here's what needs your attention today"
      />

      <div className="p-6 space-y-6 page-enter">
        {/* Quick Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <StatGrid stats={statItems} columns={4} loading={isLoading} />
        </motion.div>

        {/* Application Pipeline Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StaticBlock
            title="Application Pipeline"
            icon={<Layers className="w-4 h-4 text-[var(--accent)]" />}
            headerActions={
              <Link href="/leads">
                <Button variant="ghost" size="sm" className="text-[var(--text-muted)]">
                  View Leads
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            }
          >
            <PipelineBlock
              stages={pipelineProgress.stages}
              total={pipelineProgress.total}
              conversionRate={pipelineProgress.conversionRate}
              loading={leadsLoading}
              onStageClick={(stage) => router.push(`/leads?stage=${stage}`)}
            />
          </StaticBlock>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Appointments & Target */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Appointments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <StaticBlock
                title="Today's Appointments"
                icon={<Calendar className="w-4 h-4 text-[var(--primary)]" />}
                headerActions={
                  <Link href="/calendar">
                    <Button variant="ghost" size="sm" className="text-[var(--text-muted)]">
                      View All
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                }
              >
                <ListBlock
                  items={appointmentItems}
                  loading={appointmentsLoading}
                  emptyMessage="No appointments today"
                  emptyIcon={<Calendar className="w-8 h-8 text-[var(--text-muted)]" />}
                  showMoreHref="/calendar"
                  onShowMore={() => router.push("/calendar")}
                />
              </StaticBlock>
            </motion.div>

            {/* Monthly Target Progress */}
            {myTargetProgress && myTargetProgress.target > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <StaticBlock
                  title="Monthly Target"
                  icon={<Target className="w-4 h-4 text-[var(--success)]" />}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-3xl font-bold text-[var(--text-primary)]">
                        {myTargetProgress.applications}
                        <span className="text-lg text-[var(--text-muted)] font-normal"> / {myTargetProgress.target}</span>
                      </p>
                      <p className="text-sm text-[var(--text-muted)]">Applications this month</p>
                    </div>
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold",
                      myTargetProgress.progress >= 100
                        ? "bg-[var(--success)]/10 text-[var(--success)]"
                        : myTargetProgress.progress >= 70
                          ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                          : myTargetProgress.progress >= 40
                            ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                            : "bg-[var(--error)]/10 text-[var(--error)]"
                    )}>
                      {myTargetProgress.progress}%
                    </div>
                  </div>
                  <div className="relative h-3 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, myTargetProgress.progress)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-full",
                        myTargetProgress.progress >= 100
                          ? "bg-[var(--success)]"
                          : myTargetProgress.progress >= 70
                            ? "bg-[var(--primary)]"
                            : myTargetProgress.progress >= 40
                              ? "bg-[var(--warning)]"
                              : "bg-[var(--error)]"
                      )}
                    />
                  </div>
                  <p className="text-sm text-[var(--text-muted)] mt-2">
                    {myTargetProgress.remaining > 0
                      ? `${myTargetProgress.remaining} more applications to reach target`
                      : "Target reached! Great job!"}
                  </p>
                </StaticBlock>
              </motion.div>
            )}

            {/* Team Application Targets */}
            {allAgentsProgress.length > 0 && allAgentsProgress.filter(a => a.target > 0).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <StaticBlock
                  title="Team Application Targets"
                  icon={<Users className="w-4 h-4 text-[var(--primary)]" />}
                  headerActions={
                    <Link href="/reports">
                      <Button variant="ghost" size="sm" className="text-[var(--text-muted)]">
                        View Reports
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  }
                >
                  <div className="text-xs text-[var(--text-muted)] mb-3">
                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                  <div className="space-y-3">
                    {allAgentsProgress
                      .filter(agent => agent.target > 0)
                      .sort((a, b) => b.progress - a.progress)
                      .slice(0, 5)
                      .map((agent, index) => {
                        const isCurrentUser = agent.agentId === profile?.id
                        return (
                          <motion.div
                            key={agent.agentId}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              "p-3 rounded-xl border",
                              isCurrentUser
                                ? "border-[var(--primary)]/30 bg-[var(--primary)]/5"
                                : "border-[var(--border)] bg-[var(--bg-sunken)]"
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className={cn(
                                    "text-xs font-medium",
                                    isCurrentUser
                                      ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                                      : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                                  )}>
                                    {agent.agentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className={cn(
                                    "text-sm font-medium",
                                    isCurrentUser ? "text-[var(--primary)]" : "text-[var(--text-primary)]"
                                  )}>
                                    {agent.agentName}
                                    {isCurrentUser && <span className="text-xs text-[var(--text-muted)] ml-1">(You)</span>}
                                  </p>
                                  <p className="text-xs text-[var(--text-muted)]">
                                    {agent.applications} / {agent.target} applications
                                  </p>
                                </div>
                              </div>
                              <div className={cn(
                                "text-sm font-bold",
                                agent.progress >= 100
                                  ? "text-[var(--success)]"
                                  : agent.progress >= 70
                                    ? "text-[var(--primary)]"
                                    : agent.progress >= 40
                                      ? "text-[var(--warning)]"
                                      : "text-[var(--error)]"
                              )}>
                                {agent.progress}%
                              </div>
                            </div>
                            <div className="relative h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, agent.progress)}%` }}
                                transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.05 }}
                                className={cn(
                                  "absolute inset-y-0 left-0 rounded-full",
                                  agent.progress >= 100
                                    ? "bg-[var(--success)]"
                                    : agent.progress >= 70
                                      ? "bg-[var(--primary)]"
                                      : agent.progress >= 40
                                        ? "bg-[var(--warning)]"
                                        : "bg-[var(--error)]"
                                )}
                              />
                            </div>
                          </motion.div>
                        )
                      })}
                  </div>
                </StaticBlock>
              </motion.div>
            )}
          </div>

          {/* Right Column - Quick Actions, Leads, Calls, Pipeline */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <StaticBlock title="Quick Actions" collapsible={false}>
                <QuickActionsBlock actions={quickActions} columns={2} size="md" />
              </StaticBlock>
            </motion.div>

            {/* Leads Needing Attention */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <StaticBlock
                title="Needs Attention"
                icon={<AlertTriangle className="w-4 h-4 text-[var(--warning)]" />}
                headerActions={
                  <Link href="/leads">
                    <Button variant="ghost" size="sm" className="text-[var(--text-muted)]">
                      View All
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                }
              >
                <ListBlock
                  items={priorityLeadItems}
                  loading={leadsLoading}
                  emptyMessage="All caught up! No leads need attention"
                  emptyIcon={<CheckCircle2 className="w-8 h-8 text-[var(--success)]" />}
                />
              </StaticBlock>
            </motion.div>

            {/* Missed Calls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <StaticBlock
                title="Missed Calls"
                icon={<PhoneMissed className="w-4 h-4 text-[var(--error)]" />}
                headerActions={
                  missedCalls.length > 0 && (
                    <Badge variant="destructive" size="sm">
                      {missedCalls.length}
                    </Badge>
                  )
                }
              >
                <ListBlock
                  items={missedCallItems}
                  loading={missedCallsLoading}
                  emptyMessage="No missed calls"
                  emptyIcon={<CheckCircle2 className="w-8 h-8 text-[var(--success)]" />}
                />
              </StaticBlock>
            </motion.div>

            {/* My Pipeline Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <StaticBlock
                title="My Pipeline"
                icon={<TrendingUp className="w-4 h-4 text-[var(--info)]" />}
              >
                <PipelineVertical
                  stages={miniPipelineStages}
                  total={myLeads.filter(l => l.pipeline_stage !== 'lost').length}
                  loading={leadsLoading}
                  onStageClick={(stage) => router.push(`/leads?stage=${stage}`)}
                />
              </StaticBlock>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
