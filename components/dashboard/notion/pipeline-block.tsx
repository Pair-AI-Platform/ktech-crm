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
  showLabels = true,
  showCounts = true,
  onStageClick,
}: PipelineBlockProps) {
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-6 bg-[var(--bg-sunken)] rounded-full" />
        <div className="flex justify-between">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 w-12 bg-[var(--bg-sunken)] rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      <div className="relative h-6 bg-[var(--bg-sunken)] rounded-full overflow-hidden flex">
        {stages.map((stage, idx) => {
          const width = total > 0 ? (stage.count / total) * 100 : 0
          if (width === 0) return null

          return (
            <motion.div
              key={stage.key}
              initial={{ width: 0 }}
              animate={{ width: `${width}%` }}
              transition={{
                duration: 0.6,
                ease: "easeOut",
                delay: 0.2 + idx * 0.06,
              }}
              className={cn(
                "h-full relative group cursor-pointer",
                "hover:brightness-110 transition-all"
              )}
              style={{ backgroundColor: stage.color }}
              onClick={() => onStageClick?.(stage.key)}
            >
              {/* Tooltip on hover */}
              <div
                className={cn(
                  "absolute bottom-full left-1/2 -translate-x-1/2 mb-2",
                  "bg-[var(--bg-surface)] border border-[var(--border-default)]",
                  "rounded-lg shadow-lg px-3 py-2 whitespace-nowrap",
                  "opacity-0 group-hover:opacity-100 transition-opacity",
                  "pointer-events-none z-10"
                )}
              >
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {stage.label}
                </div>
                <div className="text-xs text-[var(--text-tertiary)]">
                  {stage.count} leads ({Math.round(width)}%)
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Labels */}
      {showLabels && (
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {stages.map((stage) => (
            <button
              key={stage.key}
              onClick={() => onStageClick?.(stage.key)}
              className={cn(
                "flex items-center gap-1.5 text-xs",
                "hover:text-[var(--text-primary)] transition-colors",
                stage.count > 0
                  ? "text-[var(--text-secondary)]"
                  : "text-[var(--text-tertiary)]"
              )}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
              <span>{stage.label}</span>
              {showCounts && (
                <span className="text-[var(--text-tertiary)]">({stage.count})</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {(total > 0 || conversionRate !== undefined) && (
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
          <span className="text-sm text-[var(--text-secondary)]">
            Total: <span className="font-medium text-[var(--text-primary)]">{total}</span> active leads
          </span>
          {conversionRate !== undefined && (
            <span className="text-sm text-[var(--text-secondary)]">
              Conversion:{" "}
              <span className="font-medium text-[var(--success)]">{conversionRate}%</span>
            </span>
          )}
        </div>
      )}
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
        <div className="h-2 bg-[var(--bg-sunken)] rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="h-2 bg-[var(--bg-sunken)] rounded-full overflow-hidden flex">
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
            <div className="w-3 h-3 rounded-full bg-[var(--bg-sunken)]" />
            <div className="flex-1 h-4 bg-[var(--bg-sunken)] rounded" />
            <div className="w-8 h-4 bg-[var(--bg-sunken)] rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {stages.map((stage, idx) => {
        const percentage = total > 0 ? Math.round((stage.count / total) * 100) : 0

        return (
          <motion.div
            key={stage.key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg",
              "hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
            )}
            onClick={() => onStageClick?.(stage.key)}
          >
            {/* Stage indicator */}
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: stage.color }}
            />

            {/* Label */}
            <span className="flex-1 text-sm text-[var(--text-secondary)]">
              {stage.label}
            </span>

            {/* Count */}
            <span className="text-sm font-medium text-[var(--text-primary)] tabular-nums">
              {stage.count}
            </span>

            {/* Percentage bar */}
            <div className="w-16 h-1.5 bg-[var(--bg-sunken)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.4, delay: 0.2 + idx * 0.05 }}
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
