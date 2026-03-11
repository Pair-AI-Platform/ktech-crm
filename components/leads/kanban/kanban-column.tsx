"use client"

import { memo, useMemo } from "react"
import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { KanbanCard } from "./kanban-card"
import type { Lead, PipelineStage } from "@/types"

interface KanbanColumnProps {
  stage: PipelineStage
  leads: Lead[]
  title: string
  color: string
  onLeadClick?: (lead: Lead) => void
  onAddLead?: (stage: PipelineStage) => void
  isOver?: boolean
  maxHeight?: string
}

// Stage metadata
export const stageConfig: Record<PipelineStage, { title: string; color: string; bgColor: string }> = {
  new: { title: "New", color: "bg-blue-500", bgColor: "bg-blue-50" },
  contacted: { title: "Contacted", color: "bg-yellow-500", bgColor: "bg-yellow-50" },
  visit: { title: "Visit", color: "bg-teal-500", bgColor: "bg-teal-50" },
  test: { title: "Test", color: "bg-indigo-500", bgColor: "bg-indigo-50" },
  application: { title: "File", color: "bg-orange-500", bgColor: "bg-orange-50" },
  applicant: { title: "Applicant", color: "bg-pink-500", bgColor: "bg-pink-50" },
  enrolled: { title: "Enrolled", color: "bg-green-500", bgColor: "bg-green-50" },
  lost: { title: "Lost", color: "bg-red-500", bgColor: "bg-red-50" },
  withdraw: { title: "Withdrawn", color: "bg-gray-500", bgColor: "bg-gray-50" },
  puc_document_submission: { title: "Doc Submission", color: "bg-cyan-500", bgColor: "bg-cyan-50" },
  puc_application_submission: { title: "App Submission", color: "bg-emerald-500", bgColor: "bg-emerald-50" },
}

export const KanbanColumn = memo(function KanbanColumn({
  stage,
  leads,
  title,
  color,
  onLeadClick,
  onAddLead,
  isOver = false,
  maxHeight = "calc(100vh - 280px)",
}: KanbanColumnProps) {
  const { setNodeRef, isOver: isDroppableOver } = useDroppable({
    id: stage,
    data: {
      type: "column",
      stage,
    },
  })

  const highlighted = isOver || isDroppableOver

  // Get lead IDs for sortable context
  const leadIds = useMemo(() => leads.map((l) => l.id), [leads])

  // Count statistics
  const totalValue = leads.length

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col min-w-[300px] w-[300px] rounded-xl",
        "bg-[var(--bg-sunken)] border border-[var(--border)]",
        "transition-all duration-200",
        highlighted && "ring-2 ring-[var(--primary)] ring-offset-2 bg-[var(--primary-muted)]/20"
      )}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn("w-3 h-3 rounded-full shrink-0", color)} />
            <h3 className="font-semibold text-[var(--text-primary)] text-sm">
              {title}
            </h3>
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-secondary)] border border-[var(--border)]">
              {totalValue}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {onAddLead && (
              <button
                onClick={() => onAddLead(stage)}
                className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                title={`Add lead to ${title}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            <button className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Column Content - Cards */}
      <div
        className="flex-1 p-2 space-y-2 overflow-y-auto"
        style={{ maxHeight }}
      >
        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
          <AnimatePresence mode="popLayout">
            {leads.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  "flex items-center justify-center py-8 rounded-lg border-2 border-dashed",
                  "text-[var(--text-tertiary)] text-sm",
                  highlighted
                    ? "border-[var(--primary)] bg-[var(--primary-muted)]/30"
                    : "border-[var(--border)]"
                )}
              >
                {highlighted ? (
                  <span className="text-[var(--primary)]">Drop here</span>
                ) : (
                  <span>No leads</span>
                )}
              </motion.div>
            ) : (
              leads.map((lead) => (
                <KanbanCard
                  key={lead.id}
                  lead={lead}
                  onClick={onLeadClick}
                />
              ))
            )}
          </AnimatePresence>
        </SortableContext>

        {/* Add Lead Button at Bottom */}
        {leads.length > 0 && onAddLead && (
          <button
            onClick={() => onAddLead(stage)}
            className={cn(
              "w-full py-2 rounded-lg border-2 border-dashed border-[var(--border)]",
              "text-[var(--text-tertiary)] text-sm font-medium",
              "hover:border-[var(--border-emphasis)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]",
              "transition-colors duration-200"
            )}
          >
            + Add lead
          </button>
        )}
      </div>
    </div>
  )
})

export type { KanbanColumnProps }
