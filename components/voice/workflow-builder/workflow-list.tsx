"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { VoiceWorkflow, WorkflowStatus } from "@/types"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/input"
import { WorkflowCard } from "./workflow-card"
import {
  Plus,
  LayoutGrid,
  List,
  Filter,
  Sparkles,
  Phone,
  Loader2,
} from "lucide-react"

interface WorkflowListProps {
  workflows: VoiceWorkflow[]
  isLoading?: boolean
  onSelect: (workflow: VoiceWorkflow) => void
  onCreate: () => void
  onDuplicate?: (workflow: VoiceWorkflow) => void
  onDelete?: (workflow: VoiceWorkflow) => void
  onArchive?: (workflow: VoiceWorkflow) => void
}

const statusFilters: { value: WorkflowStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
]

export function WorkflowList({
  workflows,
  isLoading = false,
  onSelect,
  onCreate,
  onDuplicate,
  onDelete,
  onArchive,
}: WorkflowListProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus | "all">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Filter workflows
  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesSearch =
      !search ||
      workflow.name.toLowerCase().includes(search.toLowerCase()) ||
      workflow.description?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === "all" || workflow.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Count by status
  const statusCounts = {
    all: workflows.length,
    draft: workflows.filter((w) => w.status === "draft").length,
    published: workflows.filter((w) => w.status === "published").length,
    archived: workflows.filter((w) => w.status === "archived").length,
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-cyan-500 flex items-center justify-center shadow-lg shadow-[var(--primary)]/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">Agent Workflows</h1>
              <p className="text-sm text-slate-500">Build and manage your AI conversation flows</p>
            </div>
          </div>

          <Button onClick={onCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Workflow
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* Status filter tabs */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    statusFilter === filter.value
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {filter.label}
                  <span className="ml-1.5 text-xs text-slate-400">
                    ({statusCounts[filter.value]})
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch("")}
              placeholder="Search workflows..."
              className="w-64"
            />

            {/* View toggle */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  viewMode === "grid"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  viewMode === "list"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            {workflows.length === 0 ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Phone className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No workflows yet</h3>
                <p className="text-sm text-slate-500 mb-6 max-w-md">
                  Create your first workflow to build AI-powered conversation flows for your voice agent.
                </p>
                <Button onClick={onCreate} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create First Workflow
                </Button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Filter className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No results found</h3>
                <p className="text-sm text-slate-500">
                  Try adjusting your search or filter criteria.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          )}>
            {filteredWorkflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                onSelect={() => onSelect(workflow)}
                onDuplicate={() => onDuplicate?.(workflow)}
                onDelete={() => onDelete?.(workflow)}
                onArchive={() => onArchive?.(workflow)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
