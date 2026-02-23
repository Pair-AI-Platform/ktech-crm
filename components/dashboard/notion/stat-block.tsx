"use client"

import { ReactNode } from "react"
import { motion } from "framer-motion"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatBlockProps {
  value: number | string
  label?: string
  previousValue?: number
  icon?: ReactNode
  iconBg?: string
  loading?: boolean
  formatter?: (value: number) => string
  size?: "sm" | "md" | "lg"
  trend?: "up" | "down" | "neutral"
  onClick?: () => void
}

export function StatBlock({
  value,
  label,
  previousValue,
  icon,
  iconBg = "bg-[var(--accent)]/10",
  loading = false,
  formatter = (v) => v.toLocaleString(),
  size = "md",
  trend,
  onClick,
}: StatBlockProps) {
  const numericValue = typeof value === "number" ? value : parseFloat(value) || 0
  const delta = previousValue !== undefined ? numericValue - previousValue : undefined
  const percentChange =
    delta !== undefined && previousValue !== undefined && previousValue !== 0
      ? Math.round((delta / previousValue) * 100)
      : undefined

  const calculatedTrend = trend || (delta !== undefined ? (delta > 0 ? "up" : delta < 0 ? "down" : "neutral") : undefined)

  const sizes = {
    sm: { value: "text-2xl", label: "text-xs", icon: "w-8 h-8" },
    md: { value: "text-3xl", label: "text-sm", icon: "w-10 h-10" },
    lg: { value: "text-4xl", label: "text-base", icon: "w-12 h-12" },
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center gap-3">
          <div className={cn("rounded-lg bg-[var(--bg-sunken)]", sizes[size].icon)} />
          <div className="flex-1 space-y-2">
            <div className="h-8 bg-[var(--bg-sunken)] rounded w-20" />
            {label && <div className="h-4 bg-[var(--bg-sunken)] rounded w-16" />}
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={cn(
        "flex items-center gap-3",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      {/* Icon */}
      {icon && (
        <div
          className={cn(
            "flex items-center justify-center rounded-lg",
            iconBg,
            sizes[size].icon
          )}
        >
          {icon}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          {/* Value with animation */}
          <motion.span
            key={numericValue}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "font-bold text-[var(--text-primary)] tabular-nums",
              sizes[size].value
            )}
          >
            {typeof value === "number" ? formatter(value) : value}
          </motion.span>

          {/* Trend indicator */}
          {calculatedTrend && calculatedTrend !== "neutral" && (
            <span
              className={cn(
                "flex items-center text-xs font-medium",
                calculatedTrend === "up" ? "text-[var(--success)]" : "text-[var(--error)]"
              )}
            >
              {calculatedTrend === "up" ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {percentChange !== undefined && `${Math.abs(percentChange)}%`}
            </span>
          )}
        </div>

        {/* Label */}
        {label && (
          <p className={cn("text-[var(--text-tertiary)] truncate", sizes[size].label)}>
            {label}
          </p>
        )}
      </div>
    </motion.div>
  )
}

// Compact stat grid for multiple stats in a block
interface StatGridProps {
  stats: Array<{
    id: string
    value: number | string
    label: string
    icon?: ReactNode
    iconBg?: string
    trend?: "up" | "down" | "neutral"
    onClick?: () => void
  }>
  columns?: 2 | 3 | 4
  loading?: boolean
}

export function StatGrid({ stats, columns = 2, loading = false }: StatGridProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  }

  return (
    <div className={cn("grid gap-4", gridCols[columns])}>
      {stats.map((stat) => (
        <div
          key={stat.id}
          className={cn(
            "p-4 rounded-lg bg-[var(--bg-sunken)] border border-[var(--border-subtle)]",
            "hover:bg-[var(--bg-hover)] hover:border-[var(--border-default)] transition-all",
            stat.onClick && "cursor-pointer"
          )}
          onClick={stat.onClick}
        >
          <StatBlock
            value={stat.value}
            label={stat.label}
            icon={stat.icon}
            iconBg={stat.iconBg}
            trend={stat.trend}
            size="sm"
            loading={loading}
          />
        </div>
      ))}
    </div>
  )
}
