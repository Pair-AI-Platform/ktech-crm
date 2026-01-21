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
  CreditCard,
  GraduationCap,
  ArrowDown,
  TrendingUp
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
  glowColor: string
}> = {
  new: { icon: UserPlus, color: "#60A5FA", glowColor: "rgba(96, 165, 250, 0.4)" },
  contacted: { icon: Phone, color: "#818CF8", glowColor: "rgba(129, 140, 248, 0.4)" },
  appointment: { icon: Calendar, color: "#A78BFA", glowColor: "rgba(167, 139, 250, 0.4)" },
  visit: { icon: MapPin, color: "#C084FC", glowColor: "rgba(192, 132, 252, 0.4)" },
  test: { icon: ClipboardCheck, color: "#F472B6", glowColor: "rgba(244, 114, 182, 0.4)" },
  application: { icon: FileText, color: "#FB7185", glowColor: "rgba(251, 113, 133, 0.4)" },
  lost: { icon: GraduationCap, color: "#EF4444", glowColor: "rgba(239, 68, 68, 0.4)" },
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
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setCount(Math.floor(eased * value))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration, isInView])

  return <span ref={ref}>{count.toLocaleString()}</span>
}

export function PipelineFunnelVisual({ data }: PipelineFunnelVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-50px" })

  const maxCount = data[0]?.count || 1
  const totalLeads = data.reduce((sum, s) => sum + s.count, 0)
  const applications = data.find(s => s.stage === 'application')?.count || 0
  const conversionRate = totalLeads > 0 ? ((applications / data[0]?.count) * 100).toFixed(1) : '0'

  return (
    <div ref={containerRef} className="relative">
      {/* Background Glow Effect */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-[var(--primary)]/10 via-transparent to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-gradient-radial from-emerald-500/15 via-transparent to-transparent blur-3xl" />
      </div>

      {/* Header Stats */}
      <div className="relative z-10 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-purple-600 blur-lg opacity-50" />
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-purple-600 flex items-center justify-center shadow-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                Sales Pipeline
              </h3>
              <p className="text-sm text-[var(--text-muted)]">Lead progression funnel</p>
            </div>
          </div>

          {/* Conversion Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20"
          >
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              {conversionRate}% conversion
            </span>
          </motion.div>
        </div>
      </div>

      {/* The Funnel Visualization */}
      <div className="relative z-10">
        {/* SVG Funnel Shape */}
        <div className="relative mx-auto" style={{ maxWidth: '720px' }}>
          <svg
            viewBox="0 0 720 500"
            className="w-full h-auto"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Gradient definitions for each stage */}
              {data.map((stage, index) => {
                const config = STAGE_CONFIG[stage.stage] || STAGE_CONFIG.new
                return (
                  <linearGradient
                    key={`gradient-${stage.stage}`}
                    id={`funnel-gradient-${index}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor={config.color} stopOpacity="0.9" />
                    <stop offset="50%" stopColor={config.color} stopOpacity="1" />
                    <stop offset="100%" stopColor={config.color} stopOpacity="0.9" />
                  </linearGradient>
                )
              })}

              {/* Glow filter */}
              <filter id="funnel-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              {/* Drop shadow */}
              <filter id="funnel-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.15" />
              </filter>
            </defs>

            {/* Funnel segments */}
            {data.map((stage, index) => {
              const segmentHeight = 50
              const y = index * segmentHeight + 10
              const widthPercent = Math.max(20, (stage.count / maxCount) * 100)
              const topWidth = index === 0 ? 100 : Math.max(25, (data[index - 1]?.count / maxCount) * 100)
              const bottomWidth = widthPercent

              // Calculate trapezoid points
              const centerX = 360
              const topHalf = (topWidth / 100) * 320
              const bottomHalf = (bottomWidth / 100) * 320

              const points = `
                ${centerX - topHalf},${y}
                ${centerX + topHalf},${y}
                ${centerX + bottomHalf},${y + segmentHeight - 2}
                ${centerX - bottomHalf},${y + segmentHeight - 2}
              `

              return (
                <motion.g
                  key={stage.stage}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                >
                  {/* Glow layer */}
                  <polygon
                    points={points}
                    fill={`url(#funnel-gradient-${index})`}
                    opacity="0.3"
                    filter="url(#funnel-glow)"
                  />

                  {/* Main segment */}
                  <polygon
                    points={points}
                    fill={`url(#funnel-gradient-${index})`}
                    filter="url(#funnel-shadow)"
                    className="transition-all duration-300"
                    style={{ cursor: 'pointer' }}
                  />

                  {/* Inner shine */}
                  <polygon
                    points={`
                      ${centerX - topHalf + 8},${y + 3}
                      ${centerX + topHalf - 8},${y + 3}
                      ${centerX + bottomHalf - 8},${y + segmentHeight - 5}
                      ${centerX - bottomHalf + 8},${y + segmentHeight - 5}
                    `}
                    fill="white"
                    opacity="0.1"
                  />
                </motion.g>
              )
            })}
          </svg>

          {/* Stage Labels - Positioned absolutely over the SVG */}
          <div className="absolute inset-0 pointer-events-none">
            {data.map((stage, index) => {
              const config = STAGE_CONFIG[stage.stage] || STAGE_CONFIG.new
              const Icon = config.icon
              const topPercent = ((index * 50 + 10 + 25) / 500) * 100 // Center of each segment

              return (
                <motion.div
                  key={`label-${stage.stage}`}
                  className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center gap-3 pointer-events-auto"
                  style={{ top: `${topPercent}%`, transform: 'translate(-50%, -50%)' }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: index * 0.08 + 0.2, duration: 0.4 }}
                >
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)]/90 backdrop-blur-sm border border-[var(--border)] shadow-lg">
                    <span style={{ color: config.color }}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {stage.label}
                    </span>
                    <span className="text-sm font-bold" style={{ color: config.color }}>
                      {stage.count}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      ({stage.percent}%)
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Flow arrows animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 -translate-x-1/2"
              initial={{ top: '0%', opacity: 0 }}
              animate={isInView ? {
                top: ['0%', '100%'],
                opacity: [0, 0.6, 0.6, 0],
              } : {}}
              transition={{
                duration: 3,
                delay: i * 0.6,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <ArrowDown className="w-5 h-5 text-[var(--primary)]" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="relative z-10 mt-8 grid grid-cols-3 gap-4"
      >
        <div className="text-center p-4 rounded-2xl bg-[var(--bg-depth-2)] border border-[var(--border)]">
          <p className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            <AnimatedCounter value={data[0]?.count || 0} />
          </p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Total Leads</p>
        </div>
        <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400" style={{ fontFamily: 'var(--font-display)' }}>
            <AnimatedCounter value={applications} />
          </p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Applications</p>
        </div>
        <div className="text-center p-4 rounded-2xl bg-[var(--bg-depth-2)] border border-[var(--border)]">
          <p className="text-3xl font-bold text-[var(--primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            {conversionRate}%
          </p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Conversion</p>
        </div>
      </motion.div>
    </div>
  )
}

// Alternative Horizontal Funnel for smaller spaces
export function PipelineFunnelHorizontal({ data }: PipelineFunnelVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true })

  const maxCount = data[0]?.count || 1
  const applications = data.find(s => s.stage === 'application')?.count || 0
  const conversionRate = maxCount > 0 ? ((applications / maxCount) * 100).toFixed(1) : '0'

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-[var(--text-primary)]">Pipeline Flow</span>
        </div>
        <span className="text-sm px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
          {conversionRate}% conversion
        </span>
      </div>

      {/* Horizontal funnel bars */}
      <div className="space-y-2">
        {data.map((stage, index) => {
          const config = STAGE_CONFIG[stage.stage] || STAGE_CONFIG.new
          const Icon = config.icon
          const widthPercent = Math.max(15, (stage.count / maxCount) * 100)

          return (
            <motion.div
              key={stage.stage}
              className="relative"
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${config.color}20` }}
                >
                  <span style={{ color: config.color }}>
                    <Icon className="w-4 h-4" />
                  </span>
                </div>

                {/* Bar container */}
                <div className="flex-1 relative">
                  {/* Background track */}
                  <div className="h-10 rounded-lg bg-[var(--bg-depth-3)] overflow-hidden">
                    {/* Filled bar */}
                    <motion.div
                      className="h-full rounded-lg relative overflow-hidden"
                      initial={{ width: 0 }}
                      animate={isInView ? { width: `${widthPercent}%` } : {}}
                      transition={{ delay: index * 0.05 + 0.2, duration: 0.6, ease: "easeOut" }}
                      style={{ backgroundColor: config.color }}
                    >
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0" />

                      {/* Label inside bar */}
                      <div className="absolute inset-0 flex items-center justify-between px-3">
                        <span className="text-sm font-medium text-white truncate">
                          {stage.label}
                        </span>
                        <span className="text-sm font-bold text-white">
                          {stage.count}
                        </span>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Percentage */}
                <span className="text-sm font-medium text-[var(--text-muted)] w-12 text-right">
                  {stage.percent}%
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
