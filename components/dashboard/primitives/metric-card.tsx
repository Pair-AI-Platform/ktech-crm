"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { AnimatedNumber } from "./animated-number"
import { TrendIndicator } from "./trend-indicator"
import type { LucideIcon } from "lucide-react"

interface MetricCardProps {
  label: string
  value: number
  previousValue?: number
  icon?: LucideIcon
  formatter?: (value: number) => string
  loading?: boolean
  index?: number
  className?: string
}

export function MetricCard({
  label,
  value,
  previousValue,
  icon: Icon,
  formatter,
  loading,
  index = 0,
  className,
}: MetricCardProps) {
  const delta =
    previousValue !== undefined && previousValue > 0
      ? Math.round(((value - previousValue) / previousValue) * 100)
      : undefined

  if (loading) {
    return (
      <div
        className={cn(
          "rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-3",
          className
        )}
      >
        <div className="h-3 w-20 rounded bg-[var(--bg-hover)] animate-pulse" />
        <div className="h-9 w-16 rounded bg-[var(--bg-hover)] animate-pulse" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
      className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6",
        "hover:border-[var(--border-hover)] transition-colors duration-150",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">
          {label}
        </span>
        {Icon && <Icon className="w-4 h-4 text-[var(--text-muted)]" />}
      </div>
      <div className="flex items-end gap-2">
        <AnimatedNumber
          value={value}
          formatter={formatter}
          className="text-4xl font-semibold tracking-tight tabular-nums text-[var(--text-primary)]"
        />
        {delta !== undefined && <TrendIndicator value={delta} />}
      </div>
    </motion.div>
  )
}
