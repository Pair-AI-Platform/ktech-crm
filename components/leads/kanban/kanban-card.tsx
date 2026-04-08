"use client"

import { memo, useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { motion } from "framer-motion"
import {
  Phone,
  Mail,
  Calendar,
  GraduationCap,
  Clock,
  AlertCircle,
  ExternalLink,
} from "lucide-react"
import { cn, getInitials } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { Lead, PipelineStage } from "@/types"
import { formatDistanceToNow } from "date-fns"

interface KanbanCardProps {
  lead: Lead
  onClick?: (lead: Lead) => void
  isDragging?: boolean
}

// Stage color mapping
const stageColors: Record<PipelineStage, string> = {
  new: "bg-blue-500",
  contacted: "bg-yellow-500",
  visit: "bg-teal-500",
  test: "bg-indigo-500",
  application: "bg-orange-500",
  applicant: "bg-pink-500",
  enrolled: "bg-green-500",
  lost: "bg-red-500",
  withdraw: "bg-gray-500",
  puc_document_submission: "bg-cyan-500",
  puc_application_submission: "bg-emerald-500",
}

// Status badge variants
const statusVariants: Record<string, { bg: string; text: string }> = {
  no_answer: { bg: "bg-amber-100", text: "text-amber-700" },
  callback: { bg: "bg-blue-100", text: "text-blue-700" },
  interested: { bg: "bg-green-100", text: "text-green-700" },
  not_interested: { bg: "bg-red-100", text: "text-red-700" },
  confirmed: { bg: "bg-emerald-100", text: "text-emerald-700" },
  will_see: { bg: "bg-purple-100", text: "text-purple-700" },
  wrong_number: { bg: "bg-gray-100", text: "text-gray-700" },
}

export const KanbanCard = memo(function KanbanCard({
  lead,
  onClick,
  isDragging = false,
}: KanbanCardProps) {
  const [showActions, setShowActions] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: lead.id,
    data: {
      type: "lead",
      lead,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const displayDragging = isDragging || isSortableDragging

  // Format the lead name (Arabic only)
  const fullName = [lead.first_name_ar, lead.last_name_ar].filter(Boolean).join(" ") || "Untitled Lead"
  const initials = getInitials(lead.first_name_ar || '', lead.last_name_ar || '')

  // Get the highest GPA available
  const gpa = lead.gpa_grade_12_expected ?? lead.gpa_grade_11 ?? lead.gpa_grade_10

  // Format last activity
  const lastActivity = lead.updated_at
    ? formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true })
    : null

  // Check for upcoming appointment
  const upcomingAppointment = lead.appointments?.find(
    (apt) => new Date(apt.scheduled_date) > new Date() && apt.status !== "cancelled"
  )

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "group bg-[var(--bg-surface)] rounded-lg border border-[var(--border)]",
        "cursor-grab active:cursor-grabbing",
        "hover:border-[var(--border-emphasis)] hover:shadow-[var(--shadow-md)]",
        "transition-all duration-200",
        displayDragging && "opacity-50 shadow-2xl scale-105 rotate-2 z-50"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={() => onClick?.(lead)}
    >
      {/* Card Content */}
      <div className="p-3 space-y-3">
        {/* Header: Name + Avatar */}
        <div className="flex items-start gap-3">
          {lead.pipeline_stage === "contacted" ? (
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full ring-[3px] ring-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 font-bold text-sm">
              {lead.contact_count || 0}
            </div>
          ) : (
            <Avatar size="sm">
              <AvatarFallback className="bg-[var(--primary-muted)] text-[var(--primary)] text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-[var(--text-primary)] truncate text-sm">
              {fullName}
            </h4>
            {lead.school && (
              <p className="text-xs text-[var(--text-tertiary)] truncate flex items-center gap-1">
                <GraduationCap className="w-3 h-3 shrink-0" />
                {lead.school.replace(/_/g, " ")}
              </p>
            )}
          </div>

          {/* Actions Menu (show on hover) */}
          <button
            className={cn(
              "p-1 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]",
              "transition-opacity duration-200",
              showActions ? "opacity-100" : "opacity-0"
            )}
            onClick={(e) => {
              e.stopPropagation()
              onClick?.(lead)
            }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Contact Info */}
        <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
          {lead.phone && (
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <span className="truncate max-w-[80px]">{lead.phone}</span>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              <span className="truncate max-w-[80px]">{lead.email}</span>
            </div>
          )}
        </div>

        {/* Badges Row */}
        <div className="flex flex-wrap gap-1.5">
          {/* Status Badge */}
          {lead.status && (
            <span
              className={cn(
                "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium",
                statusVariants[lead.status]?.bg || "bg-gray-100",
                statusVariants[lead.status]?.text || "text-gray-700"
              )}
            >
              {lead.status.replace(/_/g, " ")}
            </span>
          )}

          {/* GPA Badge */}
          {gpa !== undefined && gpa !== null && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--primary-muted)] text-[var(--primary)]">
              GPA: {gpa.toFixed(1)}%
            </span>
          )}

          {/* Funding Type Badge */}
          {lead.funding_type === "puc" && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">
              PUC
            </span>
          )}

          {/* Ministry Blocked */}
          {lead.ministry_blocked && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">
              <AlertCircle className="w-2.5 h-2.5" />
              Blocked
            </span>
          )}
        </div>

        {/* Upcoming Appointment */}
        {upcomingAppointment && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-[var(--bg-sunken)] text-xs">
            <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span className="text-[var(--text-secondary)]">
              {new Date(upcomingAppointment.scheduled_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}

        {/* Footer: Last Activity */}
        {lastActivity && (
          <div className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)] pt-1 border-t border-[var(--border)]">
            <Clock className="w-3 h-3" />
            <span>Updated {lastActivity}</span>
          </div>
        )}
      </div>

      {/* Drag Handle Indicator */}
      <div
        className={cn(
          "h-1 rounded-b-lg transition-colors duration-200",
          stageColors[lead.pipeline_stage] || "bg-gray-400"
        )}
      />
    </motion.div>
  )
})

// Lightweight card for drag overlay
export function KanbanCardOverlay({ lead }: { lead: Lead }) {
  const fullName = [lead.first_name_ar, lead.last_name_ar].filter(Boolean).join(" ") || "Untitled Lead"
  const initials = getInitials(lead.first_name_ar || '', lead.last_name_ar || '')

  return (
    <div className="bg-[var(--bg-surface)] rounded-lg border-2 border-[var(--primary)] shadow-2xl p-3 w-72">
      <div className="flex items-center gap-3">
        {lead.pipeline_stage === "contacted" ? (
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full ring-[3px] ring-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 font-bold text-sm">
            {lead.contact_count || 0}
          </div>
        ) : (
          <Avatar size="sm">
            <AvatarFallback className="bg-[var(--primary-muted)] text-[var(--primary)] text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-[var(--text-primary)] truncate text-sm">
            {fullName}
          </h4>
          <p className="text-xs text-[var(--text-tertiary)]">
            Moving to new stage...
          </p>
        </div>
      </div>
    </div>
  )
}

export type { KanbanCardProps }
