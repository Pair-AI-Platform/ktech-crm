"use client"

import { cn } from "@/lib/utils"
import { WorkflowActionType, WORKFLOW_ACTION_TYPES } from "@/types"
import {
  ArrowRight,
  Play,
  Zap,
  Tag,
  PhoneForwarded,
  PhoneOff,
} from "lucide-react"

interface ActionBadgeProps {
  type: WorkflowActionType
  value?: string
  size?: "xs" | "sm" | "md"
  className?: string
}

const iconMap = {
  ArrowRight,
  Play,
  Zap,
  Tag,
  PhoneForwarded,
  PhoneOff,
}

const colorMap: Record<WorkflowActionType, { bg: string; text: string; border: string }> = {
  proceed: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
  },
  run: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  trigger: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  mark: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  transfer: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  end_call: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
}

const sizeMap = {
  xs: "text-[10px] px-1.5 py-0.5 gap-0.5",
  sm: "text-xs px-2 py-0.5 gap-1",
  md: "text-sm px-2.5 py-1 gap-1.5",
}

export function ActionBadge({ type, value, size = "sm", className }: ActionBadgeProps) {
  const config = WORKFLOW_ACTION_TYPES.find((t) => t.value === type)
  const colors = colorMap[type]
  const IconComponent = iconMap[config?.icon as keyof typeof iconMap] || ArrowRight

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-md border",
        colors.bg,
        colors.text,
        colors.border,
        sizeMap[size],
        className
      )}
    >
      <IconComponent className={cn(
        size === "xs" ? "w-2.5 h-2.5" : size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"
      )} />
      {value ? (
        <span className="font-mono">{value}</span>
      ) : (
        <span>{config?.label || type}</span>
      )}
    </span>
  )
}

// Mark badge for @tags
interface MarkBadgeProps {
  tag: string
  size?: "xs" | "sm" | "md"
  className?: string
}

export function MarkBadge({ tag, size = "sm", className }: MarkBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-md border",
        "bg-emerald-50 text-emerald-700 border-emerald-200",
        sizeMap[size],
        className
      )}
    >
      <span className="font-mono">@{tag}</span>
    </span>
  )
}

// Combined badge that auto-detects type
interface WorkflowBadgeProps {
  type: WorkflowActionType
  value?: string
  size?: "xs" | "sm" | "md"
  className?: string
}

export function WorkflowBadge({ type, value, size = "sm", className }: WorkflowBadgeProps) {
  if (type === "mark" && value) {
    return <MarkBadge tag={value} size={size} className={className} />
  }
  return <ActionBadge type={type} value={value} size={size} className={className} />
}
