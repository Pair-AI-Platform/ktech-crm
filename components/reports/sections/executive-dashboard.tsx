"use client"

import { useState, useEffect, useSyncExternalStore, useRef } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
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
  Zap,
  Sparkles,
  Activity,
  BarChart3,
} from "lucide-react"
import type { ExecutiveReportData } from "@/lib/hooks/use-reports"
import { PipelineFunnelVisual, PipelineFunnelHorizontal } from "./pipeline-funnel-visual"

interface ExecutiveDashboardProps {
  data: ExecutiveReportData
}

const emptySubscribe = () => () => {}

// Enhanced animated number with easing
function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return

    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4) // easeOutQuart
      setDisplayValue(Math.floor(eased * value))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration, isInView])

  return <span ref={ref}>{displayValue.toLocaleString()}</span>
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
        className="px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl"
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
      icon: Target,
      color: "#6366F1", // Indigo
      bgGradient: "from-indigo-500/20 via-indigo-500/10 to-transparent",
      iconBg: "from-indigo-600 to-indigo-400",
    },
    {
      title: "New Leads Today",
      value: data.todayNumbers.newLeads,
      change: data.weekOverWeek.leads.change,
      icon: Users,
      color: "#8B5CF6", // Violet
      bgGradient: "from-violet-500/20 via-violet-500/10 to-transparent",
      iconBg: "from-violet-600 to-violet-400",
    },
    {
      title: "Enrollments",
      value: data.weekOverWeek.enrollments.current,
      change: data.weekOverWeek.enrollments.change,
      icon: GraduationCap,
      color: "#22C55E", // Green
      bgGradient: "from-emerald-500/20 via-emerald-500/10 to-transparent",
      iconBg: "from-emerald-600 to-emerald-400",
    },
    {
      title: "Appointments Today",
      value: data.todayNumbers.appointments,
      change: data.weekOverWeek.appointments.change,
      icon: Calendar,
      color: "#F59E0B", // Amber
      bgGradient: "from-amber-500/20 via-amber-500/10 to-transparent",
      iconBg: "from-amber-600 to-amber-400",
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
              {/* Glow effect on hover */}
              <div
                className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 blur-lg transition-all duration-500"
                style={{ background: `linear-gradient(135deg, ${stat.color}40, transparent)` }}
              />

              <Card className="relative h-full overflow-hidden border-0 bg-[var(--bg-elevated)] shadow-lg">
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-60`} />

                {/* Decorative corner accent */}
                <div
                  className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20"
                  style={{ backgroundColor: stat.color }}
                />

                <CardContent className="relative p-5">
                  <div className="flex items-start justify-between mb-4">
                    {/* Icon with gradient background */}
                    <div className="relative">
                      <div
                        className="absolute inset-0 blur-lg opacity-50"
                        style={{ background: `linear-gradient(135deg, ${stat.color}, transparent)` }}
                      />
                      <div className={`relative p-3 rounded-xl bg-gradient-to-br ${stat.iconBg} shadow-lg`}>
                        <stat.icon className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    {/* Change indicator or badge */}
                    {stat.change !== undefined && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={isInView ? { scale: 1 } : {}}
                        transition={{ delay: index * 0.1 + 0.3, type: "spring" }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                          stat.change >= 0
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-500/10 text-red-600 dark:text-red-400"
                        }`}
                      >
                        {stat.change >= 0 ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {Math.abs(stat.change)}%
                      </motion.div>
                    )}
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
                      <div className="h-1.5 rounded-full bg-[var(--bg-depth-3)] overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: stat.color }}
                          initial={{ width: 0 }}
                          animate={isInView ? { width: `${Math.min(stat.percent, 100)}%` } : {}}
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
          <Card className="h-full border-0 shadow-lg bg-[var(--bg-elevated)]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-[var(--primary)] to-blue-400 shadow-lg">
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
                  <div className="h-full bg-[var(--bg-depth-3)] rounded-xl animate-pulse" />
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
          <Card className="h-full border-0 shadow-lg bg-[var(--bg-elevated)]">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-400 shadow-lg">
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
        <Card className="border-0 shadow-xl bg-[var(--bg-elevated)] overflow-hidden">
          <CardContent className="p-8">
            <PipelineFunnelVisual data={data.pipelineFunnel} />
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
  change: number
  color: string
  delay: number
  isInView: boolean
}) {
  const isPositive = change >= 0

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay }}
      className="relative group"
    >
      <div className="p-4 rounded-xl bg-[var(--bg-depth-2)] border border-[var(--border)] transition-all duration-300 hover:border-[var(--border-hover)] hover:shadow-lg">
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
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/15 text-red-600 dark:text-red-400"
            }`}
          >
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {change > 0 ? "+" : ""}{change}%
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
            <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-depth-4)] overflow-hidden">
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
            <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-depth-4)] overflow-hidden">
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
