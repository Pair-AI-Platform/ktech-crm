"use client"

import { useEffect, useRef } from "react"
import { Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PIPELINE_STAGES, type PipelineStage } from "@/types"
import { useStageSettings } from "@/lib/hooks/use-stage-settings"

interface QuickFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  activeStage: PipelineStage | "all"
  onStageChange: (stage: PipelineStage | "all") => void
  onOpenAdvanced: () => void
  stats: Record<PipelineStage, number>
  total: number
  lostAtMode?: boolean
  hideStages?: boolean
  lostReasonFilter?: string[]
  onLostReasonFilterChange?: (ids: string[]) => void
  lostReasons?: { id: string; category: string; reason_en: string }[]
}

export function QuickFilters({
  searchQuery,
  onSearchChange,
  activeStage,
  onStageChange,
  onOpenAdvanced,
  stats,
  total,
  lostAtMode,
  hideStages,
  lostReasonFilter,
  onLostReasonFilterChange,
  lostReasons,
}: QuickFiltersProps) {
  const stagePillsRef = useRef<HTMLDivElement>(null)
  const { settings: stageSettings } = useStageSettings()

  const orderedStages = stageSettings.length > 0
    ? stageSettings.map(s => PIPELINE_STAGES.find(p => p.value === s.stage)).filter(Boolean) as typeof PIPELINE_STAGES
    : PIPELINE_STAGES

  const stagesToShow = lostAtMode
    ? orderedStages.filter(s => s.value !== "lost" && s.value !== "withdraw")
    : orderedStages.filter(s => s.value !== "lost")

  useEffect(() => {
    const container = stagePillsRef.current
    if (!container) return
    const activeBtn = container.querySelector('[data-active="true"]') as HTMLElement
    activeBtn?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
  }, [activeStage])

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1">
          <SearchInput
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={() => onSearchChange("")}
            placeholder="Search leads by name, phone, or email..."
            className="bg-[var(--bg-sunken)]"
          />
        </div>
        <Button variant="outline" onClick={onOpenAdvanced} className="shrink-0">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {!hideStages && (
        <div ref={stagePillsRef} className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          <Button
            variant={activeStage === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => onStageChange("all")}
            className="shrink-0"
            data-active={activeStage === "all"}
          >
            {lostAtMode ? "All" : "All Stages"}
            <Badge variant="secondary" size="sm" className="ml-2">
              {lostAtMode ? total : total - (stats.lost || 0)}
            </Badge>
          </Button>
          {stagesToShow.map((stage) => {
            const count = stats[stage.value] || 0
            return (
              <Button
                key={stage.value}
                variant={activeStage === stage.value ? "default" : "ghost"}
                size="sm"
                onClick={() => onStageChange(stage.value)}
                className="shrink-0"
                data-active={activeStage === stage.value}
              >
                {stage.label}
                {count > 0 && (
                  <Badge variant="secondary" size="sm" className="ml-2">
                    {count}
                  </Badge>
                )}
              </Button>
            )
          })}
        </div>
      )}

      {lostAtMode && lostReasons && lostReasons.length > 0 && onLostReasonFilterChange && (
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar items-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] shrink-0">Reason:</span>
          <Button
            variant={!lostReasonFilter || lostReasonFilter.length === 0 ? "default" : "ghost"}
            size="sm"
            onClick={() => onLostReasonFilterChange([])}
            className="shrink-0 h-7 text-xs"
          >
            All
          </Button>
          {lostReasons.map((reason) => {
            const isActive = lostReasonFilter?.includes(reason.id)
            return (
              <Button
                key={reason.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  if (isActive) {
                    onLostReasonFilterChange(lostReasonFilter!.filter(id => id !== reason.id))
                  } else {
                    onLostReasonFilterChange([...(lostReasonFilter || []), reason.id])
                  }
                }}
                className="shrink-0 h-7 text-xs"
              >
                {reason.reason_en}
              </Button>
            )
          })}
        </div>
      )}
    </div>
  )
}
