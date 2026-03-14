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
  // Navigate seasons
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
    <div className="space-y-2">
      {/* Season nav row */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
          <button
            onClick={handlePrev}
            disabled={!canGoPrev}
            className="p-0.5 hover:bg-[var(--bg-sunken)] rounded transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <CalendarRange className="w-3.5 h-3.5 text-purple-500" />
          {selectedSeason ? (
            <span className="font-medium text-[var(--text-primary)]">
              {selectedSeason.name}
              <span className="ml-1.5 text-xs font-normal text-[var(--text-muted)]">
                {formatDateRange(selectedSeason.start_date, selectedSeason.end_date)}
              </span>
            </span>
          ) : (
            <span className="italic text-[var(--text-muted)]">No semester selected</span>
          )}
          {selectedSeason?.is_active && (
            <Badge variant="secondary" size="sm" className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 border-0">
              Active
            </Badge>
          )}
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className="p-0.5 hover:bg-[var(--bg-sunken)] rounded transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <span className="ml-auto flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
          <ExternalLink className="w-2.5 h-2.5" />
          Manage in Enrollment Cycles
        </span>
      </div>
    </div>
  )
}
