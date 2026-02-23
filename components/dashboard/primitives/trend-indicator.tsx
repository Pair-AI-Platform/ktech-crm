"use client"

import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface TrendIndicatorProps {
  value: number
  suffix?: string
  className?: string
}

export function TrendIndicator({ value, suffix = "%", className }: TrendIndicatorProps) {
  const isPositive = value > 0
  const isNeutral = value === 0
  const Icon = isNeutral ? Minus : isPositive ? ArrowUpRight : ArrowDownRight

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-md",
        isNeutral && "text-[var(--text-muted)] bg-[var(--bg-hover)]",
        isPositive && "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/50",
        !isPositive && !isNeutral && "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/50",
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {isPositive && "+"}
      {value}
      {suffix}
    </span>
  )
}
