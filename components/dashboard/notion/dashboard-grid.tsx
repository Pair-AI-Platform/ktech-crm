"use client"

import { ReactNode } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface DashboardGridProps {
  mainColumnIds: string[]
  sidebarColumnIds: string[]
  renderBlock: (id: string) => ReactNode
  onDragEnd: (activeId: string, overId: string) => void
  className?: string
}

export function DashboardGrid({
  mainColumnIds,
  sidebarColumnIds,
  renderBlock,
  onDragEnd,
  className,
}: DashboardGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      onDragEnd(active.id as string, over.id as string)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className={cn(
          "grid grid-cols-1 lg:grid-cols-3 gap-6",
          className
        )}
      >
        {/* Main Column (2/3 width on lg) */}
        <div className="lg:col-span-2 space-y-4">
          <SortableContext
            items={mainColumnIds}
            strategy={verticalListSortingStrategy}
          >
            {mainColumnIds.map((id) => renderBlock(id))}
          </SortableContext>
        </div>

        {/* Sidebar Column (1/3 width on lg) */}
        <div className="space-y-4">
          <SortableContext
            items={sidebarColumnIds}
            strategy={verticalListSortingStrategy}
          >
            {sidebarColumnIds.map((id) => renderBlock(id))}
          </SortableContext>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId ? (
          <div className="opacity-80 shadow-2xl">
            {renderBlock(activeId)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

// Simple grid without drag-and-drop
interface SimpleGridProps {
  children: ReactNode
  columns?: 1 | 2 | 3 | 4
  gap?: "sm" | "md" | "lg"
  className?: string
}

export function SimpleGrid({
  children,
  columns = 2,
  gap = "md",
  className,
}: SimpleGridProps) {
  const cols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  }

  const gaps = {
    sm: "gap-3",
    md: "gap-4",
    lg: "gap-6",
  }

  return (
    <div className={cn("grid", cols[columns], gaps[gap], className)}>
      {children}
    </div>
  )
}

// Masonry-like layout for variable height blocks
interface MasonryGridProps {
  children: ReactNode[]
  columns?: 2 | 3
  gap?: "sm" | "md" | "lg"
  className?: string
}

export function MasonryGrid({
  children,
  columns = 2,
  gap = "md",
  className,
}: MasonryGridProps) {
  const gaps = {
    sm: "gap-3",
    md: "gap-4",
    lg: "gap-6",
  }

  // Split children into columns
  const columnArrays: ReactNode[][] = Array.from({ length: columns }, () => [])
  children.forEach((child, index) => {
    columnArrays[index % columns].push(child)
  })

  return (
    <div className={cn("flex", gaps[gap], className)}>
      {columnArrays.map((column, colIndex) => (
        <div key={colIndex} className={cn("flex-1 space-y-4", gaps[gap])}>
          {column}
        </div>
      ))}
    </div>
  )
}
