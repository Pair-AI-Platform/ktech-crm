"use client"

import { useSyncExternalStore, useState } from "react"
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
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Share2,
  TrendingUp,
  Layers,
  GraduationCap,
} from "lucide-react"
import type { ChannelReportData } from "@/lib/hooks/use-reports"
import { LEAD_SOURCES } from "@/types"
import type { LeadSourceCategory } from "@/types"

interface ChannelPerformanceProps {
  data: ChannelReportData
}

const SOURCE_CATEGORY_TABS: { value: LeadSourceCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'direct', label: 'Direct' },
  { value: 'outreach', label: 'Outreach' },
  { value: 'events', label: 'Events' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'referrals', label: 'Referrals' },
]

const SOURCE_TO_CATEGORY: Record<string, LeadSourceCategory> = Object.fromEntries(
  LEAD_SOURCES.map(s => [s.value, s.category])
) as Record<string, LeadSourceCategory>

const CATEGORY_COLORS: Record<string, string> = {
  direct: '#445eb7',
  events: '#22C55E',
  marketing: '#3B82F6',
  referrals: '#8B5CF6',
  outreach: '#F59E0B',
}

const emptySubscribe = () => () => {}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function ChannelPerformance({ data }: ChannelPerformanceProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  const [selectedCategory, setSelectedCategory] = useState<LeadSourceCategory | 'all'>('all')

  const filteredSources = selectedCategory === 'all'
    ? data.bySource
    : data.bySource.filter(s => SOURCE_TO_CATEGORY[s.source] === selectedCategory)

  const categoryPieData = data.byCategory.map(cat => ({
    name: cat.label,
    value: cat.count,
    percent: cat.percent,
    color: CATEGORY_COLORS[cat.category] || '#6B7280',
  })).filter(d => d.value > 0)

  const topSource = data.bySource[0]
  const topEnrollmentSource = [...data.bySource].sort((a, b) => b.enrolled - a.enrolled)[0]
  const totalEnrolled = data.bySource.reduce((sum, s) => sum + s.enrolled, 0)
  const totalLeads = data.bySource.reduce((sum, s) => sum + s.count, 0)
  const totalApplications = data.bySource.reduce((sum, s) => sum + s.files, 0)

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card hover glow className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-[var(--bg-sunken)] shadow-sm">
                  <Share2 className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <Badge variant="success" size="sm">Top Source</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Most Leads</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{topSource?.label || 'N/A'}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {topSource?.count || 0} leads
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
                <div className="p-2.5 rounded-xl bg-[var(--bg-sunken)] shadow-sm">
                  <GraduationCap className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <Badge variant="info" size="sm">Top Enrollment</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Best Enrollment Source</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{topEnrollmentSource?.label || 'N/A'}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {topEnrollmentSource?.enrolled || 0} enrolled, {topEnrollmentSource?.enrollmentRate || 0}% rate
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
                <div className="p-2.5 rounded-xl bg-[var(--bg-sunken)] shadow-sm">
                  <TrendingUp className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <Badge variant="warning" size="sm">Overall</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Overall Enrollment Rate</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{totalApplications > 0 ? Math.round((totalEnrolled / totalApplications) * 100) : 0}%</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {totalEnrolled} enrolled from {totalApplications} applications
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by Source */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[var(--primary)]" />
                Leads & Enrollment by Source
              </CardTitle>
              <CardDescription>Leads vs enrolled per source</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]" style={{ minWidth: 0 }}>
                {mounted && data.bySource.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.bySource.slice(0, 8)}
                      layout="vertical"
                      margin={{ left: 80, right: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={true} vertical={false} />
                      <XAxis
                        type="number"
                        tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                        allowDecimals={false}
                        domain={[0, (dataMax: number) => Math.max(5, dataMax)]}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                        width={75}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="count" name="Leads" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="files" name="Files" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="enrolled" name="Enrolled" fill="#22C55E" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                    No data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[var(--accent)]" />
                Source Categories
              </CardTitle>
              <CardDescription>Distribution by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Donut chart with center label */}
                <div className="relative h-[220px] w-[220px] flex-shrink-0" style={{ minWidth: 0 }}>
                  {mounted && categoryPieData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {categoryPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-xl">
                                    <p className="text-xs text-[var(--text-muted)]">{payload[0].name}</p>
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                                      {payload[0].value} leads ({payload[0].payload.percent}%)
                                    </p>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Center label */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-[var(--text-primary)]">
                          {categoryPieData.reduce((s, d) => s + d.value, 0)}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">Total Leads</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                      No data available
                    </div>
                  )}
                </div>

                {/* Legend with progress bars */}
                <div className="flex-1 w-full space-y-3">
                  {categoryPieData.map((item) => {
                    const maxCount = Math.max(...categoryPieData.map(d => d.value))
                    return (
                      <div key={item.name} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-sm"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-sm font-medium text-[var(--text-primary)]">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[var(--text-primary)]">{item.value}</span>
                            <span className="text-xs text-[var(--text-muted)] w-10 text-right">{item.percent}%</span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-[var(--bg-sunken)] rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: item.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.value / maxCount) * 100}%` }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Source Breakdown Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[var(--primary)]" />
              Source Breakdown
            </CardTitle>
            <CardDescription>Leads, enrollment count, and enrollment rate per source</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {SOURCE_CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setSelectedCategory(tab.value)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === tab.value
                      ? 'bg-[var(--primary)] text-white shadow-sm'
                      : 'bg-[var(--bg-sunken)] text-[var(--text-secondary)] hover:bg-[var(--border)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-3 px-3 text-[var(--text-muted)] font-medium">Source</th>
                    <th className="text-center py-3 px-3 text-[var(--text-muted)] font-medium">Leads</th>
                    <th className="text-center py-3 px-3 text-[var(--text-muted)] font-medium">Applications</th>
                    <th className="text-center py-3 px-3 text-[var(--text-muted)] font-medium">Enrolled</th>
                    <th className="text-center py-3 px-3 text-[var(--text-muted)] font-medium">Enrollment Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSources.map((source) => (
                    <tr key={source.source} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-sunken)] transition-colors">
                      <td className="py-3 px-3 font-medium text-[var(--text-primary)]">{source.label}</td>
                      <td className="py-3 px-3 text-center text-[var(--text-secondary)]">{source.count}</td>
                      <td className="py-3 px-3 text-center text-[var(--text-secondary)]">{source.converted}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`font-semibold ${source.enrolled > 0 ? 'text-green-500' : 'text-[var(--text-muted)]'}`}>
                          {source.enrolled}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-[var(--bg-sunken)] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-green-500 transition-all"
                              style={{ width: `${Math.min(source.enrollmentRate, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-[var(--text-muted)] w-8">{source.enrollmentRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  {(() => {
                    const fLeads = filteredSources.reduce((sum, s) => sum + s.count, 0)
                    const fApps = filteredSources.reduce((sum, s) => sum + s.converted, 0)
                    const fEnrolled = filteredSources.reduce((sum, s) => sum + s.enrolled, 0)
                    const fFiles = filteredSources.reduce((sum, s) => sum + s.files, 0)
                    return (
                      <tr className="border-t-2 border-[var(--border)] font-semibold">
                        <td className="py-3 px-3 text-[var(--text-primary)]">Total</td>
                        <td className="py-3 px-3 text-center text-[var(--text-primary)]">{fLeads}</td>
                        <td className="py-3 px-3 text-center text-[var(--text-primary)]">{fApps}</td>
                        <td className="py-3 px-3 text-center text-green-500">{fEnrolled}</td>
                        <td className="py-3 px-3 text-center text-[var(--text-muted)]">{fFiles > 0 ? Math.round((fEnrolled / fFiles) * 100) : 0}%</td>
                      </tr>
                    )
                  })()}
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

    </div>
  )
}
