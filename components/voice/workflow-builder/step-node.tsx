"use client"

import { memo } from "react"
import { Handle, Position } from "@xyflow/react"
import { cn } from "@/lib/utils"
import { VoiceWorkflowStep, VoiceWorkflowCondition } from "@/types"
import { WorkflowBadge } from "./action-badge"
import {
  MessageSquare,
  Play,
  Flag,
  MoreHorizontal,
  GripVertical,
  ChevronRight,
} from "lucide-react"

interface StepNodeData extends VoiceWorkflowStep {
  isSelected?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

interface StepNodeProps {
  data: StepNodeData
  selected?: boolean
}

function StepNodeComponent({ data, selected }: StepNodeProps) {
  const isEntryPoint = data.is_entry_point
  const isTerminal = data.is_terminal
  const conditions = data.conditions || []

  // Truncate message for preview
  const truncatedMessage = data.message?.length > 120
    ? data.message.substring(0, 120) + "..."
    : data.message

  return (
    <div
      className={cn(
        "bg-white rounded-xl border-2 shadow-sm min-w-[320px] max-w-[400px] transition-all",
        selected || data.isSelected
          ? "border-[var(--primary)] shadow-lg shadow-[var(--primary)]/10"
          : "border-slate-200 hover:border-slate-300",
        isEntryPoint && "ring-2 ring-emerald-500/20",
        isTerminal && "ring-2 ring-red-500/20"
      )}
    >
      {/* Input handle */}
      {!isEntryPoint && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-slate-300 !border-2 !border-white hover:!bg-[var(--primary)]"
        />
      )}

      {/* Header */}
      <div className={cn(
        "px-4 py-3 border-b flex items-center justify-between",
        isEntryPoint ? "bg-emerald-50/50 border-emerald-100" :
        isTerminal ? "bg-red-50/50 border-red-100" :
        "bg-slate-50/50 border-slate-100"
      )}>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold",
            isEntryPoint ? "bg-emerald-100 text-emerald-700" :
            isTerminal ? "bg-red-100 text-red-700" :
            "bg-slate-200 text-slate-600"
          )}>
            {isEntryPoint ? <Play className="w-3.5 h-3.5" /> :
             isTerminal ? <Flag className="w-3.5 h-3.5" /> :
             data.step_number}
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 text-sm leading-tight">
              {isEntryPoint && <span className="text-emerald-600">Start: </span>}
              {isTerminal && <span className="text-red-600">End: </span>}
              {data.name}
            </h4>
          </div>
        </div>
        <button className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Message Content */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 rounded bg-[var(--primary-muted)] flex items-center justify-center flex-shrink-0 mt-0.5">
            <MessageSquare className="w-3 h-3 text-[var(--primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 font-medium mb-1">Say:</p>
            <p className="text-sm text-slate-600 leading-relaxed">
              "{truncatedMessage}"
            </p>
          </div>
        </div>
      </div>

      {/* Conditions */}
      {conditions.length > 0 && (
        <div className="px-4 py-3 space-y-2">
          {conditions.slice(0, 3).map((condition: VoiceWorkflowCondition, index: number) => (
            <div key={condition.id || index} className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium w-4">If:</span>
              <span className="text-slate-600 flex-1 truncate">
                {condition.condition_label}
              </span>
              <WorkflowBadge
                type={condition.action_type}
                value={condition.action_value}
                size="xs"
              />
              {condition.target_step_id && (
                <ChevronRight className="w-3 h-3 text-slate-300" />
              )}
            </div>
          ))}
          {conditions.length > 3 && (
            <p className="text-xs text-slate-400 pl-6">
              +{conditions.length - 3} more conditions
            </p>
          )}
        </div>
      )}

      {/* Output handles for each condition */}
      {!isTerminal && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-[var(--primary)] !border-2 !border-white"
        />
      )}
    </div>
  )
}

export const StepNode = memo(StepNodeComponent)
