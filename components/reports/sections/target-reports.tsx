"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProgressBar } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Target,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Trophy,
  Medal,
  Award,
  Flame,
  Zap,
  Clock,
  GraduationCap,
  FileText,
} from "lucide-react"
import { cn, getInitials } from "@/lib/utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import type { LeaderboardData } from "@/lib/hooks/use-reports"

interface TargetReportsProps {
  data: LeaderboardData[]
  dateRange?: { start: Date; end: Date }
}

function getProgressColor(progress: number) {
  if (progress >= 100) return "success"
  if (progress >= 70) return "primary"
  if (progress >= 40) return "warning"
  return "error"
}

function getStatusInfo(progress: number) {
  if (progress >= 100) return { label: "Achieved", icon: CheckCircle2, color: "text-[var(--success)]", bg: "bg-[var(--success)]/10" }
  if (progress >= 70) return { label: "On Track", icon: TrendingUp, color: "text-[var(--primary)]", bg: "bg-[var(--primary)]/10" }
  if (progress >= 40) return { label: "At Risk", icon: AlertTriangle, color: "text-[var(--warning)]", bg: "bg-[var(--warning)]/10" }
  return { label: "Behind", icon: XCircle, color: "text-[var(--error)]", bg: "bg-[var(--error)]/10" }
}

const PODIUM_ICONS = [Trophy, Medal, Award]
const PODIUM_COLORS = ["text-yellow-500", "text-gray-400", "text-amber-600"]
const PODIUM_BGS = ["bg-yellow-500/10", "bg-gray-400/10", "bg-amber-600/10"]
const RADAR_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"]

const MOCK_TARGET_DATA: LeaderboardData[] = [
  { rank: 1, agentId: "mock-1", agentName: "Sara Al-Rashidi", avatarUrl: null, leads: 48, appointments: 32, applications: 27, enrolled: 19, conversionRate: 70, target: 25, progress: 108, pucFiles: 18, pucAppSubmission: 14, applicant: 12, sfFiles: 9, sf150: 7, sf550: 5, sfEnrolled: 4, statusChanges: 61, categories: { puc: { target: 15, applications: 18, progress: 120 }, sf: { target: 10, applications: 9, progress: 90 } } },
  { rank: 2, agentId: "mock-2", agentName: "Ahmad Khalil", avatarUrl: null, leads: 41, appointments: 28, applications: 22, enrolled: 15, conversionRate: 68, target: 20, progress: 110, pucFiles: 14, pucAppSubmission: 11, applicant: 9, sfFiles: 8, sf150: 6, sf550: 4, sfEnrolled: 3, statusChanges: 54, categories: { puc: { target: 12, applications: 14, progress: 117 }, sf: { target: 8, applications: 8, progress: 100 } } },
  { rank: 3, agentId: "mock-3", agentName: "Fatima Mansour", avatarUrl: null, leads: 37, appointments: 24, applications: 18, enrolled: 13, conversionRate: 72, target: 20, progress: 90, pucFiles: 11, pucAppSubmission: 9, applicant: 8, sfFiles: 7, sf150: 5, sf550: 3, sfEnrolled: 3, statusChanges: 47, categories: { puc: { target: 12, applications: 11, progress: 92 }, sf: { target: 8, applications: 7, progress: 88 } } },
  { rank: 4, agentId: "mock-4", agentName: "Yousef Al-Otaibi", avatarUrl: null, leads: 29, appointments: 19, applications: 14, enrolled: 9, conversionRate: 64, target: 18, progress: 78, pucFiles: 9, pucAppSubmission: 7, applicant: 6, sfFiles: 5, sf150: 4, sf550: 2, sfEnrolled: 2, statusChanges: 38, categories: { puc: { target: 10, applications: 9, progress: 90 }, sf: { target: 8, applications: 5, progress: 63 } } },
  { rank: 5, agentId: "mock-5", agentName: "Nour Al-Hamad", avatarUrl: null, leads: 22, appointments: 14, applications: 9, enrolled: 5, conversionRate: 56, target: 15, progress: 60, pucFiles: 6, pucAppSubmission: 5, applicant: 4, sfFiles: 3, sf150: 2, sf550: 1, sfEnrolled: 1, statusChanges: 29, categories: { puc: { target: 9, applications: 6, progress: 67 }, sf: { target: 6, applications: 3, progress: 50 } } },
]

export function TargetReports({ data, dateRange }: TargetReportsProps) {
  const agentsWithTargets = data.filter(a => a.target > 0)
  const isMock = agentsWithTargets.length === 0
  const effectiveData = isMock ? MOCK_TARGET_DATA : data
  const effectiveAgentsWithTargets = isMock ? MOCK_TARGET_DATA : agentsWithTargets

  return (
    <Tabs defaultValue="files" className="space-y-6">
      {isMock && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/20 text-xs text-[var(--warning)] font-medium w-fit">
          <AlertTriangle className="w-3.5 h-3.5" />
          Demo data — configure agent targets in Settings to see real results
        </div>
      )}
      <TabsList>
        <TabsTrigger value="files" className="gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          Target for Files
        </TabsTrigger>
        <TabsTrigger value="enrolled" className="gap-1.5">
          <GraduationCap className="w-3.5 h-3.5" />
          Target for Enrolled
        </TabsTrigger>
      </TabsList>

      <TabsContent value="files" className="mt-0">
        <FilesTargetTab data={effectiveData} agentsWithTargets={effectiveAgentsWithTargets} dateRange={dateRange} />
      </TabsContent>

      <TabsContent value="enrolled" className="mt-0">
        <EnrolledTargetTab data={effectiveData} agentsWithTargets={effectiveAgentsWithTargets} dateRange={dateRange} />
      </TabsContent>
    </Tabs>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   FILES TARGET TAB (existing content)
   ═══════════════════════════════════════════════════════════════════════ */

function FilesTargetTab({ data, agentsWithTargets, dateRange }: {
  data: LeaderboardData[]
  agentsWithTargets: LeaderboardData[]
  dateRange?: { start: Date; end: Date }
}) {
  const stats = useMemo(() => {
    const totalTarget = agentsWithTargets.reduce((sum, a) => sum + a.target, 0)
    const totalPucTarget = agentsWithTargets.reduce((sum, a) => sum + (a.categories?.puc?.target || 0), 0)
    const totalSfTarget = agentsWithTargets.reduce((sum, a) => sum + (a.categories?.sf?.target || 0), 0)
    const totalPucActual = agentsWithTargets.reduce((sum, a) => sum + (a.categories?.puc?.applications || 0), 0)
    const totalSfActual = agentsWithTargets.reduce((sum, a) => sum + (a.categories?.sf?.applications || 0), 0)
    const totalActual = totalPucActual + totalSfActual
    const overallProgress = totalTarget > 0 ? Math.min(100, Math.round((totalActual / totalTarget) * 100)) : 0

    const now = new Date()
    const rangeStart = dateRange?.start ?? new Date(now.getFullYear(), now.getMonth(), 1)
    const rangeEnd = dateRange?.end ?? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const totalDays = Math.max(1, Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    const elapsed = Math.max(0, Math.min(totalDays, Math.ceil((now.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24))))
    const daysRemaining = Math.max(0, totalDays - elapsed)
    const monthProgress = Math.round((elapsed / totalDays) * 100)

    const dailyRate = elapsed > 0 ? totalActual / elapsed : 0
    const projected = Math.round(dailyRate * totalDays)

    const statusCounts = agentsWithTargets.reduce((acc, a) => {
      const total = (a.categories?.puc?.applications || 0) + (a.categories?.sf?.applications || 0)
      const prog = a.target > 0 ? (total / a.target) * 100 : 0
      if (prog >= 100) acc.achieved++
      else if (prog >= 70) acc.onTrack++
      else if (prog >= 40) acc.atRisk++
      else acc.behind++
      return acc
    }, { achieved: 0, onTrack: 0, atRisk: 0, behind: 0 })

    return {
      totalTarget, totalPucTarget, totalSfTarget,
      totalPucActual, totalSfActual, totalActual,
      overallProgress, monthProgress, dailyRate, projected,
      totalDays, elapsed, daysRemaining,
      ...statusCounts,
    }
  }, [agentsWithTargets, dateRange])

  const chartData = useMemo(() => agentsWithTargets.map(a => {
    const firstName = a.agentName.split(' ')[0]
    return {
      name: firstName,
      "PUC Target": a.categories?.puc?.target || 0,
      "PUC Actual": a.categories?.puc?.applications || 0,
      "SF Target": a.categories?.sf?.target || 0,
      "SF Actual": a.categories?.sf?.applications || 0,
    }
  }), [agentsWithTargets])

  const sortedAgents = useMemo(() => [...agentsWithTargets].sort((a, b) => {
    const aTotal = (a.categories?.puc?.applications || 0) + (a.categories?.sf?.applications || 0)
    const bTotal = (b.categories?.puc?.applications || 0) + (b.categories?.sf?.applications || 0)
    const aProg = a.target > 0 ? (aTotal / a.target) * 100 : 0
    const bProg = b.target > 0 ? (bTotal / b.target) * 100 : 0
    return bProg - aProg
  }), [agentsWithTargets])

  const radarData = useMemo(() => {
    const top5 = sortedAgents.slice(0, 5)
    if (top5.length === 0) return []

    const metrics: { key: string; getValue: (a: typeof top5[0]) => number }[] = [
      { key: "Leads", getValue: a => a.leads },
      { key: "PUC Files", getValue: a => a.categories?.puc?.applications || 0 },
      { key: "SF Files", getValue: a => a.categories?.sf?.applications || 0 },
      { key: "Appts", getValue: a => a.appointments },
      { key: "Enrolled", getValue: a => a.enrolled },
    ]

    return metrics.map(({ key, getValue }) => {
      const values = top5.map(getValue)
      const max = Math.max(...values, 1)
      return {
        metric: key,
        ...Object.fromEntries(top5.map(a => [
          a.agentName.split(' ')[0],
          Math.round((getValue(a) / max) * 100)
        ])),
      }
    })
  }, [sortedAgents])

  const radarAgentNames = useMemo(() =>
    sortedAgents.slice(0, 5).map(a => a.agentName.split(' ')[0]),
  [sortedAgents])

  return (
    <div className="space-y-6">
      {/* Team Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-[var(--primary)]" />
              </div>
              <span className="text-sm text-[var(--text-secondary)]">Team Target</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {stats.totalActual}
              <span className="text-base text-[var(--text-muted)] font-normal"> / {stats.totalTarget}</span>
            </p>
            <ProgressBar value={stats.overallProgress} max={100} size="sm" color={getProgressColor(stats.overallProgress)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-indigo-500" />
              </div>
              <span className="text-sm text-[var(--text-secondary)]">PUC Files</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {stats.totalPucActual}
              <span className="text-base text-[var(--text-muted)] font-normal"> / {stats.totalPucTarget}</span>
            </p>
            <ProgressBar
              value={stats.totalPucTarget > 0 ? Math.min(100, Math.round((stats.totalPucActual / stats.totalPucTarget) * 100)) : 0}
              max={100} size="sm" color="primary" className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-rose-500" />
              </div>
              <span className="text-sm text-[var(--text-secondary)]">SF Files</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {stats.totalSfActual}
              <span className="text-base text-[var(--text-muted)] font-normal"> / {stats.totalSfTarget}</span>
            </p>
            <ProgressBar
              value={stats.totalSfTarget > 0 ? Math.min(100, Math.round((stats.totalSfActual / stats.totalSfTarget) * 100)) : 0}
              max={100} size="sm" color="error" className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-[var(--accent)]" />
              </div>
              <span className="text-sm text-[var(--text-secondary)]">Status</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              {stats.achieved > 0 && <Badge variant="success" size="sm">{stats.achieved} achieved</Badge>}
              {stats.onTrack > 0 && <Badge variant="default" size="sm">{stats.onTrack} on track</Badge>}
              {stats.atRisk > 0 && <Badge variant="warning" size="sm">{stats.atRisk} at risk</Badge>}
              {stats.behind > 0 && <Badge variant="destructive" size="sm">{stats.behind} behind</Badge>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projection & Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-purple-500" />
              </div>
              <span className="text-sm text-[var(--text-secondary)]">Projected Total</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {stats.projected}
              <span className="text-base text-[var(--text-muted)] font-normal"> / {stats.totalTarget}</span>
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Based on {stats.dailyRate.toFixed(1)} files/day avg
            </p>
            <div className="mt-2 flex items-center gap-1.5">
              {stats.projected >= stats.totalTarget ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-xs text-green-500 font-medium">On pace to hit target</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-xs text-orange-500 font-medium">
                    Need {Math.ceil((stats.totalTarget - stats.totalActual) / Math.max(1, stats.daysRemaining))}/day to catch up
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-sm text-[var(--text-secondary)]">Time Remaining</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {stats.daysRemaining}
              <span className="text-base text-[var(--text-muted)] font-normal"> days left</span>
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Day {stats.elapsed} of {stats.totalDays}
            </p>
            <div className="mt-2">
              <ProgressBar value={stats.elapsed} max={stats.totalDays} size="sm" color="primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers Podium */}
      {sortedAgents.length >= 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-center gap-4 pb-2">
              <PodiumEntry agent={sortedAgents[1]} rank={2} />
              <PodiumEntry agent={sortedAgents[0]} rank={1} />
              <PodiumEntry agent={sortedAgents[2]} rank={3} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Target vs Actual Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-[var(--primary)]" />
                Target vs Actual by Agent
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-indigo-500" />
                  <span className="text-xs text-[var(--text-secondary)]">PUC Actual</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-indigo-500/20 border border-indigo-500/40" />
                  <span className="text-xs text-[var(--text-secondary)]">PUC Target</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-rose-500" />
                  <span className="text-xs text-[var(--text-secondary)]">SF Actual</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-rose-500/20 border border-rose-500/40" />
                  <span className="text-xs text-[var(--text-secondary)]">SF Target</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={-26} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "var(--text-secondary)", fontWeight: 500 }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                    width={35}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--bg-secondary)", opacity: 0.5 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      const pucActual = payload.find(p => p.dataKey === "PUC Actual")?.value as number || 0
                      const pucTarget = payload.find(p => p.dataKey === "PUC Target")?.value as number || 0
                      const sfActual = payload.find(p => p.dataKey === "SF Actual")?.value as number || 0
                      const sfTarget = payload.find(p => p.dataKey === "SF Target")?.value as number || 0
                      const totalActualVal = pucActual + sfActual
                      const totalTargetVal = pucTarget + sfTarget
                      const totalProg = totalTargetVal > 0 ? Math.round((totalActualVal / totalTargetVal) * 100) : 0
                      return (
                        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl shadow-lg p-3 min-w-[180px]">
                          <p className="font-semibold text-sm text-[var(--text-primary)] mb-2">{label}</p>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                <span className="text-xs text-[var(--text-secondary)]">PUC</span>
                              </div>
                              <span className="text-xs font-medium text-[var(--text-primary)]">
                                {pucActual} <span className="text-[var(--text-muted)]">/ {pucTarget}</span>
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-rose-500" />
                                <span className="text-xs text-[var(--text-secondary)]">SF</span>
                              </div>
                              <span className="text-xs font-medium text-[var(--text-primary)]">
                                {sfActual} <span className="text-[var(--text-muted)]">/ {sfTarget}</span>
                              </span>
                            </div>
                            <div className="border-t border-[var(--border)] pt-1.5 mt-1.5 flex items-center justify-between">
                              <span className="text-xs font-medium text-[var(--text-secondary)]">Total</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[var(--text-primary)]">
                                  {totalActualVal} / {totalTargetVal}
                                </span>
                                <Badge
                                  variant={totalProg >= 100 ? "success" : totalProg >= 70 ? "default" : totalProg >= 40 ? "warning" : "destructive"}
                                  size="sm"
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  {totalProg}%
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    }}
                  />
                  {/* PUC - Target behind, Actual in front */}
                  <Bar dataKey="PUC Target" fill="#6366f1" opacity={0.15} radius={[4, 4, 0, 0]} barSize={26} />
                  <Bar dataKey="PUC Actual" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={14}>
                    <LabelList dataKey="PUC Actual" position="top" fontSize={10} fontWeight={600} fill="#6366f1" />
                  </Bar>
                  {/* SF - Target behind, Actual in front */}
                  <Bar dataKey="SF Target" fill="#f43f5e" opacity={0.15} radius={[4, 4, 0, 0]} barSize={26} />
                  <Bar dataKey="SF Actual" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={14}>
                    <LabelList dataKey="SF Actual" position="top" fontSize={10} fontWeight={600} fill="#f43f5e" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Performance Radar */}
      {radarData.length > 0 && radarAgentNames.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              Performance Radar — Top {radarAgentNames.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
                  />
                  <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                  {radarAgentNames.map((name, i) => (
                    <Radar
                      key={name}
                      name={name}
                      dataKey={name}
                      stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
                      fill={RADAR_COLORS[i % RADAR_COLORS.length]}
                      fillOpacity={0.15}
                    />
                  ))}
                  <Legend />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-primary)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                    formatter={(value?: number) => [`${value ?? 0}%`]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PUC vs SF Leaderboards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CategoryLeaderboard
          title="PUC Files Leaderboard"
          color="indigo"
          agents={sortedAgents.map(a => ({
            agentId: a.agentId,
            agentName: a.agentName,
            avatarUrl: a.avatarUrl,
            target: a.categories?.puc?.target || 0,
            actual: a.categories?.puc?.applications || 0,
            progress: a.categories?.puc?.progress || 0,
          })).filter(a => a.target > 0).sort((a, b) => b.progress - a.progress)}
        />
        <CategoryLeaderboard
          title="SF Files Leaderboard"
          color="rose"
          agents={sortedAgents.map(a => ({
            agentId: a.agentId,
            agentName: a.agentName,
            avatarUrl: a.avatarUrl,
            target: a.categories?.sf?.target || 0,
            actual: a.categories?.sf?.applications || 0,
            progress: a.categories?.sf?.progress || 0,
          })).filter(a => a.target > 0).sort((a, b) => b.progress - a.progress)}
        />
      </div>

      {/* Agent Target Breakdown (Full Detail) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--primary)]" />
            Agent Target Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedAgents.map((agent, i) => {
            const totalApps = (agent.categories?.puc?.applications || 0) + (agent.categories?.sf?.applications || 0)
            const progress = agent.target > 0 ? Math.min(100, Math.round((totalApps / agent.target) * 100)) : 0
            const status = getStatusInfo(progress)
            const StatusIcon = status.icon

            return (
              <motion.div
                key={agent.agentId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={agent.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs bg-[var(--primary)]/10 text-[var(--primary)]">
                        {getInitials(agent.agentName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm text-[var(--text-primary)]">{agent.agentName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <StatusIcon className={cn("w-3.5 h-3.5", status.color)} />
                        <span className={cn("text-xs font-medium", status.color)}>{status.label}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[var(--text-primary)]">
                      {totalApps}
                      <span className="text-sm text-[var(--text-muted)] font-normal"> / {agent.target}</span>
                    </p>
                    <p className={cn("text-xs font-semibold", `text-[var(--${getProgressColor(progress)})]`)}>
                      {progress}%
                    </p>
                  </div>
                </div>

                <ProgressBar value={progress} max={100} size="sm" color={getProgressColor(progress)} className="mb-3" />

                <div className="grid grid-cols-2 gap-3">
                  {agent.categories?.puc && agent.categories.puc.target > 0 && (
                    <div className="p-2.5 rounded-lg bg-[var(--bg-primary)]">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-[var(--text-secondary)]">PUC Files</span>
                        <span className="text-xs text-[var(--text-muted)]">
                          {agent.categories.puc.applications} / {agent.categories.puc.target}
                        </span>
                      </div>
                      <ProgressBar
                        value={agent.categories.puc.progress}
                        max={100} size="sm" color="primary"
                      />
                    </div>
                  )}
                  {agent.categories?.sf && agent.categories.sf.target > 0 && (
                    <div className="p-2.5 rounded-lg bg-[var(--bg-primary)]">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-[var(--text-secondary)]">SF Files</span>
                        <span className="text-xs text-[var(--text-muted)]">
                          {agent.categories.sf.applications} / {agent.categories.sf.target}
                        </span>
                      </div>
                      <ProgressBar
                        value={agent.categories.sf.progress}
                        max={100} size="sm" color="error"
                      />
                    </div>
                  )}
                </div>

                {/* Extra stats row */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                  <MiniStat label="Leads" value={agent.leads} />
                  <MiniStat label="Appts" value={agent.appointments} />
                  <MiniStat label="Enrolled" value={agent.enrolled} />
                </div>
              </motion.div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   ENROLLED TARGET TAB
   ═══════════════════════════════════════════════════════════════════════ */

function EnrolledTargetTab({ data, agentsWithTargets, dateRange }: {
  data: LeaderboardData[]
  agentsWithTargets: LeaderboardData[]
  dateRange?: { start: Date; end: Date }
}) {
  const sortedByEnrolled = useMemo(() =>
    [...agentsWithTargets].sort((a, b) => b.enrolled - a.enrolled),
  [agentsWithTargets])

  const stats = useMemo(() => {
    const totalEnrolled = agentsWithTargets.reduce((sum, a) => sum + a.enrolled, 0)
    const totalSfEnrolled = agentsWithTargets.reduce((sum, a) => sum + a.sfEnrolled, 0)
    const totalPucEnrolled = totalEnrolled - totalSfEnrolled
    const topAgent = sortedByEnrolled[0]

    const now = new Date()
    const rangeStart = dateRange?.start ?? new Date(now.getFullYear(), now.getMonth(), 1)
    const rangeEnd = dateRange?.end ?? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const totalDays = Math.max(1, Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    const elapsed = Math.max(0, Math.min(totalDays, Math.ceil((now.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24))))
    const daysRemaining = Math.max(0, totalDays - elapsed)

    const dailyRate = elapsed > 0 ? totalEnrolled / elapsed : 0
    const projected = Math.round(dailyRate * totalDays)

    return {
      totalEnrolled, totalSfEnrolled, totalPucEnrolled,
      topAgent, dailyRate, projected,
      totalDays, elapsed, daysRemaining,
    }
  }, [agentsWithTargets, sortedByEnrolled, dateRange])

  const chartData = useMemo(() => sortedByEnrolled.map(a => {
    const firstName = a.agentName.split(' ')[0]
    const pucEnrolled = a.enrolled - a.sfEnrolled
    return {
      name: firstName,
      "PUC Enrolled": pucEnrolled,
      "SF Enrolled": a.sfEnrolled,
      "Total": a.enrolled,
    }
  }), [sortedByEnrolled])

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-sm text-[var(--text-secondary)]">Total Enrolled</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {stats.totalEnrolled}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Across {agentsWithTargets.length} agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-indigo-500" />
              </div>
              <span className="text-sm text-[var(--text-secondary)]">PUC Enrolled</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {stats.totalPucEnrolled}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {stats.totalEnrolled > 0 ? Math.round((stats.totalPucEnrolled / stats.totalEnrolled) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-rose-500" />
              </div>
              <span className="text-sm text-[var(--text-secondary)]">SF Enrolled</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {stats.totalSfEnrolled}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {stats.totalEnrolled > 0 ? Math.round((stats.totalSfEnrolled / stats.totalEnrolled) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-purple-500" />
              </div>
              <span className="text-sm text-[var(--text-secondary)]">Projected</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {stats.projected}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Based on {stats.dailyRate.toFixed(1)} enrolled/day avg
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Enrolled Podium */}
      {sortedByEnrolled.length >= 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Top Enrolled Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-center gap-4 pb-2">
              <EnrolledPodiumEntry agent={sortedByEnrolled[1]} rank={2} />
              <EnrolledPodiumEntry agent={sortedByEnrolled[0]} rank={1} />
              <EnrolledPodiumEntry agent={sortedByEnrolled[2]} rank={3} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enrolled by Agent Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-500" />
                Enrolled by Agent
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-indigo-500" />
                  <span className="text-xs text-[var(--text-secondary)]">PUC Enrolled</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-rose-500" />
                  <span className="text-xs text-[var(--text-secondary)]">SF Enrolled</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "var(--text-secondary)", fontWeight: 500 }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                    width={35}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--bg-secondary)", opacity: 0.5 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      const pucEnrolled = payload.find(p => p.dataKey === "PUC Enrolled")?.value as number || 0
                      const sfEnrolled = payload.find(p => p.dataKey === "SF Enrolled")?.value as number || 0
                      const total = pucEnrolled + sfEnrolled
                      return (
                        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl shadow-lg p-3 min-w-[160px]">
                          <p className="font-semibold text-sm text-[var(--text-primary)] mb-2">{label}</p>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                <span className="text-xs text-[var(--text-secondary)]">PUC</span>
                              </div>
                              <span className="text-xs font-medium text-[var(--text-primary)]">{pucEnrolled}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-rose-500" />
                                <span className="text-xs text-[var(--text-secondary)]">SF</span>
                              </div>
                              <span className="text-xs font-medium text-[var(--text-primary)]">{sfEnrolled}</span>
                            </div>
                            <div className="border-t border-[var(--border)] pt-1.5 mt-1.5 flex items-center justify-between">
                              <span className="text-xs font-medium text-[var(--text-secondary)]">Total</span>
                              <span className="text-xs font-bold text-[var(--text-primary)]">{total}</span>
                            </div>
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="PUC Enrolled" fill="#6366f1" stackId="enrolled" radius={[0, 0, 0, 0]} barSize={32} />
                  <Bar dataKey="SF Enrolled" fill="#f43f5e" stackId="enrolled" radius={[4, 4, 0, 0]} barSize={32}>
                    <LabelList dataKey="Total" position="top" fontSize={10} fontWeight={600} fill="var(--text-secondary)" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enrolled Leaderboards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EnrolledLeaderboard
          title="PUC Enrolled Leaderboard"
          color="indigo"
          agents={sortedByEnrolled.map(a => ({
            agentId: a.agentId,
            agentName: a.agentName,
            avatarUrl: a.avatarUrl,
            count: a.enrolled - a.sfEnrolled,
          })).filter(a => a.count > 0).sort((a, b) => b.count - a.count)}
          total={stats.totalPucEnrolled}
        />
        <EnrolledLeaderboard
          title="SF Enrolled Leaderboard"
          color="rose"
          agents={sortedByEnrolled.map(a => ({
            agentId: a.agentId,
            agentName: a.agentName,
            avatarUrl: a.avatarUrl,
            count: a.sfEnrolled,
          })).filter(a => a.count > 0).sort((a, b) => b.count - a.count)}
          total={stats.totalSfEnrolled}
        />
      </div>

      {/* Agent Enrolled Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--primary)]" />
            Agent Enrolled Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedByEnrolled.map((agent, i) => {
            const pucEnrolled = agent.enrolled - agent.sfEnrolled
            const maxEnrolled = sortedByEnrolled[0]?.enrolled || 1
            const barPercent = Math.min(100, Math.round((agent.enrolled / maxEnrolled) * 100))

            return (
              <motion.div
                key={agent.agentId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={agent.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs bg-emerald-500/10 text-emerald-500">
                        {getInitials(agent.agentName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm text-[var(--text-primary)]">{agent.agentName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[var(--text-primary)]">
                      {agent.enrolled}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">enrolled</p>
                  </div>
                </div>

                <ProgressBar value={barPercent} max={100} size="sm" color="success" className="mb-3" />

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-lg bg-[var(--bg-primary)]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-[var(--text-secondary)]">PUC Enrolled</span>
                      <span className="text-xs font-semibold text-indigo-500">{pucEnrolled}</span>
                    </div>
                    <ProgressBar
                      value={agent.enrolled > 0 ? Math.round((pucEnrolled / agent.enrolled) * 100) : 0}
                      max={100} size="sm" color="primary"
                    />
                  </div>
                  <div className="p-2.5 rounded-lg bg-[var(--bg-primary)]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-[var(--text-secondary)]">SF Enrolled</span>
                      <span className="text-xs font-semibold text-rose-500">{agent.sfEnrolled}</span>
                    </div>
                    <ProgressBar
                      value={agent.enrolled > 0 ? Math.round((agent.sfEnrolled / agent.enrolled) * 100) : 0}
                      max={100} size="sm" color="error"
                    />
                  </div>
                </div>

                {/* Extra stats row */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                  <MiniStat label="Leads" value={agent.leads} />
                  <MiniStat label="Appts" value={agent.appointments} />
                  <MiniStat label="Files" value={(agent.categories?.puc?.applications || 0) + (agent.categories?.sf?.applications || 0)} />
                </div>
              </motion.div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   SHARED SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════ */

function PodiumEntry({ agent, rank }: { agent: LeaderboardData; rank: 1 | 2 | 3 }) {
  const totalApps = (agent.categories?.puc?.applications || 0) + (agent.categories?.sf?.applications || 0)
  const progress = agent.target > 0 ? Math.min(100, Math.round((totalApps / agent.target) * 100)) : 0
  const Icon = PODIUM_ICONS[rank - 1]
  const heights = { 1: "h-28", 2: "h-20", 3: "h-16" }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank === 1 ? 0.1 : rank === 2 ? 0.2 : 0.3 }}
      className="flex flex-col items-center"
    >
      <div className="relative mb-2">
        <Avatar className={cn("border-2", rank === 1 ? "w-14 h-14 border-yellow-500" : "w-11 h-11 border-[var(--border)]")}>
          <AvatarImage src={agent.avatarUrl || undefined} />
          <AvatarFallback className={cn("text-xs font-medium", PODIUM_BGS[rank - 1], PODIUM_COLORS[rank - 1])}>
            {getInitials(agent.agentName)}
          </AvatarFallback>
        </Avatar>
        <div className={cn(
          "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center",
          PODIUM_BGS[rank - 1]
        )}>
          <Icon className={cn("w-3 h-3", PODIUM_COLORS[rank - 1])} />
        </div>
      </div>
      <p className="text-xs font-medium text-[var(--text-primary)] text-center max-w-[80px] truncate">
        {agent.agentName.split(' ')[0]}
      </p>
      <p className={cn("text-sm font-bold mt-0.5", `text-[var(--${getProgressColor(progress)})]`)}>
        {progress}%
      </p>
      <p className="text-[10px] text-[var(--text-muted)]">{totalApps}/{agent.target}</p>
      <div className={cn(
        "w-20 rounded-t-lg mt-2 flex items-end justify-center",
        heights[rank],
        rank === 1 ? "bg-yellow-500/15" : rank === 2 ? "bg-gray-400/10" : "bg-amber-600/10"
      )}>
        <span className={cn("text-lg font-bold mb-2", PODIUM_COLORS[rank - 1])}>#{rank}</span>
      </div>
    </motion.div>
  )
}

function EnrolledPodiumEntry({ agent, rank }: { agent: LeaderboardData; rank: 1 | 2 | 3 }) {
  const Icon = PODIUM_ICONS[rank - 1]
  const heights = { 1: "h-28", 2: "h-20", 3: "h-16" }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank === 1 ? 0.1 : rank === 2 ? 0.2 : 0.3 }}
      className="flex flex-col items-center"
    >
      <div className="relative mb-2">
        <Avatar className={cn("border-2", rank === 1 ? "w-14 h-14 border-yellow-500" : "w-11 h-11 border-[var(--border)]")}>
          <AvatarImage src={agent.avatarUrl || undefined} />
          <AvatarFallback className={cn("text-xs font-medium", PODIUM_BGS[rank - 1], PODIUM_COLORS[rank - 1])}>
            {getInitials(agent.agentName)}
          </AvatarFallback>
        </Avatar>
        <div className={cn(
          "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center",
          PODIUM_BGS[rank - 1]
        )}>
          <Icon className={cn("w-3 h-3", PODIUM_COLORS[rank - 1])} />
        </div>
      </div>
      <p className="text-xs font-medium text-[var(--text-primary)] text-center max-w-[80px] truncate">
        {agent.agentName.split(' ')[0]}
      </p>
      <p className="text-sm font-bold mt-0.5 text-emerald-500">
        {agent.enrolled}
      </p>
      <p className="text-[10px] text-[var(--text-muted)]">enrolled</p>
      <div className={cn(
        "w-20 rounded-t-lg mt-2 flex items-end justify-center",
        heights[rank],
        rank === 1 ? "bg-yellow-500/15" : rank === 2 ? "bg-gray-400/10" : "bg-amber-600/10"
      )}>
        <span className={cn("text-lg font-bold mb-2", PODIUM_COLORS[rank - 1])}>#{rank}</span>
      </div>
    </motion.div>
  )
}

function CategoryLeaderboard({ title, color, agents }: {
  title: string
  color: "indigo" | "rose"
  agents: Array<{ agentId: string; agentName: string; avatarUrl: string | null; target: number; actual: number; progress: number }>
}) {
  const colorMap = {
    indigo: { dot: "bg-indigo-500", text: "text-indigo-500", bg: "bg-indigo-500/10", bar: "primary" as const },
    rose: { dot: "bg-rose-500", text: "text-rose-500", bg: "bg-rose-500/10", bar: "error" as const },
  }
  const c = colorMap[color]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded-full", c.dot)} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {agents.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-4">No targets set</p>
        ) : (
          agents.map((agent, i) => (
            <motion.div
              key={agent.agentId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3"
            >
              <span className="text-xs font-bold text-[var(--text-muted)] w-5 text-right">{i + 1}</span>
              <Avatar className="w-7 h-7">
                <AvatarImage src={agent.avatarUrl || undefined} />
                <AvatarFallback className={cn("text-[10px]", c.bg, c.text)}>
                  {getInitials(agent.agentName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                    {agent.agentName}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] ml-2 flex-shrink-0">
                    {agent.actual}/{agent.target}
                  </span>
                </div>
                <ProgressBar value={agent.progress} max={100} size="sm" color={c.bar} />
              </div>
              <span className={cn("text-xs font-bold w-10 text-right", `text-[var(--${getProgressColor(agent.progress)})]`)}>
                {agent.progress}%
              </span>
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function EnrolledLeaderboard({ title, color, agents, total }: {
  title: string
  color: "indigo" | "rose"
  agents: Array<{ agentId: string; agentName: string; avatarUrl: string | null; count: number }>
  total: number
}) {
  const colorMap = {
    indigo: { dot: "bg-indigo-500", text: "text-indigo-500", bg: "bg-indigo-500/10", bar: "primary" as const },
    rose: { dot: "bg-rose-500", text: "text-rose-500", bg: "bg-rose-500/10", bar: "error" as const },
  }
  const c = colorMap[color]
  const maxCount = agents[0]?.count || 1

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded-full", c.dot)} />
          {title}
          <Badge variant="outline" size="sm" className="ml-auto">{total} total</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {agents.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-4">No enrolled students</p>
        ) : (
          agents.map((agent, i) => (
            <motion.div
              key={agent.agentId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3"
            >
              <span className="text-xs font-bold text-[var(--text-muted)] w-5 text-right">{i + 1}</span>
              <Avatar className="w-7 h-7">
                <AvatarImage src={agent.avatarUrl || undefined} />
                <AvatarFallback className={cn("text-[10px]", c.bg, c.text)}>
                  {getInitials(agent.agentName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                    {agent.agentName}
                  </span>
                  <span className="text-xs font-semibold text-[var(--text-primary)] ml-2 flex-shrink-0">
                    {agent.count}
                  </span>
                </div>
                <ProgressBar value={Math.round((agent.count / maxCount) * 100)} max={100} size="sm" color={c.bar} />
              </div>
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-sm font-semibold text-[var(--text-primary)]">{value}</p>
      <p className="text-[10px] text-[var(--text-muted)]">{label}</p>
    </div>
  )
}
