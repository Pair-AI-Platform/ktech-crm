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

  // Derive cycle name from the selected season
  const cycleName = selectedSeason?.cycle?.name

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePrev}
        disabled={!canGoPrev}
        className="p-1 hover:bg-[var(--bg-sunken)] rounded transition-colors disabled:opacity-30"
      >
        <ChevronLeft className="w-3.5 h-3.5 text-[var(--text-muted)]" />
      </button>
      <CalendarRange className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
      {selectedSeason ? (
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-[var(--text-primary)] truncate">
              {selectedSeason.name}
            </span>
            {cycleName && (
              <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0">
                ({cycleName})
              </span>
            )}
            {selectedSeason.is_active && (
              <Badge variant="secondary" size="sm" className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 border-0 flex-shrink-0">
                Active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-[var(--text-muted)]">
              {formatDateRange(selectedSeason.start_date, selectedSeason.end_date)}
            </span>
            <a
              href="/settings?tab=enrollment"
              className="flex items-center gap-0.5 text-[10px] text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors flex-shrink-0"
            >
              <ExternalLink className="w-2.5 h-2.5" />
              Manage
            </a>
          </div>
        </div>
      ) : (
        <span className="italic text-sm text-[var(--text-muted)]">No semester selected</span>
      )}
      <button
        onClick={handleNext}
        disabled={!canGoNext}
        className="p-1 hover:bg-[var(--bg-sunken)] rounded transition-colors disabled:opacity-30"
      >
        <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
      </button>
    </div>
  )
}
