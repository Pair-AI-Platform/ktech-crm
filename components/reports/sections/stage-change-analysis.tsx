"use client"

import { useSyncExternalStore } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import {
  Activity,
  TrendingUp,
  Users,
  BarChart3,
} from "lucide-react"
import type { StageChangeAnalysisData } from "@/lib/hooks/use-reports"

interface StageChangeAnalysisProps {
  data: StageChangeAnalysisData
}

const emptySubscribe = () => () => {}

const STAGE_COLORS: Record<string, string> = {
  new: 'var(--text-muted)',
  contacted: 'var(--primary)',
  visit: 'var(--warning)',
  test: 'var(--accent)',
  application: 'var(--info)',
  applicant: '#8B5CF6',
  enrolled: '#22C55E',
  withdraw: '#F97316',
  lost: '#EF4444',
}

function DistributionTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { changes: number; count: number } }> }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs font-medium text-[var(--text-primary)] mb-1">
          {data.changes} {data.changes === 1 ? 'day' : 'days'} of changes
        </p>
        <p className="text-sm text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--text-primary)]">{data.count}</span> {data.count === 1 ? 'lead' : 'leads'}
        </p>
      </div>
    )
  }
  return null
}

function StageTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { stageLabel: string; avgChanges: number; count: number } }> }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs font-medium text-[var(--text-primary)] mb-1">{data.stageLabel}</p>
        <p className="text-sm text-[var(--text-secondary)]">
          Avg: <span className="font-semibold text-[var(--text-primary)]">{data.avgChanges}</span> days of changes
        </p>
        <p className="text-xs text-[var(--text-muted)]">{data.count} leads</p>
      </div>
    )
  }
  return null
}

export function StageChangeAnalysis({ data }: StageChangeAnalysisProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card hover glow className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-xl bg-[var(--primary)]/10">
                  <Activity className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <Badge variant="secondary" size="sm">Total</Badge>
              </div>
              <div className="text-3xl font-bold text-[var(--text-primary)] mb-1">
                {data.totalLeadsWithChanges}
              </div>
              <p className="text-sm text-[var(--text-muted)]">Leads with stage changes</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card hover glow className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-xl bg-[var(--info)]/10">
                  <TrendingUp className="w-5 h-5 text-[var(--info)]" />
                </div>
                <Badge variant="secondary" size="sm">Average</Badge>
              </div>
              <div className="text-3xl font-bold text-[var(--text-primary)] mb-1">
                {data.overallAvgChanges}
              </div>
              <p className="text-sm text-[var(--text-muted)]">Avg days of changes per lead</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card hover glow className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-xl bg-[var(--warning)]/10">
                  <BarChart3 className="w-5 h-5 text-[var(--warning)]" />
                </div>
                <Badge variant="secondary" size="sm">Max</Badge>
              </div>
              <div className="text-3xl font-bold text-[var(--text-primary)] mb-1">
                {data.maxChanges}
              </div>
              <p className="text-sm text-[var(--text-muted)]">Most days of changes (single lead)</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Distribution Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[var(--primary)]" />
              Stage Change Distribution
            </CardTitle>
            <p className="text-sm text-[var(--text-muted)]">
              How many unique days of stage changes each lead has (multiple changes on the same day count as 1)
            </p>
          </CardHeader>
          <CardContent>
            {mounted && data.distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="changes"
                    stroke="var(--text-muted)"
                    fontSize={12}
                    tickLine={false}
                    label={{ value: 'Days of changes', position: 'insideBottom', offset: -5, fill: 'var(--text-muted)', fontSize: 11 }}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={12}
                    tickLine={false}
                    label={{ value: 'Number of leads', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11 }}
                  />
                  <Tooltip content={<DistributionTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="var(--primary)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-[var(--text-muted)]">
                No stage change data available
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* By Current Stage Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--info)]" />
              Average Changes by Current Stage
            </CardTitle>
            <p className="text-sm text-[var(--text-muted)]">
              Average unique days of stage changes for leads currently at each pipeline stage
            </p>
          </CardHeader>
          <CardContent>
            {mounted && data.byCurrentStage.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.byCurrentStage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="stageLabel"
                    stroke="var(--text-muted)"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={12}
                    tickLine={false}
                    label={{ value: 'Avg days of changes', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11 }}
                  />
                  <Tooltip content={<StageTooltip />} />
                  <Bar dataKey="avgChanges" radius={[4, 4, 0, 0]}>
                    {data.byCurrentStage.map((entry) => (
                      <Cell
                        key={entry.stage}
                        fill={STAGE_COLORS[entry.stage] || 'var(--primary)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-[var(--text-muted)]">
                No stage change data available
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* By Agent Table */}
      {data.byAgent.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--accent)]" />
                Stage Changes by Agent
              </CardTitle>
              <p className="text-sm text-[var(--text-muted)]">
                Unique days of stage changes per agent (deduplicated per lead per day)
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left py-3 px-4 font-medium text-[var(--text-muted)]">Agent</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--text-muted)]">Leads</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--text-muted)]">Total Days</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--text-muted)]">Avg Days / Lead</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byAgent.map((agent) => (
                      <tr key={agent.agentId} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-elevated)]/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {agent.avatarUrl ? (
                              <img src={agent.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-xs font-medium text-[var(--primary)]">
                                {agent.agentName.charAt(0)}
                              </div>
                            )}
                            <span className="font-medium text-[var(--text-primary)]">{agent.agentName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-[var(--text-secondary)]">{agent.leadCount}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="secondary" size="sm">{agent.totalChanges}</Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-semibold text-[var(--text-primary)]">{agent.avgChanges}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
