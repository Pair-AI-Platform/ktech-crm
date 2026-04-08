"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input, SearchInput } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  X,
  Filter,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  Calendar,
  CalendarDays,
  User,
  MapPin,
  Sparkles,
  SlidersHorizontal,
  GraduationCap,
  Ban,
  ShieldAlert,
  MessageSquareText,
  CreditCard,
  BookOpen,
  XCircle,
  Star,
} from "lucide-react"
import { PIPELINE_STAGES, SCHOOLS, LEAD_SOURCES, LEAD_STATUSES, APPLICANT_ONLY_STATUSES, APPOINTMENT_TYPES, SUBMISSION_SUBSTAGES, SUBMISSION_STATUSES, SUBMISSION_BLOCKED_REASONS, GOVERNORATES, PUC_DOCUMENT_STATUSES, PLACEMENT_LEVELS, type PipelineStage, type LeadSource, type School, type LeadStatus, type AppointmentType, type SubmissionSubstage, type SubmissionStatus, type SubmissionBlockedReason, type AcademicTrack, type Governorate, type PUCDocumentStatus, type PlacementLevel } from "@/types"
import { WITHDRAWAL_REASONS, COMPETITOR_OPTIONS, MILITARY_SECURITY_OPTIONS } from "@/lib/config/withdrawal-reasons"
import { useActiveSources } from "@/lib/hooks/use-sources"
import { useCycles } from "@/lib/hooks/use-cycles"
import { useLostReasons } from "@/lib/hooks/use-leads"
import { useCampaigns, type Campaign } from "@/lib/hooks/use-campaigns"
import { useUser, useAgents } from "@/lib/hooks/use-user"
import { cn } from "@/lib/utils"
import { useStageSettings } from "@/lib/hooks/use-stage-settings"

export interface LeadFilters {
  searchQuery: string
  stages: PipelineStage[]
  lostAtStages: PipelineStage[]
  statuses: LeadStatus[]
  sources: LeadSource[]
  schools: School[]
  appointmentTypes: AppointmentType[]
  submissionSubstages: SubmissionSubstage[]
  submissionStatuses: SubmissionStatus[]
  fundingType: "all" | "self_funded" | "puc"
  dateRange: "all" | "today" | "week" | "month" | "quarter" | "custom"
  dateFrom: string
  dateTo: string
  assignedTo: string
  hasEmail: boolean | null
  hasPhone: boolean | null
  gpaMin: number | null
  gpaMax: number | null
  isKuwaiti: boolean | null
  blockReasons: SubmissionBlockedReason[]
  hasNotes: "all" | "with_notes" | "without_notes"
  paymentStatus: "all" | "pending" | "seat_reserved" | "full_tuition"
  paymentAmountMin: number
  paymentAmountMax: number
  academicTrack: "all" | AcademicTrack
  lostReasonIds: string[]
  withdrawalReasons: string[]
  genders: string[]
  governorates: Governorate[]
  priority: "all" | "normal" | "important" | "critical"
  ministryAssigned: "all" | "assigned" | "not_assigned"
  ministryFlagged: "all" | "flagged" | "not_flagged"
  docStatuses: PUCDocumentStatus[]
  placementLevels: PlacementLevel[]
  campaignIds: string[]
  semesterIds: string[]
}

interface LeadFiltersProps {
  filters: LeadFilters
  onChange: (filters: LeadFilters) => void
  onClose: () => void
  isOpen: boolean
}

const defaultFilters: LeadFilters = {
  searchQuery: "",
  stages: [],
  lostAtStages: [],
  statuses: [],
  sources: [],
  schools: [],
  appointmentTypes: [],
  submissionSubstages: [],
  submissionStatuses: [],
  fundingType: "all",
  dateRange: "all",
  dateFrom: "",
  dateTo: "",
  assignedTo: "",
  hasEmail: null,
  hasPhone: null,
  gpaMin: null,
  gpaMax: null,
  isKuwaiti: null,
  blockReasons: [],
  hasNotes: "all",
  paymentStatus: "all",
  paymentAmountMin: 0,
  paymentAmountMax: 5000,
  academicTrack: "all",
  lostReasonIds: [],
  withdrawalReasons: [],
  genders: [],
  governorates: [],
  priority: "all",
  ministryAssigned: "all",
  ministryFlagged: "all",
  docStatuses: [],
  placementLevels: [],
  campaignIds: [],
  semesterIds: [],
}

// Stages that leads can be lost at (excludes 'lost' and 'enrolled')
const LOST_AT_STAGES = PIPELINE_STAGES.filter(s => s.value !== 'lost' && s.value !== 'enrolled')

// Allowed statuses per stage (matches lead-table.tsx logic)
const STAGE_ALLOWED_STATUSES: Record<PipelineStage, LeadStatus[] | 'all' | 'none'> = {
  new: 'none',
  contacted: ['no_answer', 'switched_off', 'interested', 'not_interested', 'high_gpa', 'wrong_number', 'will_see'],
  visit: ['no_answer', 'cant_reach', 'interested', 'not_interested'],
  test: ['online', 'on_campus'],
  application: ['no_answer', 'switched_off', 'interested', 'not_interested', 'high_gpa', 'wrong_number', 'will_see'],
  lost: 'all',
  applicant: ['no_answer', 'cant_reach', 'informed', 'travelling', 'might_withdraw'],
  enrolled: 'none',
  withdraw: 'all',
  puc_document_submission: ['no_answer', 'cant_reach', 'interested', 'not_interested', 'will_see'],
  puc_application_submission: ['applied', 'documents_missing', 'changed_preferences', 'blocked_ku', 'blocked_paaet', 'blocked_abroad', 'blocked_aasu', 'blocked_paci', 'blocked_puc', 'blocked_other'],
}

function getStatusesForStages(stages: PipelineStage[]) {
  // When no stages selected, show all statuses EXCEPT applicant-only ones
  if (stages.length === 0) return LEAD_STATUSES.filter(s => !APPLICANT_ONLY_STATUSES.includes(s.value))

  const allowedValues = new Set<LeadStatus>()
  let hasAll = false
  const hasApplicant = stages.includes('applicant')

  for (const stage of stages) {
    const allowed = STAGE_ALLOWED_STATUSES[stage]
    if (allowed === 'all') {
      hasAll = true
      break
    }
    if (Array.isArray(allowed)) {
      allowed.forEach(s => allowedValues.add(s))
    }
  }

  if (hasAll) {
    // If 'all' but applicant not selected, exclude applicant-only statuses
    if (!hasApplicant) return LEAD_STATUSES.filter(s => !APPLICANT_ONLY_STATUSES.includes(s.value))
    return LEAD_STATUSES
  }
  if (allowedValues.size === 0) return [] as typeof LEAD_STATUSES

  return LEAD_STATUSES.filter(s => allowedValues.has(s.value))
}

export function LeadFiltersPanel({ filters, onChange, onClose, isOpen }: LeadFiltersProps) {
  const [localFilters, setLocalFilters] = useState<LeadFilters>(filters)
  const [expandedSections, setExpandedSections] = useState<string[]>(["stage", "source"])
  const { sources: dbSources } = useActiveSources()
  const { reasons: lostReasons } = useLostReasons()
  const { isAdmin } = useUser()
  const { agents } = useAgents()
  const { campaigns = [] } = useCampaigns()
  const { cycles } = useCycles()
  const leadSources = dbSources.length > 0
    ? dbSources.map(s => ({ value: s.value as LeadSource, label: s.label, category: s.category }))
    : LEAD_SOURCES

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const toggleStage = (stage: PipelineStage) => {
    setLocalFilters(prev => {
      const newStages = prev.stages.includes(stage)
        ? prev.stages.filter(s => s !== stage)
        : [...prev.stages, stage]

      // Clear any status selections that are no longer valid for the new stages
      const available = getStatusesForStages(newStages)
      const availableValues = new Set(available.map(s => s.value))
      const newStatuses = prev.statuses.filter(s => availableValues.has(s))

      return { ...prev, stages: newStages, statuses: newStatuses }
    })
  }

  const toggleLostAtStage = (stage: PipelineStage) => {
    setLocalFilters(prev => ({
      ...prev,
      lostAtStages: prev.lostAtStages.includes(stage)
        ? prev.lostAtStages.filter(s => s !== stage)
        : [...prev.lostAtStages, stage]
    }))
  }

  const toggleSource = (source: LeadSource) => {
    setLocalFilters(prev => ({
      ...prev,
      sources: prev.sources.includes(source)
        ? prev.sources.filter(s => s !== source)
        : [...prev.sources, source]
    }))
  }

  const toggleLostReason = (reasonId: string) => {
    setLocalFilters(prev => ({
      ...prev,
      lostReasonIds: prev.lostReasonIds.includes(reasonId)
        ? prev.lostReasonIds.filter(id => id !== reasonId)
        : [...prev.lostReasonIds, reasonId]
    }))
  }

  const lostReasonsByCategory = lostReasons.reduce<Record<string, typeof lostReasons>>((acc, reason) => {
    if (!acc[reason.category]) acc[reason.category] = []
    acc[reason.category].push(reason)
    return acc
  }, {})

  const categoryLabels: Record<string, string> = {
    competitors: "Competitors",
    military_security: "Military / Security",
    academic: "Academic",
    administrative: "Administrative",
    financial: "Financial",
    personal: "Personal",
  }

  const [schoolSearch, setSchoolSearch] = useState("")

  const filteredSchools = SCHOOLS.filter((school) => {
    if (!schoolSearch.trim()) return true
    const q = schoolSearch.trim().toLowerCase()
    return (
      school.label.includes(q) ||
      school.labelEn.toLowerCase().includes(q) ||
      school.labelAr.includes(q)
    )
  })

  const toggleSchool = (school: School) => {
    setLocalFilters(prev => ({
      ...prev,
      schools: prev.schools.includes(school)
        ? prev.schools.filter(s => s !== school)
        : [...prev.schools, school]
    }))
  }

  const toggleStatus = (status: LeadStatus) => {
    setLocalFilters(prev => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status]
    }))
  }

  const toggleAppointmentType = (appointmentType: AppointmentType) => {
    setLocalFilters(prev => ({
      ...prev,
      appointmentTypes: prev.appointmentTypes.includes(appointmentType)
        ? prev.appointmentTypes.filter(t => t !== appointmentType)
        : [...prev.appointmentTypes, appointmentType]
    }))
  }

  const toggleSubmissionSubstage = (substage: SubmissionSubstage) => {
    setLocalFilters(prev => ({
      ...prev,
      submissionSubstages: prev.submissionSubstages.includes(substage)
        ? prev.submissionSubstages.filter(s => s !== substage)
        : [...prev.submissionSubstages, substage]
    }))
  }

  const toggleSubmissionStatus = (status: SubmissionStatus) => {
    setLocalFilters(prev => ({
      ...prev,
      submissionStatuses: prev.submissionStatuses.includes(status)
        ? prev.submissionStatuses.filter(s => s !== status)
        : [...prev.submissionStatuses, status]
    }))
  }

  const toggleDocStatus = (status: PUCDocumentStatus) => {
    setLocalFilters(prev => ({
      ...prev,
      docStatuses: prev.docStatuses.includes(status)
        ? prev.docStatuses.filter(s => s !== status)
        : [...prev.docStatuses, status]
    }))
  }

  const handleApply = () => {
    onChange(localFilters)
    onClose()
  }

  const handleReset = () => {
    setLocalFilters(defaultFilters)
    onChange(defaultFilters)
  }

  // Filter statuses based on selected stages
  const availableStatuses = getStatusesForStages(localFilters.stages)

  const activeFiltersCount =
    localFilters.stages.length +
    localFilters.lostAtStages.length +
    localFilters.statuses.length +
    localFilters.sources.length +
    localFilters.schools.length +
    localFilters.appointmentTypes.length +
    localFilters.submissionSubstages.length +
    localFilters.submissionStatuses.length +
    (localFilters.fundingType !== "all" ? 1 : 0) +
    (localFilters.dateRange !== "all" ? 1 : 0) +
    (localFilters.assignedTo ? 1 : 0) +
    (localFilters.hasNotes !== "all" ? 1 : 0) +
    (localFilters.paymentStatus !== "all" ? 1 : 0) +
    (localFilters.paymentAmountMin > 0 || localFilters.paymentAmountMax < 5000 ? 1 : 0) +
    (localFilters.academicTrack !== "all" ? 1 : 0) +
    (localFilters.ministryAssigned !== "all" ? 1 : 0) +
    (localFilters.ministryFlagged !== "all" ? 1 : 0) +
    localFilters.docStatuses.length +
    localFilters.placementLevels.length +
    localFilters.campaignIds.length +
    localFilters.semesterIds.length

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[rgba(31,29,26,0.5)] z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[var(--bg-elevated)] border-l border-[var(--border)] shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <div>
                  <h2 className="font-semibold text-[var(--text-primary)]">Filters</h2>
                  {activeFiltersCount > 0 && (
                    <p className="text-xs text-[var(--text-muted)]">
                      {activeFiltersCount} filter{activeFiltersCount > 1 ? "s" : ""} active
                    </p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Lost At Stage - Filter lost leads by the stage they were lost at */}
              <FilterSection
                title="Lost At Stage"
                icon={<Ban className="w-4 h-4" />}
                isExpanded={expandedSections.includes("lostAtStage")}
                onToggle={() => toggleSection("lostAtStage")}
                count={localFilters.lostAtStages.length}
              >
                <div className="grid grid-cols-2 gap-2">
                  {LOST_AT_STAGES.map((stage) => (
                    <button
                      key={stage.value}
                      onClick={() => toggleLostAtStage(stage.value)}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-lg border text-sm text-left transition-all",
                        localFilters.lostAtStages.includes(stage.value)
                          ? "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400"
                          : "border-[var(--border)] hover:border-red-500/50 text-[var(--text-secondary)]"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                        localFilters.lostAtStages.includes(stage.value)
                          ? "border-red-500 bg-red-500"
                          : "border-[var(--border)]"
                      )}>
                        {localFilters.lostAtStages.includes(stage.value) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <Badge variant={stage.value} size="sm">
                        {stage.label}
                      </Badge>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Filter lost leads by which stage they were in before being marked as lost
                </p>
              </FilterSection>

              {/* Lost Reason Filter */}
              {lostReasons.length > 0 && (
              <FilterSection
                title="Lost Reason"
                icon={<XCircle className="w-4 h-4" />}
                isExpanded={expandedSections.includes("lostReason")}
                onToggle={() => toggleSection("lostReason")}
                count={localFilters.lostReasonIds.length}
              >
                <div className="space-y-3">
                  {Object.entries(lostReasonsByCategory).map(([category, reasons]) => (
                    <div key={category}>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                        {categoryLabels[category] || category}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {reasons.map((reason) => {
                          const isSelected = localFilters.lostReasonIds.includes(reason.id)
                          return (
                            <button
                              key={reason.id}
                              onClick={() => toggleLostReason(reason.id)}
                              className={cn(
                                "px-2.5 py-1.5 rounded-lg border text-xs transition-all",
                                isSelected
                                  ? "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400"
                                  : "border-[var(--border)] hover:border-red-500/50 text-[var(--text-secondary)]"
                              )}
                            >
                              {reason.reason_en}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </FilterSection>
              )}

              {/* Agent Filter - Admin Only */}
              {isAdmin && (
                <FilterSection
                  title="Agent"
                  icon={<User className="w-4 h-4" />}
                  isExpanded={expandedSections.includes("agent")}
                  onToggle={() => toggleSection("agent")}
                  count={localFilters.assignedTo ? 1 : 0}
                >
                  <div className="space-y-2">
                    <button
                      onClick={() => setLocalFilters(prev => ({ ...prev, assignedTo: "" }))}
                      className={cn(
                        "w-full flex items-center gap-2 p-2.5 rounded-lg border text-sm text-left transition-all",
                        !localFilters.assignedTo
                          ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                          : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-secondary)]"
                      )}
                    >
                      All Agents
                    </button>
                    {agents.map((agent) => (
                      <button
                        key={agent.id}
                        onClick={() => setLocalFilters(prev => ({ ...prev, assignedTo: prev.assignedTo === agent.id ? "" : agent.id }))}
                        className={cn(
                          "w-full flex items-center gap-2 p-2.5 rounded-lg border text-sm text-left transition-all",
                          localFilters.assignedTo === agent.id
                            ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                            : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-secondary)]"
                        )}
                      >
                        <div className="w-6 h-6 rounded-full bg-[var(--primary-muted)] flex items-center justify-center text-xs font-medium text-[var(--primary)]">
                          {agent.full_name?.charAt(0) || "?"}
                        </div>
                        {agent.full_name}
                      </button>
                    ))}
                  </div>
                </FilterSection>
              )}

              {/* Lead Status */}
              <FilterSection
                title="Status"
                icon={<Filter className="w-4 h-4" />}
                isExpanded={expandedSections.includes("status")}
                onToggle={() => toggleSection("status")}
                count={localFilters.statuses.length}
              >
                {availableStatuses.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {availableStatuses.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => toggleStatus(status.value)}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg border text-sm text-left transition-all",
                          localFilters.statuses.includes(status.value)
                            ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                            : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-secondary)]"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                          localFilters.statuses.includes(status.value)
                            ? "border-[var(--primary)] bg-[var(--primary)]"
                            : "border-[var(--border)]"
                        )}>
                          {localFilters.statuses.includes(status.value) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="truncate">{status.label}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--text-muted)] py-2">
                    No statuses available for the selected stage{localFilters.stages.length > 1 ? 's' : ''}
                  </p>
                )}
              </FilterSection>

              {/* Lead Sources */}
              <FilterSection
                title="Lead Source"
                icon={<User className="w-4 h-4" />}
                isExpanded={expandedSections.includes("source")}
                onToggle={() => toggleSection("source")}
                count={localFilters.sources.length}
              >
                <div className="grid grid-cols-2 gap-2">
                  {leadSources.map((source) => (
                    <button
                      key={source.value}
                      onClick={() => toggleSource(source.value)}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-lg border text-sm text-left transition-all",
                        localFilters.sources.includes(source.value)
                          ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                          : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-secondary)]"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                        localFilters.sources.includes(source.value)
                          ? "border-[var(--primary)] bg-[var(--primary)]"
                          : "border-[var(--border)]"
                      )}>
                        {localFilters.sources.includes(source.value) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="truncate">{source.label}</span>
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* School */}
              <FilterSection
                title="School"
                icon={<MapPin className="w-4 h-4" />}
                isExpanded={expandedSections.includes("school")}
                onToggle={() => toggleSection("school")}
                count={localFilters.schools.length}
              >
                <div className="px-3 pb-2">
                  <SearchInput
                    value={schoolSearch}
                    onChange={(e) => setSchoolSearch(e.target.value)}
                    onClear={() => setSchoolSearch("")}
                    placeholder="ابحث عن مدرسة..."
                    searchSize="sm"
                  />
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                  {filteredSchools.map((school) => (
                    <button
                      key={school.value}
                      onClick={() => toggleSchool(school.value)}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-lg border text-sm text-left transition-all",
                        localFilters.schools.includes(school.value)
                          ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                          : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-secondary)]"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                        localFilters.schools.includes(school.value)
                          ? "border-[var(--primary)] bg-[var(--primary)]"
                          : "border-[var(--border)]"
                      )}>
                        {localFilters.schools.includes(school.value) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="truncate">{school.label}</span>
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Appointment Type */}
              <FilterSection
                title="Appointment Type"
                icon={<CalendarDays className="w-4 h-4" />}
                isExpanded={expandedSections.includes("appointmentType")}
                onToggle={() => toggleSection("appointmentType")}
                count={localFilters.appointmentTypes.length}
              >
                <div className="grid grid-cols-1 gap-2">
                  {APPOINTMENT_TYPES.map((appointmentType) => (
                    <button
                      key={appointmentType.value}
                      onClick={() => toggleAppointmentType(appointmentType.value)}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-lg border text-sm text-left transition-all",
                        localFilters.appointmentTypes.includes(appointmentType.value)
                          ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                          : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-secondary)]"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                        localFilters.appointmentTypes.includes(appointmentType.value)
                          ? "border-[var(--primary)] bg-[var(--primary)]"
                          : "border-[var(--border)]"
                      )}>
                        {localFilters.appointmentTypes.includes(appointmentType.value) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="truncate">{appointmentType.label}</span>
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Submission Substage */}
              <FilterSection
                title="Submission Substage"
                icon={<SlidersHorizontal className="w-4 h-4" />}
                isExpanded={expandedSections.includes("submissionSubstage")}
                onToggle={() => toggleSection("submissionSubstage")}
                count={localFilters.submissionSubstages.length}
              >
                <div className="grid grid-cols-1 gap-2">
                  {SUBMISSION_SUBSTAGES.map((substage) => (
                    <button
                      key={substage.value}
                      onClick={() => toggleSubmissionSubstage(substage.value)}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-lg border text-sm text-left transition-all",
                        localFilters.submissionSubstages.includes(substage.value)
                          ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                          : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-secondary)]"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                        localFilters.submissionSubstages.includes(substage.value)
                          ? "border-[var(--primary)] bg-[var(--primary)]"
                          : "border-[var(--border)]"
                      )}>
                        {localFilters.submissionSubstages.includes(substage.value) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="truncate">{substage.label}</span>
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Orientation Status (was Submission Status) */}
              <FilterSection
                title="Orientation Status"
                icon={<SlidersHorizontal className="w-4 h-4" />}
                isExpanded={expandedSections.includes("submissionStatus")}
                onToggle={() => toggleSection("submissionStatus")}
                count={localFilters.submissionStatuses.length}
              >
                <div className="grid grid-cols-1 gap-2">
                  {SUBMISSION_STATUSES.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => toggleSubmissionStatus(status.value)}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-lg border text-sm text-left transition-all",
                        localFilters.submissionStatuses.includes(status.value)
                          ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                          : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-secondary)]"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                        localFilters.submissionStatuses.includes(status.value)
                          ? "border-[var(--primary)] bg-[var(--primary)]"
                          : "border-[var(--border)]"
                      )}>
                        {localFilters.submissionStatuses.includes(status.value) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="truncate">{status.label}</span>
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Doc Status */}
              <FilterSection
                title="Doc Status"
                icon={<SlidersHorizontal className="w-4 h-4" />}
                isExpanded={expandedSections.includes("docStatus")}
                onToggle={() => toggleSection("docStatus")}
                count={localFilters.docStatuses.length}
              >
                <div className="grid grid-cols-1 gap-2">
                  {PUC_DOCUMENT_STATUSES.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => toggleDocStatus(status.value)}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-lg border text-sm text-left transition-all",
                        localFilters.docStatuses.includes(status.value)
                          ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                          : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-secondary)]"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                        localFilters.docStatuses.includes(status.value)
                          ? "border-[var(--primary)] bg-[var(--primary)]"
                          : "border-[var(--border)]"
                      )}>
                        {localFilters.docStatuses.includes(status.value) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="truncate">{status.label}</span>
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Academic Track (Type) */}
              <FilterSection
                title="Type"
                icon={<BookOpen className="w-4 h-4" />}
                isExpanded={expandedSections.includes("academicTrack")}
                onToggle={() => toggleSection("academicTrack")}
                count={localFilters.academicTrack !== "all" ? 1 : 0}
              >
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "all", label: "All" },
                    { value: "science", label: "Science" },
                    { value: "arts", label: "Arts" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setLocalFilters(prev => ({ ...prev, academicTrack: option.value as LeadFilters["academicTrack"] }))}
                      className={cn(
                        "p-2.5 rounded-lg border text-sm text-center transition-all",
                        localFilters.academicTrack === option.value
                          ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                          : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-secondary)]"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Funding Type */}
              <FilterSection
                title="Funding Type"
                icon={<Sparkles className="w-4 h-4" />}
                isExpanded={expandedSections.includes("funding")}
                onToggle={() => toggleSection("funding")}
                count={localFilters.fundingType !== "all" ? 1 : 0}
              >
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "all", label: "All" },
                    { value: "self_funded", label: "Self-Funded" },
                    { value: "puc", label: "PUC" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setLocalFilters(prev => ({ ...prev, fundingType: option.value as LeadFilters["fundingType"] }))}
                      className={cn(
                        "p-2.5 rounded-lg border text-sm text-center transition-all",
                        localFilters.fundingType === option.value
                          ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                          : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-secondary)]"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Payment Status Filter (Self-Funded) */}
              <FilterSection
                title="Payment Status"
                icon={<CreditCard className="w-4 h-4" />}
                isExpanded={expandedSections.includes("paymentStatus")}
                onToggle={() => toggleSection("paymentStatus")}
                count={localFilters.paymentAmountMin > 0 || localFilters.paymentAmountMax < 5000 ? 1 : 0}
              >
                <PaymentRangeSlider
                  min={localFilters.paymentAmountMin}
                  max={localFilters.paymentAmountMax}
                  onChange={(min, max) => setLocalFilters(prev => ({
                    ...prev,
                    paymentAmountMin: min,
                    paymentAmountMax: max,
                    paymentStatus: min === 0 && max === 5000 ? "all" : "all",
                  }))}
                />
              </FilterSection>


              {/* Block Reason Filter */}
              <FilterSection
                title="Block Reason"
                icon={<ShieldAlert className="w-4 h-4" />}
                isExpanded={expandedSections.includes("blockReasons")}
                onToggle={() => toggleSection("blockReasons")}
                count={localFilters.blockReasons.length}
              >
                <div className="space-y-3">
                  <button
                    onClick={() => setLocalFilters(prev => ({
                      ...prev,
                      blockReasons: prev.blockReasons.length === SUBMISSION_BLOCKED_REASONS.length
                        ? []
                        : SUBMISSION_BLOCKED_REASONS.map(r => r.value)
                    }))}
                    className={cn(
                      "w-full p-2 rounded-lg border text-sm text-center transition-all",
                      localFilters.blockReasons.length === SUBMISSION_BLOCKED_REASONS.length
                        ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                        : "border-[var(--border)] hover:border-orange-500/50 text-[var(--text-secondary)]"
                    )}
                  >
                    {localFilters.blockReasons.length === SUBMISSION_BLOCKED_REASONS.length ? "Deselect All" : "Select All"}
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    {SUBMISSION_BLOCKED_REASONS.map((reason) => {
                      const isSelected = localFilters.blockReasons.includes(reason.value)
                      return (
                        <button
                          key={reason.value}
                          onClick={() => setLocalFilters(prev => ({
                            ...prev,
                            blockReasons: isSelected
                              ? prev.blockReasons.filter(r => r !== reason.value)
                              : [...prev.blockReasons, reason.value]
                          }))}
                          className={cn(
                            "flex items-center gap-2 p-2.5 rounded-lg border text-sm transition-all",
                            isSelected
                              ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                              : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-secondary)]"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                            isSelected
                              ? "bg-orange-500 border-orange-500"
                              : "border-[var(--border)]"
                          )}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          {reason.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </FilterSection>

              {/* Ministry Assigned Filter */}
              <FilterSection
                title="Ministry Assigned"
                icon={<GraduationCap className="w-4 h-4" />}
                isExpanded={expandedSections.includes("ministryAssigned")}
                onToggle={() => toggleSection("ministryAssigned")}
                count={localFilters.ministryAssigned !== "all" ? 1 : 0}
              >
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "all", label: "All" },
                    { value: "assigned", label: "Assigned" },
                    { value: "not_assigned", label: "Not Assigned" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setLocalFilters(prev => ({ ...prev, ministryAssigned: option.value as LeadFilters["ministryAssigned"] }))}
                      className={cn(
                        "p-2.5 rounded-lg border text-sm text-center transition-all",
                        localFilters.ministryAssigned === option.value
                          ? option.value === "assigned"
                            ? "border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400"
                            : "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                          : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-secondary)]"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Ministry Flagged Filter */}
              <FilterSection
                title="Ministry File Star"
                icon={<Star className="w-4 h-4" />}
                isExpanded={expandedSections.includes("ministryFlagged")}
                onToggle={() => toggleSection("ministryFlagged")}
                count={localFilters.ministryFlagged !== "all" ? 1 : 0}
              >
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "all", label: "All" },
                    { value: "flagged", label: "Starred" },
                    { value: "not_flagged", label: "Not Starred" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setLocalFilters(prev => ({ ...prev, ministryFlagged: option.value as LeadFilters["ministryFlagged"] }))}
                      className={cn(
                        "p-2.5 rounded-lg border text-sm text-center transition-all",
                        localFilters.ministryFlagged === option.value
                          ? option.value === "flagged"
                            ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                          : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-secondary)]"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Withdraw Reason Filter */}
              <FilterSection
                title="Withdraw Reason"
                icon={<Ban className="w-4 h-4" />}
                isExpanded={expandedSections.includes("withdrawalReasons")}
                onToggle={() => toggleSection("withdrawalReasons")}
                count={localFilters.withdrawalReasons.length}
              >
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">General</p>
                    <div className="flex flex-wrap gap-1.5">
                      {WITHDRAWAL_REASONS.map((reason) => {
                        const isSelected = localFilters.withdrawalReasons.includes(reason.id)
                        return (
                          <button
                            key={reason.id}
                            onClick={() => setLocalFilters(prev => ({
                              ...prev,
                              withdrawalReasons: isSelected
                                ? prev.withdrawalReasons.filter(r => r !== reason.id)
                                : [...prev.withdrawalReasons, reason.id]
                            }))}
                            className={cn(
                              "px-2.5 py-1.5 rounded-lg border text-xs transition-all",
                              isSelected
                                ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "border-[var(--border)] hover:border-amber-500/50 text-[var(--text-secondary)]"
                            )}
                          >
                            {reason.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Competitors</p>
                    <div className="flex flex-wrap gap-1.5">
                      {COMPETITOR_OPTIONS.map((reason) => {
                        const isSelected = localFilters.withdrawalReasons.includes(reason.id)
                        return (
                          <button
                            key={reason.id}
                            onClick={() => setLocalFilters(prev => ({
                              ...prev,
                              withdrawalReasons: isSelected
                                ? prev.withdrawalReasons.filter(r => r !== reason.id)
                                : [...prev.withdrawalReasons, reason.id]
                            }))}
                            className={cn(
                              "px-2.5 py-1.5 rounded-lg border text-xs transition-all",
                              isSelected
                                ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "border-[var(--border)] hover:border-amber-500/50 text-[var(--text-secondary)]"
                            )}
                          >
                            {reason.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Military / Security</p>
                    <div className="flex flex-wrap gap-1.5">
                      {MILITARY_SECURITY_OPTIONS.map((reason) => {
                        const isSelected = localFilters.withdrawalReasons.includes(reason.id)
                        return (
                          <button
                            key={reason.id}
                            onClick={() => setLocalFilters(prev => ({
                              ...prev,
                              withdrawalReasons: isSelected
                                ? prev.withdrawalReasons.filter(r => r !== reason.id)
                                : [...prev.withdrawalReasons, reason.id]
                            }))}
                            className={cn(
                              "px-2.5 py-1.5 rounded-lg border text-xs transition-all",
                              isSelected
                                ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "border-[var(--border)] hover:border-amber-500/50 text-[var(--text-secondary)]"
                            )}
                          >
                            {reason.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </FilterSection>

              {/* Gender Filter */}
              <FilterSection
                title="Gender"
                icon={<User className="w-4 h-4" />}
                isExpanded={expandedSections.includes("gender")}
                onToggle={() => toggleSection("gender")}
                count={localFilters.genders.length}
              >
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                  ].map((option) => {
                    const isSelected = localFilters.genders.includes(option.value)
                    return (
                      <button
                        key={option.value}
                        onClick={() => setLocalFilters(prev => ({
                          ...prev,
                          genders: isSelected
                            ? prev.genders.filter(g => g !== option.value)
                            : [...prev.genders, option.value]
                        }))}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg border text-sm transition-all",
                          isSelected
                            ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                            : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-secondary)]"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                          isSelected
                            ? "bg-[var(--primary)] border-[var(--primary)]"
                            : "border-[var(--border)]"
                        )}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </FilterSection>

              {/* Governorate Filter */}
              <FilterSection
                title="Governorate"
                icon={<MapPin className="w-4 h-4" />}
                isExpanded={expandedSections.includes("governorate")}
                onToggle={() => toggleSection("governorate")}
                count={localFilters.governorates.length}
              >
                <div className="grid grid-cols-2 gap-2">
                  {GOVERNORATES.map((gov) => {
                    const isSelected = localFilters.governorates.includes(gov.value)
                    return (
                      <button
                        key={gov.value}
                        onClick={() => setLocalFilters(prev => ({
                          ...prev,
                          governorates: isSelected
                            ? prev.governorates.filter(g => g !== gov.value)
                            : [...prev.governorates, gov.value]
                        }))}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg border text-sm transition-all",
                          isSelected
                            ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                            : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-secondary)]"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                          isSelected
                            ? "bg-[var(--primary)] border-[var(--primary)]"
                            : "border-[var(--border)]"
                        )}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        {gov.label}
                      </button>
                    )
                  })}
                </div>
              </FilterSection>

              {/* Test Level (Placement Level) Filter */}
              <FilterSection
                title="Test Level"
                icon={<GraduationCap className="w-4 h-4" />}
                isExpanded={expandedSections.includes("placementLevel")}
                onToggle={() => toggleSection("placementLevel")}
                count={localFilters.placementLevels.length}
              >
                <div className="grid grid-cols-3 gap-2">
                  {PLACEMENT_LEVELS.map((level) => {
                    const isSelected = localFilters.placementLevels.includes(level.value)
                    return (
                      <button
                        key={level.value}
                        onClick={() => setLocalFilters(prev => ({
                          ...prev,
                          placementLevels: isSelected
                            ? prev.placementLevels.filter(l => l !== level.value)
                            : [...prev.placementLevels, level.value]
                        }))}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg border text-sm transition-all",
                          isSelected
                            ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                            : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-secondary)]"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                          isSelected
                            ? "bg-[var(--primary)] border-[var(--primary)]"
                            : "border-[var(--border)]"
                        )}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        {level.label}
                      </button>
                    )
                  })}
                </div>
              </FilterSection>

              {/* Campaign Filter */}
              {campaigns.length > 0 && (
              <FilterSection
                title="Campaign"
                icon={<Sparkles className="w-4 h-4" />}
                isExpanded={expandedSections.includes("campaign")}
                onToggle={() => toggleSection("campaign")}
                count={localFilters.campaignIds.length}
              >
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {campaigns.map((campaign) => {
                    const isSelected = localFilters.campaignIds.includes(campaign.id)
                    return (
                      <button
                        key={campaign.id}
                        onClick={() => setLocalFilters(prev => ({
                          ...prev,
                          campaignIds: isSelected
                            ? prev.campaignIds.filter(id => id !== campaign.id)
                            : [...prev.campaignIds, campaign.id]
                        }))}
                        className={cn(
                          "w-full flex items-center gap-2 p-2.5 rounded-lg border text-sm text-left transition-all",
                          isSelected
                            ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                            : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-secondary)]"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                          isSelected
                            ? "bg-[var(--primary)] border-[var(--primary)]"
                            : "border-[var(--border)]"
                        )}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="truncate block">{campaign.name}</span>
                          <span className="text-xs text-[var(--text-muted)]">{campaign.type} &middot; {campaign.total_contacts} contacts</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </FilterSection>
              )}

              {/* Cycle / Semester Filter */}
              {cycles.length > 0 && (
              <FilterSection
                title="Cycle"
                icon={<CalendarDays className="w-4 h-4" />}
                isExpanded={expandedSections.includes("cycle")}
                onToggle={() => toggleSection("cycle")}
                count={localFilters.semesterIds.length}
              >
                <div className="space-y-3 max-h-56 overflow-y-auto">
                  {cycles.map((cycle) => {
                    const semesters = cycle.terms || []
                    const allSemesterIds = semesters.map(s => s.id)
                    const selectedCount = allSemesterIds.filter(id => localFilters.semesterIds.includes(id)).length
                    const allSelected = semesters.length > 0 && selectedCount === semesters.length

                    return (
                      <div key={cycle.id} className="space-y-1">
                        <button
                          onClick={() => {
                            setLocalFilters(prev => {
                              if (allSelected) {
                                return { ...prev, semesterIds: prev.semesterIds.filter(id => !allSemesterIds.includes(id)) }
                              }
                              const newIds = new Set([...prev.semesterIds, ...allSemesterIds])
                              return { ...prev, semesterIds: [...newIds] }
                            })
                          }}
                          className={cn(
                            "w-full flex items-center gap-2 p-2 rounded-lg border text-sm font-medium transition-all",
                            allSelected
                              ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                              : selectedCount > 0
                                ? "border-[var(--primary)]/50 bg-[var(--primary-muted)]/50 text-[var(--primary)]"
                                : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-secondary)]"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                            allSelected
                              ? "bg-[var(--primary)] border-[var(--primary)]"
                              : "border-[var(--border)]"
                          )}>
                            {allSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span>{cycle.name}</span>
                          {cycle.is_active && <Badge variant="success" size="sm">Active</Badge>}
                          {selectedCount > 0 && !allSelected && (
                            <span className="text-xs text-[var(--text-muted)] ml-auto">{selectedCount}/{semesters.length}</span>
                          )}
                        </button>
                        {semesters.length > 0 && (
                          <div className="ml-6 space-y-1">
                            {semesters.map((semester) => {
                              const isSelected = localFilters.semesterIds.includes(semester.id)
                              return (
                                <button
                                  key={semester.id}
                                  onClick={() => setLocalFilters(prev => ({
                                    ...prev,
                                    semesterIds: isSelected
                                      ? prev.semesterIds.filter(id => id !== semester.id)
                                      : [...prev.semesterIds, semester.id]
                                  }))}
                                  className={cn(
                                    "w-full flex items-center gap-2 p-2 rounded-lg border text-sm text-left transition-all",
                                    isSelected
                                      ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                                      : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-secondary)]"
                                  )}
                                >
                                  <div className={cn(
                                    "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                                    isSelected
                                      ? "bg-[var(--primary)] border-[var(--primary)]"
                                      : "border-[var(--border)]"
                                  )}>
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                  </div>
                                  <span className="truncate">{semester.name}</span>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </FilterSection>
              )}

              {/* Has Notes Filter */}
              <FilterSection
                title="Notes"
                icon={<MessageSquareText className="w-4 h-4" />}
                isExpanded={expandedSections.includes("hasNotes")}
                onToggle={() => toggleSection("hasNotes")}
                count={localFilters.hasNotes !== "all" ? 1 : 0}
              >
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "all", label: "All" },
                    { value: "with_notes", label: "Has Notes" },
                    { value: "without_notes", label: "No Notes" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setLocalFilters(prev => ({ ...prev, hasNotes: option.value as LeadFilters["hasNotes"] }))}
                      className={cn(
                        "p-2.5 rounded-lg border text-sm text-center transition-all",
                        localFilters.hasNotes === option.value
                          ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                          : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-secondary)]"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* GPA Filter */}
              <FilterSection
                title="GPA Percentage"
                icon={<GraduationCap className="w-4 h-4" />}
                isExpanded={expandedSections.includes("gpa")}
                onToggle={() => toggleSection("gpa")}
                count={(localFilters.gpaMin !== null ? 1 : 0) + (localFilters.gpaMax !== null ? 1 : 0)}
              >
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Min %</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="0"
                        value={localFilters.gpaMin ?? ""}
                        onChange={(e) => setLocalFilters(prev => ({
                          ...prev,
                          gpaMin: e.target.value ? parseFloat(e.target.value) : null
                        }))}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Max %</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="100"
                        value={localFilters.gpaMax ?? ""}
                        onChange={(e) => setLocalFilters(prev => ({
                          ...prev,
                          gpaMax: e.target.value ? parseFloat(e.target.value) : null
                        }))}
                        className="h-9"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Filters by highest available GPA percentage (Grade 12, 11, or 10)
                  </p>
                </div>
              </FilterSection>

              {/* Date Range */}
              <FilterSection
                title="Date Added"
                icon={<Calendar className="w-4 h-4" />}
                isExpanded={expandedSections.includes("date")}
                onToggle={() => toggleSection("date")}
                count={localFilters.dateRange !== "all" ? 1 : 0}
              >
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: "all", label: "All" },
                    { value: "today", label: "Today" },
                    { value: "week", label: "Week" },
                    { value: "month", label: "Month" },
                    { value: "quarter", label: "Quarter" },
                    { value: "custom", label: "Custom" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        if (option.value === "custom") {
                          setLocalFilters(prev => ({
                            ...prev,
                            dateRange: "custom",
                          }))
                        } else {
                          setLocalFilters(prev => ({
                            ...prev,
                            dateRange: option.value as LeadFilters["dateRange"],
                            dateFrom: "",
                            dateTo: "",
                          }))
                        }
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-full border text-xs text-center transition-all",
                        localFilters.dateRange === option.value
                          ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                          : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-secondary)]"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {localFilters.dateRange === "custom" && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)]/50">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-[var(--text-muted)] mb-1 block">From</label>
                        <input
                          type="date"
                          value={localFilters.dateFrom}
                          onChange={(e) => setLocalFilters(prev => ({
                            ...prev,
                            dateRange: "custom",
                            dateFrom: e.target.value,
                          }))}
                          className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)]"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-[var(--text-muted)] mb-1 block">To</label>
                        <input
                          type="date"
                          value={localFilters.dateTo}
                          onChange={(e) => setLocalFilters(prev => ({
                            ...prev,
                            dateRange: "custom",
                            dateTo: e.target.value,
                          }))}
                          className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </FilterSection>

              {/* Pipeline Stages */}
              <FilterSection
                title="Pipeline Stage"
                icon={<Sparkles className="w-4 h-4" />}
                isExpanded={expandedSections.includes("stage")}
                onToggle={() => toggleSection("stage")}
                count={localFilters.stages.length}
              >
                <div className="grid grid-cols-2 gap-2">
                  {PIPELINE_STAGES.filter(s => s.value !== 'lost').map((stage) => (
                    <button
                      key={stage.value}
                      onClick={() => toggleStage(stage.value)}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-lg border text-sm text-left transition-all",
                        localFilters.stages.includes(stage.value)
                          ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                          : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-secondary)]"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                        localFilters.stages.includes(stage.value)
                          ? "border-[var(--primary)] bg-[var(--primary)]"
                          : "border-[var(--border)]"
                      )}>
                        {localFilters.stages.includes(stage.value) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <Badge variant={stage.value} size="sm">
                        {stage.label}
                      </Badge>
                    </button>
                  ))}
                </div>
              </FilterSection>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--border)] flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset All
              </Button>
              <Button
                className="flex-1"
                onClick={handleApply}
              >
                <Check className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Dual-handle range slider for payment amount filtering
function PaymentRangeSlider({
  min,
  max,
  onChange,
}: {
  min: number
  max: number
  onChange: (min: number, max: number) => void
}) {
  const SLIDER_MIN = 0
  const SLIDER_MAX = 5000
  const STEP = 10

  // Guard against NaN/undefined values from persisted state
  const safeMin = typeof min === "number" && !isNaN(min) ? min : 0
  const safeMax = typeof max === "number" && !isNaN(max) ? max : 5000

  const getPercent = (value: number) =>
    ((value - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100

  const minPercent = getPercent(safeMin)
  const maxPercent = getPercent(safeMax)

  const [minInput, setMinInput] = React.useState(String(safeMin))
  const [maxInput, setMaxInput] = React.useState(String(safeMax))

  // Sync inputs when external value changes (e.g. zone button click)
  React.useEffect(() => { setMinInput(String(safeMin)) }, [safeMin])
  React.useEffect(() => { setMaxInput(String(safeMax)) }, [safeMax])

  const commitMin = () => {
    const parsed = parseInt(minInput, 10)
    const clamped = isNaN(parsed) ? safeMin : Math.min(Math.max(parsed, SLIDER_MIN), safeMax - STEP)
    setMinInput(String(clamped))
    onChange(clamped, safeMax)
  }

  const commitMax = () => {
    const parsed = parseInt(maxInput, 10)
    const clamped = isNaN(parsed) ? safeMax : Math.max(Math.min(parsed, SLIDER_MAX), safeMin + STEP)
    setMaxInput(String(clamped))
    onChange(safeMin, clamped)
  }

  const hasSeatReserved = safeMin < 550 && safeMax >= 150
  const hasFullTuition = safeMax >= 550

  const zones = [
    {
      key: "seat_reserved",
      label: "Seat Reserved",
      flex: "flex-[400]",
      range: [150, 549] as [number, number],
      active: hasSeatReserved,
      activeClass: "bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-400",
      hoverClass: "hover:border-blue-400/40 hover:text-blue-500",
      trackClass: "bg-blue-400/25",
      left: "15%",
      width: "40%",
    },
    {
      key: "full_tuition",
      label: "Full Tuition",
      flex: "flex-[450]",
      range: [550, 5000] as [number, number],
      active: hasFullTuition,
      activeClass: "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
      hoverClass: "hover:border-emerald-400/40 hover:text-emerald-500",
      trackClass: "bg-emerald-400/25",
      left: "55%",
      width: "45%",
    },
  ]

  return (
    <div className="space-y-3 pt-1">
      {/* Amount display — editable */}
      <div className="flex items-stretch gap-2">
        <label className="flex-1 bg-[var(--bg-sunken)] rounded-lg px-3 py-2 text-center border border-[var(--border)] focus-within:border-[var(--primary)] focus-within:ring-1 focus-within:ring-[var(--primary)]/30 transition-all cursor-text">
          <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] block">From</span>
          <div className="flex items-baseline justify-center gap-1 mt-0.5">
            <input
              type="number"
              min={SLIDER_MIN}
              max={SLIDER_MAX}
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              onBlur={commitMin}
              onKeyDown={(e) => e.key === "Enter" && commitMin()}
              className="w-14 bg-transparent text-sm font-bold text-[var(--text-primary)] tabular-nums text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-xs text-[var(--text-muted)]">KD</span>
          </div>
        </label>
        <div className="flex items-center text-[var(--text-muted)] text-xs">→</div>
        <label className="flex-1 bg-[var(--bg-sunken)] rounded-lg px-3 py-2 text-center border border-[var(--border)] focus-within:border-[var(--primary)] focus-within:ring-1 focus-within:ring-[var(--primary)]/30 transition-all cursor-text">
          <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] block">To</span>
          <div className="flex items-baseline justify-center gap-1 mt-0.5">
            <input
              type="number"
              min={SLIDER_MIN}
              max={SLIDER_MAX}
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              onBlur={commitMax}
              onKeyDown={(e) => e.key === "Enter" && commitMax()}
              className="w-14 bg-transparent text-sm font-bold text-[var(--text-primary)] tabular-nums text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-xs text-[var(--text-muted)]">KD</span>
          </div>
        </label>
      </div>

      {/* Slider track */}
      <div className="relative h-10 flex items-center">
        {/* Zone-tinted background segments */}
        {zones.map((zone) => (
          <div
            key={zone.key}
            className={cn("absolute h-2", zone.trackClass)}
            style={{ left: zone.left, width: zone.width }}
          />
        ))}
        {/* Plain track behind zones */}
        <div className="absolute w-full h-2 rounded-full border border-[var(--border)] bg-transparent" />

        {/* Active range fill */}
        <div
          className="absolute h-2 rounded-full bg-[var(--primary)]/70"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />

        {/* Threshold markers */}
        {[150, 550].map((threshold) => (
          <div
            key={threshold}
            className="absolute w-0.5 h-4 bg-[var(--text-muted)]/30 rounded-full"
            style={{ left: `${getPercent(threshold)}%`, top: "50%", transform: "translate(-50%, -50%)" }}
          />
        ))}

        {/* Min handle */}
        <input
          type="range"
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          step={STEP}
          value={safeMin}
          onChange={(e) => {
            const val = Math.min(Number(e.target.value), safeMax - STEP)
            onChange(val, safeMax)
          }}
          className="absolute w-full pointer-events-none appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--primary)] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-grab"
          style={{ zIndex: safeMin > SLIDER_MAX - 100 ? 5 : 3 }}
        />

        {/* Max handle */}
        <input
          type="range"
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          step={STEP}
          value={safeMax}
          onChange={(e) => {
            const val = Math.max(Number(e.target.value), safeMin + STEP)
            onChange(safeMin, val)
          }}
          className="absolute w-full pointer-events-none appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--primary)] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-grab"
          style={{ zIndex: 4 }}
        />
      </div>

      {/* Threshold labels */}
      <div className="relative h-4 text-[10px] text-[var(--text-muted)]">
        <span className="absolute left-0">0</span>
        <span className="absolute" style={{ left: `${getPercent(150)}%`, transform: "translateX(-50%)" }}>150</span>
        <span className="absolute" style={{ left: `${getPercent(550)}%`, transform: "translateX(-50%)" }}>550</span>
        <span className="absolute right-0">5000</span>
      </div>

      {/* Quick-select zone buttons */}
      <div className="flex gap-1.5">
        {zones.map((zone) => (
          <button
            key={zone.key}
            type="button"
            onClick={() => onChange(zone.range[0], zone.range[1])}
            className={cn(
              zone.flex,
              "rounded-lg px-2 py-1.5 text-center border text-[10px] font-medium transition-all",
              zone.active
                ? zone.activeClass
                : cn("bg-[var(--bg-sunken)] border-[var(--border)] text-[var(--text-muted)]", zone.hoverClass)
            )}
          >
            {zone.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        Drag handles or click a zone to filter by payment range. Applies to self-funded leads only.
      </p>
    </div>
  )
}

interface FilterSectionProps {
  title: string
  icon: React.ReactNode
  isExpanded: boolean
  onToggle: () => void
  count: number
  children: React.ReactNode
}

function FilterSection({ title, icon, isExpanded, onToggle, count, children }: FilterSectionProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-[var(--bg-sunken)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-muted)]">{icon}</span>
          <span className="font-medium text-sm text-[var(--text-primary)]">{title}</span>
          {count > 0 && (
            <Badge variant="default" size="sm">
              {count}
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
        )}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 border-t border-[var(--border)]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Export a simplified filter bar for the top of the page
interface QuickFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  activeStage: PipelineStage | "all"
  onStageChange: (stage: PipelineStage | "all") => void
  onOpenAdvanced: () => void
  stats: Record<PipelineStage, number>
  total: number
  lostAtMode?: boolean
  hideStages?: boolean
  lostReasonFilter?: string[]
  onLostReasonFilterChange?: (ids: string[]) => void
  lostReasons?: { id: string; category: string; reason_en: string }[]
}

export function QuickFilters({
  searchQuery,
  onSearchChange,
  activeStage,
  onStageChange,
  onOpenAdvanced,
  stats,
  total,
  lostAtMode,
  hideStages,
  lostReasonFilter,
  onLostReasonFilterChange,
  lostReasons,
}: QuickFiltersProps) {
  const stagePillsRef = useRef<HTMLDivElement>(null)
  const { settings: stageSettings } = useStageSettings()

  // Use dynamic display_order from DB; fall back to hardcoded PIPELINE_STAGES if not loaded yet
  const orderedStages = stageSettings.length > 0
    ? stageSettings.map(s => PIPELINE_STAGES.find(p => p.value === s.stage)).filter(Boolean) as typeof PIPELINE_STAGES
    : PIPELINE_STAGES

  // In lost-at mode, show stages where leads can be lost (exclude lost/withdraw)
  const stagesToShow = lostAtMode
    ? orderedStages.filter(s => s.value !== 'lost' && s.value !== 'withdraw')
    : orderedStages.filter(s => s.value !== 'lost')

  // Scroll active stage pill into view
  useEffect(() => {
    const container = stagePillsRef.current
    if (!container) return
    const activeBtn = container.querySelector('[data-active="true"]') as HTMLElement
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [activeStage])

  return (
    <div className="space-y-4">
      {/* Search and Advanced Filter */}
      <div className="flex gap-3">
        <div className="flex-1">
          <SearchInput
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={() => onSearchChange("")}
            placeholder="Search leads by name, phone, or email..."
            className="bg-[var(--bg-sunken)]"
          />
        </div>
        <Button variant="outline" onClick={onOpenAdvanced} className="shrink-0">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Stage Pills */}
      {!hideStages && (
      <div ref={stagePillsRef} className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        <Button
          variant={activeStage === "all" ? "default" : "ghost"}
          size="sm"
          onClick={() => onStageChange("all")}
          className="shrink-0"
          data-active={activeStage === "all"}
        >
          {lostAtMode ? "All" : "All Stages"}
          <Badge variant="secondary" size="sm" className="ml-2">
            {lostAtMode ? total : total - (stats.lost || 0)}
          </Badge>
        </Button>
        {stagesToShow.map((stage) => {
          const count = stats[stage.value] || 0
          return (
            <Button
              key={stage.value}
              variant={activeStage === stage.value ? "default" : "ghost"}
              size="sm"
              onClick={() => onStageChange(stage.value)}
              className="shrink-0"
              data-active={activeStage === stage.value}
            >
              {stage.label}
              {count > 0 && (
                <Badge variant="secondary" size="sm" className="ml-2">
                  {count}
                </Badge>
              )}
            </Button>
          )
        })}
      </div>
      )}

      {/* Lost Reason Filter Pills */}
      {lostAtMode && lostReasons && lostReasons.length > 0 && onLostReasonFilterChange && (
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar items-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] shrink-0">Reason:</span>
          <Button
            variant={!lostReasonFilter || lostReasonFilter.length === 0 ? "default" : "ghost"}
            size="sm"
            onClick={() => onLostReasonFilterChange([])}
            className="shrink-0 h-7 text-xs"
          >
            All
          </Button>
          {lostReasons.map((reason) => {
            const isActive = lostReasonFilter?.includes(reason.id)
            return (
              <Button
                key={reason.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  if (isActive) {
                    onLostReasonFilterChange(lostReasonFilter!.filter(id => id !== reason.id))
                  } else {
                    onLostReasonFilterChange([...(lostReasonFilter || []), reason.id])
                  }
                }}
                className="shrink-0 h-7 text-xs"
              >
                {reason.reason_en}
              </Button>
            )
          })}
        </div>
      )}
    </div>
  )
}
