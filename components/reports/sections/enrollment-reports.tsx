"use client"

import { useSyncExternalStore } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProgressBar, ProgressRing } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  GraduationCap,
  Users,
  UserMinus,
  TrendingDown,
  Target,
  AlertTriangle,
} from "lucide-react"
import type { EnrollmentReportData } from "@/lib/hooks/use-reports"

interface EnrollmentReportsProps {
  data: EnrollmentReportData
}

const emptySubscribe = () => () => {}

interface TooltipPayload {
  payload: { reason: string; percent: number }
  value: number
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-[var(--text-muted)]">{payload[0].payload.reason}</p>
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {payload[0].value} students ({payload[0].payload.percent}%)
        </p>
      </div>
    )
  }
  return null
}

const COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981']

export function EnrollmentReports({ data }: EnrollmentReportsProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  const pieData = data.withdrawals.byReason.map((item, index) => ({
    name: item.reason,
    reason: item.reason,
    value: item.count,
    percent: item.percent,
    color: COLORS[index % COLORS.length],
  }))

  const stats = [
    {
      title: "Total Enrolled",
      value: data.totalEnrolled,
      icon: GraduationCap,
      gradient: "from-[#22C55E] to-[#16A34A]"
    },
    {
      title: "Active Agents",
      value: data.byAgent.length,
      icon: Users,
      gradient: "from-[#445eb7] to-[#212e7f]"
    },
    {
      title: "Withdrawals",
      value: data.withdrawals.total,
      icon: UserMinus,
      gradient: "from-[#EF4444] to-[#DC2626]"
    },
    {
      title: "Withdrawal Rate",
      value: `${data.withdrawals.rate}%`,
      icon: TrendingDown,
      gradient: "from-[#F59E0B] to-[#D97706]"
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card hover glow className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
              </CardContent>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-50`} />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Agent Performance Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[var(--primary)]" />
              Enrollment by Agent
            </CardTitle>
            <CardDescription>Performance against monthly targets</CardDescription>
          </CardHeader>
          <CardContent>
            {data.byAgent.length > 0 ? (
              <div className="space-y-4">
                {data.byAgent.map((agent, index) => (
                  <AgentRow
                    key={agent.agentId}
                    rank={index + 1}
                    agent={agent}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)]">
                No enrollment data available
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Withdrawal Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Withdrawal Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[var(--warning)]" />
                Withdrawal Overview
              </CardTitle>
              <CardDescription>Student retention analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="relative">
                  <ProgressRing
                    value={100 - data.withdrawals.rate}
                    max={100}
                    size={160}
                    strokeWidth={14}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-[var(--text-primary)]">
                      {100 - data.withdrawals.rate}%
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">Retention</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-3 rounded-lg bg-[var(--success-bg)]">
                  <p className="text-2xl font-bold text-[var(--success)]">{data.totalEnrolled}</p>
                  <p className="text-xs text-[var(--text-muted)]">Active Students</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[var(--error-bg)]">
                  <p className="text-2xl font-bold text-[var(--error)]">{data.withdrawals.total}</p>
                  <p className="text-xs text-[var(--text-muted)]">Withdrawals</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Withdrawal Reasons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserMinus className="w-5 h-5 text-[var(--error)]" />
                Withdrawal Reasons
              </CardTitle>
              <CardDescription>Why students withdraw</CardDescription>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <>
                  <div className="h-[200px]" style={{ minWidth: 0 }}>
                    {mounted ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full bg-[var(--bg-depth-3)] rounded animate-pulse" />
                    )}
                  </div>
                  {/* Legend */}
                  <div className="space-y-2 mt-4">
                    {pieData.slice(0, 5).map((item) => (
                      <div key={item.reason} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm text-[var(--text-secondary)] truncate max-w-[150px]">
                            {item.reason}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {item.value} ({item.percent}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-[var(--text-muted)]">
                  No withdrawal data
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

function AgentRow({
  rank,
  agent,
}: {
  rank: number
  agent: EnrollmentReportData['byAgent'][0]
}) {
  const progressColor = agent.progress >= 100 ? 'success' : agent.progress >= 50 ? 'warning' : 'error'

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-depth-3)] border border-[var(--border)]">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-lg font-bold text-[var(--text-muted)] w-6">{rank}</span>
        <Avatar size="sm">
          {agent.avatarUrl && <AvatarImage src={agent.avatarUrl} />}
          <AvatarFallback>
            {agent.agentName.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-medium text-[var(--text-primary)] truncate">{agent.agentName}</p>
          <p className="text-xs text-[var(--text-muted)]">
            Target: {agent.target}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-xl font-bold text-[var(--text-primary)]">{agent.enrolled}</p>
          <p className="text-xs text-[var(--text-muted)]">enrolled</p>
        </div>
        <div className="w-24">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[var(--text-muted)]">Progress</span>
            <Badge variant={progressColor} size="sm">{agent.progress}%</Badge>
          </div>
          <ProgressBar
            value={agent.progress}
            max={100}
            size="sm"
            variant={progressColor === 'success' ? 'success' : progressColor === 'warning' ? 'warning' : 'error'}
          />
        </div>
      </div>
    </div>
  )
}
