"use client"

export const runtime = 'edge'

import { useState, useMemo, useEffect, useRef, startTransition, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { Header } from "@/components/layout/header"
import { useLeads, useLeadMutations } from "@/lib/hooks/use-leads"
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value"
import { useUser } from "@/lib/hooks/use-user"
import { createClient } from "@/lib/supabase/client"
import { LeadTable, BulkActionsBar } from "@/components/leads/lead-table"
import { exportLeadsToCSV, downloadCSV } from "@/lib/csv-utils"
import { stashCampaignPrefill, leadToPrefillContact } from "@/lib/campaigns/prefill"
import { getLeadDisplayName } from "@/lib/lead-utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/input"
import type { Lead, LeadStatus, PipelineStage, PUCDocumentStatus } from "@/types"
import { PIPELINE_STAGES } from "@/types"
import { computePUCDocumentStatus } from "@/lib/psp/document-status"
import { getMissingPucDocumentStageRequirements } from "@/lib/psp/document-stage-requirements"
import { checkStageTransition } from "@/lib/lead-stage-guards"
import { getDocumentsForGraduateType, type GraduateType } from "@/lib/psp/document-rules"
import type { LeadFilters } from "@/components/leads/lead-filters"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { SimpleTooltip } from "@/components/ui/tooltip"
import {
  Send,
  RefreshCw,
  Download,
  SlidersHorizontal,
  Plus,
} from "lucide-react"

const AppointmentBooking = dynamic(
  () => import("@/components/calendar/appointment-booking").then(m => m.AppointmentBooking),
  { ssr: false }
)
const LeadForm = dynamic(
  () => import("@/components/leads/lead-form").then(m => m.LeadForm),
  { ssr: false }
)
const LeadFiltersPanel = dynamic(
  () => import("@/components/leads/lead-filters").then(m => m.LeadFiltersPanel),
  { ssr: false }
)
const BulkAssignModal = dynamic(
  () => import("@/components/leads/bulk-operations-modal").then(m => m.BulkAssignModal),
  { ssr: false }
)
const BulkDeleteModal = dynamic(
  () => import("@/components/leads/bulk-operations-modal").then(m => m.BulkDeleteModal),
  { ssr: false }
)
const BulkStageModal = dynamic(
  () => import("@/components/leads/bulk-operations-modal").then(m => m.BulkStageModal),
  { ssr: false }
)
const SuccessToast = dynamic(
  () => import("@/components/leads/bulk-operations-modal").then(m => m.SuccessToast),
  { ssr: false }
)

type TopTab = "puc" | "self_fund"

// Self Fund tab page size (server-side paginated)
const SF_PAGE_SIZE = 50

type PucPaymentLeadRow = { lead_id: string }
type PspDocumentRow = { lead_id: string; document_type: string; graduate_type: string | null }
type PspDocumentConfigRow = { graduate_type: string; document_id: string; required: boolean | null }
type RecentStageMove = { stage: PipelineStage; rank: number; lead: Lead }
type LeadStageChangedDetail = { leadId: string; stage: PipelineStage; status?: LeadStatus | null; lead: Lead }

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
  const [sfPage, setSfPage] = useState(1)
  // Lead IDs whose stage was just changed in the current view - keep them visible
  // until the user navigates away from this tab/stage filter.
  const [pucStickyLeadIds, setPucStickyLeadIds] = useState<Set<string>>(new Set())
  const [sfStickyLeadIds, setSfStickyLeadIds] = useState<Set<string>>(new Set())
  const [recentStageMoves, setRecentStageMoves] = useState<Record<string, RecentStageMove>>({})
  const stageMoveRankRef = useRef(0)

  // Clear sticky leads whenever the active tab/stage filter changes.
  useEffect(() => {
    setPucStickyLeadIds(new Set())
  }, [stageFilter, topTab])
  useEffect(() => {
    setSfStickyLeadIds(new Set())
  }, [sfStageFilter, topTab])

  // Reset SF pagination when the stage filter or search query changes,
  // otherwise users get stuck on an empty page after narrowing the result set.
  useEffect(() => {
    setSfPage(1)
  }, [sfStageFilter, sfSearchQuery, topTab])

  useEffect(() => {
    const handleLeadStageChanged = (event: Event) => {
      const detail = (event as CustomEvent<LeadStageChangedDetail>).detail
      if (!detail?.leadId || !detail.stage || !detail.lead) return

      stageMoveRankRef.current += 1
      setRecentStageMoves((prev) => ({
        ...prev,
        [detail.leadId]: {
          stage: detail.stage,
          rank: stageMoveRankRef.current,
          lead: {
            ...detail.lead,
            pipeline_stage: detail.stage,
            position_in_stage: 0,
            status: detail.status === undefined ? detail.lead.status : (detail.status ?? undefined),
          },
        },
      }))
    }

    window.addEventListener("adl:lead-stage-changed", handleLeadStageChanged)
    return () => window.removeEventListener("adl:lead-stage-changed", handleLeadStageChanged)
  }, [])

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
  const [showStageModal, setShowStageModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const { bulkAssignLeads, bulkDeleteLeads, bulkUpdateStage, loading: mutationLoading } = useLeadMutations()

  // Debounce search inputs so each keystroke doesn't fire a Supabase query.
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)
  const debouncedSfSearchQuery = useDebouncedValue(sfSearchQuery, 300)

  // PUC leads - only fetch when PUC tab is active
  const { leads: pucLeads, loading: pucLoading, refetch: pucRefetch } = useLeads({
    fundingType: "puc",
    searchQuery: debouncedSearchQuery,
    limit: 5000,
    enabled: topTab === "puc",
  })

  // Self Fund leads: server-side stage filter + server-side pagination.
  // Pulling 15k+ SF leads with embedded JOINs is too slow for one list view,
  // so we page the result instead. Stage pill counts come from a separate
  // lightweight query below so the pills stay accurate across pages.
  const {
    leads: sfLeads,
    loading: sfLoading,
    refetch: sfRefetch,
    totalCount: sfTotalCount,
    totalPages: sfTotalPages,
  } = useLeads({
    fundingType: "self_funded",
    searchQuery: debouncedSfSearchQuery,
    stage: sfStageFilter !== "all" ? (sfStageFilter as PipelineStage) : "all",
    page: sfPage,
    pageSize: SF_PAGE_SIZE,
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

  // PUC payment completion + doc counts for doc status filtering.
  // Only needed when the doc-status filter is active or the bulk-stage modal is open.
  // LeadTable fetches its own copy for the visible "0/?" row badges, so we keep this
  // off the first-paint path.
  const [pucPaymentLeadIds, setPucPaymentLeadIds] = useState<Set<string>>(new Set())
  const [pucDocCounts, setPucDocCounts] = useState<Record<string, { uploaded: number; required: number }>>({})

  // Pre-warm doc/payment data the moment the user has selected leads (bulk-stage
  // validation needs it) or activates the doc-status filter. Without selection or
  // that filter, the data is unused, so we skip the fetch entirely.
  const needsPucDocData = topTab === "puc" && (filters.docStatuses.length > 0 || selectedLeads.length > 0)

  useEffect(() => {
    if (!needsPucDocData || pucLeads.length === 0) {
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
      const uploadedByLead: Record<string, { types: Set<string>; gradType: string }> = {}
      for (const doc of docsResult.data ?? []) {
        if (!uploadedByLead[doc.lead_id]) {
          uploadedByLead[doc.lead_id] = {
            types: new Set(),
            gradType: doc.graduate_type?.toUpperCase() || "",
          }
        }
        uploadedByLead[doc.lead_id].types.add(doc.document_type)
        if (!uploadedByLead[doc.lead_id].gradType && doc.graduate_type) {
          uploadedByLead[doc.lead_id].gradType = doc.graduate_type.toUpperCase()
        }
      }

      const dbRequiredIds: Record<string, Set<string>> = {}
      const hasDbConfigs = (configsResult.data ?? []).length > 0
      for (const cfg of configsResult.data ?? []) {
        if (cfg.required) {
          const key = cfg.graduate_type.toUpperCase()
          if (!dbRequiredIds[key]) dbRequiredIds[key] = new Set()
          dbRequiredIds[key].add(cfg.document_id)
        }
      }

      const result: Record<string, { uploaded: number; required: number }> = {}
      for (const lead of pucLeads) {
        const uploadedTypes = uploadedByLead[lead.id]?.types ?? new Set<string>()
        const gradType = uploadedByLead[lead.id]?.gradType || lead.education_type?.toUpperCase() || ""
        let requiredIds: string[] = []

        if (gradType && hasDbConfigs && dbRequiredIds[gradType]) {
          requiredIds = Array.from(dbRequiredIds[gradType])
          const baseIds = new Set(getDocumentsForGraduateType(gradType as GraduateType).map(d => d.id))
          const conditionalDocs = getDocumentsForGraduateType(gradType as GraduateType, {
            isTransfer: lead.is_transfer_student,
            isSpecialNeeds: lead.is_special_needs,
            isDiplomatic: lead.is_diplomatic,
          })
          for (const doc of conditionalDocs) {
            if (doc.required && !baseIds.has(doc.id) && !requiredIds.includes(doc.id)) {
              requiredIds.push(doc.id)
            }
          }
        } else if (gradType) {
          const allDocs = getDocumentsForGraduateType(gradType as GraduateType, {
            isTransfer: lead.is_transfer_student,
            isSpecialNeeds: lead.is_special_needs,
            isDiplomatic: lead.is_diplomatic,
          })
          requiredIds = allDocs.filter(d => d.required).map(d => d.id)
        }

        const uploadedRequiredCount = requiredIds.filter(id => uploadedTypes.has(id)).length
        result[lead.id] = { uploaded: uploadedRequiredCount, required: requiredIds.length }
      }
      setPucDocCounts(result)
    })
  }, [pucLeads, needsPucDocData])

  // Compute effective doc status for a lead (used in filtering)
  const getLeadDocStatus = useCallback((lead: Lead): PUCDocumentStatus | null => {
    if (lead.pipeline_stage !== 'puc_document_submission') return null
    if (lead.puc_document_status_override) return lead.puc_document_status_override
    const docInfo = pucDocCounts[lead.id]
    const allDocsComplete = docInfo ? (docInfo.required > 0 && docInfo.uploaded >= docInfo.required) : false
    return computePUCDocumentStatus(lead.submission_substage, allDocsComplete, pucPaymentLeadIds.has(lead.id))
  }, [pucDocCounts, pucPaymentLeadIds])

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
      result = pucLeads.filter((lead) =>
        lead.pipeline_stage === stageFilter ||
        pucStickyLeadIds.has(lead.id) ||
        recentStageMoves[lead.id]?.stage === stageFilter
      )
    }

    const resultById = new Map(result.map((lead) => [lead.id, lead]))
    for (const [leadId, move] of Object.entries(recentStageMoves)) {
      if (stageFilter === "all" || move.stage === stageFilter || pucStickyLeadIds.has(leadId)) {
        resultById.set(leadId, move.lead)
      }
    }
    result = Array.from(resultById.values())

    // Apply advanced filters
    result = applyAdvancedFilters(result)

    result.sort((a, b) => {
      const aRank = recentStageMoves[a.id]?.rank ?? 0
      const bRank = recentStageMoves[b.id]?.rank ?? 0
      return bRank - aRank
    })

    return result
  }, [pucLeads, stageFilter, linkSentLeadIds, pucStickyLeadIds, recentStageMoves, applyAdvancedFilters])

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
      result = result.filter(lead =>
        lead.pipeline_stage === sfStageFilter ||
        sfStickyLeadIds.has(lead.id) ||
        recentStageMoves[lead.id]?.stage === sfStageFilter
      )
    }
    const resultById = new Map(result.map((lead) => [lead.id, lead]))
    for (const [leadId, move] of Object.entries(recentStageMoves)) {
      if (sfStageFilter === "all" || move.stage === sfStageFilter || sfStickyLeadIds.has(leadId)) {
        resultById.set(leadId, move.lead)
      }
    }
    result = Array.from(resultById.values())

    result = applyAdvancedFilters(result)
    result.sort((a, b) => {
      const aRank = recentStageMoves[a.id]?.rank ?? 0
      const bRank = recentStageMoves[b.id]?.rank ?? 0
      return bRank - aRank
    })
    return result
  }, [sfLeads, sfStageFilter, sfStickyLeadIds, recentStageMoves, applyAdvancedFilters])

  const filteredLeads = topTab === "puc" ? pucFilteredLeads : sfFilteredLeads
  const selectedLeadObjects = useMemo(() => {
    const selectedSet = new Set(selectedLeads)
    return leads.filter((lead) => selectedSet.has(lead.id))
  }, [leads, selectedLeads])

  const bulkStageOptions = useMemo(() => {
    if (topTab === "puc") {
      return Object.entries(PUC_STAGE_CONFIG).map(([value, config]) => ({
        value: value as PipelineStage,
        label: config.label,
      }))
    }

    return SF_STAGE_CONFIG
      .filter((stage) => stage.value !== "all" && stage.value !== "lost")
      .map((stage) => ({
        value: stage.value as PipelineStage,
        label: stage.label,
      }))
  }, [topTab])

  const activeFilteredStage = topTab === "puc"
    ? (stageFilter === "link_sent" ? "all" : stageFilter)
    : sfStageFilter
  const activeStickyLeadIds = topTab === "puc" ? pucStickyLeadIds : sfStickyLeadIds
  const pinnedLeadRanks = useMemo(() => {
    if (activeFilteredStage === "all") return {}

    return Object.fromEntries(
      Object.entries(recentStageMoves)
        .filter(([leadId, move]) => activeStickyLeadIds.has(leadId) || move.stage === activeFilteredStage)
        .map(([leadId, move]) => [leadId, move.rank])
    )
  }, [activeFilteredStage, activeStickyLeadIds, recentStageMoves])

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

  // SF stage counts: fetched independently of the paginated lead list so the
  // pill counts stay accurate even when the user is on page 2+ of a single stage.
  // Keep this query aligned with /api/leads: only real leads, same search filter,
  // and "All" excludes lost because lost has its own pill.
  const [sfStageCounts, setSfStageCounts] = useState<Record<string, number>>({ all: 0 })

  useEffect(() => {
    if (topTab !== "self_fund") return

    let cancelled = false
    const supabase = createClient()

    const search = debouncedSfSearchQuery.trim()

    const countSelfFundedStage = async (stage?: PipelineStage) => {
      let query = supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("actual_lead", true)
        .eq("funding_type", "self_funded")

      query = stage ? query.eq("pipeline_stage", stage) : query.neq("pipeline_stage", "lost")

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%,civil_id.ilike.%${search}%`)
      }
      if (profile?.role === "agent") {
        query = query.eq("assigned_to", profile.id)
      }

      const { count, error } = await query
      if (error) throw error
      return count ?? 0
    }

    Promise.all(
      SF_STAGE_CONFIG.map(async ({ value }) => {
        const count = value === "all" ? await countSelfFundedStage() : await countSelfFundedStage(value)
        return [value, count] as const
      })
    )
      .then((entries) => {
        if (!cancelled) setSfStageCounts(Object.fromEntries(entries))
      })
      .catch((error) => {
        if (!cancelled) console.warn("Unable to load self-funded stage counts", error)
      })

    return () => { cancelled = true }
  }, [topTab, sfTotalCount, debouncedSfSearchQuery, profile?.id, profile?.role])

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

  const handleBulkStageConfirm = async (stage: PipelineStage) => {
    if (selectedLeadObjects.length === 0) return

    if (stage === "application") {
      const blocked = selectedLeadObjects
        .filter((lead) => lead.pipeline_stage !== "application")
        .map((lead) => ({
          lead,
          guard: checkStageTransition({ lead, newStage: "application" }),
        }))
        .filter(({ guard }) => guard.kind === "file_requirements" || guard.kind === "file_fee")

      const missingInfo = blocked.filter(({ guard }) => guard.kind === "file_requirements")
      if (missingInfo.length > 0) {
        const details = missingInfo
          .slice(0, 4)
          .map(({ lead, guard }) => {
            const missing = guard.kind === "file_requirements" ? guard.missingFields.join(", ") : ""
            return `${getLeadDisplayName(lead)}: ${missing}`
          })
          .join("\n")
        const suffix = missingInfo.length > 4 ? `\n...and ${missingInfo.length - 4} more` : ""
        window.alert(
          `Cannot move ${missingInfo.length} selected lead${missingInfo.length !== 1 ? "s" : ""} to File yet.\n\nComplete the missing required fields first.\n\n${details}${suffix}`
        )
        return
      }

      const missingFee = blocked.filter(({ guard }) => guard.kind === "file_fee")
      if (missingFee.length > 0) {
        const details = missingFee
          .slice(0, 4)
          .map(({ lead }) => getLeadDisplayName(lead))
          .join("\n")
        const suffix = missingFee.length > 4 ? `\n...and ${missingFee.length - 4} more` : ""
        window.alert(
          `Cannot move ${missingFee.length} selected lead${missingFee.length !== 1 ? "s" : ""} to File yet.\n\nHandle the file fee first for:\n\n${details}${suffix}`
        )
        return
      }
    }

    if (topTab === "puc" && stage === "puc_document_submission") {
      const blocked = selectedLeadObjects
        .filter((lead) => lead.funding_type === "puc" && lead.pipeline_stage === "application")
        .map((lead) => ({
          lead,
          missing: getMissingPucDocumentStageRequirements(lead, pucDocCounts[lead.id]),
        }))
        .filter(({ missing }) => missing.length > 0)

      if (blocked.length > 0) {
        const details = blocked
          .slice(0, 4)
          .map(({ lead, missing }) => `${getLeadDisplayName(lead)}: ${missing.join(", ")}`)
          .join("\n")
        const suffix = blocked.length > 4 ? `\n...and ${blocked.length - 4} more` : ""
        window.alert(
          `Cannot move ${blocked.length} selected lead${blocked.length !== 1 ? "s" : ""} to Documents yet.\n\nComplete the missing PSP information and required documents first.\n\n${details}${suffix}`
        )
        return
      }
    }

    const result = await bulkUpdateStage(selectedLeadObjects.map((lead) => lead.id), stage)
    if (result.error) {
      window.alert(result.error)
      return
    }

    const rankBase = stageMoveRankRef.current + 1
    setRecentStageMoves((prev) => ({
      ...prev,
      ...Object.fromEntries(
        selectedLeadObjects.map((lead, index) => [
          lead.id,
          { stage, rank: rankBase + index, lead: { ...lead, pipeline_stage: stage, position_in_stage: index } },
        ])
      ),
    }))
    stageMoveRankRef.current = rankBase + selectedLeadObjects.length - 1

    if (topTab === "puc" && stageFilter !== "all") {
      setPucStickyLeadIds((prev) => {
        const next = new Set(prev)
        selectedLeadObjects.forEach((lead) => next.add(lead.id))
        return next
      })
    } else if (topTab === "self_fund" && sfStageFilter !== "all") {
      setSfStickyLeadIds((prev) => {
        const next = new Set(prev)
        selectedLeadObjects.forEach((lead) => next.add(lead.id))
        return next
      })
    }

    setShowStageModal(false)
    setSelectedLeads([])
    setSuccessMessage(`${result.count} lead${result.count !== 1 ? "s" : ""} moved`)
    setShowSuccessToast(true)
    refetch()
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
            currentPage={topTab === "self_fund" ? sfPage : 1}
            totalPages={topTab === "self_fund" ? (sfTotalPages || 1) : 1}
            totalCount={topTab === "self_fund" ? sfTotalCount : undefined}
            pageSize={SF_PAGE_SIZE}
            onPageChange={topTab === "self_fund" ? setSfPage : undefined}
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
            pinnedLeadRanks={pinnedLeadRanks}
            onStageChanged={(leadId, newStage, status, leadSnapshot) => {
              stageMoveRankRef.current += 1
              const existing = leadSnapshot || leads.find((lead) => lead.id === leadId) || filteredLeads.find((lead) => lead.id === leadId)
              setRecentStageMoves((prev) => ({
                ...prev,
                [leadId]: {
                  stage: newStage,
                  rank: stageMoveRankRef.current,
                  lead: {
                    ...(existing ?? ({ id: leadId } as Lead)),
                    pipeline_stage: newStage,
                    position_in_stage: 0,
                    status: status === undefined ? existing?.status : (status ?? undefined),
                  },
                },
              }))

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
              onStage={() => setShowStageModal(true)}
              onBook={handleBulkBook}
              onDelete={() => setShowDeleteModal(true)}
              onClear={() => setSelectedLeads([])}
              onCampaign={() => {
                const selectedLeadById = new Map([...leads, ...filteredLeads].map((lead) => [lead.id, lead]))
                const contacts = selectedLeads
                  .map((leadId) => selectedLeadById.get(leadId))
                  .filter((lead): lead is Lead => Boolean(lead))
                  .map(leadToPrefillContact)

                if (contacts.length === 0) {
                  window.alert("Select at least one lead first.")
                  return
                }

                const ready = stashCampaignPrefill({
                  origin: "puc",
                  contacts,
                  createdAt: Date.now(),
                })
                if (!ready) {
                  window.alert("Could not prepare the selected leads for a campaign. Please try again.")
                  return
                }

                window.location.assign("/campaigns?prefill=1")
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Appointment Booking Modal */}
      {bookingLead && (
        <AppointmentBooking
          isOpen={!!bookingLead}
          onClose={() => setBookingLead(null)}
          onSuccess={refetch}
          preselectedLead={bookingLead ?? undefined}
          singleFormMode
        />
      )}

      {/* Bulk Assign Modal */}
      {showAssignModal && (
        <BulkAssignModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          selectedCount={selectedLeads.length}
          onConfirm={handleBulkAssignConfirm}
          loading={mutationLoading}
        />
      )}

      {/* Bulk Stage Modal */}
      {showStageModal && (
        <BulkStageModal
          isOpen={showStageModal}
          onClose={() => setShowStageModal(false)}
          selectedCount={selectedLeads.length}
          options={bulkStageOptions}
          onConfirm={handleBulkStageConfirm}
          loading={mutationLoading}
        />
      )}

      {/* Bulk Delete Modal */}
      {showDeleteModal && (
        <BulkDeleteModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          selectedCount={selectedLeads.length}
          onConfirm={handleBulkDeleteConfirm}
          loading={mutationLoading}
        />
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <SuccessToast
          show={showSuccessToast}
          message={successMessage}
          onHide={() => setShowSuccessToast(false)}
        />
      )}

      {/* Filters Panel */}
      {showFiltersPanel && (
        <LeadFiltersPanel
          filters={filters}
          onChange={setFilters}
          onClose={() => setShowFiltersPanel(false)}
          isOpen={showFiltersPanel}
        />
      )}

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
