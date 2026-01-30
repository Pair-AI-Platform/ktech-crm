"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Phone,
  Mail,
  MoreHorizontal,
  Undo2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  Search,
  Calendar,
  User,
  AlertTriangle,
} from "lucide-react"
import { SimpleTooltip } from "@/components/ui/tooltip"
import { PIPELINE_STAGES } from "@/types"
import { formatKuwaitPhone, getRelativeTime } from "@/lib/utils"
import { useDeletedLeadMutations, type DeletedLead } from "@/lib/hooks/use-deleted-leads"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DeletedLeadsTableProps {
  deletedLeads: DeletedLead[]
  loading?: boolean
  selectedLeads: string[]
  onSelectLead: (id: string) => void
  onSelectAll: () => void
  onRestoreSuccess?: () => void
}

type SortField = "name" | "deleted_at" | "pipeline_stage" | "deleted_by"
type SortDirection = "asc" | "desc"

interface SortButtonProps {
  field: SortField
  label: string
  sortField: SortField
  sortDirection: SortDirection
  onSort: (field: SortField) => void
}

function SortButton({ field, label, sortField, sortDirection, onSort }: SortButtonProps) {
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group"
    >
      <span>{label}</span>
      {sortField === field ? (
        sortDirection === "asc" ? (
          <ArrowUp className="w-3.5 h-3.5 text-[var(--primary)]" />
        ) : (
          <ArrowDown className="w-3.5 h-3.5 text-[var(--primary)]" />
        )
      ) : (
        <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  )
}

export function DeletedLeadsTable({
  deletedLeads,
  loading,
  selectedLeads,
  onSelectLead,
  onSelectAll,
  onRestoreSuccess,
}: DeletedLeadsTableProps) {
  const { restoreLead, permanentlyDeleteLead, loading: mutationLoading } = useDeletedLeadMutations()
  const [sortField, setSortField] = useState<SortField>("deleted_at")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedLeads = [...deletedLeads].sort((a, b) => {
    let comparison = 0
    switch (sortField) {
      case "name":
        comparison = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
        break
      case "deleted_at":
        const aTime = a.deleted_at ? new Date(a.deleted_at).getTime() : 0
        const bTime = b.deleted_at ? new Date(b.deleted_at).getTime() : 0
        comparison = aTime - bTime
        break
      case "pipeline_stage":
        const stageOrder = PIPELINE_STAGES.map(s => s.value)
        comparison = stageOrder.indexOf(a.pipeline_stage || "new") - stageOrder.indexOf(b.pipeline_stage || "new")
        break
      case "deleted_by":
        comparison = (a.deleted_by_profile?.full_name || "").localeCompare(b.deleted_by_profile?.full_name || "")
        break
    }
    return sortDirection === "asc" ? comparison : -comparison
  })

  const handleRestore = async (id: string) => {
    setRestoringId(id)
    const result = await restoreLead(id)
    setRestoringId(null)
    if (!result.error) {
      onRestoreSuccess?.()
    }
  }

  const handlePermanentDelete = async () => {
    if (!deleteConfirmId) return
    setDeletingId(deleteConfirmId)
    await permanentlyDeleteLead(deleteConfirmId)
    setDeletingId(null)
    setDeleteConfirmId(null)
  }

  const getStageColor = (stage: string | undefined) => {
    switch (stage) {
      case "new": return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case "visit": return "bg-purple-500/10 text-purple-600 border-purple-500/20"
      case "test": return "bg-orange-500/10 text-orange-600 border-orange-500/20"
      case "application": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      case "enrolled": return "bg-green-500/10 text-green-600 border-green-500/20"
      case "lost": return "bg-red-500/10 text-red-600 border-red-500/20"
      default: return "bg-gray-500/10 text-gray-600 border-gray-500/20"
    }
  }

  if (loading) {
    return (
      <Card className="p-12 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <p className="text-sm text-[var(--text-secondary)]">Loading deleted leads...</p>
      </Card>
    )
  }

  if (deletedLeads.length === 0) {
    return (
      <Card className="p-12 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[var(--bg-sunken)] flex items-center justify-center">
          <Trash2 className="w-8 h-8 text-[var(--text-tertiary)]" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">No deleted leads</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            When agents delete leads, they will appear here for you to review and restore if needed.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className="overflow-hidden border-[var(--border)]">
        {/* Table Header */}
        <div className="grid grid-cols-[auto_2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 bg-[var(--bg-sunken)] border-b border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedLeads.length === deletedLeads.length && deletedLeads.length > 0}
              onChange={onSelectAll}
              className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
            />
          </div>
          <SortButton field="name" label="Lead" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
          <SortButton field="pipeline_stage" label="Stage (at deletion)" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
          <SortButton field="deleted_by" label="Deleted By" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
          <SortButton field="deleted_at" label="Deleted At" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
          <div className="text-xs font-semibold text-[var(--text-secondary)]">Reason</div>
          <div className="text-xs font-semibold text-[var(--text-secondary)]">Actions</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-[var(--border)]">
          {sortedLeads.map((lead, index) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className={cn(
                "grid grid-cols-[auto_2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 items-center transition-colors",
                selectedLeads.includes(lead.id)
                  ? "bg-[var(--primary-muted)]"
                  : "hover:bg-[var(--bg-hover)]"
              )}
            >
              {/* Checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedLeads.includes(lead.id)}
                  onChange={() => onSelectLead(lead.id)}
                  className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
              </div>

              {/* Lead Info */}
              <div className="flex items-center gap-3 min-w-0">
                <Avatar size="sm">
                  <AvatarFallback className="bg-[var(--bg-sunken)] text-[var(--text-secondary)] text-xs font-semibold">
                    {lead.first_name?.[0]}{lead.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-[var(--text-primary)] truncate">
                    {lead.first_name} {lead.last_name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                    <Phone className="w-3 h-3" />
                    <span className="whitespace-nowrap">{formatKuwaitPhone(lead.phone)}</span>
                  </div>
                </div>
              </div>

              {/* Pipeline Stage at deletion */}
              <div>
                <Badge
                  variant="outline"
                  className={cn("text-xs", getStageColor(lead.pipeline_stage))}
                >
                  {PIPELINE_STAGES.find(s => s.value === lead.pipeline_stage)?.label || lead.pipeline_stage || "Unknown"}
                </Badge>
              </div>

              {/* Deleted By */}
              <div className="flex items-center gap-2">
                <Avatar size="xs">
                  <AvatarImage src={lead.deleted_by_profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {lead.deleted_by_profile?.full_name?.split(" ").map(n => n[0]).join("") || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-[var(--text-secondary)] truncate">
                  {lead.deleted_by_profile?.full_name || "Unknown"}
                </span>
              </div>

              {/* Deleted At */}
              <div className="text-sm text-[var(--text-secondary)]">
                <SimpleTooltip content={new Date(lead.deleted_at).toLocaleString()}>
                  <span className="cursor-help">{getRelativeTime(lead.deleted_at)}</span>
                </SimpleTooltip>
              </div>

              {/* Deletion Reason */}
              <div className="text-sm text-[var(--text-tertiary)] truncate">
                {lead.deletion_reason || "-"}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <SimpleTooltip content="Restore Lead">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRestore(lead.id)}
                    disabled={restoringId === lead.id || mutationLoading}
                    className="text-[var(--success)] hover:bg-[var(--success-bg)]"
                  >
                    {restoringId === lead.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Undo2 className="w-4 h-4" />
                    )}
                  </Button>
                </SimpleTooltip>
                <SimpleTooltip content="Permanently Delete">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleteConfirmId(lead.id)}
                    disabled={mutationLoading}
                    className="text-[var(--error)] hover:bg-[var(--error-bg)]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </SimpleTooltip>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[var(--error)]" />
              Permanently Delete Lead
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the lead
              and all associated data. The lead cannot be recovered after this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              disabled={!!deletingId}
              className="bg-[var(--error)] hover:bg-[var(--error)]/90"
            >
              {deletingId ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Permanently Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
