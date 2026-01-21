"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { InlineTagSelect, type TagOption } from "@/components/ui/notion-tag-select"
import {
  Phone,
  Mail,
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
  Flame,
  Thermometer,
  Snowflake,
  FileText,
  Plus,
  Lock,
  Send,
  BookOpen,
  ClipboardCheck
} from "lucide-react"
import { SimpleTooltip } from "@/components/ui/tooltip"
import { PIPELINE_STAGES, LEAD_SOURCES, SCHOOLS, LEAD_STATUSES, LOCKED_STAGES, SUBMISSION_SUBSTAGES, SUBMISSION_STATUSES, type Lead, type PipelineStage, type LeadStatus, type SubmissionSubstage, type SubmissionStatus } from "@/types"
import { formatKuwaitPhone, getRelativeTime } from "@/lib/utils"
import { useLeadMutations } from "@/lib/hooks/use-leads"
import { AppointmentBooking } from "@/components/calendar/appointment-booking"
import { PSPSubmissionWizard } from "@/components/leads/psp-submission-wizard"

interface LeadTableProps {
  leads: Lead[]
  loading?: boolean
  selectedLeads: string[]
  onSelectLead: (id: string) => void
  onSelectAll: () => void
  onLeadClick?: (lead: Lead) => void
  onEditLead?: (lead: Lead) => void
  currentStageFilter?: PipelineStage | "all"
}

type SortField = "name" | "updated_at" | "pipeline_stage" | "source" | "school"
type SortDirection = "asc" | "desc"
type LeadTemperature = "hot" | "warm" | "cold"

// Calculate lead temperature based on activity and pipeline stage
function getLeadTemperature(lead: Lead): { temperature: LeadTemperature; description: string } {
  const now = Date.now()
  const daysSinceContact = lead.last_contacted_at
    ? Math.floor((now - new Date(lead.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24))
    : null

  // HOT: contacted in last 3 days AND in advanced pipeline stages
  if (
    daysSinceContact !== null &&
    daysSinceContact <= 3 &&
    ["visit", "test", "application"].includes(lead.pipeline_stage)
  ) {
    return {
      temperature: "hot",
      description: "Recently contacted (last 3 days) and actively progressing through the pipeline. High priority for follow-up."
    }
  }

  // WARM: contacted in last 7 days OR in early active stages with recent contact
  if (
    daysSinceContact !== null &&
    daysSinceContact <= 7 &&
    ["visit", "test"].includes(lead.pipeline_stage)
  ) {
    return {
      temperature: "warm",
      description: "Engaged within the past week and showing interest. Good candidate for nurturing and next steps."
    }
  }

  // COLD: no contact OR not contacted in 14+ days OR stuck in new/lost
  if (
    daysSinceContact === null ||
    daysSinceContact > 14 ||
    ["new", "lost"].includes(lead.pipeline_stage)
  ) {
    return {
      temperature: "cold",
      description: "No recent contact (14+ days) or never contacted. Needs re-engagement or may be unresponsive."
    }
  }

  // Default to warm for anything in between
  return {
    temperature: "warm",
    description: "Moderately engaged. Consider scheduling follow-up to maintain momentum."
  }
}

const temperatureConfig = {
  hot: {
    icon: Flame,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    ring: "ring-orange-500",
    ringBg: "ring-orange-500/30"
  },
  warm: {
    icon: Thermometer,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    ring: "ring-amber-500",
    ringBg: "ring-amber-500/30"
  },
  cold: {
    icon: Snowflake,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
    ring: "ring-blue-400",
    ringBg: "ring-blue-400/30"
  }
}

export function LeadTable({
  leads,
  loading,
  selectedLeads,
  onSelectLead,
  onSelectAll,
  onLeadClick,
  onEditLead,
  currentStageFilter
}: LeadTableProps) {
  const { updateLeadStage, updateLead, deleteLead, loading: mutationLoading } = useLeadMutations()
  const [sortField, setSortField] = useState<SortField>("updated_at")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [editingStage, setEditingStage] = useState<string | null>(null)
  const [editingSource, setEditingSource] = useState<string | null>(null)
  const [editingSchool, setEditingSchool] = useState<string | null>(null)
  const [editingStatus, setEditingStatus] = useState<string | null>(null)
  const [editingSubmissionSubstage, setEditingSubmissionSubstage] = useState<string | null>(null)
  const [editingSubmissionStatus, setEditingSubmissionStatus] = useState<string | null>(null)
  const [bookingLead, setBookingLead] = useState<Lead | null>(null)
  const [bookingSimpleMode, setBookingSimpleMode] = useState(false)
  const [pspWizardLead, setPspWizardLead] = useState<Lead | null>(null)

  // Check if we're viewing submission stage
  const isSubmissionView = currentStageFilter === 'submission'

  // Optimistic updates - store pending changes locally
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, Partial<Lead>>>({})

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedLeads = [...leads].sort((a, b) => {
    let comparison = 0
    switch (sortField) {
      case "name":
        comparison = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
        break
      case "updated_at":
        const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0
        const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0
        comparison = aTime - bTime
        break
      case "pipeline_stage":
        const stageOrder = PIPELINE_STAGES.map(s => s.value)
        comparison = stageOrder.indexOf(a.pipeline_stage) - stageOrder.indexOf(b.pipeline_stage)
        break
      case "source":
        comparison = a.source.localeCompare(b.source)
        break
      case "school":
        comparison = (a.school || "").localeCompare(b.school || "")
        break
    }
    return sortDirection === "asc" ? comparison : -comparison
  })

  const handleStageChange = async (leadId: string, newStage: PipelineStage) => {
    // Optimistic update - immediately show the new value
    // If changing to 'new', 'visit', 'test', or 'appointment' stage, also clear the status
    const shouldClearStatus = newStage === 'new' || newStage === 'visit' || newStage === 'test' || newStage === 'appointment'
    if (shouldClearStatus) {
      setPendingUpdates(prev => ({
        ...prev,
        [leadId]: { ...prev[leadId], pipeline_stage: newStage, status: undefined as unknown as LeadStatus }
      }))
    } else {
      setPendingUpdates(prev => ({ ...prev, [leadId]: { ...prev[leadId], pipeline_stage: newStage } }))
    }
    setEditingStage(leadId)

    // If changing to 'new' or 'test' stage, update both stage and clear status
    let result
    if (shouldClearStatus) {
      result = await updateLead(leadId, { pipeline_stage: newStage, status: undefined as unknown as LeadStatus })
    } else {
      result = await updateLeadStage(leadId, newStage)
    }

    setEditingStage(null)
    // Clear pending update after API call (whether success or failure)
    // On success, the real-time subscription will update with actual data
    // On failure, we revert by clearing the pending update
    if (result.error) {
      setPendingUpdates(prev => {
        const updated = { ...prev }
        if (updated[leadId]) {
          delete updated[leadId].pipeline_stage
          if (shouldClearStatus) {
            delete updated[leadId].status
          }
          if (Object.keys(updated[leadId]).length === 0) {
            delete updated[leadId]
          }
        }
        return updated
      })
    } else {
      // If stage changed to appointment, open appointment booking popup in simple mode (date/time only)
      if (newStage === 'appointment') {
        const lead = leads.find(l => l.id === leadId)
        if (lead) {
          setBookingSimpleMode(true)
          setBookingLead(lead)
        }
      }
    }
  }

  const handleSourceChange = async (leadId: string, newSource: string) => {
    // Optimistic update
    setPendingUpdates(prev => ({ ...prev, [leadId]: { ...prev[leadId], source: newSource as Lead['source'] } }))
    setEditingSource(leadId)

    const result = await updateLead(leadId, { source: newSource as Lead['source'] })

    setEditingSource(null)
    if (result.error) {
      setPendingUpdates(prev => {
        const updated = { ...prev }
        if (updated[leadId]) {
          delete updated[leadId].source
          if (Object.keys(updated[leadId]).length === 0) {
            delete updated[leadId]
          }
        }
        return updated
      })
    }
  }

  const handleSchoolChange = async (leadId: string, newSchool: string) => {
    // Optimistic update
    setPendingUpdates(prev => ({ ...prev, [leadId]: { ...prev[leadId], school: newSchool as Lead['school'] } }))
    setEditingSchool(leadId)

    const result = await updateLead(leadId, { school: newSchool as Lead['school'] })

    setEditingSchool(null)
    if (result.error) {
      setPendingUpdates(prev => {
        const updated = { ...prev }
        if (updated[leadId]) {
          delete updated[leadId].school
          if (Object.keys(updated[leadId]).length === 0) {
            delete updated[leadId]
          }
        }
        return updated
      })
    }
  }

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    // Optimistic update
    setPendingUpdates(prev => ({ ...prev, [leadId]: { ...prev[leadId], status: newStatus } }))
    setEditingStatus(leadId)

    const result = await updateLead(leadId, { status: newStatus })

    setEditingStatus(null)
    if (result.error) {
      setPendingUpdates(prev => {
        const updated = { ...prev }
        if (updated[leadId]) {
          delete updated[leadId].status
          if (Object.keys(updated[leadId]).length === 0) {
            delete updated[leadId]
          }
        }
        return updated
      })
    } else {
      // If status changed to Callback, open appointment booking popup (full wizard for callback type)
      if (newStatus === 'callback') {
        const lead = leads.find(l => l.id === leadId)
        if (lead) {
          setBookingSimpleMode(false)
          setBookingLead(lead)
        }
      }
    }
  }

  const handleSubmissionSubstageChange = async (leadId: string, newSubstage: SubmissionSubstage) => {
    // Optimistic update
    setPendingUpdates(prev => ({ ...prev, [leadId]: { ...prev[leadId], submission_substage: newSubstage } }))
    setEditingSubmissionSubstage(leadId)

    const result = await updateLead(leadId, { submission_substage: newSubstage })

    setEditingSubmissionSubstage(null)
    if (result.error) {
      setPendingUpdates(prev => {
        const updated = { ...prev }
        if (updated[leadId]) {
          delete updated[leadId].submission_substage
          if (Object.keys(updated[leadId]).length === 0) {
            delete updated[leadId]
          }
        }
        return updated
      })
    }
  }

  const handleSubmissionStatusChange = async (leadId: string, newStatus: SubmissionStatus) => {
    // Optimistic update
    setPendingUpdates(prev => ({ ...prev, [leadId]: { ...prev[leadId], submission_status: newStatus } }))
    setEditingSubmissionStatus(leadId)

    const result = await updateLead(leadId, { submission_status: newStatus })

    setEditingSubmissionStatus(null)
    if (result.error) {
      setPendingUpdates(prev => {
        const updated = { ...prev }
        if (updated[leadId]) {
          delete updated[leadId].submission_status
          if (Object.keys(updated[leadId]).length === 0) {
            delete updated[leadId]
          }
        }
        return updated
      })
    } else {
      // If status changed to Appointment, open appointment booking popup
      if (newStatus === 'appointment') {
        const lead = leads.find(l => l.id === leadId)
        if (lead) {
          setBookingSimpleMode(false)
          setBookingLead(lead)
        }
      }
    }
  }

  // Helper to get effective value with pending updates
  const getEffectiveValue = <K extends keyof Lead>(leadId: string, field: K, originalValue: Lead[K]): Lead[K] => {
    const pending = pendingUpdates[leadId]
    if (pending && field in pending) {
      return pending[field] as Lead[K]
    }
    return originalValue
  }

  // Clear pending updates only for leads that have been updated in the new data
  // This prevents clearing pending updates while the API call is still in progress
  useEffect(() => {
    setPendingUpdates(prev => {
      if (Object.keys(prev).length === 0) return prev

      const updated = { ...prev }
      // Only clear pending updates for leads where the server data matches the pending value
      for (const leadId of Object.keys(prev)) {
        const lead = leads.find(l => l.id === leadId)
        const pending = prev[leadId]
        if (lead && pending) {
          let shouldClear = true
          // Check if all pending fields now match the server data
          for (const field of Object.keys(pending) as (keyof Lead)[]) {
            if (lead[field] !== pending[field]) {
              shouldClear = false
              break
            }
          }
          if (shouldClear) {
            delete updated[leadId]
          }
        }
      }
      return updated
    })
  }, [leads])

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-50" />
    }
    return sortDirection === "asc"
      ? <ArrowUp className="w-3.5 h-3.5 ml-1 text-[var(--primary)]" />
      : <ArrowDown className="w-3.5 h-3.5 ml-1 text-[var(--primary)]" />
  }

  if (loading) {
    return (
      <Card className="flex items-center justify-center py-24" elevated>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--primary-muted)] to-[var(--bg-sunken)] flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-[var(--primary)]" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-[var(--primary)] opacity-20 animate-ping" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--text-primary)]">Loading leads</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Please wait...</p>
          </div>
        </motion.div>
      </Card>
    )
  }

  if (leads.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-24" elevated>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--bg-sunken)] to-[var(--bg-surface)] flex items-center justify-center mb-5 mx-auto border border-[var(--border)]">
            <Search className="w-9 h-9 text-[var(--text-muted)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No leads found</h3>
          <p className="text-sm text-[var(--text-muted)] max-w-xs">
            Try adjusting your filters or add a new lead to get started
          </p>
        </motion.div>
      </Card>
    )
  }

  return (
    <>
    <Card className="overflow-hidden border-[var(--border)] flex-1 flex flex-col min-h-0 h-full" elevated>
      <div className="overflow-auto flex-1 min-h-0 h-full">
        <table className="w-full h-full">
          <thead>
            <tr className="border-b border-[var(--border)] bg-gradient-to-r from-[var(--bg-sunken)] to-[var(--bg-surface)]">
              <th className="p-4 text-left w-12">
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === leads.length && leads.length > 0}
                    onChange={onSelectAll}
                    className="w-4 h-4 rounded-md border-2 border-[var(--border)] bg-[var(--bg-surface)] text-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-muted)] focus:ring-offset-0 cursor-pointer transition-all hover:border-[var(--primary)]"
                  />
                </div>
              </th>
              <th className="p-4 text-left">
                <button
                  onClick={() => handleSort("name")}
                  className="flex items-center text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors group"
                >
                  Lead
                  <span className="group-hover:scale-110 transition-transform">{getSortIcon("name")}</span>
                </button>
              </th>
              <th className="p-4 text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Contact
                </span>
              </th>
              {/* Submission-specific columns */}
              {isSubmissionView ? (
                <>
                  <th className="p-4 text-left">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Stage
                    </span>
                  </th>
                  <th className="p-4 text-left">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Substage
                    </span>
                  </th>
                  <th className="p-4 text-left">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Status
                    </span>
                  </th>
                  <th className="p-4 text-left">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Agent
                    </span>
                  </th>
                </>
              ) : (
                <>
                  <th className="p-4 text-left">
                    <button
                      onClick={() => handleSort("source")}
                      className="flex items-center text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors group"
                    >
                      Source
                      <span className="group-hover:scale-110 transition-transform">{getSortIcon("source")}</span>
                    </button>
                  </th>
                  <th className="p-4 text-left">
                    <button
                      onClick={() => handleSort("pipeline_stage")}
                      className="flex items-center text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors group"
                    >
                      Stage
                      <span className="group-hover:scale-110 transition-transform">{getSortIcon("pipeline_stage")}</span>
                    </button>
                  </th>
                  <th className="p-4 text-left">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Status
                    </span>
                  </th>
                  <th className="p-4 text-left">
                    <button
                      onClick={() => handleSort("school")}
                      className="flex items-center text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors group"
                    >
                      School
                      <span className="group-hover:scale-110 transition-transform">{getSortIcon("school")}</span>
                    </button>
                  </th>
                  <th className="p-4 text-left">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Expected GPA
                    </span>
                  </th>
                  <th className="p-4 text-left">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Actual Lead
                    </span>
                  </th>
                </>
              )}
              <th className="p-4 text-left">
                <button
                  onClick={() => handleSort("updated_at")}
                  className="flex items-center text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors group"
                >
                  Last Updated
                  <span className="group-hover:scale-110 transition-transform">{getSortIcon("updated_at")}</span>
                </button>
              </th>
              <th className="p-4 text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedLeads.map((lead, index) => {
              const stageInfo = PIPELINE_STAGES.find((s) => s.value === lead.pipeline_stage)
              const sourceInfo = LEAD_SOURCES.find((s) => s.value === lead.source)
              const schoolInfo = SCHOOLS.find((s) => s.value === lead.school)
              const isSelected = selectedLeads.includes(lead.id)

              return (
                <motion.tr
                  key={lead.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.015 }}
                  onClick={() => isSubmissionView && onLeadClick?.(lead)}
                  className={cn(
                    "border-b border-[var(--border)] transition-all duration-150 group/row",
                    isSubmissionView && "cursor-pointer",
                    // Submission stage + blocked = RED (critical blocking)
                    lead.pipeline_stage === 'submission' && lead.ministry_blocked
                      ? "bg-red-50 dark:bg-red-950/30 border-l-2 border-l-red-500"
                      : lead.ministry_blocked
                        ? "bg-orange-50 dark:bg-orange-950/30 border-l-2 border-l-orange-500"
                        // Submission stage + ready substage = GREEN (ready to submit)
                        : lead.pipeline_stage === 'submission' && lead.submission_substage === 'ready'
                          ? "bg-emerald-50 dark:bg-emerald-950/30 border-l-2 border-l-emerald-500"
                          : lead.pipeline_stage === 'submission'
                            ? "bg-blue-50 dark:bg-blue-950/30 border-l-2 border-l-blue-400"
                            : isSelected
                                ? "bg-[var(--primary-muted)] border-l-2 border-l-[var(--primary)]"
                                : "hover:bg-[var(--bg-hover)] border-l-2 border-l-transparent hover:border-l-[var(--border-emphasis)]"
                  )}
                >
                  <td className="p-4">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectLead(lead.id)}
                        className="w-4 h-4 rounded-md border-2 border-[var(--border)] bg-[var(--bg-surface)] text-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-muted)] focus:ring-offset-0 cursor-pointer transition-all hover:border-[var(--primary)]"
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    {(() => {
                      const { temperature, description } = getLeadTemperature(lead)
                      const config = temperatureConfig[temperature]
                      const Icon = config.icon
                      const tempLabel = temperature === "hot" ? "Hot" : temperature === "warm" ? "Warm" : "Cold"
                      return (
                        <Link href={`/leads/${lead.id}${currentStageFilter && currentStageFilter !== "all" ? `?stage=${currentStageFilter}` : ""}`} className="flex items-center gap-3 group">
                          <SimpleTooltip
                            content={
                              <div className="max-w-[250px]">
                                <div className="flex items-center gap-2 mb-1">
                                  <Icon className={cn("w-4 h-4 flex-shrink-0", config.color)} />
                                  <span className="font-semibold">{tempLabel} Lead</span>
                                </div>
                                <p className="text-xs text-[var(--text-muted)] whitespace-normal break-words">{description}</p>
                              </div>
                            }
                            side="right"
                          >
                            <div className="relative cursor-help">
                              <Avatar size="sm" className={cn(
                                "ring-[3px] transition-all",
                                config.ring,
                                "group-hover:ring-4"
                              )}>
                                <AvatarFallback className="bg-gradient-to-br from-[var(--bg-sunken)] to-[var(--bg-surface)] text-[var(--text-secondary)] font-semibold text-xs">
                                  {lead.first_name?.[0]}{lead.last_name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          </SimpleTooltip>
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors truncate">
                              {lead.first_name} {lead.last_name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Badge
                                variant={lead.funding_type === "puc" ? "solid-primary" : "secondary"}
                                size="xs"
                                shape="pill"
                              >
                                {lead.funding_type === "puc" ? "PUC" : "SF"}
                              </Badge>
                              {lead.is_kuwaiti && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent-muted)] text-[var(--accent)] font-medium">KW</span>
                              )}
                              {lead.ministry_blocked && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 font-medium">
                                  Blocked
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      )
                    })()}
                  </td>
                  <td className="p-4">
                    <div className="space-y-1.5">
                      <a
                        href={`tel:+965${lead.phone}`}
                        className="flex items-center gap-2 text-sm text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors group"
                      >
                        <div className="w-6 h-6 rounded-lg bg-[var(--bg-sunken)] flex items-center justify-center group-hover:bg-[var(--primary-muted)] transition-colors">
                          <Phone className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--primary)]" />
                        </div>
                        <span className="font-medium">{formatKuwaitPhone(lead.phone)}</span>
                      </a>
                      {lead.phone_secondary && (
                        <a
                          href={`tel:+965${lead.phone_secondary}`}
                          className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors group"
                        >
                          <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                            <Phone className="w-3 h-3 text-blue-500" />
                          </div>
                          <span className="font-medium">{formatKuwaitPhone(lead.phone_secondary)}</span>
                        </a>
                      )}
                      {lead.email && (
                        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                          <div className="w-6 h-6 rounded-lg bg-[var(--bg-sunken)] flex items-center justify-center">
                            <Mail className="w-3 h-3" />
                          </div>
                          <span className="truncate max-w-[120px]">{lead.email}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  {/* Submission-specific columns */}
                  {isSubmissionView ? (
                    <>
                      {/* Stage column */}
                      <td className="p-4">
                        {(() => {
                          const currentStage = getEffectiveValue(lead.id, 'pipeline_stage', lead.pipeline_stage) as PipelineStage
                          const isStageLocked = LOCKED_STAGES.includes(currentStage)
                          const stageInfo = PIPELINE_STAGES.find(s => s.value === currentStage)

                          if (isStageLocked && stageInfo) {
                            return (
                              <SimpleTooltip content="This stage is locked and cannot be changed">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-depth-2)] border border-[var(--border)]">
                                  <Lock className="w-3 h-3 text-[var(--text-muted)]" />
                                  <span className="text-xs font-medium text-[var(--text-secondary)]">{stageInfo.label}</span>
                                </div>
                              </SimpleTooltip>
                            )
                          }

                          return (
                            <InlineTagSelect
                              value={currentStage}
                              options={PIPELINE_STAGES.map((stage) => ({
                                value: stage.value,
                                label: stage.label,
                                color: stage.value,
                              }))}
                              onChange={(value) => handleStageChange(lead.id, value as PipelineStage)}
                              disabled={editingStage === lead.id}
                              loading={editingStage === lead.id}
                            />
                          )
                        })()}
                      </td>
                      {/* Substage column */}
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <InlineTagSelect
                          value={getEffectiveValue(lead.id, 'submission_substage', lead.submission_substage) || ''}
                          options={SUBMISSION_SUBSTAGES.map((substage) => ({
                            value: substage.value,
                            label: substage.label,
                            color: substage.color,
                          }))}
                          onChange={(value) => handleSubmissionSubstageChange(lead.id, value as SubmissionSubstage)}
                          disabled={editingSubmissionSubstage === lead.id}
                          loading={editingSubmissionSubstage === lead.id}
                        />
                      </td>
                      {/* Submission Status column */}
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <InlineTagSelect
                          value={getEffectiveValue(lead.id, 'submission_status', lead.submission_status) || ''}
                          options={SUBMISSION_STATUSES.map((status) => ({
                            value: status.value,
                            label: status.label,
                            color: status.color,
                          }))}
                          onChange={(value) => handleSubmissionStatusChange(lead.id, value as SubmissionStatus)}
                          disabled={editingSubmissionStatus === lead.id}
                          loading={editingSubmissionStatus === lead.id}
                        />
                      </td>
                      {/* Agent column */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {lead.assigned_agent ? (
                            <>
                              <Avatar size="xs">
                                <AvatarImage src={lead.assigned_agent.avatar_url} />
                                <AvatarFallback className="text-[10px] bg-[var(--primary-muted)] text-[var(--primary)]">
                                  {lead.assigned_agent.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-[var(--text-secondary)] truncate max-w-[100px]">
                                {lead.assigned_agent.full_name}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-[var(--text-muted)]">—</span>
                          )}
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4">
                        <InlineTagSelect
                          value={getEffectiveValue(lead.id, 'source', lead.source)}
                          options={LEAD_SOURCES.map((source, index) => ({
                            value: source.value,
                            label: source.label,
                          }))}
                          onChange={(value) => handleSourceChange(lead.id, value)}
                          disabled={editingSource === lead.id}
                          loading={editingSource === lead.id}
                        />
                      </td>
                      <td className="p-4">
                        {(() => {
                          const currentStage = getEffectiveValue(lead.id, 'pipeline_stage', lead.pipeline_stage) as PipelineStage
                          const isStageLocked = LOCKED_STAGES.includes(currentStage)
                          const stageInfo = PIPELINE_STAGES.find(s => s.value === currentStage)

                          if (isStageLocked && stageInfo) {
                            return (
                              <SimpleTooltip content="This stage is locked and cannot be changed">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-depth-2)] border border-[var(--border)]">
                                  <Lock className="w-3 h-3 text-[var(--text-muted)]" />
                                  <span className="text-xs font-medium text-[var(--text-secondary)]">{stageInfo.label}</span>
                                </div>
                              </SimpleTooltip>
                            )
                          }

                          return (
                            <InlineTagSelect
                              value={currentStage}
                              options={PIPELINE_STAGES.map((stage) => ({
                                value: stage.value,
                                label: stage.label,
                                color: stage.value,
                              }))}
                              onChange={(value) => handleStageChange(lead.id, value as PipelineStage)}
                              disabled={editingStage === lead.id}
                              loading={editingStage === lead.id}
                            />
                          )
                        })()}
                      </td>
                      <td className="p-4">
                        {(() => {
                          const effectiveStage = getEffectiveValue(lead.id, 'pipeline_stage', lead.pipeline_stage)
                          const isStatusDisabled = effectiveStage === 'new' || effectiveStage === 'test' || effectiveStage === 'appointment'

                          // Filter statuses based on stage - visit stage only has specific statuses
                          const availableStatuses = effectiveStage === 'visit'
                            ? LEAD_STATUSES.filter(s => s.value === 'no_answer' || s.value === 'not_interested' || s.value === 'switched_off' || s.value === 'callback')
                            : LEAD_STATUSES

                          return isStatusDisabled ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-depth-2)] border border-[var(--border)] text-[var(--text-muted)]">
                              <span className="text-xs">—</span>
                            </div>
                          ) : (
                            <InlineTagSelect
                              value={getEffectiveValue(lead.id, 'status', lead.status) || ''}
                              options={availableStatuses.map((status) => ({
                                value: status.value,
                                label: status.label,
                                color: status.color,
                              }))}
                              onChange={(value) => handleStatusChange(lead.id, value as LeadStatus)}
                              disabled={editingStatus === lead.id}
                              loading={editingStatus === lead.id}
                            />
                          )
                        })()}
                      </td>
                      <td className="p-4">
                        <InlineTagSelect
                          value={getEffectiveValue(lead.id, 'school', lead.school) || ""}
                          options={SCHOOLS.map((school) => ({
                            value: school.value,
                            label: school.label,
                          }))}
                          onChange={(value) => handleSchoolChange(lead.id, value)}
                          disabled={editingSchool === lead.id}
                          loading={editingSchool === lead.id}
                        />
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-[var(--text-secondary)]">
                          {lead.expected_gpa ? `${lead.expected_gpa}%` : "—"}
                        </span>
                      </td>
                      <td className="p-4">
                        {lead.actual_lead ? (
                          <Badge variant="success" size="xs" className="gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Actual
                          </Badge>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">—</span>
                        )}
                      </td>
                    </>
                  )}
                  <td className="p-4">
                    {lead.updated_at ? (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                        <span className="text-sm text-[var(--text-secondary)] font-medium">
                          {getRelativeTime(lead.updated_at)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
                        <span className="text-sm text-[var(--text-muted)] font-medium">
                          —
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                      {/* Create Application button - replaces View when stage is test */}
                      {getEffectiveValue(lead.id, 'pipeline_stage', lead.pipeline_stage) === 'test' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStageChange(lead.id, 'application' as PipelineStage)}
                          className="text-xs gap-1.5 bg-[var(--primary-muted)] border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white"
                          title="Create Application"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Application
                        </Button>
                      ) : getEffectiveValue(lead.id, 'pipeline_stage', lead.pipeline_stage) === 'application' || getEffectiveValue(lead.id, 'pipeline_stage', lead.pipeline_stage) === 'submission' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPspWizardLead(lead)
                          }}
                          className="text-xs gap-1.5 bg-purple-50 dark:bg-purple-950/30 border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-500 hover:text-white"
                          title={getEffectiveValue(lead.id, 'pipeline_stage', lead.pipeline_stage) === 'submission' ? "Edit PSP Submission" : "Submit to PSP"}
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          PSP
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onEditLead?.(lead)}
                        className="hover:bg-[var(--accent-muted)] hover:text-[var(--accent)]"
                        title="Edit lead"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="hover:bg-[var(--success-bg)] hover:text-[var(--success)]"
                        onClick={() => {
                          setBookingSimpleMode(false)
                          setBookingLead(lead)
                        }}
                        title="Book appointment"
                      >
                        <Calendar className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between p-4 border-t border-[var(--border)] bg-gradient-to-r from-[var(--bg-sunken)] to-[var(--bg-surface)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
            <span className="text-2xl font-bold text-[var(--primary)]">{leads.length}</span>
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">leads</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled className="rounded-lg">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <div className="px-3 py-1.5 rounded-lg bg-[var(--primary-muted)] text-[var(--primary)] text-sm font-medium">
            Page 1
          </div>
          <Button variant="outline" size="sm" disabled className="rounded-lg">
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </Card>

    {/* Appointment Booking Popup */}
    <AppointmentBooking
      isOpen={!!bookingLead}
      onClose={() => {
        setBookingLead(null)
        setBookingSimpleMode(false)
      }}
      onSuccess={() => {
        setBookingLead(null)
        setBookingSimpleMode(false)
      }}
      preselectedLead={bookingLead || undefined}
      singleFormMode={true}
    />

    {/* PSP Submission Wizard */}
    <PSPSubmissionWizard
      isOpen={!!pspWizardLead}
      onClose={() => setPspWizardLead(null)}
      lead={pspWizardLead}
      onSuccess={() => setPspWizardLead(null)}
    />
    </>
  )
}

// Bulk actions bar component
interface BulkActionsProps {
  selectedCount: number
  onAssign: () => void
  onBook: () => void
  onDelete: () => void
  onClear: () => void
  onMOEFetch?: () => void
}

export function BulkActionsBar({ selectedCount, onAssign, onBook, onDelete, onClear, onMOEFetch }: BulkActionsProps) {
  if (selectedCount === 0) return null

  return (
    <motion.div
      initial={{ y: 100, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 100, opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:left-[calc(50%+130px)] z-40"
    >
      <div className="flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] shadow-2xl shadow-black/20 backdrop-blur-sm">
        {/* Selected count */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-[var(--text-primary)]">{selectedCount}</span>
            <span className="text-sm text-[var(--text-muted)] ml-1">selected</span>
          </div>
        </div>

        <div className="w-px h-8 bg-gradient-to-b from-transparent via-[var(--border)] to-transparent" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onAssign} className="rounded-lg hover:bg-[var(--primary-muted)] hover:text-[var(--primary)]">
            <UserPlus className="w-4 h-4 mr-1.5" />
            Assign
          </Button>
          <Button variant="ghost" size="sm" onClick={onBook} className="rounded-lg hover:bg-[var(--success-bg)] hover:text-[var(--success)]">
            <Calendar className="w-4 h-4 mr-1.5" />
            Book
          </Button>
          {onMOEFetch && (
            <Button variant="ghost" size="sm" onClick={onMOEFetch} className="rounded-lg hover:bg-blue-50 hover:text-blue-600">
              <BookOpen className="w-4 h-4 mr-1.5" />
              Fetch GPA
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="rounded-lg text-[var(--error)] hover:bg-[var(--error-bg)]"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete
          </Button>
        </div>

        <div className="w-px h-8 bg-gradient-to-b from-transparent via-[var(--border)] to-transparent" />

        {/* Clear */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClear}
          className="rounded-lg hover:bg-[var(--bg-hover)]"
          title="Clear selection"
        >
          <XCircle className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  )
}
