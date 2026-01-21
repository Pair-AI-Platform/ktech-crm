"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input, SearchInput } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Ban
} from "lucide-react"
import { PIPELINE_STAGES, SCHOOLS, LEAD_SOURCES, MAJORS, LEAD_STATUSES, APPOINTMENT_TYPES, SUBMISSION_SUBSTAGES, SUBMISSION_STATUSES, type PipelineStage, type LeadSource, type School, type LeadStatus, type AppointmentType, type SubmissionSubstage, type SubmissionStatus } from "@/types"
import { cn } from "@/lib/utils"

export interface LeadFilters {
  searchQuery: string
  stages: PipelineStage[]
  statuses: LeadStatus[]
  sources: LeadSource[]
  schools: School[]
  appointmentTypes: AppointmentType[]
  submissionSubstages: SubmissionSubstage[]
  submissionStatuses: SubmissionStatus[]
  fundingType: "all" | "self_funded" | "puc"
  dateRange: "all" | "today" | "week" | "month" | "quarter"
  assignedTo: string
  hasEmail: boolean | null
  hasPhone: boolean | null
  gpaMin: number | null
  gpaMax: number | null
  ministryBlocked: "all" | "blocked" | "not_blocked"
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
  statuses: [],
  sources: [],
  schools: [],
  appointmentTypes: [],
  submissionSubstages: [],
  submissionStatuses: [],
  fundingType: "all",
  dateRange: "all",
  assignedTo: "",
  hasEmail: null,
  hasPhone: null,
  gpaMin: null,
  gpaMax: null,
  ministryBlocked: "all",
}

export function LeadFiltersPanel({ filters, onChange, onClose, isOpen }: LeadFiltersProps) {
  const [localFilters, setLocalFilters] = useState<LeadFilters>(filters)
  const [expandedSections, setExpandedSections] = useState<string[]>(["stage", "source"])

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
    setLocalFilters(prev => ({
      ...prev,
      stages: prev.stages.includes(stage)
        ? prev.stages.filter(s => s !== stage)
        : [...prev.stages, stage]
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

  const handleApply = () => {
    onChange(localFilters)
    onClose()
  }

  const handleReset = () => {
    setLocalFilters(defaultFilters)
    onChange(defaultFilters)
  }

  const activeFiltersCount =
    localFilters.stages.length +
    localFilters.statuses.length +
    localFilters.sources.length +
    localFilters.schools.length +
    localFilters.appointmentTypes.length +
    localFilters.submissionSubstages.length +
    localFilters.submissionStatuses.length +
    (localFilters.fundingType !== "all" ? 1 : 0) +
    (localFilters.dateRange !== "all" ? 1 : 0) +
    (localFilters.assignedTo ? 1 : 0)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[var(--bg-depth-2)] border-l border-[var(--border)] shadow-2xl z-50 overflow-hidden flex flex-col"
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
              {/* Pipeline Stages */}
              <FilterSection
                title="Pipeline Stage"
                icon={<Sparkles className="w-4 h-4" />}
                isExpanded={expandedSections.includes("stage")}
                onToggle={() => toggleSection("stage")}
                count={localFilters.stages.length}
              >
                <div className="grid grid-cols-2 gap-2">
                  {PIPELINE_STAGES.map((stage) => (
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

              {/* Lead Status */}
              <FilterSection
                title="Status"
                icon={<Filter className="w-4 h-4" />}
                isExpanded={expandedSections.includes("status")}
                onToggle={() => toggleSection("status")}
                count={localFilters.statuses.length}
              >
                <div className="grid grid-cols-2 gap-2">
                  {LEAD_STATUSES.map((status) => (
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
                  {LEAD_SOURCES.map((source) => (
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
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                  {SCHOOLS.map((school) => (
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

              {/* Submission Status */}
              <FilterSection
                title="Submission Status"
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

              {/* Ministry Blocked Filter */}
              <FilterSection
                title="Ministry Blocked"
                icon={<Ban className="w-4 h-4" />}
                isExpanded={expandedSections.includes("ministryBlocked")}
                onToggle={() => toggleSection("ministryBlocked")}
                count={localFilters.ministryBlocked !== "all" ? 1 : 0}
              >
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "all", label: "All" },
                    { value: "blocked", label: "Blocked" },
                    { value: "not_blocked", label: "Not Blocked" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setLocalFilters(prev => ({ ...prev, ministryBlocked: option.value as LeadFilters["ministryBlocked"] }))}
                      className={cn(
                        "p-2.5 rounded-lg border text-sm text-center transition-all",
                        localFilters.ministryBlocked === option.value
                          ? option.value === "blocked"
                            ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                            : "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
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
                title="GPA Range"
                icon={<GraduationCap className="w-4 h-4" />}
                isExpanded={expandedSections.includes("gpa")}
                onToggle={() => toggleSection("gpa")}
                count={(localFilters.gpaMin !== null ? 1 : 0) + (localFilters.gpaMax !== null ? 1 : 0)}
              >
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Min GPA</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="4"
                        placeholder="0.00"
                        value={localFilters.gpaMin ?? ""}
                        onChange={(e) => setLocalFilters(prev => ({
                          ...prev,
                          gpaMin: e.target.value ? parseFloat(e.target.value) : null
                        }))}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Max GPA</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="4"
                        placeholder="4.00"
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
                    Filters by highest available GPA (Grade 12, 11, or 10)
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
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { value: "all", label: "All" },
                    { value: "today", label: "Today" },
                    { value: "week", label: "Week" },
                    { value: "month", label: "Month" },
                    { value: "quarter", label: "Quarter" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setLocalFilters(prev => ({ ...prev, dateRange: option.value as LeadFilters["dateRange"] }))}
                      className={cn(
                        "p-2 rounded-lg border text-xs text-center transition-all",
                        localFilters.dateRange === option.value
                          ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                          : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-secondary)]"
                      )}
                    >
                      {option.label}
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
        className="w-full flex items-center justify-between p-3 hover:bg-[var(--bg-depth-3)] transition-colors"
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
}

export function QuickFilters({
  searchQuery,
  onSearchChange,
  activeStage,
  onStageChange,
  onOpenAdvanced,
  stats,
  total,
}: QuickFiltersProps) {
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
            className="bg-[var(--bg-depth-3)]"
          />
        </div>
        <Button variant="outline" onClick={onOpenAdvanced} className="shrink-0">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Stage Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        <Button
          variant={activeStage === "all" ? "default" : "ghost"}
          size="sm"
          onClick={() => onStageChange("all")}
          className="shrink-0"
        >
          All Stages
          <Badge variant="secondary" size="sm" className="ml-2">
            {total}
          </Badge>
        </Button>
        {PIPELINE_STAGES.map((stage) => {
          const count = stats[stage.value] || 0
          return (
            <Button
              key={stage.value}
              variant={activeStage === stage.value ? "default" : "ghost"}
              size="sm"
              onClick={() => onStageChange(stage.value)}
              className="shrink-0"
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
    </div>
  )
}
