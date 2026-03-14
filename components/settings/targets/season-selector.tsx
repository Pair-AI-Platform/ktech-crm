"use client"

import { Badge } from "@/components/ui/badge"
import {
  CalendarRange, ChevronLeft, ChevronRight, ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Semester } from "@/types"

interface SeasonSelectorProps {
  seasons: Semester[]
  selectedSeason: Semester | null
  onChangeSeason: (id: string) => void
}

function formatDateRange(start: string, end: string) {
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

export function SeasonSelector({
  seasons,
  selectedSeason,
  onChangeSeason,
}: SeasonSelectorProps) {
  const selectedIdx = seasons.findIndex(s => s.id === selectedSeason?.id)
  const canGoPrev = selectedIdx < seasons.length - 1
  const canGoNext = selectedIdx > 0

  const handlePrev = () => {
    if (canGoPrev) onChangeSeason(seasons[selectedIdx + 1].id)
  }
  const handleNext = () => {
    if (canGoNext) onChangeSeason(seasons[selectedIdx - 1].id)
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Season</span>
        <div className="h-4 w-px bg-[var(--border)]" />
        <button
          onClick={handlePrev}
          disabled={!canGoPrev}
          className="p-1 hover:bg-[var(--bg-elevated)] rounded transition-colors disabled:opacity-30"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        </button>
        <CalendarRange className="w-3.5 h-3.5 text-purple-500" />
        {selectedSeason ? (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-[var(--text-primary)]">
              {selectedSeason.name}
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              {formatDateRange(selectedSeason.start_date, selectedSeason.end_date)}
            </span>
            {selectedSeason.is_active && (
              <Badge variant="secondary" size="sm" className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 border-0">
                Active
              </Badge>
            )}
          </div>
        ) : (
          <span className="italic text-sm text-[var(--text-muted)]">No semester selected</span>
        )}
        <button
          onClick={handleNext}
          disabled={!canGoNext}
          className="p-1 hover:bg-[var(--bg-elevated)] rounded transition-colors disabled:opacity-30"
        >
          <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        </button>
        <div className="flex items-center gap-1 ml-1">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
        </div>
      </div>

      <a
        href="/settings?tab=enrollment"
        className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
      >
        <ExternalLink className="w-2.5 h-2.5" />
        Manage in Enrollment Cycles
      </a>
    </div>
  )
}
