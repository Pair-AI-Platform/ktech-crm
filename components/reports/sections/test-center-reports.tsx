"use client"

import { useSyncExternalStore, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressBar, ProgressRing } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  FileCheck,
  GraduationCap,
  BookOpen,
  Award,
  TrendingUp,
  Users,
  RefreshCw,
  ArrowUpRight,
  Minus,
  Clock,
  RotateCcw,
  CheckCircle2,
  FolderOpen,
} from "lucide-react"
import type { TestCenterReportData, LevelStatsData } from "@/lib/hooks/use-reports"

interface TestCenterReportsProps {
  data: TestCenterReportData
  onSync?: () => Promise<void>
}

const LEVEL_COLORS = {
  foundation_1: '#F59E0B',
  foundation_2: '#3B82F6',
  majors: '#22C55E',
}

const LEVEL_LABELS = {
  foundation_1: 'Foundation 1',
  foundation_2: 'Foundation 2',
  majors: 'Majors',
}

const emptySubscribe = () => () => {}

interface TooltipPayload {
  name: string
  value: number
  payload: { percent: number }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-[var(--text-muted)]">{payload[0].name}</p>
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {payload[0].value} students ({payload[0].payload.percent}%)
        </p>
      </div>
    )
  }
  return null
}

type ViewMode = 'total' | 'sf' | 'puc'

const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: 'total', label: 'Total' },
  { value: 'sf', label: 'SF' },
  { value: 'puc', label: 'PUC' },
]

export function TestCenterReports({ data, onSync }: TestCenterReportsProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('total')

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await onSync?.()
      setLastSynced(new Date())
    } finally {
      setTimeout(() => setIsSyncing(false), 500)
    }
  }

  const enrolledStats = viewMode === 'sf' ? data.enrolledSF : viewMode === 'puc' ? data.enrolledPUC : data.enrolled
  const filesStats = viewMode === 'sf' ? data.filesSF : viewMode === 'puc' ? data.filesPUC : data.files

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)] w-fit">
        {VIEW_MODES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setViewMode(value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === value
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Enrolled Section */}
      <LevelSection
        title="Enrolled"
        subtitle={viewMode === 'sf' ? 'Self-funded enrolled students' : viewMode === 'puc' ? 'PUC enrolled students' : 'Enrolled students'}
        icon={<GraduationCap className="w-5 h-5" />}
        stats={enrolledStats}
        mounted={mounted}
        delayOffset={0}
      />

      {/* Files Section */}
      <LevelSection
        title="Files"
        subtitle={viewMode === 'sf' ? 'Self-funded students with open files' : viewMode === 'puc' ? 'PUC students with open files' : 'Students with open files'}
        icon={<FolderOpen className="w-5 h-5" />}
        stats={filesStats}
        mounted={mounted}
        delayOffset={0.3}
      />

      {/* Retest Report */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-[var(--accent)]" />
                  Retest Report
                </CardTitle>
                <CardDescription>
                  Students who retook the placement test
                  {lastSynced && (
                    <span className="ml-2 text-xs text-[var(--text-muted)]">
                      Last synced: {lastSynced.toLocaleTimeString()}
                    </span>
                  )}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Retest Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <RetestStatCard
                label="Total Retests"
                value={data.retest.totalRetests}
                icon={<RotateCcw className="w-4 h-4" />}
                color="var(--accent)"
              />
              <RetestStatCard
                label="Completed"
                value={data.retest.completed}
                icon={<CheckCircle2 className="w-4 h-4" />}
                color="var(--success)"
              />
              <RetestStatCard
                label="Improved"
                value={data.retest.improved}
                icon={<ArrowUpRight className="w-4 h-4" />}
                color="#22C55E"
              />
              <RetestStatCard
                label="Same Level"
                value={data.retest.same}
                icon={<Minus className="w-4 h-4" />}
                color="var(--warning)"
              />
              <RetestStatCard
                label="Pending"
                value={data.retest.pending}
                icon={<Clock className="w-4 h-4" />}
                color="var(--text-muted)"
              />
            </div>

            {/* Retest Students Table */}
            {data.retest.students.length > 0 ? (
              <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--bg-sunken)] border-b border-[var(--border)]">
                        <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">Student</th>
                        <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">Previous Level</th>
                        <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">Current Level</th>
                        <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">Appointment Date</th>
                        <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.retest.students.map((student, idx) => (
                        <tr
                          key={`${student.studentId}-${idx}`}
                          className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-sunken)]/50 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                            {student.studentName}
                          </td>
                          <td className="px-4 py-3">
                            {student.previousLevel ? (
                              <span className="inline-flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: LEVEL_COLORS[student.previousLevel] || '#6B7280' }}
                                />
                                <span className="text-[var(--text-secondary)]">
                                  {LEVEL_LABELS[student.previousLevel] || student.previousLevel}
                                </span>
                              </span>
                            ) : (
                              <span className="text-[var(--text-muted)]">--</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {student.currentLevel ? (
                              <span className="inline-flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: LEVEL_COLORS[student.currentLevel] || '#6B7280' }}
                                />
                                <span className="text-[var(--text-secondary)]">
                                  {LEVEL_LABELS[student.currentLevel] || student.currentLevel}
                                </span>
                              </span>
                            ) : (
                              <span className="text-[var(--text-muted)]">--</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-[var(--text-secondary)]">
                            {student.appointmentDate
                              ? new Date(student.appointmentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '--'}
                          </td>
                          <td className="px-4 py-3">
                            <RetestStatusBadge status={student.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)]">
                <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No retest appointments found</p>
                <p className="text-xs mt-1">Click Sync to check for updates</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Additional Info */}
    </div>
  )
}

function LevelSection({
  title,
  subtitle,
  icon,
  stats,
  mounted,
  delayOffset,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  stats: LevelStatsData
  mounted: boolean
  delayOffset: number
}) {
  const pieData = stats.byLevel.map(level => ({
    name: LEVEL_LABELS[level.level],
    value: level.count,
    percent: level.percent,
    color: LEVEL_COLORS[level.level],
  })).filter(d => d.value > 0)

  const statCards = [
    {
      title: `Total ${title}`,
      value: stats.total,
      icon: Users,
      colorClass: "bg-[var(--bg-sunken)]"
    },
    {
      title: "Pass Rate",
      value: `${stats.passRate}%`,
      icon: TrendingUp,
      colorClass: "bg-[var(--success)]"
    },
    {
      title: "Foundation 1",
      value: stats.foundation1,
      icon: BookOpen,
      colorClass: "bg-[var(--warning)]"
    },
    {
      title: "Foundation 2",
      value: stats.foundation2,
      icon: FileCheck,
      colorClass: "bg-[var(--primary)]"
    },
    {
      title: "Direct Entry",
      value: stats.majors,
      icon: GraduationCap,
      colorClass: "bg-[var(--success)]"
    },
  ]

  return (
    <>
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: delayOffset }}
        className="flex items-center gap-2 text-[var(--text-secondary)]"
      >
        {icon}
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
        <span className="text-sm">— {subtitle}</span>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: delayOffset + index * 0.1 }}
          >
            <Card hover glow className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-xl ${stat.colorClass} shadow-sm`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
              </CardContent>
              <div className={`absolute bottom-0 left-0 right-0 h-1 ${stat.colorClass} opacity-50`} />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Level Distribution Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: delayOffset + 0.4 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[var(--primary)]" />
                Level Distribution
              </CardTitle>
              <CardDescription>{title} — placement test results breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]" style={{ minWidth: 0 }}>
                {mounted && pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                    No test data available
                  </div>
                )}
              </div>
              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-4">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-[var(--text-secondary)]">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Level Breakdown Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: delayOffset + 0.5 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[var(--accent)]" />
                Level Breakdown
              </CardTitle>
              <CardDescription>{title} students by placement level</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.byLevel.map((level) => (
                <LevelCard
                  key={level.level}
                  level={level.level}
                  count={level.count}
                  percent={level.percent}
                  total={stats.total}
                />
              ))}

              {/* Pass Rate Ring */}
              <div className="mt-6 p-4 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Overall Pass Rate</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.passRate}%</p>
                  </div>
                  <ProgressRing
                    value={stats.passRate}
                    max={100}
                    size={80}
                    strokeWidth={8}
                    showValue
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  )
}

function LevelCard({
  level,
  count,
  percent,
  total,
}: {
  level: string
  count: number
  percent: number
  total: number
}) {
  const color = LEVEL_COLORS[level as keyof typeof LEVEL_COLORS] || '#6B7280'
  const label = LEVEL_LABELS[level as keyof typeof LEVEL_LABELS] || level

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
        </div>
        <div className="text-right">
          <span className="text-sm font-semibold text-[var(--text-primary)]">{count}</span>
          <span className="text-xs text-[var(--text-muted)] ml-2">({percent}%)</span>
        </div>
      </div>
      <ProgressBar
        value={count}
        max={total || 1}
        size="sm"
        className="[&>div]:transition-all"
        style={{ '--progress-color': color } as React.CSSProperties}
      />
    </div>
  )
}

function RetestStatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: number
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="p-3 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)]">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}20`, color }}>
          {icon}
        </div>
      </div>
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="text-xl font-bold text-[var(--text-primary)]">{value}</p>
    </div>
  )
}

function RetestStatusBadge({ status }: { status: 'improved' | 'same' | 'pending' }) {
  const config = {
    improved: { label: 'Improved', variant: 'success' as const, icon: <ArrowUpRight className="w-3 h-3" /> },
    same: { label: 'Same', variant: 'warning' as const, icon: <Minus className="w-3 h-3" /> },
    pending: { label: 'Pending', variant: 'secondary' as const, icon: <Clock className="w-3 h-3" /> },
  }
  const { label, variant, icon } = config[status]
  return (
    <Badge variant={variant} size="sm" className="gap-1">
      {icon}
      {label}
    </Badge>
  )
}

