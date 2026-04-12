"use client"

import { useState, useMemo, useCallback, useSyncExternalStore } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  List,
} from "lucide-react"
import { generateExcelXML } from "@/lib/export/excel-generator"
import type { ChannelReportData, DemographicReportData } from "@/lib/hooks/use-reports"

interface SchoolReportsProps {
  data: ChannelReportData
  demographicData: DemographicReportData
}

const SCHOOL_COLORS = [
  '#445eb7', '#22C55E', '#F59E0B', '#8B5CF6', '#3B82F6',
  '#EF4444', '#06B6D4', '#EC4899', '#14B8A6', '#F97316',
]

const ITEMS_PER_PAGE = 10

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
  const [currentPage, setCurrentPage] = useState(1)
  const [showAll, setShowAll] = useState(false)

  const topSchool = data.topSchools[0]
  const topSchoolByLeads = data.bySchool.length > 0
    ? data.bySchool.reduce((max, school) => school.leads > max.leads ? school : max, data.bySchool[0])
    : { label: 'N/A', leads: 0, applicationPercent: 0, pucPercent: 0 }
  const topSchoolByEnrolledPuc = data.topSchools.length > 0
    ? data.topSchools.reduce((max, school) => school.enrolledPuc > max.enrolledPuc ? school : max, data.topSchools[0])
    : null
  const topSchoolByEnrolledSf = data.topSchools.length > 0
    ? data.topSchools.reduce((max, school) => school.enrolledSf > max.enrolledSf ? school : max, data.topSchools[0])
    : null

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

  // Pagination
  const allSchools = data.topSchools
  const totalPages = Math.ceil(allSchools.length / ITEMS_PER_PAGE)
  const displayedSchools = useMemo(() => {
    if (showAll) return allSchools
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return allSchools.slice(start, start + ITEMS_PER_PAGE)
  }, [allSchools, currentPage, showAll])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }, [totalPages])

  const handleToggleShowAll = useCallback(() => {
    setShowAll(prev => {
      if (!prev) setCurrentPage(1)
      return !prev
    })
  }, [])

  const handleExportExcel = useCallback(() => {
    const exportData = {
      title: 'School Breakdown',
      columns: [
        { key: 'rank', label: '#', width: 40 },
        { key: 'school', label: 'School', width: 200 },
        { key: 'totalLeads', label: 'Total Leads', width: 100 },
        { key: 'applications', label: 'Files', width: 100 },
        { key: 'applicationPercent', label: 'Files %', width: 100 },
        { key: 'enrolled', label: 'Enrolled', width: 100 },
        { key: 'enrolledPercent', label: 'Enrolled %', width: 100 },
        { key: 'puc', label: 'PUC', width: 80 },
        { key: 'pucPercent', label: 'PUC %', width: 80 },
        { key: 'sf', label: 'SF', width: 80 },
        { key: 'sfPercent', label: 'SF %', width: 80 },
      ],
      rows: allSchools.map((school, index) => ({
        rank: index + 1,
        school: school.schoolName,
        totalLeads: school.leads,
        applications: school.applications,
        applicationPercent: `${school.applicationPercent}%`,
        enrolled: school.enrolled,
        enrolledPercent: `${school.enrolledPercent}%`,
        puc: school.pucCount,
        pucPercent: `${school.pucPercent}%`,
        sf: school.sfCount,
        sfPercent: `${school.sfPercent}%`,
      })),
    }

    const xml = generateExcelXML(exportData)
    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `school-breakdown-${new Date().toISOString().split('T')[0]}.xls`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [allSchools])

  // Calculate offset for row numbering
  const rowOffset = showAll ? 0 : (currentPage - 1) * ITEMS_PER_PAGE

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
              <p className="text-sm text-[var(--text-secondary)] mb-1">Best Performing School (by files)</p>
              <p className="text-xl font-bold text-[var(--text-primary)] truncate">{topSchool?.schoolName || 'N/A'}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {topSchool?.applications || 0} files opened, {topSchool?.leads || 0} leads
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
                {topSchoolByLeads?.leads || 0} leads, {topSchoolByLeads?.applicationPercent || 0}% files
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card hover glow className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-[#8B5CF6] shadow-sm">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <Badge variant="info" size="sm">Enrolled PUC</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Best School (enrolled PUC)</p>
              <p className="text-xl font-bold text-[var(--text-primary)] truncate">{topSchoolByEnrolledPuc?.schoolName || 'N/A'}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {topSchoolByEnrolledPuc?.enrolledPuc || 0} enrolled PUC, {topSchoolByEnrolledPuc?.pucCount || 0} total PUC
              </p>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#8B5CF6] opacity-50" />
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card hover glow className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-[#F59E0B] shadow-sm">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <Badge variant="warning" size="sm">Enrolled SF</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Best School (enrolled SF)</p>
              <p className="text-xl font-bold text-[var(--text-primary)] truncate">{topSchoolByEnrolledSf?.schoolName || 'N/A'}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {topSchoolByEnrolledSf?.enrolledSf || 0} enrolled SF, {topSchoolByEnrolledSf?.sfCount || 0} total SF
              </p>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#F59E0B] opacity-50" />
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <CardDescription>Top 10 schools by lead count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[450px]" style={{ minWidth: 0 }}>
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

        {/* School Type Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-[var(--primary)]" />
                School Types
              </CardTitle>
              <CardDescription>Leads, files & enrollment by school type</CardDescription>
            </CardHeader>
            <CardContent>
              {data.bySchoolType.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-2">Type</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-2">Leads</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-2">Files</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-2">Files %</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-2">Enrolled</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-2">Enroll %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bySchoolType.map((row) => (
                      <tr key={row.type} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-sunken)] transition-colors">
                        <td className="py-2.5">
                          <Badge variant="secondary" size="sm">{row.label}</Badge>
                        </td>
                        <td className="py-2.5 text-center text-sm font-medium text-[var(--text-primary)]">{row.leads}</td>
                        <td className="py-2.5 text-center text-sm font-medium text-[var(--primary)]">{row.files}</td>
                        <td className="py-2.5 text-center">
                          <Badge variant={row.filesRate >= 30 ? 'success' : row.filesRate >= 15 ? 'warning' : 'secondary'} size="sm">{row.filesRate}%</Badge>
                        </td>
                        <td className="py-2.5 text-center text-sm font-medium text-[var(--success)]">{row.enrolled}</td>
                        <td className="py-2.5 text-center">
                          <Badge variant={row.enrollRate >= 20 ? 'success' : row.enrollRate >= 10 ? 'warning' : 'secondary'} size="sm">{row.enrollRate}%</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-[var(--text-muted)]">
                  No school type data available
                </div>
              )}
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
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-[var(--success)]" />
                  School Breakdown
                </CardTitle>
                <CardDescription className="mt-1">Total leads, files %, enrolled %, PUC %, and SF % per school</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleShowAll}
                  className="gap-1.5"
                >
                  <List className="w-4 h-4" />
                  {showAll ? 'Paginate' : `All Schools (${allSchools.length})`}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportExcel}
                  className="gap-1.5"
                  disabled={allSchools.length === 0}
                >
                  <Download className="w-4 h-4" />
                  Export Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {allSchools.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pr-4">#</th>
                        <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pr-4">School</th>
                        <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Total Leads</th>
                        <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Files</th>
                        <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Files %</th>
                        <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Enrolled</th>
                        <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Enrolled %</th>
                        <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">PUC</th>
                        <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">PUC %</th>
                        <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">SF</th>
                        <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pl-3">SF %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedSchools.map((school, index) => (
                        <tr key={school.schoolId} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-sunken)] transition-colors">
                          <td className="py-3 pr-4">
                            <span className="text-sm font-bold text-[var(--text-muted)]">{rowOffset + index + 1}</span>
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
                          <td className="py-3 px-3 text-center">
                            <Badge variant="info" size="sm">
                              {school.pucPercent}%
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="text-sm font-semibold text-[var(--text-primary)]">{school.sfCount}</span>
                          </td>
                          <td className="py-3 pl-3 text-center">
                            <Badge variant="warning" size="sm">
                              {school.sfPercent}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {!showAll && totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)]">
                    <p className="text-sm text-[var(--text-muted)]">
                      Showing {rowOffset + 1}-{Math.min(rowOffset + ITEMS_PER_PAGE, allSchools.length)} of {allSchools.length} schools
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          if (totalPages <= 5) return true
                          if (page === 1 || page === totalPages) return true
                          return Math.abs(page - currentPage) <= 1
                        })
                        .reduce<(number | 'ellipsis')[]>((acc, page, i, arr) => {
                          if (i > 0 && page - (arr[i - 1] as number) > 1) acc.push('ellipsis')
                          acc.push(page)
                          return acc
                        }, [])
                        .map((item, i) =>
                          item === 'ellipsis' ? (
                            <span key={`ellipsis-${i}`} className="px-1 text-[var(--text-muted)]">...</span>
                          ) : (
                            <Button
                              key={item}
                              variant={currentPage === item ? 'default' : 'ghost'}
                              size="sm"
                              onClick={() => handlePageChange(item)}
                              className="h-8 w-8 p-0"
                            >
                              {item}
                            </Button>
                          )
                        )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {showAll && (
                  <div className="flex items-center justify-center mt-4 pt-4 border-t border-[var(--border)]">
                    <p className="text-sm text-[var(--text-muted)]">
                      Showing all {allSchools.length} schools
                    </p>
                  </div>
                )}
              </>
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
