"use client"

import { useState, useSyncExternalStore } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  FileCheck,
  UserX,
  Users,
  BookOpen,
  MapPin,
  GraduationCap,
  School,
} from "lucide-react"
import type { DetailedAnalyticsData } from "@/lib/hooks/use-reports"

interface DetailedAnalyticsProps {
  data: DetailedAnalyticsData
}

const emptySubscribe = () => () => {}

const COLORS = {
  sf: "var(--primary)",
  puc: "var(--warning)",
  male: "var(--primary)",
  female: "var(--accent)",
  f1: "var(--warning)",
  f2: "var(--success)",
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs font-medium text-[var(--text-primary)] mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

type BreakdownTab = 'governorate' | 'school' | 'graduation_year'

export function DetailedAnalytics({ data }: DetailedAnalyticsProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)
  const [breakdownTab, setBreakdownTab] = useState<BreakdownTab>('governorate')

  const { enrollmentFromApplications, withdrawalsByAgent, enrolledByGender, foundationLevel, enrolledByBreakdown } = data

  // Chart data
  const appChartData = [
    { name: 'SF', Applications: enrollmentFromApplications.sfApplications, Enrolled: enrollmentFromApplications.sfEnrolled },
    { name: 'PUC', Applications: enrollmentFromApplications.pucApplications, Enrolled: enrollmentFromApplications.pucEnrolled },
  ]

  const genderPieData = [
    { name: 'Male', value: enrolledByGender.totalMale },
    { name: 'Female', value: enrolledByGender.totalFemale },
  ].filter(d => d.value > 0)

  const genderBarData = enrolledByGender.byAgent.map(a => ({
    name: a.agentName.split(' ')[0],
    Male: a.male,
    Female: a.female,
  }))

  const breakdownData = breakdownTab === 'governorate'
    ? enrolledByBreakdown.byGovernorate
    : breakdownTab === 'school'
      ? enrolledByBreakdown.bySchool.slice(0, 15)
      : enrolledByBreakdown.byGraduationYear

  return (
    <div className="space-y-8">
      {/* ============================================= */}
      {/* SECTION 1: Enrollment from Applications */}
      {/* ============================================= */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-[var(--primary)]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Enrollment from Applications</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card hover glow>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-[var(--primary-muted)] shadow-sm">
                    <FileCheck className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <Badge variant="info" size="sm">Total</Badge>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">Total Applications</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{enrollmentFromApplications.totalApplications}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {enrollmentFromApplications.totalEnrolled} enrolled ({enrollmentFromApplications.conversionRate}%)
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card hover glow>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-[var(--primary-muted)] shadow-sm">
                    <Users className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <Badge variant="secondary" size="sm">SF</Badge>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">Self-Funded Apps</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{enrollmentFromApplications.sfApplications}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {enrollmentFromApplications.sfEnrolled} enrolled ({enrollmentFromApplications.sfConversionRate}%)
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card hover glow>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-[var(--warning-bg)] shadow-sm">
                    <Users className="w-5 h-5 text-[var(--warning)]" />
                  </div>
                  <Badge variant="warning" size="sm">PUC</Badge>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">PUC Apps</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{enrollmentFromApplications.pucApplications}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {enrollmentFromApplications.pucEnrolled} enrolled ({enrollmentFromApplications.pucConversionRate}%)
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* SF vs PUC Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle>Applications vs Enrolled (SF / PUC)</CardTitle>
              <CardDescription>Comparison of application and enrollment counts by funding type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]" style={{ minWidth: 0 }}>
                {mounted && appChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={appChartData} margin={{ left: 10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="Applications" fill={COLORS.sf} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Enrolled" fill="var(--success)" radius={[4, 4, 0, 0]} />
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
      </section>

      {/* ============================================= */}
      {/* SECTION 2: Withdrawals by Agent */}
      {/* ============================================= */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <UserX className="w-5 h-5 text-[var(--error)]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Withdrawals by Agent</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card hover glow>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-[var(--error-bg)] shadow-sm">
                    <UserX className="w-5 h-5 text-[var(--error)]" />
                  </div>
                  <Badge variant="error" size="sm">Total</Badge>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">Total Withdrawals</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{withdrawalsByAgent.totalWithdrawnSF + withdrawalsByAgent.totalWithdrawnPUC}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card hover glow>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-[var(--primary-muted)] shadow-sm">
                    <Users className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <Badge variant="secondary" size="sm">SF</Badge>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">SF Withdrawals</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{withdrawalsByAgent.totalWithdrawnSF}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card hover glow>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-[var(--warning-bg)] shadow-sm">
                    <Users className="w-5 h-5 text-[var(--warning)]" />
                  </div>
                  <Badge variant="warning" size="sm">PUC</Badge>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">PUC Withdrawals</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{withdrawalsByAgent.totalWithdrawnPUC}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Agent Withdrawal Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle>Withdrawals per Agent</CardTitle>
              <CardDescription>Breakdown of withdrawals by funding type per agent</CardDescription>
            </CardHeader>
            <CardContent>
              {withdrawalsByAgent.byAgent.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pr-4">#</th>
                        <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pr-4">Agent</th>
                        <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">SF</th>
                        <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">PUC</th>
                        <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawalsByAgent.byAgent.map((agent, index) => (
                        <tr key={agent.agentId} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-sunken)] transition-colors">
                          <td className="py-3 pr-4">
                            <span className="text-sm font-bold text-[var(--text-muted)]">{index + 1}</span>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="w-7 h-7">
                                <AvatarImage src={agent.avatarUrl || undefined} />
                                <AvatarFallback className="text-xs">{getInitials(agent.agentName)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium text-[var(--text-primary)]">{agent.agentName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="text-sm font-semibold text-[var(--primary)]">{agent.sfWithdrawn}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="text-sm font-semibold text-[var(--warning)]">{agent.pucWithdrawn}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Badge variant="error" size="sm">{agent.total}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  No withdrawal data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* ============================================= */}
      {/* SECTION 3: Enrolled by Gender per Agent */}
      {/* ============================================= */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[var(--accent)]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Enrolled by Gender</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Gender Distribution</CardTitle>
                <CardDescription>Male vs Female enrolled students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]" style={{ minWidth: 0 }}>
                  {mounted && genderPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={genderPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          dataKey="value"
                          label={({ name, value, percent }) => `${name}: ${value} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                        >
                          {genderPieData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={index === 0 ? COLORS.male : COLORS.female}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                      No gender data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stacked Bar Chart by Agent */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Gender per Agent</CardTitle>
                <CardDescription>Male vs Female enrolled per agent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]" style={{ minWidth: 0 }}>
                  {mounted && genderBarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={genderBarData} margin={{ left: 10, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="Male" stackId="gender" fill={COLORS.male} radius={[0, 0, 0, 0]} />
                        <Bar dataKey="Female" stackId="gender" fill={COLORS.female} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                      No agent data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Agent Gender Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle>Enrolled per Agent by Gender</CardTitle>
              <CardDescription>Detailed breakdown of enrolled students per agent</CardDescription>
            </CardHeader>
            <CardContent>
              {enrolledByGender.byAgent.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pr-4">#</th>
                        <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pr-4">Agent</th>
                        <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Male</th>
                        <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Female</th>
                        <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrolledByGender.byAgent.map((agent, index) => (
                        <tr key={agent.agentId} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-sunken)] transition-colors">
                          <td className="py-3 pr-4">
                            <span className="text-sm font-bold text-[var(--text-muted)]">{index + 1}</span>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="w-7 h-7">
                                <AvatarImage src={agent.avatarUrl || undefined} />
                                <AvatarFallback className="text-xs">{getInitials(agent.agentName)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium text-[var(--text-primary)]">{agent.agentName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="text-sm font-semibold text-[var(--primary)]">{agent.male}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="text-sm font-semibold text-[var(--accent)]">{agent.female}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Badge variant="success" size="sm">{agent.total}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  No enrolled data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* ============================================= */}
      {/* SECTION 4: Foundation Level Totals */}
      {/* ============================================= */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[var(--warning)]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Foundation Level</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card hover glow>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-[var(--warning-bg)] shadow-sm">
                    <BookOpen className="w-5 h-5 text-[var(--warning)]" />
                  </div>
                  <Badge variant="warning" size="sm">F1</Badge>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">Foundation 1</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{foundationLevel.foundation1}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card hover glow>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-[var(--success-bg)] shadow-sm">
                    <BookOpen className="w-5 h-5 text-[var(--success)]" />
                  </div>
                  <Badge variant="success" size="sm">F2</Badge>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">Foundation 2</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{foundationLevel.foundation2}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card hover glow>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-[var(--primary-muted)] shadow-sm">
                    <BookOpen className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <Badge variant="info" size="sm">Total</Badge>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">Total Foundation</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{foundationLevel.totalFoundation}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card hover glow>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-[var(--accent-muted)] shadow-sm">
                    <BookOpen className="w-5 h-5 text-[var(--accent)]" />
                  </div>
                  <Badge variant="secondary" size="sm">Rate</Badge>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">Foundation %</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{foundationLevel.foundationPercent}%</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  of {foundationLevel.totalStudents} students
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ============================================= */}
      {/* SECTION 5: Enrolled Breakdown */}
      {/* ============================================= */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[var(--success)]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Enrolled Breakdown (SF / PUC)</h2>
        </div>

        {/* Mini-tabs */}
        <div className="flex gap-2">
          {([
            { id: 'governorate' as const, label: 'Governorate', icon: MapPin },
            { id: 'school' as const, label: 'Schools', icon: School },
            { id: 'graduation_year' as const, label: 'Grad Year', icon: GraduationCap },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setBreakdownTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                breakdownTab === tab.id
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-sunken)]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Stacked Bar Chart */}
        <motion.div
          key={breakdownTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>
                {breakdownTab === 'governorate' ? 'By Governorate' : breakdownTab === 'school' ? 'By School (Top 15)' : 'By Graduation Year'}
              </CardTitle>
              <CardDescription>SF vs PUC split for enrolled students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[360px]" style={{ minWidth: 0 }}>
                {mounted && breakdownData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={breakdownData}
                      layout="vertical"
                      margin={{ left: breakdownTab === 'school' ? 120 : 80, right: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                      <YAxis
                        type="category"
                        dataKey="label"
                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                        width={breakdownTab === 'school' ? 110 : 70}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="sf" name="SF" stackId="funding" fill={COLORS.sf} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="puc" name="PUC" stackId="funding" fill={COLORS.puc} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                    No breakdown data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle>
                {breakdownTab === 'governorate' ? 'Governorate' : breakdownTab === 'school' ? 'School' : 'Graduation Year'} Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {breakdownData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pr-4">
                          {breakdownTab === 'governorate' ? 'Governorate' : breakdownTab === 'school' ? 'School' : 'Year'}
                        </th>
                        <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">SF</th>
                        <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">PUC</th>
                        <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breakdownData.map((row) => (
                        <tr key={row.label} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-sunken)] transition-colors">
                          <td className="py-3 pr-4">
                            <span className="text-sm font-medium text-[var(--text-primary)]">{row.label}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="text-sm font-semibold text-[var(--primary)]">{row.sf}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="text-sm font-semibold text-[var(--warning)]">{row.puc}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Badge variant="success" size="sm">{row.total}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  No data available for this breakdown
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  )
}
