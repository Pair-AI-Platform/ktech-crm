"use client"

import { useState, useMemo, useEffect, useRef, startTransition, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/layout/header"
import { useLeads, useLeadMutations } from "@/lib/hooks/use-leads"
import { useUser } from "@/lib/hooks/use-user"
import { createClient } from "@/lib/supabase/client"
import { AppointmentBooking } from "@/components/calendar/appointment-booking"
import { LeadTable, BulkActionsBar } from "@/components/leads/lead-table"
import { BulkAssignModal, BulkDeleteModal, SuccessToast } from "@/components/leads/bulk-operations-modal"
import { exportLeadsToCSV, downloadCSV } from "@/lib/csv-utils"
import { stashCampaignPrefill, leadToPrefillContact } from "@/lib/campaigns/prefill"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/input"
import type { Lead, PipelineStage, PUCDocumentStatus } from "@/types"
import { PIPELINE_STAGES } from "@/types"
import { computePUCDocumentStatus } from "@/lib/psp/document-status"
import { getDocumentsForGraduateType, type GraduateType } from "@/lib/psp/document-rules"
import { LeadFiltersPanel, type LeadFilters } from "@/components/leads/lead-filters"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { LeadForm } from "@/components/leads/lead-form"
import { SimpleTooltip } from "@/components/ui/tooltip"
import {
  Send,
  RefreshCw,
  Download,
  SlidersHorizontal,
  Plus,
} from "lucide-react"

type TopTab = "puc" | "self_fund"

type PucPaymentLeadRow = { lead_id: string }
type PucPaymentAmountRow = { lead_id: string; amount: number | null }
type PspDocumentRow = { lead_id: string; document_type: string; graduate_type: string | null }
type PspDocumentConfigRow = { graduate_type: string; document_id: string; required: boolean | null }

// PUC pipeline stage pills (the stages a PUC lead progresses through)
const PUC_STAGE_CONFIG: Record<string, { label: string }> = {
  new: { label: "New" },
  contacted: { label: "Contacted" },
  visit: { label: "Visit" },
  test: { label: "Test" },
  application: { label: "File" },
  puc_document_submission: { label: "Documents" },
  puc_application_submission: { label: "Submission" },
  applicant: { label: "Applicant" },
  enrolled: { label: "Enrolled" },
  withdraw: { label: "Withdraw" },
}

// Pipeline stages for Self Fund tab (same as Contacts)
const SF_STAGE_CONFIG: { value: PipelineStage | "all"; label: string }[] = [
  { value: "all", label: "All" },
  ...PIPELINE_STAGES.filter(s => s.value !== 'puc_document_submission' && s.value !== 'puc_application_submission').map(s => ({ value: s.value, label: s.label })),
]

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

export default function PUCPSPPage() {
  const { profile } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [topTab, setTopTab] = useState<TopTab>(
    tabParam === "self_fund" || tabParam === "sf_srj" ? "self_fund" : "puc"
  )

  // Sync tab state when URL search param changes (e.g. sidebar navigation).
  // Legacy sf_srj links now resolve to the plain self-funded workspace.
  useEffect(() => {
    if (tabParam === "sf_srj") {
      router.replace("/puc?tab=self_fund")
      setTopTab("self_fund")
    } else if (tabParam === "self_fund") {
      setTopTab("self_fund")
    } else if (tabParam === "puc") {
      setTopTab("puc")
    } else if (!tabParam) {
      setTopTab("puc")
    }
  }, [router, tabParam])
  const stagePillsRef = useRef<HTMLDivElement>(null)
  const pendingScrollRestore = useRef<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [stageFilter, setStageFilter] = useState<string>("all")
  const [sfStageFilter, setSfStageFilter] = useState<PipelineStage | "all">("all")
  const [sfSearchQuery, setSfSearchQuery] = useState("")
  // Lead IDs whose stage was just changed in the current view - keep them visible
  // until the user navigates away from this tab/stage filter.
  const [pucStickyLeadIds, setPucStickyLeadIds] = useState<Set<string>>(new Set())
  const [sfStickyLeadIds, setSfStickyLeadIds] = useState<Set<string>>(new Set())

  // Clear sticky leads whenever the active tab/stage filter changes.
  useEffect(() => {
    setPucStickyLeadIds(new Set())
  }, [stageFilter, topTab])
  useEffect(() => {
    setSfStickyLeadIds(new Set())
  }, [sfStageFilter, topTab])

  // Restore view state from sessionStorage on mount (for back navigation)
  useEffect(() => {
    const saved = sessionStorage.getItem("puc-psp-view-state")
    if (!saved) return
    sessionStorage.removeItem("puc-psp-view-state")
    try {
      const state = JSON.parse(saved)
      if (state.topTab) setTopTab(state.topTab === "sf_srj" ? "self_fund" : state.topTab)
      if (state.searchQuery) setSearchQuery(state.searchQuery)
      if (state.stageFilter) setStageFilter(state.stageFilter)
      if (state.sfStageFilter) setSfStageFilter(state.sfStageFilter)
      if (state.sfSearchQuery) setSfSearchQuery(state.sfSearchQuery)
      if (state.scrollTop) pendingScrollRestore.current = state.scrollTop
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [bookingLead, setBookingLead] = useState<Lead | null>(null)
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)
  const [filters, setFilters] = useState<LeadFilters>(defaultFilters)

  // New state for table + modal layout
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const { bulkAssignLeads, bulkDeleteLeads, loading: mutationLoading } = useLeadMutations()

  // PUC leads - only fetch when PUC tab is active
  const { leads: pucLeads, loading: pucLoading, refetch: pucRefetch } = useLeads({
    fundingType: "puc",
    searchQuery,
    limit: 200,
    enabled: topTab === "puc",
  })

  // Self Fund leads - only fetch when Self Fund tab is active
  const { leads: sfLeads, loading: sfLoading, refetch: sfRefetch } = useLeads({
    fundingType: "self_funded",
    searchQuery: sfSearchQuery,
    limit: 200,
    enabled: topTab === "self_fund",
  })

  // Active leads/loading/refetch based on tab
  const leads = topTab === "puc" ? pucLeads : sfLeads
  const loading = topTab === "puc" ? pucLoading : sfLoading
  const refetch = topTab === "puc" ? pucRefetch : sfRefetch

  // Restore scroll position after data loads
  useEffect(() => {
    if (!loading && pendingScrollRestore.current !== null) {
      const scrollEl = document.querySelector('.overflow-auto.scrollbar-thin')
      if (scrollEl) {
        requestAnimationFrame(() => {
          scrollEl.scrollTop = pendingScrollRestore.current!
          pendingScrollRestore.current = null
        })
      } else {
        pendingScrollRestore.current = null
      }
    }
  }, [loading])

  // Clear selection when switching tabs
  useEffect(() => {
    setSelectedLeads([])
  }, [topTab])

  // Track which leads have pending/processing payment links
  const [linkSentLeadIds, setLinkSentLeadIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (topTab !== "puc" || pucLeads.length === 0) {
      startTransition(() => setLinkSentLeadIds(new Set()))
      return
    }
    const supabase = createClient()
    const ids = pucLeads.map((l) => l.id)
    supabase
      .from("payment_transactions")
      .select("lead_id")
      .in("lead_id", ids)
      .eq("notes", "PSP Fee Payment")
      .in("status", ["pending", "processing"])
      .then(({ data }: { data: PucPaymentLeadRow[] | null }) => {
        if (data) {
          setLinkSentLeadIds(new Set(data.map((r) => r.lead_id)))
        }
      })
  }, [pucLeads, topTab])

  const linkSentCount = linkSentLeadIds.size

  // Payment stats (Amendment 2)
  const [paymentStats, setPaymentStats] = useState<{
    seatReservationCount: number
    fullDownpaymentCount: number
    totalPaid: number
  }>({ seatReservationCount: 0, fullDownpaymentCount: 0, totalPaid: 0 })

  useEffect(() => {
    if (topTab !== "puc" || pucLeads.length === 0) {
      startTransition(() => setPaymentStats({ seatReservationCount: 0, fullDownpaymentCount: 0, totalPaid: 0 }))
      return
    }
    const supabase = createClient()
    const ids = pucLeads.map((l) => l.id)
    supabase
      .from("payment_transactions")
      .select("lead_id, amount")
      .in("lead_id", ids)
      .eq("status", "completed")
      .eq("notes", "PSP Fee Payment")
      .then(({ data }: { data: PucPaymentAmountRow[] | null }) => {
        if (!data) return
        const leadTotals = new Map<string, number>()
        for (const tx of data) {
          leadTotals.set(tx.lead_id, (leadTotals.get(tx.lead_id) || 0) + (tx.amount || 0))
        }
        let seatReservation = 0
        let fullDownpayment = 0
        let totalPaid = 0
        for (const [, total] of leadTotals) {
          totalPaid++
          if (total >= 150) seatReservation++
          if (total >= 400) fullDownpayment++
        }
        setPaymentStats({ seatReservationCount: seatReservation, fullDownpaymentCount: fullDownpayment, totalPaid })
      })
  }, [pucLeads, topTab])

  // PUC payment completion + doc counts for doc status filtering
  const [pucPaymentLeadIds, setPucPaymentLeadIds] = useState<Set<string>>(new Set())
  const [pucDocCounts, setPucDocCounts] = useState<Record<string, { uploaded: number; required: number }>>({})

  useEffect(() => {
    if (topTab !== "puc" || pucLeads.length === 0) {
      startTransition(() => { setPucPaymentLeadIds(new Set()); setPucDocCounts({}) })
      return
    }
    const supabase = createClient()
    const pucLeadIds = pucLeads.map(l => l.id)

    // Fetch completed PSP payment leads
    supabase
      .from('payment_transactions')
      .select('lead_id')
      .in('lead_id', pucLeadIds)
      .eq('status', 'completed')
      .eq('notes', 'PSP Fee Payment')
      .then(({ data }: { data: PucPaymentLeadRow[] | null }) => {
        if (data) setPucPaymentLeadIds(new Set(data.map(t => t.lead_id)))
      })

    // Fetch doc counts
    Promise.all([
      supabase
        .from('psp_documents')
        .select('lead_id, document_type, graduate_type')
        .in('lead_id', pucLeadIds),
      supabase
        .from('psp_document_configs')
        .select('graduate_type, document_id, required')
        .eq('is_active', true),
    ]).then(([docsResult, configsResult]: [
      { data: PspDocumentRow[] | null },
      { data: PspDocumentConfigRow[] | null },
    ]) => {
      const uploadedByLead: Record<string, Set<string>> = {}
      for (const doc of docsResult.data ?? []) {
        if (!uploadedByLead[doc.lead_id]) uploadedByLead[doc.lead_id] = new Set()
        uploadedByLead[doc.lead_id].add(doc.document_type)
      }

      const dbRequiredCounts: Record<string, number> = {}
      const hasDbConfigs = (configsResult.data ?? []).length > 0
      for (const cfg of configsResult.data ?? []) {
        if (cfg.required) {
          dbRequiredCounts[cfg.graduate_type] = (dbRequiredCounts[cfg.graduate_type] || 0) + 1
        }
      }

      const result: Record<string, { uploaded: number; required: number }> = {}
      for (const lead of pucLeads) {
        const uploaded = uploadedByLead[lead.id]?.size ?? 0
        let requiredCount = 0
        const gradType = lead.academic_track || 'science'
        if (hasDbConfigs && dbRequiredCounts[gradType] !== undefined) {
          requiredCount = dbRequiredCounts[gradType]
        } else {
          const allDocs = getDocumentsForGraduateType(gradType as GraduateType, {
            isTransfer: lead.is_transfer_student,
            isSpecialNeeds: lead.is_special_needs,
            isDiplomatic: lead.is_diplomatic,
          })
          requiredCount = allDocs.filter(d => d.required).length
        }
        result[lead.id] = { uploaded, required: requiredCount }
      }
      setPucDocCounts(result)
    })
  }, [pucLeads, topTab])

  // Compute effective doc status for a lead (used in filtering)
  const getLeadDocStatus = useCallback((lead: Lead): PUCDocumentStatus | null => {
    if (lead.pipeline_stage !== 'puc_document_submission') return null
    if (lead.puc_document_status_override) return lead.puc_document_status_override
    const docInfo = pucDocCounts[lead.id]
    const allDocsComplete = docInfo ? (docInfo.required > 0 && docInfo.uploaded >= docInfo.required) : false
    return computePUCDocumentStatus(lead.submission_substage, allDocsComplete, pucPaymentLeadIds.has(lead.id))
  }, [pucDocCounts, pucPaymentLeadIds])

  // Placement test stats (Amendment 3)
  const placementStats = useMemo(() => {
    if (topTab !== "puc") return { foundation1: 0, foundation2: 0, directEntry: 0, total: 0 }
    let foundation1 = 0
    let foundation2 = 0
    let directEntry = 0
    for (const lead of pucLeads) {
      const level = (lead as unknown as Record<string, unknown>).placement_level as string | undefined
      if (!level) continue
      if (level === "foundation_1") foundation1++
      else if (level === "foundation_2") foundation2++
      else if (level === "direct_entry") directEntry++
    }
    return { foundation1, foundation2, directEntry, total: foundation1 + foundation2 + directEntry }
  }, [pucLeads, topTab])

  // Shared advanced filter logic applied to any lead array
  const applyAdvancedFilters = useCallback((leadsArr: Lead[]) => {
    return leadsArr.filter((lead) => {
      // Status filter
      if (filters.statuses.length > 0 && (!lead.status || !filters.statuses.includes(lead.status))) return false
      // Source filter
      if (filters.sources.length > 0 && !filters.sources.includes(lead.source)) return false
      // School filter
      if (filters.schools.length > 0 && lead.school && !filters.schools.includes(lead.school)) return false
      // Academic track (type) filter
      if (filters.academicTrack !== "all" && lead.academic_track !== filters.academicTrack) return false
      // Date range filter
      if (filters.dateRange !== "all") {
        const leadDate = new Date(lead.created_at)
        const now = new Date()
        const diffDays = Math.floor((now.getTime() - leadDate.getTime()) / (1000 * 60 * 60 * 24))
        switch (filters.dateRange) {
          case "today": if (diffDays > 0) return false; break
          case "week": if (diffDays > 7) return false; break
          case "month": if (diffDays > 30) return false; break
          case "quarter": if (diffDays > 90) return false; break
        }
      }
      // GPA filter
      if (filters.gpaMin !== null || filters.gpaMax !== null) {
        const leadGpa = lead.gpa_grade_12_expected ?? lead.gpa_grade_11 ?? lead.gpa_grade_10
        if (leadGpa === undefined || leadGpa === null) return false
        if (filters.gpaMin !== null && leadGpa < filters.gpaMin) return false
        if (filters.gpaMax !== null && leadGpa > filters.gpaMax) return false
      }
      // Appointment type filter
      if (filters.appointmentTypes.length > 0) {
        const leadAppointments = lead.appointments || []
        const hasMatch = leadAppointments.some(apt =>
          apt.appointment_type.some(type => filters.appointmentTypes.includes(type))
        )
        if (!hasMatch) return false
      }
      // Block reasons filter
      if (filters.blockReasons.length > 0) {
        if (!lead.submission_blocked_reason || !filters.blockReasons.includes(lead.submission_blocked_reason)) return false
      }
      // Submission substage filter
      if (filters.submissionSubstages.length > 0) {
        if (!lead.submission_substage || !filters.submissionSubstages.includes(lead.submission_substage)) return false
      }
      // Submission status filter
      if (filters.submissionStatuses.length > 0) {
        if (!lead.submission_status || !filters.submissionStatuses.includes(lead.submission_status)) return false
      }
      // Has notes filter
      if (filters.hasNotes === "with_notes" && (!lead.notes || lead.notes.trim() === "")) return false
      if (filters.hasNotes === "without_notes" && lead.notes && lead.notes.trim() !== "") return false
      // Doc status filter
      if (filters.docStatuses.length > 0) {
        const docStatus = getLeadDocStatus(lead)
        if (!docStatus || !filters.docStatuses.includes(docStatus)) return false
      }
      return true
    })
  }, [filters, getLeadDocStatus])

  // PUC filtered leads
  const pucFilteredLeads = useMemo(() => {
    let result: Lead[]
    if (stageFilter === "link_sent") {
      result = pucLeads.filter((lead) => linkSentLeadIds.has(lead.id) || pucStickyLeadIds.has(lead.id))
    } else if (stageFilter === "all") {
      result = [...pucLeads]
    } else {
      result = pucLeads.filter((lead) => lead.pipeline_stage === stageFilter || pucStickyLeadIds.has(lead.id))
    }

    // Apply advanced filters
    result = applyAdvancedFilters(result)

    return result
  }, [pucLeads, stageFilter, linkSentLeadIds, pucStickyLeadIds, applyAdvancedFilters])

  // Count active filters for badge
  const activeFiltersCount =
    filters.statuses.length +
    filters.sources.length +
    filters.schools.length +
    filters.appointmentTypes.length +
    filters.submissionSubstages.length +
    filters.submissionStatuses.length +
    (filters.dateRange !== "all" ? 1 : 0) +
    (filters.gpaMin !== null ? 1 : 0) +
    (filters.gpaMax !== null ? 1 : 0) +
    filters.blockReasons.length +
    (filters.hasNotes !== "all" ? 1 : 0) +
    (filters.paymentStatus !== "all" ? 1 : 0) +
    filters.docStatuses.length

  // SF filtered leads (stage filtering done client-side for correct counts)
  const sfFilteredLeads = useMemo(() => {
    let result = [...sfLeads]
    // Apply stage filter client-side
    if (sfStageFilter !== "all") {
      result = result.filter(lead => lead.pipeline_stage === sfStageFilter || sfStickyLeadIds.has(lead.id))
    }
    result = applyAdvancedFilters(result)
    return result
  }, [sfLeads, sfStageFilter, sfStickyLeadIds, applyAdvancedFilters])

  const filteredLeads = topTab === "puc" ? pucFilteredLeads : sfFilteredLeads

  const stageCounts = useMemo(() => {
    let allCount = 0
    const counts: Record<string, number> = {}
    for (const lead of pucLeads) {
      counts[lead.pipeline_stage] = (counts[lead.pipeline_stage] || 0) + 1
      if (lead.pipeline_stage !== "lost") {
        allCount++
      }
    }
    counts.all = allCount
    return counts
  }, [pucLeads])

  // SF stage counts
  const sfStageCounts = useMemo(() => {
    const counts: Record<string, number> = { all: sfLeads.length }
    for (const lead of sfLeads) {
      counts[lead.pipeline_stage] = (counts[lead.pipeline_stage] || 0) + 1
    }
    return counts
  }, [sfLeads])

  // Selection handlers
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

  // Bulk operation handlers
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

  const handleBulkBook = () => {
    const leadIds = selectedLeads.join(",")
    window.location.href = `/calendar?book=${leadIds}`
  }

  // Scroll active stage pill into view when filter changes
  const activeStageFilter = topTab === "puc" ? stageFilter : sfStageFilter
  useEffect(() => {
    const container = stagePillsRef.current
    if (!container) return
    const activeBtn = container.querySelector('[data-active="true"]') as HTMLElement
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [activeStageFilter])

  const handleExportCSV = () => {
    const csvContent = exportLeadsToCSV(filteredLeads)
    const prefix = topTab === "puc" ? "puc" : "self_fund"
    const filename = `${prefix}_leads_export_${new Date().toISOString().split("T")[0]}.csv`
    downloadCSV(csvContent, filename)
    setSuccessMessage(`${filteredLeads.length} leads exported`)
    setShowSuccessToast(true)
  }

  return (
    <div className="flex-1 bg-[var(--bg-base)] flex flex-col min-h-0 min-w-0">
      <Header
        user={profile}
        title={topTab === "puc" ? "PUC" : "Self Funded"}
        action={{
          label: "Add Lead",
          onClick: () => setShowAddForm(true),
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      <div className="px-3 py-4 sm:p-6 gap-4 sm:gap-6 page-enter flex flex-col flex-1 min-h-0 min-w-0 h-full">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Filter */}
            <Button
              variant={activeFiltersCount > 0 ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowFiltersPanel(true)}
            >
              <SlidersHorizontal className="w-4 h-4 mr-1.5" />
              Filter
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" size="sm" className="ml-1.5">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
            {/* GPA Sort */}
            {/* Refresh */}
            <SimpleTooltip content="Refresh" side="bottom">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                className="text-[var(--text-muted)] w-8 h-8 sm:w-9 sm:h-9"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </Button>
            </SimpleTooltip>
            {/* Export CSV */}
            <SimpleTooltip content="Export CSV" side="bottom">
              <Button
                variant="ghost"
                size="icon"
                className="text-[var(--text-muted)] w-8 h-8 sm:w-9 sm:h-9"
                onClick={handleExportCSV}
                disabled={filteredLeads.length === 0}
              >
                <Download className="w-4 h-4" />
              </Button>
            </SimpleTooltip>
          </div>
        </div>

        {/* Search & Stage Filters */}
        <div className="space-y-4">
          {topTab === "puc" ? (
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery("")}
              placeholder="Search leads by name, phone, or civil ID..."
              className="bg-[var(--bg-sunken)]"
            />
          ) : (
            <SearchInput
              value={sfSearchQuery}
              onChange={(e) => setSfSearchQuery(e.target.value)}
              onClear={() => setSfSearchQuery("")}
              placeholder="Search self-funded leads by name, phone, or civil ID..."
              className="bg-[var(--bg-sunken)]"
            />
          )}

          {/* Stage Pills */}
          <div ref={stagePillsRef} className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {topTab === "puc" ? (
              <>
                <Button
                  variant={stageFilter === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setStageFilter("all")}
                  className="shrink-0"
                  data-active={stageFilter === "all"}
                >
                  All
                  <Badge variant="secondary" size="sm" className="ml-2">
                    {stageCounts.all || 0}
                  </Badge>
                </Button>
                {Object.entries(PUC_STAGE_CONFIG).map(([key, config]) => {
                  const count = stageCounts[key] || 0
                  return (
                    <Button
                      key={key}
                      variant={stageFilter === key ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setStageFilter(stageFilter === key ? "all" : key)}
                      className="shrink-0"
                      data-active={stageFilter === key}
                    >
                      {config.label}
                      <Badge variant="secondary" size="sm" className="ml-2">
                        {count}
                      </Badge>
                    </Button>
                  )
                })}
                {linkSentCount > 0 && (
                  <Button
                    variant={stageFilter === "link_sent" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setStageFilter(stageFilter === "link_sent" ? "all" : "link_sent")}
                    className="shrink-0"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Link Sent
                    <Badge variant="secondary" size="sm" className="ml-2">
                      {linkSentCount}
                    </Badge>
                  </Button>
                )}
              </>
            ) : (
              <>
                {SF_STAGE_CONFIG.map(({ value, label }) => {
                  const count = value === "all" ? sfStageCounts.all || 0 : sfStageCounts[value] || 0
                  if (value !== "all" && count === 0 && sfStageFilter !== value) return null
                  return (
                    <Button
                      key={value}
                      variant={sfStageFilter === value ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSfStageFilter(value)}
                      className="shrink-0"
                      data-active={sfStageFilter === value}
                    >
                      {label}
                      <Badge variant="secondary" size="sm" className="ml-2">
                        {count}
                      </Badge>
                    </Button>
                  )
                })}
              </>
            )}
          </div>
        </div>

        {/* Lead Table (full width) */}
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
              sessionStorage.setItem("puc-psp-view-state", JSON.stringify({
                topTab,
                searchQuery,
                stageFilter,
                sfStageFilter,
                sfSearchQuery,
                scrollTop: scrollEl?.scrollTop ?? 0,
              }))
              router.push(`/leads/${lead.id}?from=${topTab}`)
            }}
            currentStageFilter={topTab === "puc" ? (stageFilter === "link_sent" ? "all" : stageFilter as PipelineStage | "all") : sfStageFilter}
            fundingTypeFilter={topTab === "puc" ? "puc" : "self_funded"}
            onStageChanged={(leadId) => {
              // Only pin when a sub-filter is active; on "all" the lead never disappears.
              if (topTab === "puc") {
                if (stageFilter !== "all") {
                  setPucStickyLeadIds((prev) => {
                    if (prev.has(leadId)) return prev
                    const next = new Set(prev)
                    next.add(leadId)
                    return next
                  })
                }
              } else if (sfStageFilter !== "all") {
                setSfStickyLeadIds((prev) => {
                  if (prev.has(leadId)) return prev
                  const next = new Set(prev)
                  next.add(leadId)
                  return next
                })
              }
            }}
          />
        </motion.div>

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedLeads.length > 0 && (
            <BulkActionsBar
              selectedCount={selectedLeads.length}
              onAssign={() => setShowAssignModal(true)}
              onBook={handleBulkBook}
              onDelete={() => setShowDeleteModal(true)}
              onClear={() => setSelectedLeads([])}
              onCampaign={() => {
                const selectedSet = new Set(selectedLeads)
                const contacts = filteredLeads
                  .filter((l) => selectedSet.has(l.id))
                  .map(leadToPrefillContact)
                stashCampaignPrefill({
                  origin: "puc",
                  contacts,
                  createdAt: Date.now(),
                })
                router.push("/campaigns?prefill=1")
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Appointment Booking Modal */}
      <AppointmentBooking
        isOpen={!!bookingLead}
        onClose={() => setBookingLead(null)}
        onSuccess={refetch}
        preselectedLead={bookingLead ?? undefined}
        singleFormMode
      />

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

      {/* Success Toast */}
      <SuccessToast
        show={showSuccessToast}
        message={successMessage}
        onHide={() => setShowSuccessToast(false)}
      />

      {/* Filters Panel */}
      <LeadFiltersPanel
        filters={filters}
        onChange={setFilters}
        onClose={() => setShowFiltersPanel(false)}
        isOpen={showFiltersPanel}
      />

      {/* Add Lead Form Modal */}
      {showAddForm && (
        <LeadForm
          key="new"
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            refetch()
            setShowAddForm(false)
          }}
        />
      )}

    </div>
  )
}
