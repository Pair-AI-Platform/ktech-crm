"use client"

import { useSyncExternalStore } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProgressBar } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import {
  TrendingUp,
  ArrowUpRight,
  Layers,
} from "lucide-react"
import type { ChannelReportData } from "@/lib/hooks/use-reports"

interface ConversionBySourceProps {
  data: ChannelReportData
}

const emptySubscribe = () => () => {}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs font-medium text-[var(--text-primary)] mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}{entry.name === 'Conversion %' ? '%' : ''}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function ConversionBySource({ data }: ConversionBySourceProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  const chartData = data.bySource
    .filter(s => s.count > 0)
    .slice(0, 10)
    .map(s => ({
      name: s.label,
      leads: s.count,
      converted: s.converted,
      conversionRate: s.conversionRate,
    }))
    .sort((a, b) => b.conversionRate - a.conversionRate)

  const bestSource = chartData[0]
  const totalConverted = data.bySource.reduce((sum, s) => sum + s.converted, 0)
  const totalLeads = data.bySource.reduce((sum, s) => sum + s.count, 0)
  const overallRate = totalLeads > 0 ? Math.round((totalConverted / totalLeads) * 100) : 0

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
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <Badge variant="info" size="sm">Overall</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Overall Conversion Rate</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{overallRate}%</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {totalConverted} converted of {totalLeads} leads
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
                  <ArrowUpRight className="w-5 h-5 text-white" />
                </div>
                <Badge variant="success" size="sm">Best</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Best Converting Source</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{bestSource?.name || 'N/A'}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {bestSource?.conversionRate || 0}% conversion rate
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
                <div className="p-2.5 rounded-xl bg-[var(--accent)] shadow-sm">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <Badge variant="secondary" size="sm">Sources</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Active Sources</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{chartData.length}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Sources with at least 1 lead
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Conversion Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[var(--primary)]" />
              Conversion Rate by Source
            </CardTitle>
            <CardDescription>Leads vs converted per source, sorted by conversion rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]" style={{ minWidth: 0 }}>
              {mounted && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ left: 100, right: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={true} vertical={false} />
                    <XAxis
                      type="number"
                      tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                      width={95}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="leads" name="Total Leads" fill="var(--border)" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="converted" name="Converted" fill="var(--success)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                  No source data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Source Breakdown Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Source Breakdown</CardTitle>
            <CardDescription>Detailed conversion metrics per lead source</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pr-4">#</th>
                      <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pr-4">Source</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Leads</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Converted</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Rate</th>
                      <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pl-4 w-40">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((source, index) => (
                      <tr key={source.name} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-sunken)] transition-colors">
                        <td className="py-3 pr-4">
                          <span className="text-sm font-bold text-[var(--text-muted)]">{index + 1}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-sm font-medium text-[var(--text-primary)]">{source.name}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-sm font-semibold text-[var(--text-primary)]">{source.leads}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-sm font-semibold text-[var(--success)]">{source.converted}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge
                            variant={source.conversionRate >= 30 ? 'success' : source.conversionRate >= 15 ? 'warning' : 'secondary'}
                            size="sm"
                          >
                            {source.conversionRate}%
                          </Badge>
                        </td>
                        <td className="py-3 pl-4">
                          <ProgressBar value={source.conversionRate} max={100} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)]">
                No source data available
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
