"use client"

import { useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Target, Save, Check, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { SeasonSelector } from "./season-selector"
import type { TargetSeason } from "@/types"

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
  // Season props
  seasons: TargetSeason[]
  selectedSeason: TargetSeason | null
  onChangeSeason: (id: string) => void
  onCreateSeason: (data: { name: string; start_date: string; end_date: string }) => Promise<TargetSeason>
  onUpdateSeason: (data: { id: string; name: string; start_date: string; end_date: string }) => Promise<void>
  onDeleteSeason: (id: string) => Promise<void>
}

const categoryConfig: { key: TargetCategory; label: string; color: string }[] = [
  { key: 'puc_files', label: 'PUC', color: 'bg-green-500' },
  { key: 'sf_files', label: 'SF Files', color: 'bg-orange-500' },
  { key: 'sf_applicants', label: 'SF App', color: 'bg-blue-500' },
  { key: 'puc_app_submission', label: 'PUC App', color: 'bg-purple-500' },
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
  onCreateSeason,
  onUpdateSeason,
  onDeleteSeason,
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
    <div className="space-y-3">
      {/* Title row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center shadow-sm">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Agent Targets</h2>
            <p className="text-xs text-[var(--text-muted)]">Set per-agent targets by month and season</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5">
            {categoryConfig.map(cat => {
              const isActive = activeCategories.has(cat.key)
              return (
                <button
                  key={cat.key}
                  onClick={() => onToggleCategory(cat.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    isActive
                      ? 'bg-[var(--bg-elevated)] border-[var(--primary)]/30 text-[var(--text-primary)] shadow-sm'
                      : 'bg-transparent border-[var(--border)] text-[var(--text-muted)] opacity-50 hover:opacity-75'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${cat.color} ${!isActive ? 'opacity-40' : ''}`} />
                  {cat.label}
                </button>
              )
            })}
          </div>
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

      {/* Period selectors row */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 px-1">
        {/* Monthly period (PUC Files + SF Files) */}
        {showMonthly && (
          <div className="flex items-center gap-1.5 text-sm">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--bg-sunken)] border border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-muted)] mr-1 font-medium uppercase tracking-wide">Monthly</span>
              {onPrevMonth && (
                <button
                  onClick={handlePrev}
                  className="p-0.5 hover:bg-[var(--bg-elevated)] rounded transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </button>
              )}
              <Calendar className="w-3.5 h-3.5 text-orange-500" />
              <div className="overflow-hidden h-5 flex items-center">
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
                    className="inline-block font-medium text-[var(--text-primary)]"
                  >
                    {monthLabel}
                  </motion.span>
                </AnimatePresence>
              </div>
              {onNextMonth && (
                <button
                  onClick={handleNext}
                  disabled={!canGoNext}
                  className="p-0.5 hover:bg-[var(--bg-elevated)] rounded transition-colors disabled:opacity-30"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <div className="w-2 h-2 rounded-full bg-orange-500" />
            </div>
          </div>
        )}

        {/* Seasonal period (SF Applicants + PUC App) */}
        {showSeasonal && (
          <div className="flex-1 px-2 py-1 rounded-lg bg-[var(--bg-sunken)] border border-[var(--border)]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wide">Season</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <div className="w-2 h-2 rounded-full bg-purple-500" />
              </div>
            </div>
            <SeasonSelector
              seasons={seasons}
              selectedSeason={selectedSeason}
              onChangeSeason={onChangeSeason}
              onCreateSeason={onCreateSeason}
              onUpdateSeason={onUpdateSeason}
              onDeleteSeason={onDeleteSeason}
            />
          </div>
        )}
      </div>
    </div>
  )
}
