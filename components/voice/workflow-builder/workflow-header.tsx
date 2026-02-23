"use client"

import { useState } from "react"
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
  Sparkles,
  Save,
  Rocket,
  MoreVertical,
  Copy,
  Trash2,
  Archive,
  Clock,
  CheckCircle,
  Loader2,
  Edit3,
  X,
  Check,
  Phone,
  MessageSquare,
  Zap,
} from "lucide-react"

interface WorkflowHeaderProps {
  workflow: VoiceWorkflow
  onSave: () => void
  onDeploy: () => void
  onTitleChange: (title: string) => void
  onDuplicate?: () => void
  onDelete?: () => void
  onArchive?: () => void
  isSaving?: boolean
  isDeploying?: boolean
  hasUnsavedChanges?: boolean
  lastSavedAt?: Date
}

const modalityConfig = {
  voice: { label: "Voice", icon: Phone, color: "text-teal-600 bg-teal-50" },
  chat: { label: "Chat", icon: MessageSquare, color: "text-blue-600 bg-blue-50" },
  "multi-modal": { label: "Multi-modal", icon: Zap, color: "text-purple-600 bg-purple-50" },
}

export function WorkflowHeader({
  workflow,
  onSave,
  onDeploy,
  onTitleChange,
  onDuplicate,
  onDelete,
  onArchive,
  isSaving = false,
  isDeploying = false,
  hasUnsavedChanges = false,
  lastSavedAt,
}: WorkflowHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(workflow.name)

  const statusConfig = WORKFLOW_STATUS_CONFIG[workflow.status]
  const modality = modalityConfig[workflow.modality]
  const ModalityIcon = modality.icon

  const handleTitleSave = () => {
    if (titleValue.trim()) {
      onTitleChange(titleValue.trim())
    } else {
      setTitleValue(workflow.name)
    }
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave()
    } else if (e.key === "Escape") {
      setTitleValue(workflow.name)
      setIsEditingTitle(false)
    }
  }

  const formatLastSaved = () => {
    if (!lastSavedAt) return null
    const now = new Date()
    const diff = now.getTime() - lastSavedAt.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return lastSavedAt.toLocaleDateString()
  }

  return (
    <div className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between">
      {/* Left section - Title and badges */}
      <div className="flex items-center gap-4">
        {/* Agent icon */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-cyan-500 flex items-center justify-center shadow-lg shadow-[var(--primary)]/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>

        {/* Title */}
        <div className="flex items-center gap-3">
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="text-lg font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
                autoFocus
              />
              <button
                onClick={handleTitleSave}
                className="p-1 hover:bg-emerald-50 rounded text-emerald-600"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setTitleValue(workflow.name)
                  setIsEditingTitle(false)
                }}
                className="p-1 hover:bg-slate-100 rounded text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="group flex items-center gap-2"
            >
              <h1 className="text-lg font-semibold text-slate-800">
                {workflow.name}
              </h1>
              <Edit3 className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          {/* Badges */}
          <div className="flex items-center gap-2">
            {/* Modality badge */}
            <span className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
              modality.color
            )}>
              <ModalityIcon className="w-3.5 h-3.5" />
              {modality.label}
            </span>

            {/* Status badge */}
            <span className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
              workflow.status === "draft" && "bg-slate-100 text-slate-600",
              workflow.status === "published" && "bg-emerald-50 text-emerald-600",
              workflow.status === "archived" && "bg-slate-100 text-slate-400"
            )}>
              {workflow.status === "published" && <CheckCircle className="w-3.5 h-3.5" />}
              {statusConfig.label}
            </span>

            {/* Unsaved changes indicator */}
            {hasUnsavedChanges && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Unsaved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center gap-3">
        {/* Last saved */}
        {lastSavedAt && (
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatLastSaved()}
          </span>
        )}

        {/* Save button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={isSaving || !hasUnsavedChanges}
          className="gap-2"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save
        </Button>

        {/* Deploy button */}
        <Button
          size="sm"
          onClick={onDeploy}
          disabled={isDeploying || workflow.status === "archived"}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          {isDeploying ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Rocket className="w-4 h-4" />
          )}
          {workflow.status === "published" ? "Update" : "Deploy"}
        </Button>

        {/* More menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onDuplicate} className="gap-2">
              <Copy className="w-4 h-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {workflow.status !== "archived" && (
              <DropdownMenuItem onClick={onArchive} className="gap-2 text-amber-600">
                <Archive className="w-4 h-4" />
                Archive
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onDelete} className="gap-2 text-red-600">
              <Trash2 className="w-4 h-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
