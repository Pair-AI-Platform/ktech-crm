"use client"

import { useSyncExternalStore } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProgressBar } from "@/components/ui/progress"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts"
import {
  Globe,
  CreditCard,
  BookOpen,
  Percent,
  UserCircle,
  MapPin,
  Shield,
} from "lucide-react"
import type { DemographicReportData } from "@/lib/hooks/use-reports"

interface DemographicReportsProps {
  data: DemographicReportData
}

const GENDER_COLORS = ['#3B82F6', '#EC4899']
const NATIONALITY_COLORS = ['#22C55E', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#0EA5E9', '#F97316', '#14B8A6', '#EF4444', '#6366F1', '#84CC16', '#D946EF']
const FUNDING_COLORS = ['#445eb7', '#8B5CF6']
const MAJOR_COLORS = ['#212e7f', '#445eb7', '#5a71c4', '#7084d1', '#8992c8', '#a3aad6', '#c5c9db']
const GOVERNORATE_COLORS = ['#0EA5E9', '#8B5CF6', '#F59E0B', '#22C55E', '#EC4899', '#F97316']

const emptySubscribe = () => () => {}

interface TooltipPayload {
  payload: { name?: string; percent: number }
  name: string
  value: number
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-[var(--text-muted)]">{payload[0].payload.name || payload[0].name}</p>
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {payload[0].value} ({payload[0].payload.percent}%)
        </p>
      </div>
    )
  }
  return null
}

export function DemographicReports({ data }: DemographicReportsProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  const genderPieData = data.byGender.map((item, index) => ({
    name: item.gender,
    value: item.count,
    percent: item.percent,
    color: GENDER_COLORS[index % GENDER_COLORS.length],
  }))

  const genderEnrolledPieData = data.byGenderEnrolled.map((item, index) => ({
    name: item.gender,
    value: item.count,
    percent: item.percent,
    color: GENDER_COLORS[index % GENDER_COLORS.length],
  }))

  const nationalityPieData = data.byNationality.map((item, index) => ({
    name: item.label,
    value: item.count,
    percent: item.percent,
    color: NATIONALITY_COLORS[index % NATIONALITY_COLORS.length],
  }))

  const fundingPieData = data.byFunding.map((item, index) => ({
    name: item.label,
    value: item.count,
    percent: item.percent,
    color: FUNDING_COLORS[index % FUNDING_COLORS.length],
  }))


  return (
    <div className="space-y-6">
      {/* Pie Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution - All Files */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-[var(--primary)]" />
                Gender Split — All Files
              </CardTitle>
              <CardDescription>Male vs Female across all leads</CardDescription>
            </CardHeader>
            <CardContent>
              <PieChartSection data={genderPieData} mounted={mounted} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Gender Distribution - Enrolled */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-[var(--success)]" />
                Gender Split — Enrolled
              </CardTitle>
              <CardDescription>Male vs Female among enrolled students</CardDescription>
            </CardHeader>
            <CardContent>
              <PieChartSection data={genderEnrolledPieData} mounted={mounted} />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Nationality + Funding Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nationality Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-[var(--success)]" />
                Nationality Split
              </CardTitle>
              <CardDescription>Distribution by nationality</CardDescription>
            </CardHeader>
            <CardContent>
              <PieChartSection data={nationalityPieData} mounted={mounted} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Funding Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[var(--accent)]" />
                Funding Split
              </CardTitle>
              <CardDescription>Self-Funded vs PUC</CardDescription>
            </CardHeader>
            <CardContent>
              <PieChartSection data={fundingPieData} mounted={mounted} />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Lead Types */}
      {data.byLeadType.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[var(--warning)]" />
                Lead Types
              </CardTitle>
              <CardDescription>Breakdown by student category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {data.byLeadType.map((item, index) => {
                  const typeColors = ['#F59E0B', '#22C55E', '#8B5CF6', '#3B82F6', '#EC4899', '#0EA5E9']
                  const color = typeColors[index % typeColors.length]
                  return (
                    <div
                      key={item.type}
                      className="relative rounded-xl border border-[var(--border)] p-4 text-center overflow-hidden"
                    >
                      <div
                        className="absolute top-0 left-0 right-0 h-1"
                        style={{ backgroundColor: color }}
                      />
                      <p className="text-2xl font-bold text-[var(--text-primary)]">{item.count}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">{item.label}</p>
                      <Badge variant="secondary" size="sm" className="mt-2">{item.percent}%</Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Major Performance — Enrolled vs Files (PUC + SF) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[var(--info)]" />
              Major Performance
            </CardTitle>
            <CardDescription>Enrolled vs files per major — PUC and self-funded separated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[360px]" style={{ minWidth: 0 }}>
              {mounted && data.byMajorCombined.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.byMajorCombined}
                    layout="vertical"
                    margin={{ left: 110, right: 20, top: 10, bottom: 10 }}
                    barCategoryGap="20%"
                    barGap={2}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={true} vertical={false} />
                    <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                      width={105}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0]?.payload
                          return (
                            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-xl text-xs space-y-1 min-w-[160px]">
                              <p className="font-semibold text-[var(--text-primary)] mb-1">{label}</p>
                              <div className="flex justify-between gap-4">
                                <span className="text-[var(--text-muted)]">Total Leads</span>
                                <span className="font-medium text-[var(--text-primary)]">{d?.totalLeads}</span>
                              </div>
                              <div className="border-t border-[var(--border)] my-1" />
                              <p className="text-[var(--text-muted)] font-medium uppercase tracking-wide text-[10px]">Files</p>
                              <div className="flex justify-between gap-4">
                                <span className="text-[#445eb7]">PUC</span>
                                <span className="font-medium">{d?.pucFiles}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-[#8B5CF6]">Self-Funded</span>
                                <span className="font-medium">{d?.sfFiles}</span>
                              </div>
                              <div className="border-t border-[var(--border)] my-1" />
                              <p className="text-[var(--text-muted)] font-medium uppercase tracking-wide text-[10px]">Enrolled</p>
                              <div className="flex justify-between gap-4">
                                <span className="text-[#1e3a8a]">PUC</span>
                                <span className="font-medium">{d?.pucEnrolled}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-[#6d28d9]">Self-Funded</span>
                                <span className="font-medium">{d?.sfEnrolled}</span>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      formatter={(value) => <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{value}</span>}
                    />
                    <Bar dataKey="pucFiles" name="PUC Files" stackId="files" fill="#445eb7" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="sfFiles" name="SF Files" stackId="files" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="pucEnrolled" name="PUC Enrolled" stackId="enrolled" fill="#1e3a8a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="sfEnrolled" name="SF Enrolled" stackId="enrolled" fill="#6d28d9" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                  No major data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Governorate Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.65 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[var(--primary)]" />
              Leads by Governorate
            </CardTitle>
            <CardDescription>Distribution of leads across Kuwait governorates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]" style={{ minWidth: 0 }}>
              {mounted && data.byGovernorate.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.byGovernorate}
                    margin={{ left: 10, right: 10, top: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-xl">
                              <p className="text-xs text-[var(--text-muted)]">{payload[0].payload.label}</p>
                              <p className="text-sm font-semibold text-[var(--text-primary)]">
                                {payload[0].value} leads ({payload[0].payload.percent}%)
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {data.byGovernorate.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={GOVERNORATE_COLORS[index % GOVERNORATE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                  No governorate data available
                </div>
              )}
            </div>
            {/* Governorate Table */}
            {data.byGovernorate.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[var(--border)] overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-[var(--text-muted)] border-b border-[var(--border)]">
                      <th className="pb-2 pr-4 font-medium">Governorate</th>
                      <th className="pb-2 pr-4 font-medium text-right">Leads</th>
                      <th className="pb-2 pr-4 font-medium text-right">Files</th>
                      <th className="pb-2 pr-4 font-medium text-right">Enrolled</th>
                      <th className="pb-2 pr-4 font-medium text-right">PUC</th>
                      <th className="pb-2 font-medium text-right">Self Fund</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byGovernorate.map((item, index) => (
                      <tr key={item.governorate} className="border-b border-[var(--border)] last:border-0">
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: GOVERNORATE_COLORS[index % GOVERNORATE_COLORS.length] }}
                            />
                            <span className="text-[var(--text-secondary)]">{item.label}</span>
                          </div>
                        </td>
                        <td className="py-2 pr-4 text-right font-medium text-[var(--text-primary)]">
                          {item.count}
                          <span className="text-[var(--text-muted)] font-normal ml-1">({item.percent}%)</span>
                        </td>
                        <td className="py-2 pr-4 text-right text-[var(--text-primary)]">{item.files}</td>
                        <td className="py-2 pr-4 text-right text-[var(--text-primary)]">{item.enrolled}</td>
                        <td className="py-2 pr-4 text-right text-[var(--text-primary)]">{item.puc}</td>
                        <td className="py-2 text-right text-[var(--text-primary)]">{item.sf}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Discount Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-[var(--warning)]" />
              Discount Analysis
            </CardTitle>
            <CardDescription>Students by discount type</CardDescription>
          </CardHeader>
          <CardContent>
            {data.discountAnalysis.length > 0 ? (
              <div className="space-y-4">
                {data.discountAnalysis.map((discount) => (
                  <div key={discount.discountType} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {discount.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" size="sm">{discount.count} students</Badge>
                      </div>
                    </div>
                    <ProgressBar
                      value={discount.count}
                      max={Math.max(...data.discountAnalysis.map(d => d.count)) || 1}
                      size="sm"
                      variant="gradient"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)]">
                No discount data available
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

function PieChartSection({
  data,
  mounted,
}: {
  data: Array<{ name: string; value: number; percent: number; color: string }>
  mounted: boolean
}) {
  return (
    <>
      <div className="h-[180px]" style={{ minWidth: 0 }}>
        {mounted && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
            No data
          </div>
        )}
      </div>
      {/* Legend */}
      <div className="flex flex-col gap-2 mt-4">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-[var(--text-secondary)]">{item.name}</span>
            </div>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {item.value} ({item.percent}%)
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
