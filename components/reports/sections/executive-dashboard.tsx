"use client"

import { useSyncExternalStore, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  Target,
  GraduationCap,
  Calendar,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Layers,
} from "lucide-react"
import type { ExecutiveReportData } from "@/lib/hooks/use-reports"
import { AnimatedNumber } from "../animated-number"
import { PipelineFunnelVisual } from "./pipeline-funnel-visual"
import { cn } from "@/lib/utils"

interface ExecutiveDashboardProps {
  data: ExecutiveReportData
  isAgent?: boolean
  onNavigateTab?: (tab: string) => void
}

const emptySubscribe = () => () => {}

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

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div
        className="px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm"
        style={{
          background: 'var(--bg-elevated)',
          borderColor: 'var(--border-default)',
        }}
      >
        <p className="text-[11px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2.5">
              <div
                className="w-2.5 h-2.5 rounded-md shadow-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-[var(--text-secondary)] font-medium">{entry.name}</span>
              <span className="text-sm font-bold text-[var(--text-primary)] ml-auto tabular-nums">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

export function ExecutiveDashboard({ data, isAgent, onNavigateTab }: ExecutiveDashboardProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-50px" })

  const totalSchedule = data?.periodNumbers?.appointments ?? 0
  const callbacksCount = data?.periodNumbers?.callbacks ?? 0
  const appointmentsOnly = totalSchedule - callbacksCount
  const newLeadsCount = data?.periodNumbers?.newLeads ?? 0
  const enrolledCount = data?.periodNumbers?.enrolled ?? 0
  const totalStageChanges = data?.totalStageChanges ?? 0

  // Compute total active leads across both funnels
  const totalActiveLeads = (data?.sfPipelineFunnel ?? []).reduce((s, i) => s + i.count, 0)
    + (data?.pucPipelineFunnel ?? []).reduce((s, i) => s + i.count, 0)

  const stats = [
    {
      title: "Target Progress",
      value: data?.targetProgress?.current ?? 0,
      suffix: ` / ${data?.targetProgress?.target ?? 0}`,
      percent: data?.targetProgress?.percent ?? 0,
      change: null as number | null,
      icon: Target,
      iconBg: "bg-indigo-500",
      iconGlow: "shadow-indigo-500/25",
      accentBg: "bg-indigo-50 dark:bg-indigo-950/20",
      color: "var(--primary)",
      navigateTo: "pipeline",
      breakdown: undefined as string | undefined,
    },
    {
      title: "New Leads",
      value: newLeadsCount,
      change: data?.periodComparison?.leads?.change ?? null,
      icon: Users,
      iconBg: "bg-violet-500",
      iconGlow: "shadow-violet-500/25",
      accentBg: "bg-violet-50 dark:bg-violet-950/20",
      color: "var(--primary)",
      navigateTo: "pipeline",
      breakdown: `${totalActiveLeads} total active`,
    },
    {
      title: "Appointments",
      value: appointmentsOnly,
      change: data?.periodComparison?.appointments?.change ?? null,
      icon: Calendar,
      iconBg: "bg-sky-500",
      iconGlow: "shadow-sky-500/25",
      accentBg: "bg-sky-50 dark:bg-sky-950/20",
      color: "var(--info)",
      navigateTo: "calendar",
      breakdown: callbacksCount > 0 ? `${callbacksCount} callbacks` : undefined,
    },
    {
      title: "Enrolled",
      value: enrolledCount,
      change: data?.periodComparison?.enrollments?.change ?? null,
      icon: GraduationCap,
      iconBg: "bg-emerald-500",
      iconGlow: "shadow-emerald-500/25",
      accentBg: "bg-emerald-50 dark:bg-emerald-950/20",
      color: "var(--success)",
      navigateTo: "pipeline",
      breakdown: totalStageChanges > 0 ? `${totalStageChanges} stage moves` : undefined,
    },
  ]

  return (
    <div ref={containerRef} className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay: index * 0.1, ease: "easeOut" }}
            whileHover={{ y: -4, boxShadow: "0 12px 40px -12px rgba(0,0,0,0.15)" }}
            onClick={() => onNavigateTab?.(stat.navigateTo)}
            style={{ cursor: onNavigateTab ? "pointer" : undefined }}
            className="group"
          >
            <div className={cn(
              "relative h-full overflow-hidden rounded-2xl p-6 transition-all duration-300",
              "bg-[var(--bg-surface)] border border-[var(--border-default)]",
              "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
            )}>
              {/* Hover background tint */}
              <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                stat.accentBg
              )} />

              <div className="relative z-10">
                {/* Header: Icon + Change */}
                <div className="flex items-start justify-between mb-5">
                  <div className={cn(
                    "w-13 h-13 rounded-2xl flex items-center justify-center shadow-lg",
                    stat.iconBg, stat.iconGlow
                  )}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Change indicator */}
                  {stat.change !== undefined && stat.change !== null && (() => {
                    const info = fmtChange(stat.change)
                    return (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={isInView ? { scale: 1, opacity: 1 } : {}}
                        transition={{ delay: index * 0.1 + 0.3, type: "spring", stiffness: 200 }}
                        className="text-right"
                      >
                        <div className={cn(
                          "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold",
                          info.isNew
                            ? "bg-[var(--info)]/8 text-[var(--info)]"
                            : info.isPositive
                              ? "bg-[var(--success)]/8 text-[var(--success)]"
                              : "bg-[var(--error)]/8 text-[var(--error)]"
                        )}>
                          {!info.isNew && (info.isPositive ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          ))}
                          {info.label}
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] mt-1 text-center uppercase tracking-wide">vs prev period</p>
                      </motion.div>
                    )
                  })()}

                  {/* Percent badge for target */}
                  {stat.percent !== undefined && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={isInView ? { scale: 1, opacity: 1 } : {}}
                      transition={{ delay: index * 0.1 + 0.3, type: "spring", stiffness: 200 }}
                    >
                      <div className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-bold tabular-nums",
                        stat.percent >= 80 ? "bg-[var(--success)]/10 text-[var(--success)]"
                          : stat.percent >= 50 ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                          : "bg-[var(--warning)]/10 text-[var(--warning)]"
                      )}>
                        {stat.percent}%
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Label */}
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">{stat.title}</p>

                {/* Value */}
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="text-[32px] font-extrabold tracking-tight leading-none text-[var(--text-primary)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {mounted ? <AnimatedNumber value={stat.value} /> : stat.value}
                  </span>
                  {stat.suffix && (
                    <span className="text-lg text-[var(--text-muted)] font-medium">{stat.suffix}</span>
                  )}
                </div>

                {/* Breakdown subtitle */}
                {stat.breakdown && (
                  <p className="text-[11px] text-[var(--text-muted)] mt-2 font-medium">{stat.breakdown}</p>
                )}

                {/* Progress bar for target */}
                {stat.percent !== undefined && (
                  <div className="mt-4">
                    <div className="h-2.5 rounded-full bg-[var(--bg-sunken)] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: stat.color }}
                        initial={{ width: 0 }}
                        animate={isInView ? { width: `${Math.max(Math.min(stat.percent, 100), 2)}%` } : {}}
                        transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Agent Performance Chart */}
      {!isAgent && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className={cn(
            "rounded-2xl overflow-hidden",
            "bg-[var(--bg-surface)] border border-[var(--border-default)]",
            "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
          )}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-indigo-500 shadow-lg shadow-indigo-500/25 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                    Agent Performance
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Leads, files &amp; enrollments by agent
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="font-semibold text-xs px-3 py-1.5 rounded-lg">
                Current Period
              </Badge>
            </div>

            {/* Chart */}
            <div className="px-6 pt-6 pb-4">
              <div className="h-[320px]" style={{ minWidth: 0 }}>
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.agentPerformance ?? []} barGap={2}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        vertical={false}
                        opacity={0.4}
                      />
                      <XAxis
                        dataKey="agent"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}
                        dy={12}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 500 }}
                        dx={-8}
                        width={35}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)', radius: 8 }} />
                      <Bar
                        dataKey="leads"
                        name="Leads"
                        fill="#6366F1"
                        radius={[0, 0, 4, 4]}
                        maxBarSize={36}
                      />
                      <Bar
                        dataKey="files"
                        name="Files"
                        fill="#8B5CF6"
                        radius={[0, 0, 0, 0]}
                        maxBarSize={36}
                      />
                      <Bar
                        dataKey="enrolled"
                        name="Enrolled"
                        fill="#10B981"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={36}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full bg-[var(--bg-sunken)] rounded-xl animate-pulse" />
                )}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#6366F1]" />
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Leads</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#8B5CF6]" />
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Files</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#10B981]" />
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Enrolled</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Pipeline Funnels - SF & PUC Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="rounded-2xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-8">
            <PipelineFunnelVisual
              data={data?.sfPipelineFunnel ?? []}
              totalStageChanges={data?.totalStageChanges ?? 0}
              title="Self Funded"
              subtitle="SF lead progression funnel"
              icon={<Layers className="w-5 h-5 text-white" />}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="rounded-2xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-8">
            <PipelineFunnelVisual
              data={data?.pucPipelineFunnel ?? []}
              totalStageChanges={data?.totalStageChanges ?? 0}
              title="PUC"
              subtitle="PUC lead progression funnel"
              icon={<GraduationCap className="w-5 h-5 text-white" />}
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
