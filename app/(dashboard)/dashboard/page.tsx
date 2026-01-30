"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Phone,
  PhoneMissed,
  Calendar,
  Users,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ChevronRight,
  UserPlus,
  CalendarPlus,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  UserCircle,
  Cloud,
  Server,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { LEAD_SOURCES, APPOINTMENT_TYPES, PIPELINE_STAGES } from "@/types"
import { useLeads } from "@/lib/hooks/use-leads"
import { useUser } from "@/lib/hooks/use-user"
import { useTodayAppointments, useAppointmentStats } from "@/lib/hooks/use-appointments"
import { useAgentTargetProgress } from "@/lib/hooks/use-reports"
import { useMissedCalls } from "@/lib/hooks/use-calls"
import type { Lead, Appointment } from "@/types"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const { profile } = useUser()
  const { leads: allLeads, loading: leadsLoading } = useLeads({ limit: 200 })
  const { appointments: todayAppointments, loading: appointmentsLoading } = useTodayAppointments()
  const { stats: appointmentStats, loading: statsLoading } = useAppointmentStats()
  const { progress: myTargetProgress, allAgentsProgress, loading: targetLoading, targetMode } = useAgentTargetProgress(profile?.id)
  const { calls: missedCalls, loading: missedCallsLoading } = useMissedCalls()

  // Filter leads assigned to current agent
  const myLeads = useMemo(() => {
    if (!profile?.id) return allLeads
    return allLeads.filter(lead => lead.assigned_to === profile.id)
  }, [allLeads, profile])

  // Get priority leads that need attention
  const priorityLeads = useMemo(() => {
    if (!myLeads.length) return []

    const now = new Date()
    const priorities: { lead: Lead; reason: string; urgency: "high" | "medium" | "low" }[] = []

    myLeads.forEach(lead => {
      if (lead.pipeline_stage === 'lost') return

      const created = new Date(lead.created_at)
      const lastContact = lead.last_contacted_at ? new Date(lead.last_contacted_at) : null
      const daysSinceCreated = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
      const daysSinceContact = lastContact
        ? Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
        : daysSinceCreated

      if (lead.pipeline_stage === 'new' && !lastContact) {
        priorities.push({
          lead,
          reason: daysSinceCreated === 0 ? 'New today' : `Waiting ${daysSinceCreated}d`,
          urgency: daysSinceCreated > 2 ? 'high' : daysSinceCreated > 0 ? 'medium' : 'low',
        })
      } else if (daysSinceContact >= 3) {
        priorities.push({
          lead,
          reason: `${daysSinceContact}d no contact`,
          urgency: daysSinceContact >= 5 ? 'high' : 'medium',
        })
      }
    })

    return priorities.sort((a, b) => {
      const urgencyOrder = { high: 0, medium: 1, low: 2 }
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
    }).slice(0, 5)
  }, [myLeads])

  // Stats calculations
  const stats = useMemo(() => {
    const newLeads = myLeads.filter(l => l.pipeline_stage === 'new').length
    const activeLeads = myLeads.filter(l => l.pipeline_stage !== 'lost').length
    const appointedLeads = myLeads.filter(l => ['appointment', 'visit'].includes(l.pipeline_stage)).length
    const applicationThisMonth = myLeads.filter(l => {
      if (l.pipeline_stage !== 'application') return false
      const now = new Date()
      const createdAt = new Date(l.created_at)
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()
    }).length

    return { newLeads, activeLeads, appointedLeads, applicationThisMonth }
  }, [myLeads])

  // Get agent name helper for appointments
  const getAgentName = (apt: Appointment) => {
    const agentProfile = (apt as unknown as { assigned_agent_profile?: { id: string; full_name: string } | null }).assigned_agent_profile
    if (agentProfile && typeof agentProfile === 'object') return agentProfile.full_name
    return null
  }

  const firstName = profile?.full_name?.split(' ')[0] || ''
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const isLoading = leadsLoading || appointmentsLoading || statsLoading

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Header
        user={profile}
        title={`${greeting}${firstName ? `, ${firstName}` : ''}`}
        subtitle="Here's what needs your attention today"
      />

      <div className="p-6 space-y-6 page-enter">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[var(--primary)]/10 to-transparent rounded-bl-full" />
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {appointmentsLoading ? "..." : appointmentStats.today}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Today&apos;s Appts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[var(--warning)]/10 to-transparent rounded-bl-full" />
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--warning)]/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-[var(--warning)]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {leadsLoading ? "..." : priorityLeads.length}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Need Attention</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[var(--info)]/10 to-transparent rounded-bl-full" />
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--info)]/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-[var(--info)]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {leadsLoading ? "..." : stats.activeLeads}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Active Leads</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[var(--success)]/10 to-transparent rounded-bl-full" />
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--success)]/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {leadsLoading ? "..." : stats.applicationThisMonth}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Applications (Month)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Appointments & Target */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Appointments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-[var(--primary)]" />
                      </div>
                      Today&apos;s Appointments
                    </CardTitle>
                    <Link href="/calendar">
                      <Button variant="ghost" size="sm" className="text-[var(--text-muted)]">
                        View All
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {appointmentsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary)]" />
                    </div>
                  ) : todayAppointments.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-xl bg-[var(--bg-depth-3)] flex items-center justify-center mx-auto mb-3">
                        <Calendar className="w-6 h-6 text-[var(--text-muted)]" />
                      </div>
                      <p className="text-sm text-[var(--text-muted)] mb-3">No appointments today</p>
                      <Link href="/calendar">
                        <Button size="sm" variant="outline">
                          <CalendarPlus className="w-4 h-4 mr-2" />
                          Book Appointment
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todayAppointments.slice(0, 5).map((apt, index) => {
                        const employeeName = getAgentName(apt)
                        const aptLeads = apt.appointment_leads?.map(al => al.lead).filter(Boolean) || []
                        const leadName = aptLeads.length > 0
                          ? aptLeads.length === 1
                            ? `${aptLeads[0]!.first_name} ${aptLeads[0]!.last_name}`
                            : `${aptLeads[0]!.first_name} ${aptLeads[0]!.last_name} +${aptLeads.length - 1}`
                          : apt.lead
                          ? `${apt.lead.first_name} ${apt.lead.last_name}`
                          : 'Unknown'
                        const typeInfo = APPOINTMENT_TYPES.find(t => apt.appointment_type.includes(t.value))

                        return (
                          <motion.div
                            key={apt.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Link href={`/leads/${apt.appointment_leads?.[0]?.lead_id || apt.lead_id}`}>
                              <div className="flex items-center gap-4 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-depth-3)] hover:border-[var(--primary)]/50 transition-all group">
                                <div className="flex-shrink-0">
                                  <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                                    <span className="text-lg font-bold text-[var(--primary)]">
                                      {apt.scheduled_time?.slice(0, 2)}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-center text-[var(--text-muted)] mt-1">
                                    {apt.scheduled_time?.slice(0, 5)}
                                  </p>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors truncate">
                                    {leadName}
                                  </p>
                                  <p className="text-xs text-[var(--text-muted)] truncate">
                                    {typeInfo?.label || apt.appointment_type}
                                  </p>
                                  {employeeName && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <UserCircle className="w-3 h-3 text-[var(--text-muted)]" />
                                      <span className="text-xs text-[var(--text-secondary)]">{employeeName}</span>
                                    </div>
                                  )}
                                </div>
                                <Badge
                                  variant={apt.status === 'confirmed' ? 'success' : apt.status === 'on_the_way' ? 'info' : apt.status === 'no_answer' || apt.status === 'cant_reach' ? 'warning' : 'outline'}
                                  size="sm"
                                >
                                  {apt.status}
                                </Badge>
                              </div>
                            </Link>
                          </motion.div>
                        )
                      })}
                      {todayAppointments.length > 5 && (
                        <Link href="/calendar">
                          <Button variant="ghost" size="sm" className="w-full text-[var(--text-muted)]">
                            View all {todayAppointments.length} appointments
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Monthly Target Progress */}
            {myTargetProgress && myTargetProgress.target > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="w-8 h-8 rounded-lg bg-[var(--success)]/10 flex items-center justify-center">
                        <Target className="w-4 h-4 text-[var(--success)]" />
                      </div>
                      Monthly Target
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
                    <div className="relative h-3 rounded-full bg-[var(--bg-depth-2)] overflow-hidden">
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
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Team Application Targets */}
            {allAgentsProgress.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                            <Users className="w-4 h-4 text-[var(--primary)]" />
                          </div>
                          Monthly Application Targets
                        </CardTitle>
                        <p className="text-xs text-[var(--text-muted)] ml-10 mt-1">
                          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <Link href="/reports">
                        <Button variant="ghost" size="sm" className="text-[var(--text-muted)]">
                          View Reports
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {targetLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary)]" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {allAgentsProgress
                          .filter(agent => agent.target > 0)
                          .sort((a, b) => b.progress - a.progress)
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
                                    : "border-[var(--border)] bg-[var(--bg-depth-3)]"
                                )}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-8 h-8">
                                      <AvatarFallback className={cn(
                                        "text-xs font-medium",
                                        isCurrentUser
                                          ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                                          : "bg-[var(--bg-depth-2)] text-[var(--text-secondary)]"
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

                                {/* Categorized Progress Bars */}
                                {targetMode === 'gender' && agent.categories && (
                                  <div className="space-y-2 mb-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                                      <span className="text-xs text-[var(--text-muted)] flex-1">Male</span>
                                      <span className="text-xs font-medium">{agent.categories.male?.applications || 0}/{agent.categories.male?.target || 0}</span>
                                    </div>
                                    <div className="relative h-1.5 rounded-full bg-[var(--bg-depth-2)] overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, agent.categories.male?.progress || 0)}%` }}
                                        className="absolute inset-y-0 left-0 rounded-full bg-blue-500"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full bg-pink-500" />
                                      <span className="text-xs text-[var(--text-muted)] flex-1">Female</span>
                                      <span className="text-xs font-medium">{agent.categories.female?.applications || 0}/{agent.categories.female?.target || 0}</span>
                                    </div>
                                    <div className="relative h-1.5 rounded-full bg-[var(--bg-depth-2)] overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, agent.categories.female?.progress || 0)}%` }}
                                        className="absolute inset-y-0 left-0 rounded-full bg-pink-500"
                                      />
                                    </div>
                                  </div>
                                )}

                                {targetMode === 'funding' && agent.categories && (
                                  <div className="space-y-2 mb-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full bg-green-500" />
                                      <span className="text-xs text-[var(--text-muted)] flex-1">PUC</span>
                                      <span className="text-xs font-medium">{agent.categories.puc?.applications || 0}/{agent.categories.puc?.target || 0}</span>
                                    </div>
                                    <div className="relative h-1.5 rounded-full bg-[var(--bg-depth-2)] overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, agent.categories.puc?.progress || 0)}%` }}
                                        className="absolute inset-y-0 left-0 rounded-full bg-green-500"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                                      <span className="text-xs text-[var(--text-muted)] flex-1">Self-Funded</span>
                                      <span className="text-xs font-medium">{agent.categories.sf?.applications || 0}/{agent.categories.sf?.target || 0}</span>
                                    </div>
                                    <div className="relative h-1.5 rounded-full bg-[var(--bg-depth-2)] overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, agent.categories.sf?.progress || 0)}%` }}
                                        className="absolute inset-y-0 left-0 rounded-full bg-orange-500"
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Total Progress Bar */}
                                <div className="relative h-2 rounded-full bg-[var(--bg-depth-2)] overflow-hidden">
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
                        {allAgentsProgress.filter(a => a.target > 0).length === 0 && (
                          <div className="text-center py-6">
                            <p className="text-sm text-[var(--text-muted)]">No targets set for this month</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Right Column - Leads Needing Attention & Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/leads?new=true" className="block">
                    <Button variant="outline" className="w-full justify-start gap-3 h-11">
                      <div className="w-7 h-7 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                        <UserPlus className="w-4 h-4 text-[var(--primary)]" />
                      </div>
                      Add New Lead
                    </Button>
                  </Link>
                  <Link href="/calendar" className="block">
                    <Button variant="outline" className="w-full justify-start gap-3 h-11">
                      <div className="w-7 h-7 rounded-lg bg-[var(--success)]/10 flex items-center justify-center">
                        <CalendarPlus className="w-4 h-4 text-[var(--success)]" />
                      </div>
                      Book Appointment
                    </Button>
                  </Link>
                  <Link href="/leads" className="block">
                    <Button variant="outline" className="w-full justify-start gap-3 h-11">
                      <div className="w-7 h-7 rounded-lg bg-[var(--info)]/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-[var(--info)]" />
                      </div>
                      View All Leads
                    </Button>
                  </Link>
                  <Link href="/reports" className="block">
                    <Button variant="outline" className="w-full justify-start gap-3 h-11">
                      <div className="w-7 h-7 rounded-lg bg-[var(--warning)]/10 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-[var(--warning)]" />
                      </div>
                      View Reports
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Leads Needing Attention */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="w-8 h-8 rounded-lg bg-[var(--warning)]/10 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />
                      </div>
                      Needs Attention
                    </CardTitle>
                    <Link href="/leads">
                      <Button variant="ghost" size="sm" className="text-[var(--text-muted)]">
                        View All
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {leadsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary)]" />
                    </div>
                  ) : priorityLeads.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-xl bg-[var(--success)]/10 flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 className="w-6 h-6 text-[var(--success)]" />
                      </div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">All caught up!</p>
                      <p className="text-xs text-[var(--text-muted)]">No leads need immediate attention</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {priorityLeads.map((item, index) => {
                        const urgencyColors = {
                          high: { bg: "bg-[var(--error)]/10", text: "text-[var(--error)]", border: "border-[var(--error)]/30" },
                          medium: { bg: "bg-[var(--warning)]/10", text: "text-[var(--warning)]", border: "border-[var(--warning)]/30" },
                          low: { bg: "bg-[var(--primary)]/10", text: "text-[var(--primary)]", border: "border-[var(--primary)]/30" },
                        }
                        const colors = urgencyColors[item.urgency]
                        const stageInfo = PIPELINE_STAGES.find(s => s.value === item.lead.pipeline_stage)

                        return (
                          <motion.div
                            key={item.lead.id}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Link href={`/leads/${item.lead.id}`}>
                              <div className={cn(
                                "flex items-center gap-3 p-3 rounded-xl border transition-all group hover:shadow-sm",
                                colors.border,
                                colors.bg
                              )}>
                                <Avatar className="w-10 h-10">
                                  <AvatarFallback className={cn("text-sm font-medium", colors.text, colors.bg)}>
                                    {item.lead.first_name?.[0]}{item.lead.last_name?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">
                                    {item.lead.first_name} {item.lead.last_name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant="outline" size="xs">{stageInfo?.label || item.lead.pipeline_stage}</Badge>
                                    <span className={cn("text-xs font-medium", colors.text)}>{item.reason}</span>
                                  </div>
                                </div>
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  className="flex-shrink-0"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    window.location.href = `tel:${item.lead.phone}`
                                  }}
                                >
                                  <Phone className="w-4 h-4" />
                                </Button>
                              </div>
                            </Link>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Missed Calls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="w-8 h-8 rounded-lg bg-[var(--error)]/10 flex items-center justify-center">
                        <PhoneMissed className="w-4 h-4 text-[var(--error)]" />
                      </div>
                      Missed Calls
                    </CardTitle>
                    {missedCalls.length > 0 && (
                      <Badge variant="destructive" size="sm">
                        {missedCalls.length}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {missedCallsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary)]" />
                    </div>
                  ) : missedCalls.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-xl bg-[var(--success)]/10 flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 className="w-6 h-6 text-[var(--success)]" />
                      </div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">No missed calls</p>
                      <p className="text-xs text-[var(--text-muted)]">All calls have been answered</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {missedCalls.slice(0, 5).map((call, index) => {
                        const timeAgo = (() => {
                          const now = new Date()
                          const callTime = new Date(call.created_at)
                          const diffMs = now.getTime() - callTime.getTime()
                          const diffMins = Math.floor(diffMs / (1000 * 60))
                          const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                          if (diffMins < 60) return `${diffMins}m ago`
                          return `${diffHours}h ago`
                        })()

                        // Determine call source
                        const isAvaya = call.source === "avaya" || call.avaya_call_id
                        const sourceLabel = isAvaya ? "Avaya PBX" : "Twilio"
                        const SourceIcon = isAvaya ? Server : Cloud

                        return (
                          <motion.div
                            key={call.id}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-3 p-3 rounded-xl border border-[var(--error)]/20 bg-[var(--error)]/5 group"
                          >
                            <div className="relative w-10 h-10 rounded-full bg-[var(--error)]/10 flex items-center justify-center">
                              <PhoneMissed className="w-5 h-5 text-[var(--error)]" />
                              {/* Source indicator badge */}
                              <div
                                className={cn(
                                  "absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center",
                                  isAvaya
                                    ? "bg-[var(--accent)] text-white"
                                    : "bg-[var(--primary)] text-white"
                                )}
                                title={sourceLabel}
                              >
                                <SourceIcon className="w-2.5 h-2.5" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-[var(--text-primary)] truncate">
                                {call.from_number}
                              </p>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-[var(--text-muted)]">
                                  {timeAgo}
                                </p>
                                {call.metadata?.avaya?.queueName && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)]">
                                    {call.metadata.avaya.queueName}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              size="icon-sm"
                              className="flex-shrink-0 bg-[var(--success)] hover:bg-[var(--success)]/90"
                              onClick={() => {
                                window.location.href = `tel:${call.from_number}`
                              }}
                            >
                              <Phone className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Pipeline Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="w-8 h-8 rounded-lg bg-[var(--info)]/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-[var(--info)]" />
                    </div>
                    My Pipeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { stage: 'new', label: 'New', color: 'var(--info)' },
                      { stage: 'visit', label: 'Visit', color: 'var(--accent)' },
                      { stage: 'test', label: 'Test', color: 'var(--success)' },
                      { stage: 'application', label: 'Application', color: 'var(--primary)' },
                    ].map((item) => {
                      const count = myLeads.filter(l => l.pipeline_stage === item.stage).length
                      const total = myLeads.filter(l => l.pipeline_stage !== 'lost').length
                      const percent = total > 0 ? (count / total) * 100 : 0

                      return (
                        <div key={item.stage} className="flex items-center gap-3">
                          <div className="w-20 text-xs text-[var(--text-muted)]">{item.label}</div>
                          <div className="flex-1 h-2 rounded-full bg-[var(--bg-depth-2)] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${percent}%`, backgroundColor: item.color }}
                            />
                          </div>
                          <div className="w-8 text-xs font-medium text-[var(--text-primary)] text-right">{count}</div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
