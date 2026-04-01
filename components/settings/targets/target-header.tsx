"use client"

import { useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Target, Save, Check, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { SeasonSelector } from "./season-selector"
import { cn } from "@/lib/utils"
import type { Semester } from "@/types"

export type TargetCategory = 'puc_files' | 'sf_files' | 'sf_applicants' | 'puc_app_submission'

// Which categories are monthly vs seasonal
export const MONTHLY_CATEGORIES = new Set<TargetCategory>(['puc_files', 'sf_files'])
export const SEASONAL_CATEGORIES = new Set<TargetCategory>(['sf_applicants', 'puc_app_submission'])

interface TargetHeaderProps {
  month: string
  saving: boolean
  saveSuccess: boolean
  onSave: () => void
  onPrevMonth?: () => void
  onNextMonth?: () => void
  canGoNext?: boolean
  hasUnsavedChanges?: boolean
  activeCategories: Set<TargetCategory>
  onToggleCategory: (cat: TargetCategory) => void
  // Season props (read-only — semesters managed in Enrollment Cycles)
  seasons: Semester[]
  selectedSeason: Semester | null
  onChangeSeason: (id: string) => void
}

const categoryConfig: { key: TargetCategory; label: string; shortLabel: string; color: string; dotColor: string }[] = [
  { key: 'puc_files', label: 'PUC Files', shortLabel: 'PUC', color: 'bg-green-500', dotColor: 'bg-green-500' },
  { key: 'sf_files', label: 'SF Files', shortLabel: 'SF', color: 'bg-orange-500', dotColor: 'bg-orange-500' },
  { key: 'sf_applicants', label: 'SF Enrolled', shortLabel: 'SF Enr', color: 'bg-blue-500', dotColor: 'bg-blue-500' },
  { key: 'puc_app_submission', label: 'PUC Enrolled', shortLabel: 'PUC Enr', color: 'bg-purple-500', dotColor: 'bg-purple-500' },
]

export function TargetHeader({
  month,
  saving,
  saveSuccess,
  onSave,
  onPrevMonth,
  onNextMonth,
  canGoNext = false,
  hasUnsavedChanges = false,
  activeCategories,
  onToggleCategory,
  seasons,
  selectedSeason,
  onChangeSeason,
}: TargetHeaderProps) {
  const [year, m] = month.split('-')
  const monthLabel = new Date(parseInt(year), parseInt(m) - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const directionRef = useRef<1 | -1>(1)

  const handlePrev = () => {
    directionRef.current = -1
    onPrevMonth?.()
  }

  const handleNext = () => {
    directionRef.current = 1
    onNextMonth?.()
  }

  // Determine which period rows to show based on active categories
  const showMonthly = [...activeCategories].some(c => MONTHLY_CATEGORIES.has(c))
  const showSeasonal = [...activeCategories].some(c => SEASONAL_CATEGORIES.has(c))

  return (
    <div className="space-y-4">
      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center shadow-sm">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Agent Targets</h2>
            <p className="text-xs text-[var(--text-muted)]">Set per-agent targets by month and season</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onSave}
            disabled={saving}
            size="sm"
            className={hasUnsavedChanges && !saving && !saveSuccess ? "animate-pulse" : ""}
          >
            {saving ? (
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-1.5" />
            ) : saveSuccess ? (
              <Check className="w-3.5 h-3.5 mr-1.5" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1.5" />
            )}
            {saveSuccess ? "Saved!" : "Save All"}
          </Button>
        </div>
      </div>

      {/* Period selectors with grouped categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Monthly section */}
        <div className={cn(
          "rounded-xl border transition-all",
          showMonthly
            ? "border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm"
            : "border-dashed border-[var(--border)] bg-[var(--bg-sunken)] opacity-60"
        )}>
          {/* Monthly categories */}
          <div className="flex items-center gap-1.5 px-3 pt-3 pb-2">
            {categoryConfig.filter(c => MONTHLY_CATEGORIES.has(c.key)).map(cat => {
              const isActive = activeCategories.has(cat.key)
              return (
                <button
                  key={cat.key}
                  onClick={() => onToggleCategory(cat.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                    isActive
                      ? "bg-[var(--bg-sunken)] text-[var(--text-primary)]"
                      : "text-[var(--text-muted)] opacity-50 hover:opacity-75"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full", cat.dotColor, !isActive && "opacity-40")} />
                  {cat.label}
                </button>
              )
            })}
          </div>
          {/* Month navigator */}
          <div className="flex items-center gap-2 px-3 pb-3">
            {onPrevMonth && (
              <button
                onClick={handlePrev}
                className="p-1 hover:bg-[var(--bg-sunken)] rounded transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </button>
            )}
            <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
            <div className="overflow-hidden h-5 flex items-center min-w-[120px]">
              <AnimatePresence mode="wait" custom={directionRef.current}>
                <motion.span
                  key={month}
                  custom={directionRef.current}
                  variants={{
                    initial: (dir: number) => ({ y: dir * 10, opacity: 0 }),
                    animate: { y: 0, opacity: 1 },
                    exit: (dir: number) => ({ y: dir * -10, opacity: 0 }),
                  }}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                  className="inline-block font-semibold text-sm text-[var(--text-primary)]"
                >
                  {monthLabel}
                </motion.span>
              </AnimatePresence>
            </div>
            {onNextMonth && (
              <button
                onClick={handleNext}
                disabled={!canGoNext}
                className="p-1 hover:bg-[var(--bg-sunken)] rounded transition-colors disabled:opacity-30"
              >
                <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </button>
            )}
          </div>
        </div>

        {/* Seasonal section */}
        <div className={cn(
          "rounded-xl border transition-all",
          showSeasonal
            ? "border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm"
            : "border-dashed border-[var(--border)] bg-[var(--bg-sunken)] opacity-60"
        )}>
          {/* Seasonal categories */}
          <div className="flex items-center gap-1.5 px-3 pt-3 pb-2">
            {categoryConfig.filter(c => SEASONAL_CATEGORIES.has(c.key)).map(cat => {
              const isActive = activeCategories.has(cat.key)
              return (
                <button
                  key={cat.key}
                  onClick={() => onToggleCategory(cat.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                    isActive
                      ? "bg-[var(--bg-sunken)] text-[var(--text-primary)]"
                      : "text-[var(--text-muted)] opacity-50 hover:opacity-75"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full", cat.dotColor, !isActive && "opacity-40")} />
                  {cat.label}
                </button>
              )
            })}
          </div>
          {/* Season navigator */}
          <div className="px-3 pb-3">
            <SeasonSelector
              seasons={seasons}
              selectedSeason={selectedSeason}
              onChangeSeason={onChangeSeason}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
