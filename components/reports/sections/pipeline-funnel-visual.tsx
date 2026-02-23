"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import {
  Sparkles,
  UserPlus,
  Phone,
  Calendar,
  MapPin,
  FileText,
  ClipboardCheck,
  GraduationCap,
  ArrowDown,
  TrendingUp,
  LogOut
} from "lucide-react"

interface PipelineStageData {
  stage: string
  label: string
  count: number
  percent: number
}

interface PipelineFunnelVisualProps {
  data: PipelineStageData[]
}

const STAGE_CONFIG: Record<string, {
  icon: React.ComponentType<{ className?: string }>
  color: string
  gradient: [string, string]
}> = {
  new:         { icon: UserPlus,       color: "#6B9BF7", gradient: ["#7CB3F7", "#5B8DEF"] },
  contacted:   { icon: Phone,          color: "#8B8CF8", gradient: ["#9B9DF8", "#7B7CF0"] },
  appointment: { icon: Calendar,       color: "#A78BFA", gradient: ["#B79BFA", "#977BF0"] },
  visit:       { icon: MapPin,         color: "#C084FC", gradient: ["#D094FC", "#B074EC"] },
  test:        { icon: ClipboardCheck, color: "#E879A8", gradient: ["#F089B8", "#E06998"] },
  application: { icon: FileText,       color: "#F47088", gradient: ["#F88098", "#EC6078"] },
  applicant:   { icon: GraduationCap,  color: "#6BA3E8", gradient: ["#7BB3F8", "#5B93D8"] },
  enrolled:    { icon: GraduationCap,  color: "#5B93D8", gradient: ["#6BA3E8", "#4B83C8"] },
  withdraw:    { icon: LogOut,         color: "#5B8BD0", gradient: ["#6B9BE0", "#4B7BC0"] },
  lost:        { icon: LogOut,         color: "#EF4444", gradient: ["#F05454", "#DF3434"] },
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
 * Builds an hourglass/diamond funnel shape:
 * - Wide at top, narrowing to the middle, then widening again at the bottom.
 * - Each stage gets a width that follows a curve: widest at edges, narrowest at center.
 */
function getStageWidths(count: number): number[] {
  if (count <= 1) return [100]
  const widths: number[] = []
  const midpoint = (count - 1) / 2
  for (let i = 0; i < count; i++) {
    // Distance from the midpoint, normalized 0..1
    const distFromMid = Math.abs(i - midpoint) / midpoint
    // Width ranges from 35% (at narrowest) to 100% (at widest)
    const width = 35 + distFromMid * 65
    widths.push(width)
  }
  return widths
}

export function PipelineFunnelVisual({ data }: PipelineFunnelVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-50px" })

  const totalLeads = data[0]?.count || 0
  const applications = data.find(s => s.stage === 'application')?.count || 0
  const conversionRate = totalLeads > 0 ? ((applications / totalLeads) * 100).toFixed(1) : '0'

  const stageWidths = getStageWidths(data.length)
  const segmentHeight = 56
  const gap = 2
  const totalHeight = data.length * segmentHeight + (data.length - 1) * gap + 20
  const svgWidth = 700
  const maxHalfWidth = 320

  return (
    <div ref={containerRef} className="relative">
      {/* Header */}
      <div className="relative z-10 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--text-primary)] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[var(--bg-surface)]" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">
                Sales Pipeline
              </h3>
              <p className="text-sm text-[var(--text-muted)]">Lead progression funnel</p>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--success)]/10 border border-[var(--success)]/20"
          >
            <TrendingUp className="w-4 h-4 text-[var(--success)]" />
            <span className="text-sm font-medium text-[var(--success)]">
              {conversionRate}% conversion
            </span>
          </motion.div>
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
                <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="#000" floodOpacity="0.08" />
              </filter>
            </defs>

            {data.map((stage, index) => {
              const centerX = svgWidth / 2
              const y = 10 + index * (segmentHeight + gap)

              const topWidth = stageWidths[index]
              const bottomWidth = index < data.length - 1 ? stageWidths[index + 1] : stageWidths[index]

              const topHalf = (topWidth / 100) * maxHalfWidth
              const bottomHalf = (bottomWidth / 100) * maxHalfWidth

              const points = [
                `${centerX - topHalf},${y}`,
                `${centerX + topHalf},${y}`,
                `${centerX + bottomHalf},${y + segmentHeight}`,
                `${centerX - bottomHalf},${y + segmentHeight}`,
              ].join(' ')

              return (
                <motion.g
                  key={stage.stage}
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
                  transition={{ delay: index * 0.07, duration: 0.5, ease: "easeOut" }}
                  style={{ transformOrigin: `${centerX}px ${y + segmentHeight / 2}px` }}
                >
                  <polygon
                    points={points}
                    fill={`url(#funnel-g-${index})`}
                    filter="url(#f-shadow)"
                  />
                  {/* Horizontal separator line */}
                  <line
                    x1={centerX - topHalf + 4}
                    y1={y + 1}
                    x2={centerX + topHalf - 4}
                    y2={y + 1}
                    stroke="white"
                    strokeOpacity="0.25"
                    strokeWidth="1"
                  />
                </motion.g>
              )
            })}
          </svg>

          {/* Floating Labels */}
          <div className="absolute inset-0 pointer-events-none">
            {data.map((stage, index) => {
              const config = STAGE_CONFIG[stage.stage] || STAGE_CONFIG.new
              const Icon = config.icon
              const y = 10 + index * (segmentHeight + gap)
              const topPercent = ((y + segmentHeight / 2) / totalHeight) * 100

              return (
                <motion.div
                  key={`lbl-${stage.stage}`}
                  className="absolute left-1/2"
                  style={{ top: `${topPercent}%`, transform: 'translate(-50%, -50%)' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: index * 0.07 + 0.25, duration: 0.4 }}
                >
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-md whitespace-nowrap">
                    <span style={{ color: config.color }}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                      {stage.label}
                    </span>
                    <span className="text-xs font-bold" style={{ color: config.color }}>
                      {stage.count}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      ({stage.percent}%)
                    </span>
                  </div>
                  {/* Arrow between labels */}
                  {index < data.length - 1 && index % 2 === 0 && (
                    <div className="flex justify-center mt-0.5">
                      <ArrowDown className="w-3.5 h-3.5 text-gray-300 dark:text-zinc-600" />
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Down arrow before stats */}
      <div className="flex justify-center my-4">
        <ArrowDown className="w-5 h-5 text-gray-300 dark:text-zinc-600" />
      </div>

      {/* Bottom Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="relative z-10 grid grid-cols-3 gap-4"
      >
        <div className="text-center p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)]">
          <p className="text-3xl font-bold text-[var(--text-primary)]">
            <AnimatedCounter value={totalLeads} />
          </p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Total Leads</p>
        </div>
        <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            <AnimatedCounter value={applications} />
          </p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Applications</p>
        </div>
        <div className="text-center p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)]">
          <p className="text-3xl font-bold text-[var(--text-primary)]">
            {conversionRate}%
          </p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Conversion</p>
        </div>
      </motion.div>
    </div>
  )
}

// Horizontal converging funnel (inspired by the second reference)
export function PipelineFunnelHorizontal({ data }: PipelineFunnelVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true })

  const maxCount = data[0]?.count || 1
  const applications = data.find(s => s.stage === 'application')?.count || 0
  const conversionRate = maxCount > 0 ? ((applications / maxCount) * 100).toFixed(1) : '0'

  // Build converging funnel path heights
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
          <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
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
          const config = STAGE_CONFIG[stage.stage] || STAGE_CONFIG.new
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
              <stop offset="0%" stopColor="#6B9BF7" />
              <stop offset="60%" stopColor="#8BB8F8" />
              <stop offset="100%" stopColor="#F5A623" />
            </linearGradient>
          </defs>

          {/* Build the converging shape */}
          <motion.path
            d={(() => {
              const baseline = svgHeight - 20
              const topPoints: string[] = []
              const bottomPoints: string[] = []

              data.forEach((stage, i) => {
                const x = padding + i * colWidth
                const nextX = padding + (i + 1) * colWidth
                const heightRatio = stage.count / maxCount
                const barH = Math.max(12, heightRatio * maxBarHeight)
                const centerY = baseline
                const topY = centerY - barH
                // Top edge at start and end of column
                topPoints.push(`${x},${topY}`)
                topPoints.push(`${nextX},${i < data.length - 1 ? centerY - Math.max(12, (data[i + 1].count / maxCount) * maxBarHeight) : topY}`)
                // Bottom is flat
                bottomPoints.push(`${nextX},${centerY}`)
                bottomPoints.push(`${x},${centerY}`)
              })

              // Simplified: create smooth converging shape
              const pts: Array<[number, number]> = []
              // Top edge
              for (let i = 0; i <= data.length; i++) {
                const x = padding + i * colWidth
                const idx = Math.min(i, data.length - 1)
                const heightRatio = data[idx].count / maxCount
                const barH = Math.max(12, heightRatio * maxBarHeight)
                pts.push([x, baseline - barH])
              }
              // Bottom edge (right to left)
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

          {/* Vertical divider lines */}
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
