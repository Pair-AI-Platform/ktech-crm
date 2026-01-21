"use client"

import { cn } from "@/lib/utils"
import { VoiceWorkflow, WORKFLOW_STATUS_CONFIG } from "@/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Phone,
  MessageSquare,
  Zap,
  MoreVertical,
  Copy,
  Trash2,
  Archive,
  Edit,
  CheckCircle,
  Clock,
  GitBranch,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface WorkflowCardProps {
  workflow: VoiceWorkflow
  onSelect: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  onArchive?: () => void
}

const modalityConfig = {
  voice: { label: "Voice", icon: Phone, color: "text-teal-600 bg-teal-50" },
  chat: { label: "Chat", icon: MessageSquare, color: "text-blue-600 bg-blue-50" },
  "multi-modal": { label: "Multi-modal", icon: Zap, color: "text-purple-600 bg-purple-50" },
}

export function WorkflowCard({
  workflow,
  onSelect,
  onDuplicate,
  onDelete,
  onArchive,
}: WorkflowCardProps) {
  const statusConfig = WORKFLOW_STATUS_CONFIG[workflow.status]
  const modality = modalityConfig[workflow.modality]
  const ModalityIcon = modality.icon
  const stepsCount = workflow.steps?.length || 0

  return (
    <div
      className={cn(
        "group bg-white rounded-xl border border-slate-200 p-5 hover:border-[var(--primary)]/50 hover:shadow-lg hover:shadow-[var(--primary)]/5 transition-all cursor-pointer",
        workflow.is_default && "ring-2 ring-amber-500/20"
      )}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            workflow.status === "published" ? "bg-emerald-100" : "bg-slate-100"
          )}>
            <ModalityIcon className={cn(
              "w-5 h-5",
              workflow.status === "published" ? "text-emerald-600" : "text-slate-500"
            )} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-800">{workflow.name}</h3>
              {workflow.is_default && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold text-amber-600 bg-amber-100 rounded">
                  DEFAULT
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              v{workflow.version} {workflow.published_version && `(published v${workflow.published_version})`}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(); }} className="gap-2">
              <Edit className="w-4 h-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate?.(); }} className="gap-2">
              <Copy className="w-4 h-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {workflow.status !== "archived" && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive?.(); }} className="gap-2 text-amber-600">
                <Archive className="w-4 h-4" />
                Archive
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete?.(); }} className="gap-2 text-red-600">
              <Trash2 className="w-4 h-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Description */}
      {workflow.description && (
        <p className="text-sm text-slate-500 mb-4 line-clamp-2">
          {workflow.description}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <GitBranch className="w-4 h-4" />
          <span>{stepsCount} steps</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <Clock className="w-4 h-4" />
          <span>{formatDistanceToNow(new Date(workflow.updated_at), { addSuffix: true })}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        {/* Badges */}
        <div className="flex items-center gap-2">
          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
            modality.color
          )}>
            <ModalityIcon className="w-3 h-3" />
            {modality.label}
          </span>

          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
            workflow.status === "draft" && "bg-slate-100 text-slate-600",
            workflow.status === "published" && "bg-emerald-50 text-emerald-600",
            workflow.status === "archived" && "bg-slate-100 text-slate-400"
          )}>
            {workflow.status === "published" && <CheckCircle className="w-3 h-3" />}
            {statusConfig.label}
          </span>
        </div>

        {/* Edit button on hover */}
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity gap-2"
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
        >
          <Edit className="w-4 h-4" />
          Edit
        </Button>
      </div>
    </div>
  )
}
