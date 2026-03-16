"use client"

import { useSyncExternalStore, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  Target,
  Users,
  GraduationCap,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react"
import type { ExecutiveReportData } from "@/lib/hooks/use-reports"
import { AnimatedNumber } from "../animated-number"
import { PipelineFunnelVisual } from "./pipeline-funnel-visual"

interface ExecutiveDashboardProps {
  data: ExecutiveReportData
}

const emptySubscribe = () => () => {}

/** Format change for display — cap at ±200%, handle null (new) */
function fmtChange(change: number | null): { label: string; isPositive: boolean; isNew: boolean } {
  if (change === null) return { label: "New", isPositive: true, isNew: true }
  const capped = Math.max(-200, Math.min(200, change))
  const prefix = capped > 0 ? "+" : ""
  const display = Math.abs(change) > 200 ? `${capped > 0 ? ">" : "<"}200` : `${prefix}${capped}`
  return { label: `${display}%`, isPositive: capped >= 0, isNew: false }
}

interface TooltipPayload {
  color: string
  name: string
  value: number
  dataKey: string
}

// Custom tooltip with glass morphism effect
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="px-4 py-3 rounded-xl border shadow-md"
        style={{
          background: 'var(--bg-elevated)',
          borderColor: 'var(--border)',
        }}
      >
        <p className="text-xs font-medium text-[var(--text-muted)] mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-[var(--text-secondary)]">{entry.name}:</span>
              <span className="text-sm font-bold text-[var(--text-primary)]">{entry.value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    )
  }
  return null
}

export function ExecutiveDashboard({ data }: ExecutiveDashboardProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-50px" })

  const stats = [
    {
      title: "Target Progress",
      value: data.targetProgress.current,
      suffix: ` / ${data.targetProgress.target}`,
      percent: data.targetProgress.percent,
      change: null as number | null,
      icon: Target,
      color: "var(--primary)",
      iconColorClass: "bg-[var(--primary)]",
    },
    {
      title: "New Leads Today",
      value: data.todayNumbers.newLeads,
      change: data.weekOverWeek.leads.change,
      icon: Users,
      color: "var(--accent)",
      iconColorClass: "bg-[var(--accent)]",
    },
    {
      title: "Enrollments This Week",
      value: data.weekOverWeek.enrollments.current,
      change: data.weekOverWeek.enrollments.change,
      icon: GraduationCap,
      color: "var(--success)",
      iconColorClass: "bg-[var(--success)]",
    },
    {
      title: "Appointments Today",
      value: data.todayNumbers.appointments,
      change: data.weekOverWeek.appointments.change,
      icon: Calendar,
      color: "var(--warning)",
      iconColorClass: "bg-[var(--warning)]",
    },
  ]

  return (
    <div ref={containerRef} className="space-y-8">
      {/* Stats Grid - Premium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="group relative h-full">
              <Card className="relative h-full overflow-hidden bg-[var(--bg-surface)] shadow-sm">
                <CardContent className="relative p-5">
                  <div className="flex items-start justify-between mb-4">
                    {/* Icon with flat background */}
                    <div className={`p-3 rounded-xl ${stat.iconColorClass} shadow-sm`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>

                    {/* Change indicator or badge */}
                    {stat.change !== undefined && stat.change !== null && (() => {
                      const info = fmtChange(stat.change)
                      return (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={isInView ? { scale: 1 } : {}}
                          transition={{ delay: index * 0.1 + 0.3, type: "spring" }}
                          className="text-right"
                        >
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                            info.isNew
                              ? "bg-[var(--info)]/10 text-[var(--info)]"
                              : info.isPositive
                                ? "bg-[var(--success)]/10 text-[var(--success)]"
                                : "bg-[var(--error)]/10 text-[var(--error)]"
                          }`}>
                            {!info.isNew && (info.isPositive ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3" />
                            ))}
                            {info.label}
                          </div>
                          <p className="text-[9px] text-[var(--text-muted)] mt-0.5 text-center">vs last week</p>
                        </motion.div>
                      )
                    })()}
                    {stat.percent !== undefined && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={isInView ? { scale: 1 } : {}}
                        transition={{ delay: index * 0.1 + 0.3, type: "spring" }}
                      >
                        <Badge variant="info" size="sm" className="font-semibold">
                          {stat.percent}%
                        </Badge>
                      </motion.div>
                    )}
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] mb-1.5 font-medium">{stat.title}</p>
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className="text-3xl font-bold tracking-tight"
                      style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
                    >
                      {mounted ? <AnimatedNumber value={stat.value} /> : stat.value}
                    </span>
                    {stat.suffix && (
                      <span className="text-base text-[var(--text-muted)] font-medium">{stat.suffix}</span>
                    )}
                  </div>

                  {/* Progress bar for target */}
                  {stat.percent !== undefined && (
                    <div className="mt-3">
                      <div className="h-1.5 rounded-full bg-[var(--bg-sunken)] overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: stat.color }}
                          initial={{ width: 0 }}
                          animate={isInView ? { width: `${Math.max(Math.min(stat.percent, 100), 2)}%` } : {}}
                          transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Weekly Trend Chart - Takes more space */}
        <motion.div
          className="xl:col-span-7"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="h-full shadow-sm bg-[var(--bg-surface)]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[var(--primary)] shadow-sm">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg" style={{ fontFamily: 'var(--font-display)' }}>
                      Weekly Performance
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Leads and enrollments over time
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="font-medium">Last 7 Days</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[300px]" style={{ minWidth: 0 }}>
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.weeklyTrend}>
                      <defs>
                        <linearGradient id="colorLeadsNew" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366F1" stopOpacity={0.4}/>
                          <stop offset="100%" stopColor="#6366F1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorEnrolledNew" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22C55E" stopOpacity={0.4}/>
                          <stop offset="100%" stopColor="#22C55E" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        vertical={false}
                        opacity={0.5}
                      />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 500 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 500 }}
                        dx={-10}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="leads"
                        name="Leads"
                        stroke="#6366F1"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorLeadsNew)"
                        dot={false}
                        activeDot={{
                          r: 6,
                          fill: "#6366F1",
                          stroke: "#fff",
                          strokeWidth: 2,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="enrolled"
                        name="Enrolled"
                        stroke="#22C55E"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorEnrolledNew)"
                        dot={false}
                        activeDot={{
                          r: 6,
                          fill: "#22C55E",
                          stroke: "#fff",
                          strokeWidth: 2,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full bg-[var(--bg-sunken)] rounded-xl animate-pulse" />
                )}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#6366F1]" />
                  <span className="text-sm text-[var(--text-secondary)]">Leads</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#22C55E]" />
                  <span className="text-sm text-[var(--text-secondary)]">Enrolled</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Week over Week - Redesigned */}
        <motion.div
          className="xl:col-span-5"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="h-full shadow-sm bg-[var(--bg-surface)]">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[var(--success)] shadow-sm">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg" style={{ fontFamily: 'var(--font-display)' }}>
                    Week over Week
                  </CardTitle>
                  <CardDescription className="text-xs">Performance comparison</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ComparisonCard
                label="Leads"
                current={data.weekOverWeek.leads.current}
                previous={data.weekOverWeek.leads.previous}
                change={data.weekOverWeek.leads.change}
                color="#6366F1"
                delay={0.6}
                isInView={isInView}
              />
              <ComparisonCard
                label="Appointments"
                current={data.weekOverWeek.appointments.current}
                previous={data.weekOverWeek.appointments.previous}
                change={data.weekOverWeek.appointments.change}
                color="#F59E0B"
                delay={0.7}
                isInView={isInView}
              />
              <ComparisonCard
                label="Enrollments"
                current={data.weekOverWeek.enrollments.current}
                previous={data.weekOverWeek.enrollments.previous}
                change={data.weekOverWeek.enrollments.change}
                color="#22C55E"
                delay={0.8}
                isInView={isInView}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Pipeline Funnel - Full Width Premium Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="shadow-sm bg-[var(--bg-surface)] overflow-hidden">
          <CardContent className="p-8">
            <PipelineFunnelVisual data={data.pipelineFunnel} totalStageChanges={data.totalStageChanges} />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// Redesigned comparison card component
function ComparisonCard({
  label,
  current,
  previous,
  change,
  color,
  delay,
  isInView,
}: {
  label: string
  current: number
  previous: number
  change: number | null
  color: string
  delay: number
  isInView: boolean
}) {
  const changeInfo = fmtChange(change)
  const isPositive = changeInfo.isPositive

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay }}
      className="relative group"
    >
      <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] transition-all duration-300 hover:border-[var(--border-hover)] hover:shadow-lg">
        {/* Accent line */}
        <div
          className="absolute left-0 top-4 bottom-4 w-1 rounded-full"
          style={{ backgroundColor: color }}
        />

        <div className="flex items-center justify-between mb-3 pl-3">
          <span className="font-semibold text-[var(--text-primary)]">{label}</span>
          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ delay: delay + 0.2, type: "spring" }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
              isPositive
                ? "bg-[var(--success)]/15 text-[var(--success)]"
                : "bg-[var(--error)]/15 text-[var(--error)]"
            }`}
          >
            {!changeInfo.isNew && (isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />)}
            {changeInfo.label}
          </motion.div>
        </div>

        <div className="flex items-end justify-between pl-3">
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-1">This Week</p>
            <p className="text-2xl font-bold" style={{ color, fontFamily: 'var(--font-display)' }}>
              {current}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--text-muted)] mb-1">Last Week</p>
            <p className="text-lg font-medium text-[var(--text-secondary)]">{previous}</p>
          </div>
        </div>

        {/* Mini comparison bar */}
        <div className="mt-3 pl-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-hover)] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={isInView ? {
                  width: `${Math.min((current / Math.max(current, previous)) * 100, 100)}%`
                } : {}}
                transition={{ delay: delay + 0.3, duration: 0.6 }}
              />
            </div>
            <span className="text-[10px] text-[var(--text-muted)] font-medium w-8">now</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-hover)] overflow-hidden">
              <motion.div
                className="h-full rounded-full opacity-50"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={isInView ? {
                  width: `${Math.min((previous / Math.max(current, previous)) * 100, 100)}%`
                } : {}}
                transition={{ delay: delay + 0.4, duration: 0.6 }}
              />
            </div>
            <span className="text-[10px] text-[var(--text-muted)] font-medium w-8">prev</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
