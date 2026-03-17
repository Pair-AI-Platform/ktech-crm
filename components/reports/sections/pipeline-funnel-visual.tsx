"use client"

import { motion, useInView, AnimatePresence } from "framer-motion"
import { useRef, useState, useEffect, useCallback } from "react"
import {
  Sparkles,
  UserPlus,
  Phone,
  Calendar,
  MapPin,
  FileText,
  ClipboardCheck,
  GraduationCap,
  TrendingUp,
  LogOut,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Zap
} from "lucide-react"

interface PipelineStageData {
  stage: string
  label: string
  count: number
  percent: number
  movesIn: number
  movesOut: number
}

interface PipelineFunnelVisualProps {
  data: PipelineStageData[]
  totalStageChanges?: number
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  onStageClick?: (stage: string) => void
}

const STAGE_CONFIG: Record<string, {
  icon: React.ComponentType<{ className?: string }>
  color: string
  gradient: [string, string]
  glow: string
}> = {
  new:         { icon: UserPlus,       color: "#818CF8", gradient: ["#A5B4FC", "#6366F1"], glow: "rgba(99,102,241,0.3)" },
  contacted:   { icon: Phone,          color: "#8B5CF6", gradient: ["#A78BFA", "#7C3AED"], glow: "rgba(139,92,246,0.3)" },
  appointment: { icon: Calendar,       color: "#A855F7", gradient: ["#C084FC", "#9333EA"], glow: "rgba(168,85,247,0.3)" },
  visit:       { icon: MapPin,         color: "#D946EF", gradient: ["#E879F9", "#C026D3"], glow: "rgba(217,70,239,0.3)" },
  test:        { icon: ClipboardCheck, color: "#EC4899", gradient: ["#F472B6", "#DB2777"], glow: "rgba(236,72,153,0.3)" },
  application: { icon: FileText,       color: "#F43F5E", gradient: ["#FB7185", "#E11D48"], glow: "rgba(244,63,94,0.3)" },
  applicant:   { icon: GraduationCap,  color: "#F59E0B", gradient: ["#FBBF24", "#D97706"], glow: "rgba(245,158,11,0.3)" },
  enrolled:    { icon: GraduationCap,  color: "#10B981", gradient: ["#34D399", "#059669"], glow: "rgba(16,185,129,0.3)" },
  withdraw:    { icon: LogOut,         color: "#6B7280", gradient: ["#9CA3AF", "#4B5563"], glow: "rgba(107,114,128,0.3)" },
  lost:        { icon: LogOut,         color: "#EF4444", gradient: ["#F87171", "#DC2626"], glow: "rgba(239,68,68,0.3)" },
  puc_document_submission:    { icon: FileText,       color: "#EC4899", gradient: ["#F472B6", "#DB2777"], glow: "rgba(236,72,153,0.3)" },
  puc_application_submission: { icon: ClipboardCheck, color: "#06B6D4", gradient: ["#22D3EE", "#0891B2"], glow: "rgba(6,182,212,0.3)" },
}

function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    let startTime: number
    let animationFrame: number
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * value))
      if (progress < 1) animationFrame = requestAnimationFrame(animate)
    }
    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration, isInView])

  return <span ref={ref}>{count.toLocaleString()}</span>
}

/**
 * True top-down funnel: widest at the top, narrowing progressively.
 * Width decreases linearly from 100% to 28% regardless of count.
 */
function getFunnelWidths(data: PipelineStageData[]): number[] {
  if (data.length === 0) return []
  const minWidth = 28
  const maxWidth = 100
  return data.map((_, index) => {
    const ratio = data.length > 1 ? index / (data.length - 1) : 0
    return maxWidth - ratio * (maxWidth - minWidth)
  })
}

export function PipelineFunnelVisual({ data, totalStageChanges = 0, title, subtitle, icon, onStageClick }: PipelineFunnelVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-50px" })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const totalLeads = data.reduce((sum, s) => sum + s.count, 0)
  const applications = data.find(s => s.stage === 'application')?.count || 0
  const enrolled = data.find(s => s.stage === 'enrolled')?.count || 0
  const conversionRate = totalLeads > 0 ? ((applications / totalLeads) * 100).toFixed(1) : '0'

  const stageWidths = getFunnelWidths(data)
  // Dynamic sizing: target ~350px total funnel height regardless of stage count
  const targetFunnelHeight = 350
  const gap = 3
  const segmentHeight = Math.max(32, Math.min(52, (targetFunnelHeight - (data.length - 1) * gap - 20) / data.length))
  const totalHeight = data.length * segmentHeight + (data.length - 1) * gap + 20
  const svgWidth = 700
  const maxHalfWidth = 310

  const getDropoff = useCallback((index: number) => {
    if (index >= data.length - 1) return null
    const current = data[index].count
    const next = data[index + 1].count
    if (current === 0) return null
    const dropPercent = Math.round(((current - next) / current) * 100)
    return dropPercent
  }, [data])

  return (
    <div ref={containerRef} className="relative">
      {/* Header */}
      <div className="relative z-10 mb-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20"
              initial={{ rotate: -10, scale: 0.8 }}
              animate={isInView ? { rotate: 0, scale: 1 } : {}}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              {icon || <Sparkles className="w-5 h-5 text-white" />}
            </motion.div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">
                {title || 'Sales Pipeline'}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">{subtitle || 'Lead progression funnel'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {conversionRate}%
              </span>
              <span className="text-[10px] text-emerald-500/70">conv.</span>
            </motion.div>
            {totalStageChanges > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20"
              >
                <Zap className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {totalStageChanges}
                </span>
                <span className="text-[10px] text-blue-500/70">moves</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Funnel */}
      <div className="relative z-10">
        <div className="relative mx-auto" style={{ maxWidth: `${svgWidth}px` }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${totalHeight}`}
            className="w-full h-auto"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {data.map((stage, index) => {
                const config = STAGE_CONFIG[stage.stage] || STAGE_CONFIG.new
                return (
                  <linearGradient
                    key={`g-${stage.stage}`}
                    id={`funnel-g-${index}`}
                    x1="0%" y1="0%" x2="100%" y2="0%"
                  >
                    <stop offset="0%" stopColor={config.gradient[0]} stopOpacity="0.15" />
                    <stop offset="20%" stopColor={config.gradient[0]} stopOpacity="0.9" />
                    <stop offset="50%" stopColor={config.gradient[1]} stopOpacity="1" />
                    <stop offset="80%" stopColor={config.gradient[0]} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={config.gradient[0]} stopOpacity="0.15" />
                  </linearGradient>
                )
              })}
              {/* Glow filters per stage */}
              {data.map((stage, index) => {
                const config = STAGE_CONFIG[stage.stage] || STAGE_CONFIG.new
                return (
                  <filter key={`glow-${index}`} id={`funnel-glow-${index}`} x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feFlood floodColor={config.glow} floodOpacity="0.6" result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="glow" />
                    <feMerge>
                      <feMergeNode in="glow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                )
              })}
              <filter id="f-shadow" x="-10%" y="-10%" width="120%" height="130%">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.06" />
              </filter>
            </defs>

            {data.map((stage, index) => {
              const centerX = svgWidth / 2
              const y = 10 + index * (segmentHeight + gap)
              const isHovered = hoveredIndex === index

              const topWidth = stageWidths[index]
              const bottomWidth = index < data.length - 1 ? stageWidths[index + 1] : stageWidths[index] * 0.85

              const topHalf = (topWidth / 100) * maxHalfWidth
              const bottomHalf = (bottomWidth / 100) * maxHalfWidth

              // Rounded trapezoid using path with curves
              const tl = { x: centerX - topHalf, y }
              const tr = { x: centerX + topHalf, y }
              const br = { x: centerX + bottomHalf, y: y + segmentHeight }
              const bl = { x: centerX - bottomHalf, y: y + segmentHeight }
              const r = 6 // corner radius

              const pathD = [
                `M ${tl.x + r},${tl.y}`,
                `L ${tr.x - r},${tr.y}`,
                `Q ${tr.x},${tr.y} ${tr.x},${tr.y + r}`,
                `L ${br.x},${br.y - r}`,
                `Q ${br.x},${br.y} ${br.x - r},${br.y}`,
                `L ${bl.x + r},${bl.y}`,
                `Q ${bl.x},${bl.y} ${bl.x},${bl.y - r}`,
                `L ${tl.x},${tl.y + r}`,
                `Q ${tl.x},${tl.y} ${tl.x + r},${tl.y}`,
                'Z'
              ].join(' ')

              return (
                <motion.g
                  key={stage.stage}
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={isInView ? {
                    opacity: 1,
                    scaleX: 1,
                    filter: isHovered ? `url(#funnel-glow-${index})` : 'url(#f-shadow)'
                  } : {}}
                  transition={{ delay: index * 0.06, duration: 0.5, ease: "easeOut" }}
                  style={{ transformOrigin: `${centerX}px ${y + segmentHeight / 2}px`, cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => onStageClick?.(stage.stage)}
                >
                  <path
                    d={pathD}
                    fill={`url(#funnel-g-${index})`}
                    style={{
                      transition: 'all 0.3s ease',
                    }}
                  />
                  {/* Inner highlight line at top */}
                  <line
                    x1={centerX - topHalf * 0.7}
                    y1={y + 3}
                    x2={centerX + topHalf * 0.7}
                    y2={y + 3}
                    stroke="white"
                    strokeOpacity="0.2"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                </motion.g>
              )
            })}

            {/* Connection lines and dropoff indicators between stages */}
            {data.map((_, index) => {
              if (index >= data.length - 1) return null
              const centerX = svgWidth / 2
              const y1 = 10 + index * (segmentHeight + gap) + segmentHeight
              const y2 = 10 + (index + 1) * (segmentHeight + gap)
              const midY = (y1 + y2) / 2

              // Right edge = bottom-right corner of current trapezoid
              const bottomWidth = stageWidths[index + 1]
              const edgeX = centerX + (bottomWidth / 100) * maxHalfWidth

              return (
                <motion.g
                  key={`conn-${index}`}
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ delay: index * 0.06 + 0.3, duration: 0.3 }}
                >
                  {/* Dashed center connector */}
                  <line
                    x1={centerX}
                    y1={y1 + 1}
                    x2={centerX}
                    y2={y2 - 1}
                    stroke="var(--border)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    strokeOpacity="0.5"
                  />
                  {/* Dropoff indicator at the right edge */}
                  {(() => {
                    const drop = getDropoff(index)
                    if (drop === null) return null
                    const isNegative = drop > 0
                    return (
                      <g>
                        {/* Connecting line from edge to label */}
                        <line
                          x1={edgeX + 2}
                          y1={midY}
                          x2={edgeX + 16}
                          y2={midY}
                          stroke={isNegative ? "var(--text-muted)" : "var(--text-muted)"}
                          strokeWidth="1"
                          strokeOpacity="0.3"
                        />
                        <text
                          x={edgeX + 20}
                          y={midY + 3.5}
                          fontSize="10"
                          fontWeight="500"
                          fill={isNegative ? "#EF4444" : "#10B981"}
                          textAnchor="start"
                          opacity="0.8"
                        >
                          {isNegative ? `−${drop}%` : `+${Math.abs(drop)}%`}
                        </text>
                      </g>
                    )
                  })()}
                </motion.g>
              )
            })}
          </svg>

          {/* Floating Labels */}
          <div className="absolute inset-0 pointer-events-none flex flex-col">
            {data.map((stage, index) => {
              const config = STAGE_CONFIG[stage.stage] || STAGE_CONFIG.new
              const Icon = config.icon
              const y = 10 + index * (segmentHeight + gap)
              const topPercent = ((y + segmentHeight / 2) / totalHeight) * 100
              const isHovered = hoveredIndex === index

              return (
                <motion.div
                  key={`lbl-${stage.stage}`}
                  className="absolute inset-x-0 flex justify-center"
                  style={{ top: `${topPercent}%`, transform: 'translateY(-50%)' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? {
                    opacity: 1,
                    y: 0,
                    scale: isHovered ? 1.08 : 1
                  } : {}}
                  transition={{
                    delay: index * 0.06 + 0.2,
                    duration: 0.4,
                    scale: { duration: 0.2 }
                  }}
                >
                  <div
                    className={`flex items-center gap-2 rounded-xl whitespace-nowrap transition-all duration-200 ${data.length > 7 ? 'px-2.5 py-1.5' : 'px-3.5 py-2'}`}
                    style={{
                      background: isHovered
                        ? 'rgba(255,255,255,0.98)'
                        : 'rgba(255,255,255,0.92)',
                      backdropFilter: 'blur(12px)',
                      boxShadow: isHovered
                        ? `0 8px 24px -4px ${config.glow}, 0 2px 8px rgba(0,0,0,0.08)`
                        : '0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
                      border: `1px solid ${isHovered ? config.color + '40' : 'rgba(0,0,0,0.06)'}`,
                    }}
                  >
                    <div
                      className={`${data.length > 7 ? 'w-5 h-5' : 'w-6 h-6'} rounded-lg flex items-center justify-center flex-shrink-0`}
                      style={{
                        background: `linear-gradient(135deg, ${config.gradient[0]}20, ${config.gradient[1]}30)`,
                        color: config.color,
                      }}
                    >
                      <Icon className={data.length > 7 ? "w-3 h-3" : "w-3.5 h-3.5"} />
                    </div>
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                      {stage.label}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold tabular-nums" style={{ color: config.color }}>
                        {stage.count}
                      </span>
                      <span className="text-[10px] font-medium text-gray-400">
                        {stage.percent}%
                      </span>
                    </div>
                    {(stage.movesIn > 0 || stage.movesOut > 0) && (
                      <div className="flex items-center gap-1 pl-1.5 ml-0.5 border-l border-gray-200/60">
                        {stage.movesIn > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] font-medium text-emerald-500">
                            <ArrowUpRight className="w-2.5 h-2.5" />
                            {stage.movesIn}
                          </span>
                        )}
                        {stage.movesOut > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] font-medium text-red-400">
                            <ArrowDownRight className="w-2.5 h-2.5" />
                            {stage.movesOut}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Dark mode overlay for labels */}
          <style>{`
            .dark [data-funnel-label] {
              background: rgba(24,24,27,0.92) !important;
              border-color: rgba(255,255,255,0.08) !important;
            }
            .dark [data-funnel-label]:hover {
              background: rgba(24,24,27,0.98) !important;
            }
          `}</style>
        </div>
      </div>

      {/* Animated chevron */}
      <div className="flex justify-center my-3">
        <motion.div
          animate={{ y: [0, 4, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          <ChevronDown className="w-5 h-5 text-[var(--text-muted)] opacity-40" />
        </motion.div>
      </div>

      {/* Bottom Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="relative z-10 grid grid-cols-4 gap-3"
      >
        {[
          {
            label: "Total Leads",
            value: totalLeads,
            gradient: "from-slate-500/8 to-slate-500/3",
            border: "border-slate-200/50 dark:border-slate-700/50",
            textColor: "text-[var(--text-primary)]",
            icon: <UserPlus className="w-3.5 h-3.5 text-slate-400" />,
          },
          {
            label: "Applications",
            value: applications,
            gradient: "from-rose-500/10 to-rose-500/3",
            border: "border-rose-200/50 dark:border-rose-800/30",
            textColor: "text-rose-600 dark:text-rose-400",
            icon: <FileText className="w-3.5 h-3.5 text-rose-400" />,
          },
          {
            label: "Enrolled",
            value: enrolled,
            gradient: "from-emerald-500/10 to-emerald-500/3",
            border: "border-emerald-200/50 dark:border-emerald-800/30",
            textColor: "text-emerald-600 dark:text-emerald-400",
            icon: <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />,
          },
          {
            label: "Conversion",
            value: null,
            displayValue: `${conversionRate}%`,
            gradient: "from-indigo-500/10 to-indigo-500/3",
            border: "border-indigo-200/50 dark:border-indigo-800/30",
            textColor: "text-indigo-600 dark:text-indigo-400",
            icon: <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />,
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8 + i * 0.08, duration: 0.4 }}
            className={`relative overflow-hidden text-center p-3 rounded-2xl bg-gradient-to-br ${stat.gradient} border ${stat.border} group hover:shadow-md transition-shadow duration-300`}
          >
            <div className="flex items-center justify-center gap-1.5 mb-1.5">
              {stat.icon}
              <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
            <p className={`text-xl font-bold ${stat.textColor} tabular-nums`}>
              {stat.value !== null && stat.value !== undefined ? (
                <AnimatedCounter value={stat.value} />
              ) : (
                (stat as { displayValue?: string }).displayValue
              )}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

// Horizontal converging funnel
export function PipelineFunnelHorizontal({ data }: PipelineFunnelVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true })

  const maxCount = data[0]?.count || 1
  const applications = data.find(s => s.stage === 'application')?.count || 0
  const conversionRate = maxCount > 0 ? ((applications / maxCount) * 100).toFixed(1) : '0'

  const svgWidth = 800
  const svgHeight = 200
  const padding = 20
  const usableWidth = svgWidth - padding * 2
  const colWidth = usableWidth / data.length
  const maxBarHeight = 140

  return (
    <div ref={containerRef} className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-[var(--text-primary)]">Sales Funnel Analytics</span>
        </div>
        <span className="text-sm px-3 py-1 rounded-full bg-[var(--success)]/10 text-[var(--success)] font-medium">
          {conversionRate}% conversion
        </span>
      </div>

      {/* Column headers with counts */}
      <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}>
        {data.map((stage, index) => {
          return (
            <motion.div
              key={stage.stage}
              className="px-2 border-l border-[var(--border)] first:border-l-0"
              initial={{ opacity: 0, y: -10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.06, duration: 0.3 }}
            >
              <p className="text-xs text-[var(--text-muted)] truncate">{stage.label}</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                {stage.count >= 1000
                  ? `${(stage.count / 1000).toFixed(1)}K`
                  : stage.count
                }
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">{stage.percent}%</p>
            </motion.div>
          )
        })}
      </div>

      {/* SVG converging funnel */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="h-funnel-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#818CF8" />
              <stop offset="40%" stopColor="#A78BFA" />
              <stop offset="70%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>

          <motion.path
            d={(() => {
              const baseline = svgHeight - 20
              const pts: Array<[number, number]> = []
              for (let i = 0; i <= data.length; i++) {
                const x = padding + i * colWidth
                const idx = Math.min(i, data.length - 1)
                const heightRatio = data[idx].count / maxCount
                const barH = Math.max(12, heightRatio * maxBarHeight)
                pts.push([x, baseline - barH])
              }
              for (let i = data.length; i >= 0; i--) {
                const x = padding + i * colWidth
                pts.push([x, baseline])
              }
              return `M ${pts.map(p => p.join(',')).join(' L ')} Z`
            })()}
            fill="url(#h-funnel-grad)"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 0.85 } : {}}
            transition={{ duration: 0.8 }}
          />

          {data.map((_, i) => {
            if (i === 0) return null
            const x = padding + i * colWidth
            return (
              <line
                key={`div-${i}`}
                x1={x} y1={0} x2={x} y2={svgHeight}
                stroke="white"
                strokeOpacity="0.4"
                strokeWidth="1"
              />
            )
          })}
        </svg>
      </div>
    </div>
  )
}
