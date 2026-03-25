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
  new:         { icon: UserPlus,       color: "#818CF8", gradient: ["#818CF8", "#6366F1"], glow: "rgba(99,102,241,0.25)" },
  contacted:   { icon: Phone,          color: "#8B5CF6", gradient: ["#8B5CF6", "#7C3AED"], glow: "rgba(139,92,246,0.25)" },
  appointment: { icon: Calendar,       color: "#A855F7", gradient: ["#A855F7", "#9333EA"], glow: "rgba(168,85,247,0.25)" },
  visit:       { icon: MapPin,         color: "#D946EF", gradient: ["#D946EF", "#C026D3"], glow: "rgba(217,70,239,0.25)" },
  test:        { icon: ClipboardCheck, color: "#EC4899", gradient: ["#EC4899", "#DB2777"], glow: "rgba(236,72,153,0.25)" },
  application: { icon: FileText,       color: "#F43F5E", gradient: ["#F43F5E", "#E11D48"], glow: "rgba(244,63,94,0.25)" },
  applicant:   { icon: GraduationCap,  color: "#F59E0B", gradient: ["#F59E0B", "#D97706"], glow: "rgba(245,158,11,0.25)" },
  enrolled:    { icon: GraduationCap,  color: "#10B981", gradient: ["#10B981", "#059669"], glow: "rgba(16,185,129,0.25)" },
  withdraw:    { icon: LogOut,         color: "#6B7280", gradient: ["#9CA3AF", "#6B7280"], glow: "rgba(107,114,128,0.25)" },
  lost:        { icon: LogOut,         color: "#EF4444", gradient: ["#EF4444", "#DC2626"], glow: "rgba(239,68,68,0.25)" },
  puc_document_submission:    { icon: FileText,       color: "#EC4899", gradient: ["#EC4899", "#DB2777"], glow: "rgba(236,72,153,0.25)" },
  puc_application_submission: { icon: ClipboardCheck, color: "#06B6D4", gradient: ["#06B6D4", "#0891B2"], glow: "rgba(6,182,212,0.25)" },
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
  const targetFunnelHeight = 420
  const gap = 3
  const segmentHeight = Math.max(36, Math.min(52, (targetFunnelHeight - (data.length - 1) * gap - 20) / data.length))
  const totalHeight = data.length * segmentHeight + (data.length - 1) * gap + 20
  const svgWidth = 700
  const maxHalfWidth = 280

  // Reserve space for left labels and right info
  const centerX = svgWidth / 2

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
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {conversionRate}%
              </span>
              <span className="text-xs text-emerald-500/70">conv.</span>
            </motion.div>
            {totalStageChanges > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20"
              >
                <Zap className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {totalStageChanges}
                </span>
                <span className="text-xs text-blue-500/70">moves</span>
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
                    <stop offset="0%" stopColor={config.gradient[0]} stopOpacity="0.85" />
                    <stop offset="50%" stopColor={config.gradient[1]} stopOpacity="1" />
                    <stop offset="100%" stopColor={config.gradient[0]} stopOpacity="0.85" />
                  </linearGradient>
                )
              })}
              <filter id="f-shadow" x="-10%" y="-10%" width="120%" height="130%">
                <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#000" floodOpacity="0.08" />
              </filter>
              {data.map((stage, index) => {
                const config = STAGE_CONFIG[stage.stage] || STAGE_CONFIG.new
                return (
                  <filter key={`glow-${index}`} id={`funnel-glow-${index}`} x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feFlood floodColor={config.glow} floodOpacity="0.5" result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="glow" />
                    <feMerge>
                      <feMergeNode in="glow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                )
              })}
            </defs>

            {data.map((stage, index) => {
              const config = STAGE_CONFIG[stage.stage] || STAGE_CONFIG.new
              const Icon = config.icon
              const y = 10 + index * (segmentHeight + gap)
              const isHovered = hoveredIndex === index

              const topWidth = stageWidths[index]
              const bottomWidth = index < data.length - 1 ? stageWidths[index + 1] : stageWidths[index] * 0.85

              const topHalf = (topWidth / 100) * maxHalfWidth
              const bottomHalf = (bottomWidth / 100) * maxHalfWidth

              const tl = { x: centerX - topHalf, y }
              const tr = { x: centerX + topHalf, y }
              const br = { x: centerX + bottomHalf, y: y + segmentHeight }
              const bl = { x: centerX - bottomHalf, y: y + segmentHeight }
              const r = 5

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

              const hasMovesData = stage.movesIn > 0 || stage.movesOut > 0

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
                    style={{ transition: 'all 0.3s ease' }}
                  />
                  {/* Subtle top highlight */}
                  <line
                    x1={centerX - topHalf * 0.6}
                    y1={y + 2}
                    x2={centerX + topHalf * 0.6}
                    y2={y + 2}
                    stroke="white"
                    strokeOpacity="0.15"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />

                  {/* Clean inline label: icon + label + count only */}
                  <foreignObject
                    x={centerX - topHalf}
                    y={y}
                    width={topHalf * 2}
                    height={segmentHeight}
                    style={{ pointerEvents: 'none' }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '0 16px',
                      }}
                    >
                      <Icon className="text-white/80 shrink-0 w-3.5 h-3.5" />
                      <span style={{
                        fontSize: data.length > 7 ? 12 : 13,
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.9)',
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.02em',
                      }}>
                        {stage.label}
                      </span>
                      <span style={{
                        fontSize: data.length > 7 ? 15 : 17,
                        fontWeight: 700,
                        color: 'white',
                        whiteSpace: 'nowrap',
                        marginLeft: '2px',
                      }}>
                        {stage.count}
                      </span>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.55)',
                        whiteSpace: 'nowrap',
                      }}>
                        {stage.percent}%
                      </span>
                    </div>
                  </foreignObject>

                  {/* Moves data shown on hover as a tooltip-like element to the left */}
                  {isHovered && hasMovesData && (
                    <foreignObject
                      x={centerX - topHalf - 120}
                      y={y + 2}
                      width={110}
                      height={segmentHeight - 4}
                      style={{ pointerEvents: 'none' }}
                    >
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '6px',
                      }}>
                        {stage.movesIn > 0 && (
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                          }}>
                            <ArrowUpRight style={{ width: 12, height: 12, color: '#10B981' }} />
                            {stage.movesIn}
                          </span>
                        )}
                        {stage.movesOut > 0 && (
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                          }}>
                            <ArrowDownRight style={{ width: 12, height: 12, color: '#EF4444' }} />
                            {stage.movesOut}
                          </span>
                        )}
                      </div>
                    </foreignObject>
                  )}
                </motion.g>
              )
            })}

            {/* Drop-off indicators between stages */}
            {data.map((_, index) => {
              if (index >= data.length - 1) return null
              const y1 = 10 + index * (segmentHeight + gap) + segmentHeight
              const y2 = 10 + (index + 1) * (segmentHeight + gap)
              const midY = (y1 + y2) / 2

              const bottomWidth = stageWidths[index + 1]
              const edgeX = centerX + (bottomWidth / 100) * maxHalfWidth

              const drop = getDropoff(index)

              return (
                <motion.g
                  key={`conn-${index}`}
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ delay: index * 0.06 + 0.3, duration: 0.3 }}
                >
                  {drop !== null && drop !== 0 && (
                    <text
                      x={edgeX + 14}
                      y={midY + 4}
                      fontSize="11"
                      fontWeight="600"
                      fill={drop > 0 ? "#EF4444" : "#10B981"}
                      textAnchor="start"
                      opacity="0.7"
                    >
                      {drop > 0 ? `−${drop}%` : `+${Math.abs(drop)}%`}
                    </text>
                  )}
                </motion.g>
              )
            })}
          </svg>
        </div>
      </div>

      {/* Bottom Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="relative z-10 grid grid-cols-4 gap-3 mt-4"
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
            <div className="flex items-center justify-center gap-1.5 mb-2">
              {stat.icon}
              <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
            <p className={`text-2xl font-bold ${stat.textColor} tabular-nums`}>
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
