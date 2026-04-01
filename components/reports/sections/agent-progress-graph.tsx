"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import {
  TrendingUp,
  Users,
  FileText,
  GraduationCap,
  Zap,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { AgentProgressGraphData } from "@/lib/hooks/use-reports"

interface AgentProgressGraphProps {
  data: AgentProgressGraphData
  dateLabel?: string
}

type MetricMode = 'leads' | 'files' | 'enrolled'

const METRICS: { key: MetricMode; label: string; icon: typeof Users; color: string }[] = [
  { key: 'leads', label: 'Leads', icon: Users, color: 'text-indigo-500' },
  { key: 'files', label: 'Files', icon: FileText, color: 'text-orange-500' },
  { key: 'enrolled', label: 'Enrolled', icon: GraduationCap, color: 'text-green-500' },
]

function CustomTooltip({ active, payload, label, metric }: {
  active?: boolean
  payload?: Array<{ dataKey: string; value: number; color: string; name: string }>
  label?: string
  metric: MetricMode
}) {
  if (!active || !payload?.length) return null
  const items = payload.filter(p => p.value > 0).sort((a, b) => b.value - a.value)
  if (items.length === 0) return null

  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 shadow-xl min-w-[180px]">
      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">{label}</p>
      <div className="space-y-1.5">
        {items.map(item => (
          <div key={item.dataKey} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-[var(--text-secondary)]">{item.name}</span>
            </div>
            <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">
              {item.value} {metric === 'leads' ? 'leads' : metric === 'files' ? 'files' : 'enrolled'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AgentProgressGraph({ data, dateLabel }: AgentProgressGraphProps) {
  const [metricMode, setMetricMode] = useState<MetricMode>('leads')

  const chartData = useMemo(() => {
    return data.dailyData.map(point => {
      const result: Record<string, string | number> = {
        date: point.date,
        label: point.label,
      }
      data.agents.forEach(agent => {
        result[agent.id] = (point[`${agent.id}_${metricMode}`] as number) || 0
      })
      return result
    })
  }, [data.dailyData, data.agents, metricMode])

  const hasData = chartData.some(point =>
    data.agents.some(agent => (point[agent.id] as number) > 0)
  )

  const { peakTime, totals } = data

  // Format peak date
  const peakDateFormatted = peakTime
    ? new Date(peakTime.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  if (data.agents.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className={cn(
        "rounded-2xl overflow-hidden",
        "bg-[var(--bg-surface)] border border-[var(--border-default)]",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
      )}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/25 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                Agent Progress
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Daily performance trend by agent
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Metric Toggle */}
            <div className="flex items-center bg-[var(--bg-sunken)] rounded-lg p-0.5">
              {METRICS.map(m => (
                <button
                  key={m.key}
                  onClick={() => setMetricMode(m.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                    metricMode === m.key
                      ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  )}
                >
                  <m.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{m.label}</span>
                </button>
              ))}
            </div>
            {dateLabel && (
              <Badge variant="secondary" className="font-semibold text-xs px-3 py-1.5 rounded-lg">
                {dateLabel}
              </Badge>
            )}
          </div>
        </div>

        {/* Peak Time Banner */}
        {peakTime && (
          <div className="px-6 py-3 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-transparent border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Peak Performance</span>
                <span className="text-xs text-[var(--text-secondary)]">—</span>
                <span className="text-xs font-semibold text-[var(--text-primary)]">{peakTime.agentName}</span>
                <span className="text-xs text-[var(--text-muted)]">achieved</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-bold">
                  {peakTime.value} {peakTime.metric}
                </Badge>
                <span className="text-xs text-[var(--text-muted)]">on {peakDateFormatted}</span>
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="px-6 py-5">
          {hasData ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  {data.agents.map(agent => (
                    <linearGradient key={agent.id} id={`grad-${agent.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={agent.color} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={agent.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={{ stroke: 'var(--border-subtle)' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip metric={metricMode} />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-xs font-medium text-[var(--text-secondary)]">{value}</span>
                  )}
                />
                {data.agents.map(agent => (
                  <Area
                    key={agent.id}
                    type="monotone"
                    dataKey={agent.id}
                    name={agent.name}
                    stroke={agent.color}
                    strokeWidth={2}
                    fill={`url(#grad-${agent.id})`}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, fill: 'var(--bg-surface)' }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[320px] text-[var(--text-muted)]">
              <BarChart3 className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No data for this period</p>
              <p className="text-xs mt-1">Try adjusting the date range</p>
            </div>
          )}
        </div>

        {/* Agent Totals Summary */}
        {totals.length > 0 && (
          <div className="border-t border-[var(--border-subtle)]">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-[var(--border-subtle)]">
              {totals
                .sort((a, b) => b.leads - a.leads)
                .slice(0, 5)
                .map((agent, i) => {
                  const agentColor = data.agents.find(a => a.id === agent.agentId)?.color || '#6366F1'
                  return (
                    <div key={agent.agentId} className="bg-[var(--bg-surface)] px-4 py-3.5">
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: agentColor }} />
                        <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{agent.agentName}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-indigo-500" />
                          <span className="text-xs font-bold text-[var(--text-primary)] tabular-nums">{agent.leads}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3 text-orange-500" />
                          <span className="text-xs font-bold text-[var(--text-primary)] tabular-nums">{agent.files}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 text-green-500" />
                          <span className="text-xs font-bold text-[var(--text-primary)] tabular-nums">{agent.enrolled}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
