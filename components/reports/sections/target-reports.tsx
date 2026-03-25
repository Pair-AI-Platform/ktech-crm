"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProgressBar } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Target,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
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
  Cell,
} from "recharts"
import type { LeaderboardData } from "@/lib/hooks/use-reports"

interface TargetReportsProps {
  data: LeaderboardData[]
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

export function TargetReports({ data }: TargetReportsProps) {
  const agentsWithTargets = data.filter(a => a.target > 0)
  const totalTarget = agentsWithTargets.reduce((sum, a) => sum + a.target, 0)
  const totalPucTarget = agentsWithTargets.reduce((sum, a) => sum + (a.categories?.puc?.target || 0), 0)
  const totalSfTarget = agentsWithTargets.reduce((sum, a) => sum + (a.categories?.sf?.target || 0), 0)
  const totalPucActual = agentsWithTargets.reduce((sum, a) => sum + (a.categories?.puc?.applications || 0), 0)
  const totalSfActual = agentsWithTargets.reduce((sum, a) => sum + (a.categories?.sf?.applications || 0), 0)
  const totalActual = totalPucActual + totalSfActual
  const overallProgress = totalTarget > 0 ? Math.min(100, Math.round((totalActual / totalTarget) * 100)) : 0

  const achieved = agentsWithTargets.filter(a => {
    const total = (a.categories?.puc?.applications || 0) + (a.categories?.sf?.applications || 0)
    return a.target > 0 && total >= a.target
  }).length
  const onTrack = agentsWithTargets.filter(a => {
    const total = (a.categories?.puc?.applications || 0) + (a.categories?.sf?.applications || 0)
    const prog = a.target > 0 ? (total / a.target) * 100 : 0
    return prog >= 70 && prog < 100
  }).length
  const atRisk = agentsWithTargets.filter(a => {
    const total = (a.categories?.puc?.applications || 0) + (a.categories?.sf?.applications || 0)
    const prog = a.target > 0 ? (total / a.target) * 100 : 0
    return prog >= 40 && prog < 70
  }).length
  const behind = agentsWithTargets.filter(a => {
    const total = (a.categories?.puc?.applications || 0) + (a.categories?.sf?.applications || 0)
    const prog = a.target > 0 ? (total / a.target) * 100 : 0
    return prog < 40
  }).length

  // Chart data
  const chartData = agentsWithTargets.map(a => {
    const firstName = a.agentName.split(' ')[0]
    return {
      name: firstName,
      "PUC Target": a.categories?.puc?.target || 0,
      "PUC Actual": a.categories?.puc?.applications || 0,
      "SF Target": a.categories?.sf?.target || 0,
      "SF Actual": a.categories?.sf?.applications || 0,
    }
  })

  // Sort agents by progress (lowest first to highlight who needs help)
  const sortedAgents = [...agentsWithTargets].sort((a, b) => {
    const aTotal = (a.categories?.puc?.applications || 0) + (a.categories?.sf?.applications || 0)
    const bTotal = (b.categories?.puc?.applications || 0) + (b.categories?.sf?.applications || 0)
    const aProg = a.target > 0 ? (aTotal / a.target) * 100 : 0
    const bProg = b.target > 0 ? (bTotal / b.target) * 100 : 0
    return bProg - aProg
  })

  if (agentsWithTargets.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Target className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-[var(--text-secondary)] font-medium">No targets set</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Configure agent targets in Settings to see target reports.</p>
        </CardContent>
      </Card>
    )
  }

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
              {totalActual}
              <span className="text-base text-[var(--text-muted)] font-normal"> / {totalTarget}</span>
            </p>
            <ProgressBar value={overallProgress} max={100} size="sm" color={getProgressColor(overallProgress)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
              <span className="text-sm text-[var(--text-secondary)]">PUC Files</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {totalPucActual}
              <span className="text-base text-[var(--text-muted)] font-normal"> / {totalPucTarget}</span>
            </p>
            <ProgressBar
              value={totalPucTarget > 0 ? Math.min(100, Math.round((totalPucActual / totalPucTarget) * 100)) : 0}
              max={100} size="sm" color="success" className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-orange-500" />
              </div>
              <span className="text-sm text-[var(--text-secondary)]">SF Files</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {totalSfActual}
              <span className="text-base text-[var(--text-muted)] font-normal"> / {totalSfTarget}</span>
            </p>
            <ProgressBar
              value={totalSfTarget > 0 ? Math.min(100, Math.round((totalSfActual / totalSfTarget) * 100)) : 0}
              max={100} size="sm" color="warning" className="mt-2"
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
              {achieved > 0 && <Badge variant="success" size="sm">{achieved} achieved</Badge>}
              {onTrack > 0 && <Badge variant="default" size="sm">{onTrack} on track</Badge>}
              {atRisk > 0 && <Badge variant="warning" size="sm">{atRisk} at risk</Badge>}
              {behind > 0 && <Badge variant="destructive" size="sm">{behind} behind</Badge>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Target vs Actual Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-[var(--primary)]" />
              Target vs Actual by Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={2} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} />
                  <YAxis tick={{ fontSize: 12, fill: "var(--text-secondary)" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-primary)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="PUC Target" fill="var(--success)" opacity={0.3} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="PUC Actual" fill="var(--success)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="SF Target" fill="var(--warning)" opacity={0.3} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="SF Actual" fill="var(--warning)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Target Breakdown */}
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

                {/* Overall Progress */}
                <ProgressBar value={progress} max={100} size="sm" color={getProgressColor(progress)} className="mb-3" />

                {/* Category Breakdown */}
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
                        max={100} size="sm" color="success"
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
                        max={100} size="sm" color="warning"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
