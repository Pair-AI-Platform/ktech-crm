"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface PipelineStage {
  key: string
  label: string
  count: number
  color: string
}

interface PipelineBlockProps {
  stages: PipelineStage[]
  total: number
  conversionRate?: number
  loading?: boolean
  showLabels?: boolean
  showCounts?: boolean
  onStageClick?: (stageKey: string) => void
}

export function PipelineBlock({
  stages,
  total,
  conversionRate,
  loading = false,
  onStageClick,
}: PipelineBlockProps) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-5">
        <div className="flex gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-1 space-y-2">
              <div className="h-5 bg-[var(--bg-sunken)] rounded w-8 mx-auto" />
              <div className="h-3 bg-[var(--bg-sunken)] rounded w-12 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Stages */}
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${stages.length}, 1fr)` }}
      >
        {stages.map((stage, idx) => (
          <motion.button
            key={stage.key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: idx * 0.03 }}
            className={cn(
              "group flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-colors",
              "hover:bg-[var(--bg-hover)] cursor-pointer"
            )}
            onClick={() => onStageClick?.(stage.key)}
          >
            <span className="text-[14px] font-semibold tabular-nums text-[var(--text-primary)]">
              {stage.count}
            </span>
            <span className="text-[9px] tracking-wide uppercase text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
              {stage.label}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Thin proportional bar */}
      <div className="h-[3px] rounded-full bg-[var(--bg-sunken)] overflow-hidden flex">
        {stages.map((stage, idx) => {
          const width = total > 0 ? (stage.count / total) * 100 : 0
          if (width === 0) return null
          return (
            <motion.div
              key={stage.key}
              initial={{ width: 0 }}
              animate={{ width: `${width}%` }}
              transition={{ duration: 0.5, delay: 0.1 + idx * 0.04, ease: "easeOut" }}
              className="h-full"
              style={{ backgroundColor: stage.color, opacity: 0.6 }}
            />
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[var(--text-muted)]">
          <span className="tabular-nums font-medium text-[var(--text-secondary)]">{total}</span> leads
        </span>
        {conversionRate !== undefined && (
          <span className="text-[11px] text-[var(--text-muted)]">
            <span className="tabular-nums font-medium text-[var(--text-secondary)]">{conversionRate}%</span> enrolled
          </span>
        )}
      </div>
    </div>
  )
}

// Mini version for sidebar/compact display
export function PipelineMini({
  stages,
  total,
  loading,
}: {
  stages: PipelineStage[]
  total: number
  loading?: boolean
}) {
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-1.5 bg-[var(--bg-sunken)] rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="h-1.5 bg-[var(--bg-sunken)] rounded-full overflow-hidden flex">
        {stages.map((stage, idx) => {
          const width = total > 0 ? (stage.count / total) * 100 : 0
          if (width === 0) return null

          return (
            <motion.div
              key={stage.key}
              initial={{ width: 0 }}
              animate={{ width: `${width}%` }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="h-full"
              style={{ backgroundColor: stage.color }}
            />
          )
        })}
      </div>
      <div className="flex justify-between text-xs text-[var(--text-tertiary)]">
        <span>New: {stages.find((s) => s.key === "new")?.count || 0}</span>
        <span>Enrolled: {stages.find((s) => s.key === "enrolled")?.count || 0}</span>
      </div>
    </div>
  )
}

// Vertical pipeline (for showing flow)
export function PipelineVertical({
  stages,
  total,
  loading,
  onStageClick,
}: PipelineBlockProps) {
  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[var(--bg-sunken)]" />
            <div className="flex-1 h-3 bg-[var(--bg-sunken)] rounded" />
            <div className="w-6 h-3 bg-[var(--bg-sunken)] rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {stages.map((stage, idx) => {
        const percentage = total > 0 ? Math.round((stage.count / total) * 100) : 0

        return (
          <motion.div
            key={stage.key}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.04 }}
            className={cn(
              "flex items-center gap-3 px-2 py-1.5 rounded-md",
              "hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
            )}
            onClick={() => onStageClick?.(stage.key)}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: stage.color }}
            />
            <span className="flex-1 text-[13px] text-[var(--text-secondary)]">
              {stage.label}
            </span>
            <span className="text-[13px] font-medium text-[var(--text-primary)] tabular-nums">
              {stage.count}
            </span>
            <div className="w-12 h-1 bg-[var(--bg-sunken)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.4, delay: 0.15 + idx * 0.04 }}
                className="h-full rounded-full"
                style={{ backgroundColor: stage.color }}
              />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
