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
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Share2,
  TrendingUp,
  Building,
  MapPin,
  Layers,
  GraduationCap,
} from "lucide-react"
import type { ChannelReportData } from "@/lib/hooks/use-reports"

interface ChannelPerformanceProps {
  data: ChannelReportData
}

const CATEGORY_COLORS: Record<string, string> = {
  direct: '#445eb7',
  events: '#22C55E',
  digital: '#3B82F6',
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

  const categoryPieData = data.byCategory.map(cat => ({
    name: cat.label,
    value: cat.count,
    percent: cat.percent,
    color: CATEGORY_COLORS[cat.category] || '#6B7280',
  })).filter(d => d.value > 0)

  const topSource = data.bySource[0]
  const topSchool = data.topSchools[0]
  const topSchoolByLeads = data.bySchool.reduce((max, school) =>
    school.leads > max.leads ? school : max, data.bySchool[0] || { label: 'N/A', leads: 0 })

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
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#445eb7] to-[#212e7f] shadow-lg">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
                <Badge variant="success" size="sm">Top Source</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Best Performing Source</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{topSource?.label || 'N/A'}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {topSource?.count || 0} leads, {topSource?.conversionRate || 0}% conversion
              </p>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#445eb7] to-[#212e7f] opacity-50" />
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
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#22C55E] to-[#16A34A] shadow-lg">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <Badge variant="success" size="sm">Top School</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Best Performing School</p>
              <p className="text-xl font-bold text-[var(--text-primary)] truncate">{topSchool?.schoolName || 'N/A'}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {topSchool?.leads || 0} leads, {topSchool?.applications || 0} applications
              </p>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#22C55E] to-[#16A34A] opacity-50" />
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
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#2563EB] shadow-lg">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <Badge variant="success" size="sm">Top Area</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Best Performing School Type</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{topSchoolByLeads?.label || 'N/A'}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {topSchoolByLeads?.leads || 0} leads, {topSchoolByLeads?.conversionRate || 0}% conversion
              </p>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] opacity-50" />
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
                Leads by Source
              </CardTitle>
              <CardDescription>Performance by lead source</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]" style={{ minWidth: 0 }}>
                {mounted && data.bySource.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.bySource.slice(0, 8)}
                      layout="vertical"
                      margin={{ left: 80 }}
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
                      <Bar dataKey="count" name="Leads" fill="var(--primary)" radius={[0, 4, 4, 0]} />
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
              <div className="h-[200px]" style={{ minWidth: 0 }}>
                {mounted && categoryPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
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
                ) : (
                  <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                    No data available
                  </div>
                )}
              </div>
              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {categoryPieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-[var(--text-secondary)]">{item.name}</span>
                    <span className="text-xs text-[var(--text-muted)] ml-auto">{item.percent}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Schools & School Analysis Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Schools */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-[var(--success)]" />
                Top Schools
              </CardTitle>
              <CardDescription>Schools with most leads</CardDescription>
            </CardHeader>
            <CardContent>
              {data.topSchools.length > 0 ? (
                <div className="space-y-3">
                  {data.topSchools.slice(0, 8).map((school, index) => (
                    <div key={school.schoolId} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-depth-3)]">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-[var(--text-muted)] w-5">{index + 1}</span>
                        <span className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[180px]">
                          {school.schoolName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" size="sm">{school.leads} leads</Badge>
                        <Badge variant="success" size="sm">{school.applications} applications</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  No school data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* School Type Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[var(--info)]" />
                School Type Analysis
              </CardTitle>
              <CardDescription>Leads and conversion by school type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.bySchool.map((school) => (
                  <div key={school.school} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--text-primary)]">{school.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--text-secondary)]">{school.leads} leads</span>
                        <Badge variant={school.conversionRate >= 30 ? 'success' : school.conversionRate >= 15 ? 'warning' : 'secondary'} size="sm">
                          {school.conversionRate}%
                        </Badge>
                      </div>
                    </div>
                    <ProgressBar
                      value={school.leads}
                      max={Math.max(...data.bySchool.map(s => s.leads)) || 1}
                      size="sm"
                      variant="gradient"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
