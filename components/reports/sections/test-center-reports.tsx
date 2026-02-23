"use client"

import { useSyncExternalStore } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressBar, ProgressRing } from "@/components/ui/progress"
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
} from "lucide-react"
import type { TestCenterReportData } from "@/lib/hooks/use-reports"

interface TestCenterReportsProps {
  data: TestCenterReportData
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

export function TestCenterReports({ data }: TestCenterReportsProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  const pieData = data.byLevel.map(level => ({
    name: LEVEL_LABELS[level.level],
    value: level.count,
    percent: level.percent,
    color: LEVEL_COLORS[level.level],
  })).filter(d => d.value > 0)

  const stats = [
    {
      title: "Total Tested",
      value: data.totalTested,
      icon: Users,
      colorClass: "bg-[var(--bg-sunken)]"
    },
    {
      title: "Pass Rate",
      value: `${data.passRate}%`,
      icon: TrendingUp,
      colorClass: "bg-[var(--success)]"
    },
    {
      title: "Foundation 1",
      value: data.foundation1,
      icon: BookOpen,
      colorClass: "bg-[var(--warning)]"
    },
    {
      title: "Foundation 2",
      value: data.foundation2,
      icon: FileCheck,
      colorClass: "bg-[var(--primary)]"
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
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
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[var(--primary)]" />
                Level Distribution
              </CardTitle>
              <CardDescription>Placement test results breakdown</CardDescription>
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
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[var(--accent)]" />
                Level Breakdown
              </CardTitle>
              <CardDescription>Students by placement level</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.byLevel.map((level) => (
                <LevelCard
                  key={level.level}
                  level={level.level}
                  count={level.count}
                  percent={level.percent}
                  total={data.totalTested}
                />
              ))}

              {/* Pass Rate Ring */}
              <div className="mt-6 p-4 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Overall Pass Rate</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{data.passRate}%</p>
                  </div>
                  <ProgressRing
                    value={data.passRate}
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

      {/* Additional Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Placement Level Details</CardTitle>
            <CardDescription>What each level means</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoCard
                title="Foundation 1"
                color="#F59E0B"
                description="Students requiring comprehensive English foundation courses before starting major courses."
              />
              <InfoCard
                title="Foundation 2"
                color="#3B82F6"
                description="Students with intermediate English proficiency, requiring one semester of foundation courses."
              />
              <InfoCard
                title="Majors"
                color="#22C55E"
                description="Students ready to start their major courses directly without foundation requirements."
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
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

function InfoCard({
  title,
  color,
  description,
}: {
  title: string
  color: string
  description: string
}) {
  return (
    <div className="p-4 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)]">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <h4 className="font-semibold text-[var(--text-primary)]">{title}</h4>
      </div>
      <p className="text-sm text-[var(--text-muted)]">{description}</p>
    </div>
  )
}
