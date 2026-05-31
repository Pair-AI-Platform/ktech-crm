"use client"

import { motion, useInView, AnimatePresence } from "framer-motion"
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
  LogOut,
  ArrowUpRight,
  ArrowDownRight,
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
  hoverColor: string
  glow: string
}> = {
  new:         { icon: UserPlus,       color: "#2563EB", hoverColor: "#1D4ED8", glow: "rgba(37,99,235,0.22)" },
  contacted:   { icon: Phone,          color: "#0EA5E9", hoverColor: "#0284C7", glow: "rgba(14,165,233,0.22)" },
  appointment: { icon: Calendar,       color: "#14B8A6", hoverColor: "#0D9488", glow: "rgba(20,184,166,0.22)" },
  visit:       { icon: MapPin,         color: "#2DD4BF", hoverColor: "#14B8A6", glow: "rgba(45,212,191,0.22)" },
  test:        { icon: ClipboardCheck, color: "#F43F5E", hoverColor: "#E11D48", glow: "rgba(244,63,94,0.22)" },
  application: { icon: FileText,       color: "#EF4444", hoverColor: "#DC2626", glow: "rgba(239,68,68,0.22)" },
  applicant:   { icon: GraduationCap,  color: "#F59E0B", hoverColor: "#D97706", glow: "rgba(245,158,11,0.22)" },
  enrolled:    { icon: GraduationCap,  color: "#10B981", hoverColor: "#059669", glow: "rgba(16,185,129,0.22)" },
  withdraw:    { icon: LogOut,         color: "#6B7280", hoverColor: "#4B5563", glow: "rgba(107,114,128,0.22)" },
  lost:        { icon: LogOut,         color: "#EF4444", hoverColor: "#DC2626", glow: "rgba(239,68,68,0.22)" },
  puc_document_submission:    { icon: FileText,       color: "#22C55E", hoverColor: "#16A34A", glow: "rgba(34,197,94,0.22)" },
  puc_application_submission: { icon: ClipboardCheck, color: "#06B6D4", hoverColor: "#0891B2", glow: "rgba(6,182,212,0.22)" },
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

function formatPercent(value: number) {
  if (value <= 0) return "0%"
  if (value < 0.1) return "<0.1%"
  if (value < 10) return `${value.toFixed(1)}%`
  return `${Math.round(value)}%`
}

export function PipelineFunnelVisual({ data, title, subtitle, icon, onStageClick }: PipelineFunnelVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-50px" })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const totalLeads = data.reduce((sum, s) => sum + s.count, 0)
  const fileStageSet = new Set(['application', 'puc_document_submission', 'puc_application_submission', 'applicant', 'enrolled'])
  const fileStageLeads = data.reduce((sum, s) => sum + (fileStageSet.has(s.stage) ? s.count : 0), 0)
  const enrolled = data.find(s => s.stage === 'enrolled')?.count || 0
  const hoveredStage = hoveredIndex !== null ? data[hoveredIndex] : null

  const stageWidths = getFunnelWidths(data)
  const targetFunnelHeight = 340
  const gap = 3
  const segmentHeight = Math.max(28, Math.min(48, (targetFunnelHeight - (data.length - 1) * gap - 20) / data.length))
  const totalHeight = data.length * segmentHeight + (data.length - 1) * gap + 20
  const svgWidth = 700
  const maxHalfWidth = 260

  // Reserve space for left labels and right info
  const centerX = svgWidth / 2

  return (
    <div ref={containerRef} className="relative">
      {/* Header */}
      <div className="relative z-10 mb-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-11 h-11 rounded-xl bg-[var(--primary)] flex items-center justify-center shadow-lg shadow-[var(--primary)]/20 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-xl"
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
        </div>
      </div>

      {/* Funnel */}
      <div className="relative z-10 overflow-hidden">
        <div className="relative mx-auto" style={{ maxWidth: `${svgWidth}px` }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${totalHeight}`}
            className="w-full h-auto"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
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
                  whileHover={{
                    scale: 1.025,
                    y: -2,
                    transition: { type: "spring", stiffness: 360, damping: 24 },
                  }}
                  transition={{ delay: index * 0.06, duration: 0.5, ease: "easeOut" }}
                  style={{ transformOrigin: `${centerX}px ${y + segmentHeight / 2}px`, cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => onStageClick?.(stage.stage)}
                >
                  <path
                    d={pathD}
                    fill={isHovered ? config.hoverColor : config.color}
                    stroke={isHovered ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.28)'}
                    strokeWidth={isHovered ? 1.5 : 0.75}
                    style={{ transition: 'fill 0.2s ease, stroke 0.2s ease, stroke-width 0.2s ease' }}
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
                        {formatPercent(stage.percent)}
                      </span>
                    </div>
                  </foreignObject>

                  {/* Lightweight movement hints on hover */}
                  {isHovered && hasMovesData && (
                    <foreignObject
                      x={Math.min(centerX + topHalf + 10, svgWidth - 120)}
                      y={y + 2}
                      width={120}
                      height={segmentHeight - 4}
                      style={{ pointerEvents: 'none' }}
                    >
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
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
          </svg>

          <AnimatePresence>
            {hoveredStage && hoveredIndex !== null && (
              <motion.div
                key={hoveredStage.stage}
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.14 }}
                className="pointer-events-none absolute right-0 w-52 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]/95 p-3 text-left shadow-xl backdrop-blur"
                style={{
                  top: Math.min(
                    Math.max(4, 10 + hoveredIndex * (segmentHeight + gap) - 8),
                    Math.max(4, totalHeight - 142)
                  ),
                }}
              >
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {hoveredStage.label}
                </p>
                <div className="mt-2 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[var(--text-muted)]">Current leads</span>
                    <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                      {hoveredStage.count.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[var(--text-muted)]">Share of funnel</span>
                    <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                      {formatPercent(hoveredStage.percent)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[var(--text-muted)]">Total real leads</span>
                    <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                      {totalLeads.toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="rounded-lg bg-[var(--bg-sunken)] px-2 py-1.5">
                      <span className="text-[var(--text-muted)]">Moved in</span>
                      <p className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {hoveredStage.movesIn.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[var(--bg-sunken)] px-2 py-1.5">
                      <span className="text-[var(--text-muted)]">Moved out</span>
                      <p className="font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                        {hoveredStage.movesOut.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                {onStageClick && (
                  <p className="mt-2 border-t border-[var(--border)] pt-2 text-[11px] font-medium text-[var(--text-muted)]">
                    Click the stage to open matching leads.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="relative z-10 grid grid-cols-3 gap-2 mt-4"
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
            label: "Files",
            value: fileStageLeads,
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
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8 + i * 0.08, duration: 0.4 }}
            className={`relative overflow-hidden text-center px-2 py-3 rounded-2xl bg-gradient-to-br ${stat.gradient} border ${stat.border} group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--border-default)]`}
          >
            <div className="flex items-center justify-center gap-1 mb-2">
              {stat.icon}
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider truncate">
                {stat.label}
              </p>
            </div>
            <p className={`text-xl font-bold ${stat.textColor} tabular-nums`}>
              <AnimatedCounter value={stat.value} />
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
          <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center shadow-sm shadow-[var(--primary)]/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-[var(--text-primary)]">Sales Funnel Analytics</span>
        </div>
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
              <p className="text-[10px] text-[var(--text-muted)]">{formatPercent(stage.percent)}</p>
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
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="40%" stopColor="#0EA5E9" />
              <stop offset="70%" stopColor="#14B8A6" />
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
