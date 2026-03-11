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
        <div className="h-10 bg-[var(--bg-sunken)] rounded-2xl" />
        <div className="flex items-center justify-end gap-3">
          <div className="h-3 w-16 bg-[var(--bg-sunken)] rounded" />
          <div className="h-3 w-20 bg-[var(--bg-sunken)] rounded" />
        </div>
      </div>
    )
  }

  const visibleTotal = stages.reduce((sum, s) => sum + s.count, 0)

  return (
    <div className="space-y-2">
      {/* Apple-style segmented bar */}
      <div className="flex h-10 rounded-[14px] overflow-hidden border border-[var(--border-default)]/40 bg-[var(--bg-primary)]">
        {stages.map((stage, idx) => {
          const width = visibleTotal > 0 ? (stage.count / visibleTotal) * 100 : 0
          if (width === 0) return null

          return (
            <motion.div
              key={stage.key}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: `${width}%`, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: idx * 0.05 }}
              className="h-full relative group cursor-pointer"
              onClick={() => onStageClick?.(stage.key)}
            >
              {/* Soft gradient fill */}
              <span
                className="absolute inset-0 transition-opacity duration-200"
                style={{
                  background: `linear-gradient(180deg, ${stage.color}15 0%, ${stage.color}08 100%)`,
                }}
              />
              {/* Hover state */}
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{
                  background: `linear-gradient(180deg, ${stage.color}25 0%, ${stage.color}15 100%)`,
                }}
              />
              {/* Right separator line */}
              <span
                className="absolute right-0 top-[6px] bottom-[6px] w-[1px]"
                style={{ backgroundColor: `${stage.color}30` }}
              />
              {/* Content - show label+count, on hover show label+count for narrow ones */}
              <span className="absolute inset-0 flex items-center justify-center gap-1 px-1.5 select-none z-[1] overflow-hidden whitespace-nowrap">
                {width > 14 && (
                  <span
                    className="text-[11px] font-medium tracking-[-0.01em] truncate group-hover:hidden"
                    style={{ color: stage.color }}
                  >
                    {stage.label}
                  </span>
                )}
                <span
                  className="text-[12px] font-semibold tabular-nums tracking-[-0.02em] group-hover:hidden"
                  style={{ color: stage.color }}
                >
                  {width > 4 ? stage.count : ""}
                </span>
                {/* Hover: always show label + count */}
                <span
                  className="hidden group-hover:inline text-[11px] font-semibold tracking-[-0.01em] truncate"
                  style={{ color: stage.color }}
                >
                  {stage.label} {stage.count}
                </span>
              </span>
            </motion.div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2.5 text-[11px]">
          <span className="text-[var(--text-tertiary)]">
            <span className="font-medium text-[var(--text-secondary)] tabular-nums">{total}</span> leads
          </span>
          {conversionRate !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--success)_10%,transparent)]">
              <span className="font-semibold text-[var(--success)] tabular-nums">{conversionRate}%</span>
              <span className="text-[var(--success)] font-medium">enrolled</span>
            </span>
          )}
        </div>
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
