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
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Building,
  MapPin,
  TrendingUp,
  Award,
} from "lucide-react"
import type { ChannelReportData, DemographicReportData } from "@/lib/hooks/use-reports"

interface SchoolReportsProps {
  data: ChannelReportData
  demographicData: DemographicReportData
}

const SCHOOL_COLORS = [
  '#445eb7', '#22C55E', '#F59E0B', '#8B5CF6', '#3B82F6',
  '#EF4444', '#06B6D4', '#EC4899', '#14B8A6', '#F97316',
]

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

export function SchoolReports({ data, demographicData }: SchoolReportsProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  const topSchool = data.topSchools[0]
  const topSchoolByLeads = data.bySchool.length > 0
    ? data.bySchool.reduce((max, school) => school.leads > max.leads ? school : max, data.bySchool[0])
    : { label: 'N/A', leads: 0, applicationPercent: 0, pucPercent: 0 }

  const totalSchools = data.bySchool.length
  const totalLeadsFromSchools = data.bySchool.reduce((sum, s) => sum + s.leads, 0)
  const avgLeadsPerSchool = totalSchools > 0 ? Math.round(totalLeadsFromSchools / totalSchools) : 0

  // Pie chart data for governorate distribution
  const governoratePieData = demographicData.byGovernorate.map((gov, i) => ({
    name: gov.label,
    value: gov.count,
    color: SCHOOL_COLORS[i % SCHOOL_COLORS.length],
  })).filter(d => d.value > 0)

  // Bar chart data for top schools
  const schoolBarData = data.topSchools.slice(0, 10).map(school => ({
    name: school.schoolName,
    leads: school.leads,
    applications: school.applications,
    puc: school.pucCount,
  }))

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
                <div className="p-2.5 rounded-xl bg-[var(--success)] shadow-sm">
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
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--success)] opacity-50" />
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
                <div className="p-2.5 rounded-xl bg-[var(--primary)] shadow-sm">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <Badge variant="success" size="sm">Top Area</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Top School by Leads</p>
              <p className="text-xl font-bold text-[var(--text-primary)] truncate">{topSchoolByLeads?.label || 'N/A'}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {topSchoolByLeads?.leads || 0} leads, {topSchoolByLeads?.applicationPercent || 0}% application
              </p>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--primary)] opacity-50" />
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
                  <Award className="w-5 h-5 text-white" />
                </div>
                <Badge variant="info" size="sm">Stats</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">School Overview</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{totalSchools} Schools</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {totalLeadsFromSchools} total leads, ~{avgLeadsPerSchool} avg per school
              </p>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--accent)] opacity-50" />
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by School - Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[var(--primary)]" />
                Leads by School
              </CardTitle>
              <CardDescription>Top schools by lead count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]" style={{ minWidth: 0 }}>
                {mounted && schoolBarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={schoolBarData}
                      layout="vertical"
                      margin={{ left: 100 }}
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
                        dataKey="name"
                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                        width={95}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="leads" name="Leads" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                    No school data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Governorate Distribution - Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[var(--success)]" />
                Governorate Distribution
              </CardTitle>
              <CardDescription>Lead distribution across governorates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]" style={{ minWidth: 0 }}>
                {mounted && governoratePieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={governoratePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {governoratePieData.map((entry, index) => (
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
                                  {payload[0].value} leads
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
                    No governorate data available
                  </div>
                )}
              </div>
              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {governoratePieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-[var(--text-secondary)] truncate">{item.name}</span>
                    <span className="text-xs text-[var(--text-muted)] ml-auto shrink-0">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* School Breakdown Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-[var(--success)]" />
              School Breakdown
            </CardTitle>
            <CardDescription>Total leads, application stage %, enrolled %, and PUC % per school</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topSchools.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pr-4">#</th>
                      <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pr-4">School</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Total Leads</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Applications</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Application %</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Enrolled</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Enrolled %</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">PUC</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pl-3">PUC %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topSchools.map((school, index) => (
                      <tr key={school.schoolId} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-sunken)] transition-colors">
                        <td className="py-3 pr-4">
                          <span className="text-sm font-bold text-[var(--text-muted)]">{index + 1}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-sm font-medium text-[var(--text-primary)]">{school.schoolName}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-sm font-semibold text-[var(--text-primary)]">{school.leads}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-sm font-semibold text-[var(--text-primary)]">{school.applications}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant={school.applicationPercent >= 30 ? 'success' : school.applicationPercent >= 15 ? 'warning' : 'secondary'} size="sm">
                            {school.applicationPercent}%
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-sm font-semibold text-[var(--text-primary)]">{school.enrolled}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant={school.enrolledPercent >= 30 ? 'success' : school.enrolledPercent >= 15 ? 'warning' : 'secondary'} size="sm">
                            {school.enrolledPercent}%
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-sm font-semibold text-[var(--text-primary)]">{school.pucCount}</span>
                        </td>
                        <td className="py-3 pl-3 text-center">
                          <Badge variant="info" size="sm">
                            {school.pucPercent}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)]">
                No school data available
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
