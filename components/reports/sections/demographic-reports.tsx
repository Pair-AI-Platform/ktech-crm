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
} from "recharts"
import {
  Users,
  Globe,
  CreditCard,
  BookOpen,
  Percent,
  UserCircle,
  MapPin,
} from "lucide-react"
import type { DemographicReportData } from "@/lib/hooks/use-reports"

interface DemographicReportsProps {
  data: DemographicReportData
}

const GENDER_COLORS = ['#3B82F6', '#EC4899']
const NATIONALITY_COLORS = ['#22C55E', '#F59E0B']
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

  const totalLeads = data.byGender.reduce((sum, g) => sum + g.count, 0)

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {genderPieData.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card hover glow className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="p-2.5 rounded-xl shadow-lg"
                    style={{ backgroundColor: item.color }}
                  >
                    <UserCircle className="w-5 h-5 text-white" />
                  </div>
                  <Badge variant="secondary" size="sm">{item.percent}%</Badge>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">{item.name}</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{item.value}</p>
              </CardContent>
              <div
                className="absolute bottom-0 left-0 right-0 h-1 opacity-50"
                style={{ backgroundColor: item.color }}
              />
            </Card>
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card hover glow className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-[var(--bg-sunken)] shadow-sm">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Total Leads</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{totalLeads}</p>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--bg-sunken)] opacity-50" />
          </Card>
        </motion.div>
      </div>

      {/* Pie Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gender Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-[var(--primary)]" />
                Gender Split
              </CardTitle>
              <CardDescription>Male vs Female distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <PieChartSection data={genderPieData} mounted={mounted} />
            </CardContent>
          </Card>
        </motion.div>

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
              <CardDescription>Kuwaiti vs Non-Kuwaiti</CardDescription>
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

      {/* Major Demand */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[var(--info)]" />
              Major Demand
            </CardTitle>
            <CardDescription>Interest by intended major</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]" style={{ minWidth: 0 }}>
              {mounted && data.byMajor.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.byMajor}
                    layout="vertical"
                    margin={{ left: 100 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={true} vertical={false} />
                    <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                      width={95}
                    />
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
                    <Bar dataKey="count" fill="var(--primary)" radius={[0, 4, 4, 0]}>
                      {data.byMajor.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={MAJOR_COLORS[index % MAJOR_COLORS.length]} />
                      ))}
                    </Bar>
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
            {/* Governorate Legend/Stats */}
            {data.byGovernorate.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-[var(--border)]">
                {data.byGovernorate.map((item, index) => (
                  <div key={item.governorate} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: GOVERNORATE_COLORS[index % GOVERNORATE_COLORS.length] }}
                    />
                    <span className="text-sm text-[var(--text-secondary)] truncate">{item.label}</span>
                    <span className="text-sm font-medium text-[var(--text-primary)] ml-auto">
                      {item.count} <span className="text-[var(--text-muted)]">({item.percent}%)</span>
                    </span>
                  </div>
                ))}
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
