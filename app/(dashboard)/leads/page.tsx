"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Download,
  Upload,
  RefreshCw,
  Sparkles,
  GraduationCap,
  BookOpen,
} from "lucide-react"
import { type PipelineStage, type Lead, type LeadStatus, PIPELINE_STAGES } from "@/types"
import { useLeads, useLeadStats, useLeadMutations, useLostReasons } from "@/lib/hooks/use-leads"
import { useUser } from "@/lib/hooks/use-user"
import { LeadForm } from "@/components/leads/lead-form"
import { LeadTable, BulkActionsBar } from "@/components/leads/lead-table"
import { LeadFiltersPanel, QuickFilters, type LeadFilters } from "@/components/leads/lead-filters"
import { BulkAssignModal, BulkDeleteModal, SuccessToast } from "@/components/leads/bulk-operations-modal"
import { CSVImportModal } from "@/components/leads/csv-import-modal"
import { MinistryImportDialog } from "@/components/leads/ministry-import-dialog"
import { PucImportDialog } from "@/components/leads/puc-import-dialog"
import { PucImportBadge } from "@/components/leads/puc-import-badge"
import { EnrollFromListDialog } from "@/components/leads/enroll-from-list-dialog"
import { PSPTransferModal } from "@/components/leads/psp-transfer-modal"
import { MOEGPAFetchDialog } from "@/components/leads/moe-gpa-fetch-dialog"
import { SendRSVPDialog } from "@/components/leads/send-rsvp-dialog"
import { MarkLostDialog } from "@/components/leads/mark-lost-dialog"
import { exportLeadsToCSV, downloadCSV } from "@/lib/csv-utils"
import { stashCampaignPrefill, leadToPrefillContact } from "@/lib/campaigns/prefill"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { ErrorState } from "@/components/ui/error-state"

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
  pucImportFlagged: "all",
  docStatuses: [],
  placementLevels: [],
  campaignIds: [],
  semesterIds: [],
}

export default function LeadsPage() {
  const searchParams = useSearchParams()
  const searchParamsString = searchParams.toString()
  const router = useRouter()
  const { profile, isAdmin } = useUser()
  const { reasons: lostReasons } = useLostReasons()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)
  const [filters, setFilters] = useState<LeadFilters>(defaultFilters)
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [stageFilter, setStageFilter] = useState<PipelineStage | "all">("all")
  const [lostAtFilter, setLostAtFilter] = useState<PipelineStage | "all">("all")
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showLostModal, setShowLostModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showPSPTransferModal, setShowPSPTransferModal] = useState(false)
const [showMOEFetchModal, setShowMOEFetchModal] = useState(false)
  const [showRSVPModal, setShowRSVPModal] = useState(false)
  const [showMinistryImportModal, setShowMinistryImportModal] = useState(false)
  const [showPucImportModal, setShowPucImportModal] = useState(false)
  const [showEnrollFromListModal, setShowEnrollFromListModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  const { bulkAssignLeads, bulkDeleteLeads, bulkUpdateStage, loading: mutationLoading } = useLeadMutations()
  const initialCheckDone = useRef(false)
  const pendingScrollRestore = useRef<number | null>(null)
  const viewStateRestored = useRef(false)
  const lastSyncedParams = useRef<string | null>(null)
  const [studentPaymentMap, setStudentPaymentMap] = useState<Map<string, string>>(new Map())

  // Restore view state from sessionStorage on mount (for back navigation)
  useEffect(() => {
    const saved = sessionStorage.getItem("leads-view-state")
    if (!saved) return
    sessionStorage.removeItem("leads-view-state")
    // Don't restore if URL already has params driving state
    if (searchParams.get("stage") || searchParams.get("new")) return
    try {
      const state = JSON.parse(saved)
      viewStateRestored.current = true
      if (state.searchQuery) setFilters(prev => ({ ...prev, searchQuery: state.searchQuery }))
      if (state.stageFilter) setStageFilter(state.stageFilter)
      if (state.lostAtFilter) setLostAtFilter(state.lostAtFilter)
      if (state.scrollTop) pendingScrollRestore.current = state.scrollTop
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Check URL params for opening the form (only once on mount)
  useEffect(() => {
    if (!initialCheckDone.current) {
      initialCheckDone.current = true

      // Check for new lead form
      if (searchParams.get("new") === "true") {
        // Use setTimeout to schedule the state update after the current render cycle
        setTimeout(() => setShowAddForm(true), 0)
      }
    }
  }, [searchParamsString])

  // Sync filters from URL params (for sidebar sub-tab navigation like PUC SRJ)
  useEffect(() => {
    // Skip if searchParams matches what we last synced to URL (prevents infinite loop)
    if (lastSyncedParams.current !== null && searchParamsString === lastSyncedParams.current) {
      return
    }
    // Skip the initial sync if we just restored view state from sessionStorage
    if (viewStateRestored.current) {
      viewStateRestored.current = false
      return
    }

    const stageParam = searchParams.get("stage") as PipelineStage | null
    if (stageParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing URL params to local state
      setStageFilter(stageParam)
      if (stageParam !== "lost") setLostAtFilter("all")
    } else {
      // No stage param = "All Leads" view, reset from any previous stage
      setStageFilter("all")
      setLostAtFilter("all")
    }

    const fundingTypeParam = searchParams.get("funding_type") as "self_funded" | "puc" | null
    const gpaMinParam = searchParams.get("gpa_min")
    const gpaMaxParam = searchParams.get("gpa_max")
    const isKuwaitiParam = searchParams.get("is_kuwaiti")
    const paymentStatusParam = searchParams.get("payment_status") as "pending" | "seat_reserved" | "full_tuition" | null
    const searchQueryParam = searchParams.get("q")
    const statusesParam = searchParams.get("statuses")
    const sourcesParam = searchParams.get("sources")
    const dateRangeParam = searchParams.get("date_range")
    const assignedToParam = searchParams.get("assigned_to")
    const academicTrackParam = searchParams.get("academic_track")
    const lostAtParam = searchParams.get("lost_at") as PipelineStage | null

    if (lostAtParam) {
      setLostAtFilter(lostAtParam)
    }

    const hasFilterParams = fundingTypeParam || gpaMinParam || gpaMaxParam || isKuwaitiParam || paymentStatusParam || searchQueryParam || statusesParam || sourcesParam || dateRangeParam || assignedToParam || academicTrackParam

    if (hasFilterParams) {
      setFilters(prev => ({
        ...prev,
        ...(searchQueryParam ? { searchQuery: searchQueryParam } : {}),
        ...(fundingTypeParam ? { fundingType: fundingTypeParam } : {}),
        ...(gpaMinParam ? { gpaMin: parseFloat(gpaMinParam) } : {}),
        ...(gpaMaxParam ? { gpaMax: parseFloat(gpaMaxParam) } : {}),
        ...(isKuwaitiParam === "true" ? { isKuwaiti: true } : isKuwaitiParam === "false" ? { isKuwaiti: false } : {}),
        ...(paymentStatusParam ? { paymentStatus: paymentStatusParam } : {}),
        ...(statusesParam ? { statuses: statusesParam.split(",") as LeadStatus[] } : {}),
        ...(sourcesParam ? { sources: sourcesParam.split(",") as LeadFilters['sources'] } : {}),
        ...(dateRangeParam ? { dateRange: dateRangeParam as LeadFilters['dateRange'] } : {}),
        ...(assignedToParam ? { assignedTo: assignedToParam } : {}),
        ...(academicTrackParam ? { academicTrack: academicTrackParam as LeadFilters['academicTrack'] } : {}),
      }))
    }
  }, [searchParamsString])

  // Sync filter state to URL search params (for shareability and back-navigation)
  useEffect(() => {
    const params = new URLSearchParams()

    if (stageFilter !== "all") params.set("stage", stageFilter)
    if (filters.searchQuery) params.set("q", filters.searchQuery)
    if (filters.fundingType !== "all") params.set("funding_type", filters.fundingType)
    if (filters.statuses.length > 0) params.set("statuses", filters.statuses.join(","))
    if (filters.sources.length > 0) params.set("sources", filters.sources.join(","))
    if (filters.dateRange !== "all") params.set("date_range", filters.dateRange)
    if (filters.assignedTo) params.set("assigned_to", filters.assignedTo)
    if (filters.gpaMin !== null) params.set("gpa_min", String(filters.gpaMin))
    if (filters.gpaMax !== null) params.set("gpa_max", String(filters.gpaMax))
    if (filters.isKuwaiti !== null) params.set("is_kuwaiti", String(filters.isKuwaiti))
    if (filters.academicTrack !== "all") params.set("academic_track", filters.academicTrack)
    if (lostAtFilter !== "all") params.set("lost_at", lostAtFilter)

    const newUrl = params.toString() ? `?${params.toString()}` : "/leads"
    // Use replaceState to avoid polluting browser history with every filter change
    lastSyncedParams.current = params.toString()
    window.history.replaceState(null, "", newUrl)
  }, [stageFilter, lostAtFilter, filters.searchQuery, filters.fundingType, filters.statuses, filters.sources, filters.dateRange, filters.assignedTo, filters.gpaMin, filters.gpaMax, filters.isKuwaiti, filters.academicTrack])

  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 50

  // Build server-side filters object
  const serverFilters = {
    statuses: filters.statuses,
    sources: filters.sources,
    schools: filters.schools,
    academicTrack: filters.academicTrack,
    dateRange: filters.dateRange,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    assignedTo: filters.assignedTo,
    gpaMin: filters.gpaMin,
    gpaMax: filters.gpaMax,
    isKuwaiti: filters.isKuwaiti,
    blockReasons: filters.blockReasons,
    submissionSubstages: filters.submissionSubstages,
    submissionStatuses: filters.submissionStatuses,
    lostAtStages: filters.lostAtStages,
    lostAtFilter: stageFilter === "lost" ? lostAtFilter : undefined,
    hasNotes: filters.hasNotes,
    lostReasonIds: filters.lostReasonIds,
    withdrawalReasons: filters.withdrawalReasons,
    genders: filters.genders,
    governorates: filters.governorates,
    ministryAssigned: filters.ministryAssigned,
    pucImportFlagged: filters.pucImportFlagged,
    docStatuses: filters.docStatuses,
    placementLevels: filters.placementLevels,
    campaignIds: filters.campaignIds,
    semesterIds: filters.semesterIds,
  }

  // Reset to page 1 when any filter changes
  useEffect(() => {
    setCurrentPage(1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageFilter, filters.searchQuery, filters.fundingType, filters.statuses, filters.sources, filters.schools, filters.academicTrack, filters.dateRange, filters.assignedTo, filters.gpaMin, filters.gpaMax, filters.isKuwaiti, filters.blockReasons, filters.submissionSubstages, filters.submissionStatuses, filters.lostAtStages, filters.hasNotes, filters.lostReasonIds, filters.withdrawalReasons, filters.genders, filters.governorates, filters.paymentStatus, filters.paymentAmountMin, filters.paymentAmountMax, filters.appointmentTypes, lostAtFilter])

  const { leads, loading, error, totalCount, totalPages, refetch } = useLeads({
    stage: stageFilter,
    fundingType: filters.fundingType,
    searchQuery: filters.searchQuery,
    page: currentPage,
    pageSize,
    filters: serverFilters,
  })

  const { stats } = useLeadStats()

  // Check if payment range filter is active
  const isPaymentRangeActive = filters.paymentAmountMin > 0 || filters.paymentAmountMax < 5000

  // Track whether client-side-only filters are active (payment, appointments)
  const hasClientSideFilters = filters.paymentStatus !== "all" || isPaymentRangeActive || filters.appointmentTypes.length > 0 || (stageFilter === "all")

  // Restore scroll position after leads finish loading
  useEffect(() => {
    if (!loading && pendingScrollRestore.current !== null) {
      const scrollTop = pendingScrollRestore.current
      pendingScrollRestore.current = null
      requestAnimationFrame(() => {
        const scrollEl = document.querySelector('.overflow-auto.scrollbar-thin')
        if (scrollEl) scrollEl.scrollTop = scrollTop
      })
    }
  }, [loading])

  // Fetch student payment data when payment filter is active
  const leadIds = leads.map(l => l.id).join(",")
  useEffect(() => {
    if (filters.paymentStatus === "all" && !isPaymentRangeActive) {
      setStudentPaymentMap(prev => prev.size === 0 ? prev : new Map())
      return
    }

    const sfLeadIds = leads.filter(l => l.funding_type === "self_funded").map(l => l.id)
    if (sfLeadIds.length === 0) {
      setStudentPaymentMap(prev => prev.size === 0 ? prev : new Map())
      return
    }

    const supabase = createClient()
    supabase
      .from("students")
      .select("lead_id, payment_status")
      .in("lead_id", sfLeadIds)
      .then(({ data }) => {
        const map = new Map<string, string>()
        if (data) {
          for (const row of data) {
            if (row.lead_id) map.set(row.lead_id, row.payment_status ?? "pending")
          }
        }
        setStudentPaymentMap(map)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.paymentStatus, isPaymentRangeActive, leadIds])

  // Client-side filtering (only for filters that can't be done server-side)
  const filteredLeads = leads.filter((lead) => {
    // Exclude lost leads from "all" view (they have their own sidebar tab)
    if (stageFilter === "all" && lead.pipeline_stage === "lost") return false
    // Funding type filter (also applied server-side, but kept for "all" stage lost exclusion consistency)
    if (filters.fundingType !== "all" && lead.funding_type !== filters.fundingType) return false
    // Appointment type filter (requires join - can't easily do server-side)
    if (filters.appointmentTypes.length > 0) {
      const leadAppointments = lead.appointments || []
      const hasMatchingAppointment = leadAppointments.some(apt =>
        apt.appointment_type?.some(type => filters.appointmentTypes.includes(type))
      )
      if (!hasMatchingAppointment) return false
    }
    // Payment status filter (self-funded only, requires students table join)
    if (filters.paymentStatus !== "all") {
      if (lead.funding_type !== "self_funded") return false
      const status = studentPaymentMap.get(lead.id) ?? "pending"
      if (status !== filters.paymentStatus) return false
    }
    // Payment amount range filter (self-funded only)
    if (isPaymentRangeActive) {
      if (lead.funding_type !== "self_funded") return false
      const status = studentPaymentMap.get(lead.id) ?? "pending"
      const statusRanges: Record<string, [number, number]> = {
        pending: [0, 149],
        seat_reserved: [150, 549],
        full_tuition: [550, 1000],
      }
      const range = statusRanges[status] ?? [0, 149]
      if (range[1] < filters.paymentAmountMin || range[0] > filters.paymentAmountMax) return false
    }
    return true
  })

  // Compute lost-at stage counts for the lost view tabs
  const lostAtStats = stageFilter === "lost" ? leads.reduce<Record<string, number>>((acc, lead) => {
    if (lead.pipeline_stage === "lost" && lead.lost_at_stage) {
      acc[lead.lost_at_stage] = (acc[lead.lost_at_stage] || 0) + 1
    }
    return acc
  }, {}) : {}

  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(filteredLeads.map((l) => l.id))
    }
  }

  const toggleSelectLead = (id: string) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleFormSuccess = () => {
    refetch()
    setEditingLead(null)
    // Remove the ?new=true from URL
    window.history.replaceState({}, "", "/leads")
  }

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead)
  }

  const handleBulkAssign = () => {
    setShowAssignModal(true)
  }

  const handleBulkAssignConfirm = async (agentIds: string[]) => {
    if (agentIds.length === 1) {
      const result = await bulkAssignLeads(selectedLeads, agentIds[0])
      if (!result.error) {
        setShowAssignModal(false)
        setSelectedLeads([])
        setSuccessMessage(`${result.count} lead${result.count !== 1 ? "s" : ""} assigned successfully`)
        setShowSuccessToast(true)
        refetch()
      }
    } else {
      // Split leads evenly across agents
      const base = Math.floor(selectedLeads.length / agentIds.length)
      const remainder = selectedLeads.length % agentIds.length
      let offset = 0
      let totalAssigned = 0
      let hasError = false

      for (let i = 0; i < agentIds.length; i++) {
        const count = base + (i < remainder ? 1 : 0)
        const chunk = selectedLeads.slice(offset, offset + count)
        offset += count

        if (chunk.length > 0) {
          const result = await bulkAssignLeads(chunk, agentIds[i])
          if (result.error) {
            hasError = true
            break
          }
          totalAssigned += result.count
        }
      }

      if (!hasError) {
        setShowAssignModal(false)
        setSelectedLeads([])
        setSuccessMessage(`${totalAssigned} lead${totalAssigned !== 1 ? "s" : ""} assigned to ${agentIds.length} agents`)
        setShowSuccessToast(true)
        refetch()
      }
    }
  }

  const handleBulkBook = () => {
    // Navigate to calendar with selected leads for booking
    const leadIds = selectedLeads.join(",")
    window.location.href = `/calendar?book=${leadIds}`
  }

  const handleBulkDelete = () => {
    setShowDeleteModal(true)
  }

  const handleBulkDeleteConfirm = async () => {
    const result = await bulkDeleteLeads(selectedLeads)
    if (!result.error) {
      setShowDeleteModal(false)
      setSelectedLeads([])
      setSuccessMessage(`${result.count} lead${result.count !== 1 ? "s" : ""} deleted`)
      setShowSuccessToast(true)
      refetch()
    }
  }

  const handleBulkLost = () => {
    setShowLostModal(true)
  }

  const handleBulkLostConfirm = async (reasonId: string, notes?: string) => {
    const result = await bulkUpdateStage(selectedLeads, "lost" as PipelineStage, reasonId, notes)
    if (!result.error) {
      setShowLostModal(false)
      setSelectedLeads([])
      setSuccessMessage(`${result.count} lead${result.count !== 1 ? "s" : ""} marked as lost`)
      setShowSuccessToast(true)
      refetch()
    }
  }

  const handleExportCSV = () => {
    const csvContent = exportLeadsToCSV(filteredLeads)
    const filename = `leads_export_${new Date().toISOString().split("T")[0]}.csv`
    downloadCSV(csvContent, filename)
    setSuccessMessage(`${filteredLeads.length} leads exported`)
    setShowSuccessToast(true)
  }

  const handleImportSuccess = (count: number) => {
    setSuccessMessage(`${count} lead${count !== 1 ? "s" : ""} imported successfully`)
    setShowSuccessToast(true)
    refetch()
  }

  const handleMOEFetchSuccess = () => {
    setShowMOEFetchModal(false)
    setSelectedLeads([])
    setSuccessMessage("GPA fetch completed successfully")
    setShowSuccessToast(true)
    refetch()
  }

  const handleMinistryImportSuccess = (updatedCount: number, createdCount: number) => {
    const messages = []
    if (updatedCount > 0) messages.push(`${updatedCount} lead${updatedCount !== 1 ? "s" : ""} updated`)
    if (createdCount > 0) messages.push(`${createdCount} lead${createdCount !== 1 ? "s" : ""} created`)
    setSuccessMessage(`Ministry import: ${messages.join(", ")}`)
    setShowSuccessToast(true)
    refetch()
  }

  const handlePucImportSuccess = (matchedCount: number, flaggedCount: number, createdCount: number) => {
    const messages = []
    if (matchedCount > 0) messages.push(`${matchedCount} matched`)
    if (flaggedCount > 0) messages.push(`${flaggedCount} Type 2`)
    if (createdCount > 0) messages.push(`${createdCount} created`)
    setSuccessMessage(`PUC Import: ${messages.join(", ")} → Applicant`)
    setShowSuccessToast(true)
    refetch()
  }

  // Get the selected lead objects for the MOE dialog
  const selectedLeadObjects = filteredLeads.filter((lead) =>
    selectedLeads.includes(lead.id)
  )

  return (
    <div className="flex-1 bg-[var(--bg-base)] flex flex-col min-h-0 min-w-0">
      <Header
        user={profile}
        title={stageFilter === "lost" ? "Lost" : "All Leads"}
        action={{
          label: "Add Lead",
          onClick: () => setShowAddForm(true),
          icon: <Plus className="w-4 h-4" />
        }}
      />

      <div className="px-3 py-4 sm:p-6 gap-4 sm:gap-6 page-enter flex flex-col flex-1 min-h-0 min-w-0 h-full">
        {/* Stats Bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {/* SF/PUC Toggle */}
            <div className="flex items-center p-1 bg-[var(--bg-surface)] rounded-lg border border-[var(--border)]">
              {[
                { value: "all" as const, label: "All" },
                { value: "self_funded" as const, label: "SF" },
                { value: "puc" as const, label: "PUC" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilters(prev => ({ ...prev, fundingType: option.value }))}
                  aria-pressed={filters.fundingType === option.value}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                    filters.fundingType === option.value
                      ? "bg-[var(--primary)] text-white shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Refresh Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              className="text-[var(--text-muted)] w-8 h-8 sm:w-9 sm:h-9"
              aria-label="Refresh leads"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>

            {/* Import/Export - hidden on small mobile, shown sm+ */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex text-[var(--text-muted)]"
              onClick={() => setShowImportModal(true)}
              title="Import CSV"
            >
              <Upload className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex items-center gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
              onClick={() => setShowMinistryImportModal(true)}
              title="Import Ministry GPA List"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Ministry Import</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex items-center gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50 hover:border-amber-300"
              onClick={() => setShowPucImportModal(true)}
              title="PUC Import - Cross-reference ministry acceptance list with PUC Submission"
            >
              <PucImportBadge size="xs" />
              <span className="text-xs font-medium">PUC Import</span>
            </Button>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex items-center gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300"
                onClick={() => setShowEnrollFromListModal(true)}
                title="Enroll from List - Match civil IDs and move applicants to enrolled"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Enroll from List</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-[var(--text-muted)] w-8 h-8 sm:w-9 sm:h-9"
              onClick={handleExportCSV}
              title="Export CSV"
              disabled={filteredLeads.length === 0}
              aria-label="Export leads"
            >
              <Download className="w-4 h-4" />
            </Button>
            {/* Mobile-only import button (collapsed) */}
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden text-[var(--text-muted)] w-8 h-8"
              onClick={() => setShowImportModal(true)}
              title="Import"
            >
              <Upload className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Filters */}
        {stageFilter === "lost" ? (
          <QuickFilters
            searchQuery={filters.searchQuery}
            onSearchChange={(query) => setFilters(prev => ({ ...prev, searchQuery: query }))}
            activeStage={lostAtFilter}
            onStageChange={(stage) => setLostAtFilter(stage)}
            onOpenAdvanced={() => setShowFiltersPanel(true)}
            stats={lostAtStats as Record<PipelineStage, number>}
            total={leads.filter(l => l.pipeline_stage === "lost").length}
            lostAtMode
            lostReasonFilter={filters.lostReasonIds}
            onLostReasonFilterChange={(ids) => setFilters(prev => ({ ...prev, lostReasonIds: ids }))}
            lostReasons={lostReasons}
          />
        ) : (
          <QuickFilters
            searchQuery={filters.searchQuery}
            onSearchChange={(query) => setFilters(prev => ({ ...prev, searchQuery: query }))}
            activeStage={stageFilter}
            onStageChange={setStageFilter}
            onOpenAdvanced={() => setShowFiltersPanel(true)}
            stats={stats.byStage}
            total={stats.total}
            hideStages
          />
        )}

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col min-h-0 min-w-0 h-full"
        >
          <LeadTable
            leads={filteredLeads}
            loading={loading}
            selectedLeads={selectedLeads}
            onSelectLead={toggleSelectLead}
            onSelectAll={toggleSelectAll}
            onLeadClick={(lead) => {
              // Save view state so we can restore it on back navigation
              const scrollEl = document.querySelector('.overflow-auto.scrollbar-thin')
              sessionStorage.setItem("leads-view-state", JSON.stringify({
                searchQuery: filters.searchQuery,
                stageFilter,
                lostAtFilter,
                scrollTop: scrollEl?.scrollTop ?? 0,
              }))
              router.push(`/leads/${lead.id}${stageFilter && stageFilter !== "all" ? `?stage=${stageFilter}` : ""}`)
            }}
            onEditLead={handleEditLead}
            currentStageFilter={stageFilter}
            fundingTypeFilter={filters.fundingType}
            currentPage={currentPage}
            totalPages={hasClientSideFilters ? Math.ceil(filteredLeads.length / pageSize) || 1 : totalPages}
            totalCount={hasClientSideFilters ? filteredLeads.length : totalCount}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </motion.div>

        {/* Error State */}
        {error && !loading && (
          <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
            <ErrorState
              title="Failed to load leads"
              message={error}
              onRetry={() => refetch()}
            />
          </div>
        )}

        {/* Empty State for No Leads */}
        {!loading && !error && filteredLeads.length === 0 && leads.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-20 h-20 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center mb-4">
              <Sparkles className="w-10 h-10 text-[var(--primary)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
              No leads yet
            </h3>
            <p className="text-[var(--text-muted)] mb-6 text-center max-w-md">
              Start building your pipeline by adding your first lead. You can import leads in bulk or add them one by one.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowImportModal(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Lead
              </Button>
            </div>
          </motion.div>
        )}

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedLeads.length > 0 && (
            <BulkActionsBar
              selectedCount={selectedLeads.length}
              onAssign={handleBulkAssign}
              onBook={handleBulkBook}
              onLost={handleBulkLost}
              onDelete={handleBulkDelete}
              onClear={() => setSelectedLeads([])}
              onMOEFetch={() => setShowMOEFetchModal(true)}
              onSendRSVP={() => setShowRSVPModal(true)}
              onCampaign={() => {
                stashCampaignPrefill({
                  origin: "leads",
                  contacts: selectedLeadObjects.map(leadToPrefillContact),
                  createdAt: Date.now(),
                })
                router.push("/campaigns?prefill=1")
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Filters Panel */}
      <LeadFiltersPanel
        filters={filters}
        onChange={setFilters}
        onClose={() => setShowFiltersPanel(false)}
        isOpen={showFiltersPanel}
      />

      {/* Add/Edit Lead Form Modal */}
      {(showAddForm || editingLead) && (
        <LeadForm
          key={editingLead?.id || 'new'}
          lead={editingLead}
          onClose={() => {
            setShowAddForm(false)
            setEditingLead(null)
            window.history.replaceState({}, "", "/leads")
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Bulk Assign Modal */}
      <BulkAssignModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        selectedCount={selectedLeads.length}
        onConfirm={handleBulkAssignConfirm}
        loading={mutationLoading}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        selectedCount={selectedLeads.length}
        onConfirm={handleBulkDeleteConfirm}
        loading={mutationLoading}
      />

      {/* Bulk Mark Lost Dialog */}
      <MarkLostDialog
        open={showLostModal}
        onOpenChange={setShowLostModal}
        onConfirm={handleBulkLostConfirm}
        leadName={`${selectedLeads.length} lead${selectedLeads.length !== 1 ? "s" : ""}`}
      />

      {/* Success Toast */}
      <SuccessToast
        show={showSuccessToast}
        message={successMessage}
        onHide={() => setShowSuccessToast(false)}
      />

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportSuccess}
      />

      {/* Ministry GPA Import Modal */}
      <MinistryImportDialog
        isOpen={showMinistryImportModal}
        onClose={() => setShowMinistryImportModal(false)}
        onSuccess={handleMinistryImportSuccess}
      />

      {/* PUC Import Modal */}
      <PucImportDialog
        isOpen={showPucImportModal}
        onClose={() => setShowPucImportModal(false)}
        onSuccess={handlePucImportSuccess}
      />

      {/* Enroll from List Modal */}
      <EnrollFromListDialog
        isOpen={showEnrollFromListModal}
        onClose={() => setShowEnrollFromListModal(false)}
        onSuccess={(count) => {
          refetch()
          setSuccessMessage(`Enrolled ${count} ${count === 1 ? "student" : "students"}`)
          setShowSuccessToast(true)
        }}
      />

      {/* PSP Transfer Modal */}
      <PSPTransferModal
        isOpen={showPSPTransferModal}
        onClose={() => setShowPSPTransferModal(false)}
        onSuccess={() => {
          refetch()
          setSuccessMessage("PUC leads transferred to Submission stage")
          setShowSuccessToast(true)
        }}
      />

      {/* MOE GPA Fetch Modal */}
      <MOEGPAFetchDialog
        isOpen={showMOEFetchModal}
        onClose={() => setShowMOEFetchModal(false)}
        selectedLeads={selectedLeadObjects}
        onSuccess={handleMOEFetchSuccess}
      />

      {/* Send RSVP Modal */}
      <SendRSVPDialog
        isOpen={showRSVPModal}
        onClose={() => setShowRSVPModal(false)}
        selectedLeads={selectedLeadObjects}
        onSuccess={() => {
          refetch()
          setSuccessMessage("RSVP links generated successfully")
          setShowSuccessToast(true)
        }}
      />

    </div>
  )
}
