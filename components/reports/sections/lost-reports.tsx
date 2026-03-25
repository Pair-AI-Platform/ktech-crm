"use client"

import { useSyncExternalStore } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  UserX,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  Users,
  Target,
} from "lucide-react"
import type { LostReportData } from "@/lib/hooks/use-reports"

export interface LostReportsProps {
  data: LostReportData
  isAgent?: boolean
}

const emptySubscribe = () => () => {}

const COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#6366F1', '#14B8A6']

interface PieTooltipPayload {
  payload: { reason: string; percent: number }
  value: number
}

function PieCustomTooltip({ active, payload }: { active?: boolean; payload?: PieTooltipPayload[] }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-[var(--text-muted)]">{payload[0].payload.reason}</p>
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {payload[0].value} leads ({payload[0].payload.percent}%)
        </p>
      </div>
    )
  }
  return null
}

interface BarTooltipPayload {
  payload: { stageLabel: string; lostRatio: number; totalInStage: number }
  value: number
}

function BarCustomTooltip({ active, payload }: { active?: boolean; payload?: BarTooltipPayload[] }) {
  if (active && payload && payload.length) {
    const d = payload[0].payload
    return (
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-[var(--text-muted)]">{d.stageLabel}</p>
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {payload[0].value} lost of {d.totalInStage} ({d.lostRatio}%)
        </p>
      </div>
    )
  }
  return null
}

export function LostReports({ data, isAgent }: LostReportsProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  const pieData = data.byReason.map((item, index) => ({
    name: item.reason,
    reason: item.reason,
    category: item.category,
    value: item.count,
    percent: item.percent,
    color: COLORS[index % COLORS.length],
  }))

  const barData = data.byStage
    .filter(s => s.stage !== 'unknown')
    .map((item) => ({
      stage: item.stage,
      stageLabel: item.stageLabel,
      count: item.count,
      percent: item.percent,
      totalInStage: item.totalInStage,
      lostRatio: item.lostRatio,
    }))

  const unknownCount = data.byReason.find(r => r.reason === 'Unknown')?.count || 0

  return (
    <div className="space-y-6">
      {/* Missing Reasons Warning */}
      {unknownCount > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                {unknownCount} lost lead{unknownCount !== 1 ? 's' : ''} missing a reason
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                Filter by &quot;Lost&quot; stage in the leads table and click &quot;+ Add reason&quot; to assign reasons retroactively.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.0 }}>
          <Card hover glow className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-[var(--error-bg)] shadow-sm">
                  <UserX className="w-5 h-5 text-[var(--error)]" />
                </div>
                <Badge variant="error" size="sm">Total</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Total Lost</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{data.totalLost}</p>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--error)] opacity-50" />
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card hover glow className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-[var(--primary-muted)] shadow-sm">
                  <Users className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <Badge variant="secondary" size="sm">SF</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">SF Lost</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{data.sfLost}</p>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--primary)] opacity-50" />
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card hover glow className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-[var(--warning-bg)] shadow-sm">
                  <Users className="w-5 h-5 text-[var(--warning)]" />
                </div>
                <Badge variant="warning" size="sm">PUC</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">PUC Lost</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{data.pucLost}</p>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--warning)] opacity-50" />
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card hover glow className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-[var(--warning-bg)] shadow-sm">
                  <TrendingDown className="w-5 h-5 text-[var(--warning)]" />
                </div>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Lost Rate</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{data.lostRate}%</p>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--warning)] opacity-50" />
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card hover glow className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-[var(--error-bg)] shadow-sm">
                  <Target className="w-5 h-5 text-[var(--error)]" />
                </div>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Top Reason</p>
              <p className="text-lg font-bold text-[var(--text-primary)] truncate" title={data.topReason || "N/A"}>
                {data.topReason || "N/A"}
              </p>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--error)] opacity-50" />
          </Card>
        </motion.div>
      </div>

      {/* Lost per Stage — PUC + SF side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PUC Stage Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-[var(--warning)]" />
                Lost per Stage — PUC
              </CardTitle>
              <CardDescription>PUC leads lost at each stage and the loss ratio</CardDescription>
            </CardHeader>
            <CardContent>
              {data.byStagePuc.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pr-4">Stage</th>
                        <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Lost</th>
                        <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Loss Ratio</th>
                        <th className="text-right text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pl-3" style={{ minWidth: 120 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byStagePuc.map((stage) => {
                        const maxCount = Math.max(...data.byStagePuc.map(s => s.count))
                        const barWidth = maxCount > 0 ? (stage.count / maxCount) * 100 : 0
                        return (
                          <tr key={stage.stage} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-sunken)] transition-colors">
                            <td className="py-3 pr-4">
                              <span className="text-sm font-medium text-[var(--text-primary)]">{stage.stageLabel}</span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="text-sm font-semibold text-[var(--warning)]">{stage.count}</span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <Badge
                                variant={stage.lostRatio >= 50 ? "error" : stage.lostRatio >= 25 ? "warning" : "secondary"}
                                size="sm"
                              >
                                {stage.lostRatio}%
                              </Badge>
                            </td>
                            <td className="py-3 pl-3">
                              <div className="w-full h-2 bg-[var(--bg-sunken)] rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-[var(--warning)] transition-all duration-500"
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  No PUC stage data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* SF Stage Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-[var(--primary)]" />
                Lost per Stage — SF
              </CardTitle>
              <CardDescription>Self-funded leads lost at each stage and the loss ratio</CardDescription>
            </CardHeader>
            <CardContent>
              {data.byStageSf.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pr-4">Stage</th>
                        <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Lost</th>
                        <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Loss Ratio</th>
                        <th className="text-right text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pl-3" style={{ minWidth: 120 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byStageSf.map((stage) => {
                        const maxCount = Math.max(...data.byStageSf.map(s => s.count))
                        const barWidth = maxCount > 0 ? (stage.count / maxCount) * 100 : 0
                        return (
                          <tr key={stage.stage} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-sunken)] transition-colors">
                            <td className="py-3 pr-4">
                              <span className="text-sm font-medium text-[var(--text-primary)]">{stage.stageLabel}</span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="text-sm font-semibold text-[var(--primary)]">{stage.count}</span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <Badge
                                variant={stage.lostRatio >= 50 ? "error" : stage.lostRatio >= 25 ? "warning" : "secondary"}
                                size="sm"
                              >
                                {stage.lostRatio}%
                              </Badge>
                            </td>
                            <td className="py-3 pl-3">
                              <div className="w-full h-2 bg-[var(--bg-sunken)] rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  No SF stage data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Loss Ratio Bar Chart (all stages combined) */}
      <div className="grid grid-cols-1 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.65 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[var(--error)]" />
                Loss Ratio by Stage
              </CardTitle>
              <CardDescription>Lost / total leads that reached each stage</CardDescription>
            </CardHeader>
            <CardContent>
              {barData.length > 0 ? (
                <div className="h-[300px]" style={{ minWidth: 0 }}>
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={barData}
                        layout="vertical"
                        margin={{ top: 0, right: 30, bottom: 0, left: 10 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis
                          type="category"
                          dataKey="stageLabel"
                          width={90}
                          tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<BarCustomTooltip />} cursor={{ fill: 'var(--bg-sunken)' }} />
                        <Bar
                          dataKey="count"
                          fill="var(--error)"
                          radius={[0, 6, 6, 0]}
                          barSize={22}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full bg-[var(--bg-sunken)] rounded animate-pulse" />
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-[var(--text-muted)]">
                  No stage data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Reasons Ranked + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranked Reasons Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[var(--error)]" />
                Lost Reasons Ranked
              </CardTitle>
              <CardDescription>All reasons sorted by frequency</CardDescription>
            </CardHeader>
            <CardContent>
              {data.byReason.length > 0 ? (
                <div className="space-y-3">
                  {data.byReason.map((item, index) => {
                    const maxCount = data.byReason[0]?.count || 1
                    const barWidth = (item.count / maxCount) * 100
                    return (
                      <div key={item.reasonId} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[var(--text-muted)] w-5">{index + 1}</span>
                            <span className="text-sm text-[var(--text-primary)] truncate max-w-[200px]" title={item.reason}>
                              {item.reason}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[var(--error)]">{item.count}</span>
                            <Badge variant="secondary" size="sm">{item.percent}%</Badge>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-[var(--bg-sunken)] rounded-full overflow-hidden ml-7">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${barWidth}%`,
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  No lost reason data
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Reasons Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.8 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="w-5 h-5 text-[var(--error)]" />
                Reason Distribution
              </CardTitle>
              <CardDescription>Visual breakdown of lost reasons</CardDescription>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <>
                  <div className="h-[220px]" style={{ minWidth: 0 }}>
                    {mounted ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<PieCustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full bg-[var(--bg-sunken)] rounded animate-pulse" />
                    )}
                  </div>
                  <div className="space-y-2 mt-4">
                    {pieData.slice(0, 8).map((item) => (
                      <div key={item.reason} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm text-[var(--text-secondary)] truncate max-w-[180px]">
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
                  No lost reason data
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Reasons by Stage */}
      {data.reasonsByStage.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[var(--warning)]" />
                Top Reasons per Stage
              </CardTitle>
              <CardDescription>Why leads are lost at each pipeline stage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.reasonsByStage.map((stageData) => (
                  <div
                    key={stageData.stage}
                    className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-[var(--text-primary)]">{stageData.stageLabel}</h4>
                      <Badge variant="error" size="sm">
                        {stageData.reasons.reduce((sum, r) => sum + r.count, 0)}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {stageData.reasons.slice(0, 5).map((reason, idx) => (
                        <div key={`${stageData.stage}-${idx}`} className="flex items-center justify-between">
                          <span className="text-xs text-[var(--text-secondary)] truncate max-w-[140px]" title={reason.reason}>
                            {reason.reason}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-[var(--text-primary)]">{reason.count}</span>
                            <span className="text-xs text-[var(--text-muted)]">({reason.percent}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Lost Leads per Agent Table — admin only */}
      {!isAgent && (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-[var(--error)]" />
              Lost Leads per Agent
            </CardTitle>
            <CardDescription>Breakdown of lost leads by funding type per agent</CardDescription>
          </CardHeader>
          <CardContent>
            {data.byAgent.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pr-4">#</th>
                      <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pr-4">Agent</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">SF</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">PUC</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byAgent.map((agent, index) => (
                      <tr key={agent.agentId} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-sunken)] transition-colors">
                        <td className="py-3 pr-4">
                          <span className="text-sm font-bold text-[var(--text-muted)]">{index + 1}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="w-7 h-7">
                              <AvatarImage src={agent.avatarUrl || undefined} />
                              <AvatarFallback className="text-xs">{getInitials(agent.agentName)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-[var(--text-primary)]">{agent.agentName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-sm font-semibold text-[var(--primary)]">{agent.sfLost}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-sm font-semibold text-[var(--warning)]">{agent.pucLost}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant="error" size="sm">{agent.total}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)]">
                No lost lead data available
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
      )}
    </div>
  )
}
