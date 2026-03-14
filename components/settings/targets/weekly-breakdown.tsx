"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, ChevronDown, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { TargetCategory } from "@/types"

interface WeeklyBreakdownProps {
  category: TargetCategory
  label: string
  total: number
  weekly: number[] | null | undefined
  onWeeklyChange: (values: number[]) => void
}

const categoryColors: Record<TargetCategory, { border: string; bg: string; text: string }> = {
  puc_files: { border: 'border-green-500/30', bg: 'bg-green-500/5', text: 'text-green-600 dark:text-green-400' },
  sf_files: { border: 'border-orange-500/30', bg: 'bg-orange-500/5', text: 'text-orange-600 dark:text-orange-400' },
  sf_applicants: { border: 'border-blue-500/30', bg: 'bg-blue-500/5', text: 'text-blue-600 dark:text-blue-400' },
  puc_app_submission: { border: 'border-purple-500/30', bg: 'bg-purple-500/5', text: 'text-purple-600 dark:text-purple-400' },
}

function getWeekRanges() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const monthName = firstDay.toLocaleDateString("en-US", { month: "short" })

  // For isCurrent: treat Friday/Saturday as part of the previous Thu-ended week
  const nowForCurrent = new Date(now)
  const todayDay = nowForCurrent.getDay()
  if (todayDay === 5) nowForCurrent.setDate(nowForCurrent.getDate() - 1)
  if (todayDay === 6) nowForCurrent.setDate(nowForCurrent.getDate() - 2)

  const ranges: { label: string; dateRange: string; isCurrent: boolean }[] = []
  let weekStart = new Date(firstDay)

  const startDay = weekStart.getDay()
  if (startDay === 5) weekStart.setDate(weekStart.getDate() + 2)
  else if (startDay === 6) weekStart.setDate(weekStart.getDate() + 1)

  let weekNum = 1

  while (weekStart <= lastDay) {
    const weekEnd = new Date(weekStart)
    const daysUntilThu = (4 - weekStart.getDay() + 7) % 7
    weekEnd.setDate(weekStart.getDate() + daysUntilThu)
    if (weekEnd > lastDay) weekEnd.setTime(lastDay.getTime())

    const isCurrent =
      nowForCurrent >= weekStart &&
      nowForCurrent <= new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate(), 23, 59, 59)
    ranges.push({
      label: `W${weekNum}`,
      dateRange: `${monthName} ${weekStart.getDate()}-${weekEnd.getDate()}`,
      isCurrent,
    })

    weekStart = new Date(weekEnd)
    weekStart.setDate(weekStart.getDate() + 3)
    weekNum++
  }
  return ranges
}

function autoDistribute(total: number, numWeeks: number): number[] {
  const base = Math.floor(total / numWeeks)
  const remainder = total - base * numWeeks
  return Array.from({ length: numWeeks }, (_, i) => base + (i === numWeeks - 1 ? remainder : 0))
}

export function WeeklyBreakdown({ category, label, total, weekly, onWeeklyChange }: WeeklyBreakdownProps) {
  const [expanded, setExpanded] = useState(false)
  const weekRanges = getWeekRanges()
  const colors = categoryColors[category]

  if (total <= 0) return null

  const values = weekly && weekly.length === weekRanges.length
    ? weekly
    : autoDistribute(total, weekRanges.length)

  const weeklySum = values.reduce((a, b) => a + b, 0)
  const isBalanced = weeklySum === total

  const handleChange = (weekIndex: number, val: string) => {
    const newVal = parseInt(val) || 0
    const updated = [...values]
    updated[weekIndex] = newVal
    onWeeklyChange(updated)
  }

  const handleAutoDistribute = () => {
    onWeeklyChange(autoDistribute(total, weekRanges.length))
  }

  return (
    <div className={cn("rounded-lg border transition-colors", expanded ? colors.border : "border-transparent")}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center justify-between w-full px-3 py-1.5 text-xs rounded-lg transition-colors",
          expanded ? colors.bg : "hover:bg-[var(--bg-elevated)]"
        )}
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3 text-[var(--text-muted)]" />
          <span className={cn("font-medium", expanded ? colors.text : "text-[var(--text-secondary)]")}>
            {label} Weekly
          </span>
          {!isBalanced && (
            <Badge variant="destructive" size="sm" className="text-[9px] px-1 py-0 h-4">
              {weeklySum}/{total}
            </Badge>
          )}
        </div>
        <ChevronDown className={cn(
          "w-3 h-3 text-[var(--text-muted)] transition-transform",
          expanded && "rotate-180"
        )} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1">
              <div className="flex items-center justify-end mb-2">
                <button
                  onClick={handleAutoDistribute}
                  className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  Auto-distribute
                </button>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {weekRanges.map((week, i) => (
                  <div
                    key={week.label}
                    className={cn(
                      "flex-1 min-w-[70px] p-2 rounded-lg border text-center transition-all",
                      week.isCurrent
                        ? cn("border-[var(--primary)]/40 shadow-sm", colors.bg)
                        : "border-[var(--border)] bg-[var(--bg-elevated)]"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <span className={cn(
                        "text-[10px] font-semibold",
                        week.isCurrent ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                      )}>
                        {week.label}
                      </span>
                      {week.isCurrent && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                      )}
                    </div>
                    <Input
                      type="number"
                      value={values[i] ?? 0}
                      onChange={(e) => handleChange(i, e.target.value)}
                      className="text-center font-bold h-7 text-sm px-1"
                      min={0}
                    />
                    <p className="text-[9px] text-[var(--text-muted)] mt-1 leading-tight">{week.dateRange}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
