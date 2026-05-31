"use client"

import { useSyncExternalStore } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  Clock,
  TrendingDown,
  Zap,
} from "lucide-react"
import type { TimeToConversionData } from "@/lib/hooks/use-reports"

interface TimeToConversionProps {
  data: TimeToConversionData[]
}

const emptySubscribe = () => () => {}

const STAGE_COLORS: Record<string, string> = {
  contacted: 'var(--primary)',
  appointment: 'var(--info)',
  visit: 'var(--warning)',
  test: 'var(--accent)',
  application: 'var(--success)',
  enrolled: '#22C55E',
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: TimeToConversionData }> }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs font-medium text-[var(--text-primary)] mb-1">{data.stageLabel}</p>
        <p className="text-sm text-[var(--text-secondary)]">
          Avg: <span className="font-semibold text-[var(--text-primary)]">{data.avgDays} days</span>
        </p>
        <p className="text-xs text-[var(--text-muted)]">{data.count} leads measured</p>
      </div>
    )
  }
  return null
}

export function TimeToConversion({ data }: TimeToConversionProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  const chartData = data.map(d => ({
    ...d,
    name: d.stageLabel,
    color: STAGE_COLORS[d.stage] || 'var(--primary)',
  }))

  const fastestStage = [...data].sort((a, b) => a.avgDays - b.avgDays)[0]
  const slowestStage = [...data].sort((a, b) => b.avgDays - a.avgDays)[0]
  const enrolledData = data.find(d => d.stage === 'enrolled')
  const totalAvgDays = enrolledData?.avgDays || (data.length > 0 ? data[data.length - 1].avgDays : 0)

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
                <div className="p-2.5 rounded-xl bg-[var(--primary)] shadow-sm">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <Badge variant="info" size="sm">Overall</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Avg Days to Enroll</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{totalAvgDays} days</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                From lead creation to enrollment
              </p>
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
                <div className="p-2.5 rounded-xl bg-[var(--success)] shadow-sm">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <Badge variant="success" size="sm">Fastest</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Fastest Stage</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{fastestStage?.stageLabel || 'N/A'}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {fastestStage?.avgDays || 0} avg days • {fastestStage?.count || 0} leads
              </p>
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
                <div className="p-2.5 rounded-xl bg-[var(--warning)] shadow-sm">
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
                <Badge variant="warning" size="sm">Slowest</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Slowest Stage</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{slowestStage?.stageLabel || 'N/A'}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {slowestStage?.avgDays || 0} avg days • {slowestStage?.count || 0} leads
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Horizontal Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[var(--primary)]" />
              Average Days per Stage
            </CardTitle>
            <CardDescription>How long leads take to reach each pipeline stage on average</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]" style={{ minWidth: 0 }}>
              {mounted && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ left: 90, right: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={true} vertical={false} />
                    <XAxis
                      type="number"
                      tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                      tickFormatter={(v) => `${v}d`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                      width={85}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="avgDays" name="Avg Days" radius={[0, 6, 6, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                ) : (
                <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                  No stage timing data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stage Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Stage Duration Details</CardTitle>
            <CardDescription>Average number of days from lead creation to reaching each stage</CardDescription>
          </CardHeader>
          <CardContent>
            {data.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.map((stage, index) => (
                  <motion.div
                    key={stage.stage}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: STAGE_COLORS[stage.stage] || 'var(--primary)' }}
                        />
                        <span className="text-sm font-medium text-[var(--text-primary)]">{stage.stageLabel}</span>
                      </div>
                      <Badge variant="secondary" size="sm">{stage.count} leads</Badge>
                    </div>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {stage.avgDays} <span className="text-sm font-normal text-[var(--text-muted)]">days</span>
                    </p>
                    <div className="mt-2 h-1.5 rounded-full bg-[var(--bg-sunken)] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${slowestStage ? Math.min(100, (stage.avgDays / slowestStage.avgDays) * 100) : 0}%` }}
                        transition={{ duration: 0.8, delay: 0.6 + index * 0.05 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: STAGE_COLORS[stage.stage] || 'var(--primary)' }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)]">
                No stage timing data available
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
