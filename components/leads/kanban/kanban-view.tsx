"use client"

import { useState, useCallback, useMemo } from "react"
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  MeasuringStrategy,
} from "@dnd-kit/core"
import {
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { cn } from "@/lib/utils"
import { KanbanColumn, stageConfig } from "./kanban-column"
import { KanbanCardOverlay } from "./kanban-card"
import type { Lead, PipelineStage } from "@/types"

interface KanbanViewProps {
  leads: Lead[]
  onLeadClick?: (lead: Lead) => void
  onLeadMove?: (leadId: string, newStage: PipelineStage, position?: number) => void | Promise<void>
  onAddLead?: (stage: PipelineStage) => void
  loading?: boolean
  visibleStages?: PipelineStage[]
  className?: string
}

// Default visible stages (excluding lost for cleaner board)
const defaultVisibleStages: PipelineStage[] = [
  "new",
  "contacted",
  "visit",
  "test",
  "application",
  "applicant",
  "enrolled",
  "withdraw",
]

export function KanbanView({
  leads,
  onLeadClick,
  onLeadMove,
  onAddLead,
  loading = false,
  visibleStages = defaultVisibleStages,
  className,
}: KanbanViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  // Group leads by stage
  const leadsByStage = useMemo(() => {
    const grouped: Record<PipelineStage, Lead[]> = {} as Record<PipelineStage, Lead[]>

    // Initialize all stages with empty arrays
    visibleStages.forEach((stage) => {
      grouped[stage] = []
    })

    // Group leads
    leads.forEach((lead) => {
      if (visibleStages.includes(lead.pipeline_stage)) {
        grouped[lead.pipeline_stage].push(lead)
      }
    })

    // Sort leads within each stage by position_in_stage or updated_at
    Object.keys(grouped).forEach((stage) => {
      grouped[stage as PipelineStage].sort((a, b) => {
        // First by position_in_stage if available
        if (a.position_in_stage !== undefined && b.position_in_stage !== undefined) {
          return a.position_in_stage - b.position_in_stage
        }
        // Then by updated_at (most recent first)
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      })
    })

    return grouped
  }, [leads, visibleStages])

  // Get the active lead for drag overlay
  const activeLead = useMemo(() => {
    if (!activeId) return null
    return leads.find((l) => l.id === activeId) || null
  }, [activeId, leads])

  // Configure sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Custom collision detection
  const collisionDetection = useCallback((args: Parameters<typeof pointerWithin>[0]) => {
    // First check for direct intersections with columns
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) {
      return pointerCollisions
    }

    // Fall back to rect intersection for better column detection
    return rectIntersection(args)
  }, [])

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  // Handle drag over
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event
    setOverId(over ? (over.id as string) : null)
  }, [])

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event

      setActiveId(null)
      setOverId(null)

      if (!over) return

      const activeId = active.id as string
      const overId = over.id as string

      // Get the active lead
      const activeLead = leads.find((l) => l.id === activeId)
      if (!activeLead) return

      // Determine the target stage
      let targetStage: PipelineStage

      // Check if dropped directly on a column
      if (visibleStages.includes(overId as PipelineStage)) {
        targetStage = overId as PipelineStage
      } else {
        // Dropped on another card - find that card's stage
        const overLead = leads.find((l) => l.id === overId)
        if (!overLead) return
        targetStage = overLead.pipeline_stage
      }

      // Only update if stage changed
      if (activeLead.pipeline_stage !== targetStage && onLeadMove) {
        // Calculate position
        const targetLeads = leadsByStage[targetStage]
        const overIndex = targetLeads.findIndex((l) => l.id === overId)
        const position = overIndex >= 0 ? overIndex : targetLeads.length

        await onLeadMove(activeId, targetStage, position)
      }
    },
    [leads, visibleStages, leadsByStage, onLeadMove]
  )

  // Handle drag cancel
  const handleDragCancel = useCallback(() => {
    setActiveId(null)
    setOverId(null)
  }, [])

  // Loading skeleton
  if (loading) {
    return (
      <div className={cn("flex gap-4 overflow-x-auto p-4", className)}>
        {visibleStages.slice(0, 5).map((stage) => (
          <div
            key={stage}
            className="flex-shrink-0 w-[300px] h-[400px] rounded-xl bg-[var(--bg-sunken)] animate-pulse"
          />
        ))}
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
    >
      <div
        className={cn(
          "flex gap-4 overflow-x-auto pb-4 px-1",
          className
        )}
      >
        {visibleStages.map((stage) => {
          const config = stageConfig[stage]
          const stageLeads = leadsByStage[stage] || []

          return (
            <KanbanColumn
              key={stage}
              stage={stage}
              leads={stageLeads}
              title={config.title}
              color={config.color}
              onLeadClick={onLeadClick}
              onAddLead={onAddLead}
              isOver={overId === stage}
            />
          )
        })}
      </div>

      {/* Drag Overlay */}
      <DragOverlay dropAnimation={null}>
        {activeLead ? <KanbanCardOverlay lead={activeLead} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

// Re-export components and types
export { KanbanColumn, stageConfig } from "./kanban-column"
export { KanbanCard, KanbanCardOverlay } from "./kanban-card"
export type { KanbanViewProps }
