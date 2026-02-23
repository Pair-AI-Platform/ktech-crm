"use client"

import { useState, useMemo, useEffect, startTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Header } from "@/components/layout/header"
import { useLeads, useLeadMutations } from "@/lib/hooks/use-leads"
import { useUser } from "@/lib/hooks/use-user"
import { PSPSubmissionWizard } from "@/components/leads/psp-submission-wizard"
import { preloadAllForLead } from "@/lib/psp/preloader"
import { createClient } from "@/lib/supabase/client"
import { AppointmentBooking } from "@/components/calendar/appointment-booking"
import { LeadTable, BulkActionsBar } from "@/components/leads/lead-table"
import { BulkAssignModal, BulkDeleteModal, SuccessToast } from "@/components/leads/bulk-operations-modal"
import { exportLeadsToCSV, downloadCSV } from "@/lib/csv-utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/input"
import type { Lead, PipelineStage } from "@/types"
import { PIPELINE_STAGES } from "@/types"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import {
  Send,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Download,
  GraduationCap,
  Wallet,
} from "lucide-react"

type TopTab = "puc" | "sf_srj" | "self_fund"
type GPASortMode = "none" | "gpa_desc" | "gpa_asc"

const SUBSTAGE_CONFIG: Record<string, { label: string }> = {
  documents: { label: "Documents" },
  submissions: { label: "Submissions" },
  sf_srj: { label: "SF SRJ" },
  lost: { label: "Lost" },
}

// Pipeline stages for Self Fund tab (same as Contacts)
const SF_STAGE_CONFIG: { value: PipelineStage | "all"; label: string }[] = [
  { value: "all", label: "All" },
  ...PIPELINE_STAGES.map(s => ({ value: s.value, label: s.label })),
]

export default function PUCSRJPage() {
  const { profile } = useUser()
  const router = useRouter()
  const [topTab, setTopTab] = useState<TopTab>("puc")
  const [searchQuery, setSearchQuery] = useState("")
  const [stageFilter, setStageFilter] = useState<string>("all")
  const [sfSrjStageFilter, setSfSrjStageFilter] = useState<string>("all")
  const [sfSrjSearchQuery, setSfSrjSearchQuery] = useState("")
  const [sfStageFilter, setSfStageFilter] = useState<PipelineStage | "all">("all")
  const [sfSearchQuery, setSfSearchQuery] = useState("")
  const [bookingLead, setBookingLead] = useState<Lead | null>(null)
  const [gpaSortMode, setGpaSortMode] = useState<GPASortMode>("none")

  // New state for table + modal layout
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [wizardLead, setWizardLead] = useState<Lead | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  const { bulkAssignLeads, bulkDeleteLeads, loading: mutationLoading } = useLeadMutations()

  // PUC leads
  const { leads: pucLeads, loading: pucLoading, refetch: pucRefetch } = useLeads({
    fundingType: "puc",
    searchQuery,
    limit: 200,
  })

  // SF SRJ leads (self-funded applicants)
  const { leads: sfSrjLeads, loading: sfSrjLoading, refetch: sfSrjRefetch } = useLeads({
    fundingType: "self_funded",
    stage: "applicant",
    searchQuery: sfSrjSearchQuery,
    limit: 200,
  })

  // Self Fund leads
  const { leads: sfLeads, loading: sfLoading, refetch: sfRefetch } = useLeads({
    fundingType: "self_funded",
    stage: sfStageFilter,
    searchQuery: sfSearchQuery,
    limit: 200,
  })

  // Active leads/loading/refetch based on tab
  const leads = topTab === "puc" ? pucLeads : topTab === "sf_srj" ? sfSrjLeads : sfLeads
  const loading = topTab === "puc" ? pucLoading : topTab === "sf_srj" ? sfSrjLoading : sfLoading
  const refetch = topTab === "puc" ? pucRefetch : topTab === "sf_srj" ? sfSrjRefetch : sfRefetch

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
      .then(({ data }) => {
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
      .then(({ data }) => {
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

  // PUC filtered leads
  const pucFilteredLeads = useMemo(() => {
    let result: Lead[]
    if (stageFilter === "link_sent") {
      result = pucLeads.filter((lead) => linkSentLeadIds.has(lead.id))
    } else if (stageFilter === "all") {
      result = [...pucLeads]
    } else {
      result = pucLeads.filter((lead) => (lead.submission_substage || "documents") === stageFilter)
    }

    if (gpaSortMode !== "none") {
      result.sort((a, b) => {
        const aGpa = a.actual_gpa ?? -1
        const bGpa = b.actual_gpa ?? -1
        return gpaSortMode === "gpa_desc" ? bGpa - aGpa : aGpa - bGpa
      })
    }

    return result
  }, [pucLeads, stageFilter, linkSentLeadIds, gpaSortMode])

  // SF SRJ filtered leads (self-funded applicants with substage filters)
  const sfSrjFilteredLeads = useMemo(() => {
    let result: Lead[]
    if (sfSrjStageFilter === "all") {
      result = [...sfSrjLeads]
    } else {
      result = sfSrjLeads.filter((lead) => (lead.submission_substage || "documents") === sfSrjStageFilter)
    }
    if (gpaSortMode !== "none") {
      result.sort((a, b) => {
        const aGpa = a.actual_gpa ?? -1
        const bGpa = b.actual_gpa ?? -1
        return gpaSortMode === "gpa_desc" ? bGpa - aGpa : aGpa - bGpa
      })
    }
    return result
  }, [sfSrjLeads, sfSrjStageFilter, gpaSortMode])

  // SF filtered leads (already filtered by stage via useLeads, just apply GPA sort)
  const sfFilteredLeads = useMemo(() => {
    const result = [...sfLeads]
    if (gpaSortMode !== "none") {
      result.sort((a, b) => {
        const aGpa = a.actual_gpa ?? -1
        const bGpa = b.actual_gpa ?? -1
        return gpaSortMode === "gpa_desc" ? bGpa - aGpa : aGpa - bGpa
      })
    }
    return result
  }, [sfLeads, gpaSortMode])

  const filteredLeads = topTab === "puc" ? pucFilteredLeads : topTab === "sf_srj" ? sfSrjFilteredLeads : sfFilteredLeads

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = { all: pucLeads.length }
    for (const lead of pucLeads) {
      const stage = lead.submission_substage || "documents"
      counts[stage] = (counts[stage] || 0) + 1
    }
    return counts
  }, [pucLeads])

  // SF SRJ stage counts
  const sfSrjStageCounts = useMemo(() => {
    const counts: Record<string, number> = { all: sfSrjLeads.length }
    for (const lead of sfSrjLeads) {
      const stage = lead.submission_substage || "documents"
      counts[stage] = (counts[stage] || 0) + 1
    }
    return counts
  }, [sfSrjLeads])

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

  const handleExportCSV = () => {
    const csvContent = exportLeadsToCSV(filteredLeads)
    const prefix = topTab === "puc" ? "puc" : "self_fund"
    const filename = `${prefix}_leads_export_${new Date().toISOString().split("T")[0]}.csv`
    downloadCSV(csvContent, filename)
    setSuccessMessage(`${filteredLeads.length} leads exported`)
    setShowSuccessToast(true)
  }

  return (
    <div className="flex-1 bg-[var(--bg-base)] flex flex-col min-h-0">
      <Header
        user={profile}
        title="PUC SRJ"
        subtitle={topTab === "puc" ? "PSP Submission Wizard" : topTab === "sf_srj" ? "Self Funded SRJ" : "Self Fund Leads"}
      />

      <div className="p-6 gap-6 page-enter flex flex-col flex-1 min-h-0 h-full">
        {/* Top Tab Switcher */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center p-1 bg-[var(--bg-surface)] rounded-lg border border-[var(--border)]">
              <button
                onClick={() => setTopTab("puc")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
                  topTab === "puc"
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                )}
              >
                <GraduationCap className="w-4 h-4" />
                PUC
              </button>
              <button
                onClick={() => setTopTab("sf_srj")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
                  topTab === "sf_srj"
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                )}
              >
                <Wallet className="w-4 h-4" />
                Self Funded SRJ
              </button>
              <button
                onClick={() => setTopTab("self_fund")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
                  topTab === "self_fund"
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                )}
              >
                <Wallet className="w-4 h-4" />
                Self Fund
              </button>
            </div>

            {/* Stats (PUC only) */}
            {topTab === "puc" && (
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="info" size="sm">PUC</Badge>
                <span className="text-sm text-[var(--text-muted)]">
                  {filteredLeads.length} leads
                </span>
                {paymentStats.totalPaid > 0 && (
                  <>
                    <div className="w-px h-4 bg-[var(--border)]" />
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
                        Seat ({'\u2265'}150 KD): {paymentStats.seatReservationCount}
                        {pucLeads.length > 0 && <span className="opacity-70"> ({Math.round((paymentStats.seatReservationCount / pucLeads.length) * 100)}%)</span>}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
                        Full ({'\u2265'}400 KD): {paymentStats.fullDownpaymentCount}
                        {pucLeads.length > 0 && <span className="opacity-70"> ({Math.round((paymentStats.fullDownpaymentCount / pucLeads.length) * 100)}%)</span>}
                      </span>
                    </div>
                  </>
                )}
                {placementStats.total > 0 && (
                  <>
                    <div className="w-px h-4 bg-[var(--border)]" />
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">
                        F1: {placementStats.foundation1}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-medium">
                        F2: {placementStats.foundation2}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium">
                        Direct: {placementStats.directEntry}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Stats (SF SRJ) */}
            {topTab === "sf_srj" && (
              <div className="flex items-center gap-3">
                <Badge variant="accent" size="sm">SF SRJ</Badge>
                <span className="text-sm text-[var(--text-muted)]">
                  {filteredLeads.length} leads
                </span>
              </div>
            )}

            {/* Stats (SF only) */}
            {topTab === "self_fund" && (
              <div className="flex items-center gap-3">
                <Badge variant="accent" size="sm">SF</Badge>
                <span className="text-sm text-[var(--text-muted)]">
                  {filteredLeads.length} leads
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* GPA Sort */}
            <Button
              variant={gpaSortMode !== "none" ? "default" : "ghost"}
              size="sm"
              onClick={() => setGpaSortMode(prev => prev === "none" ? "gpa_desc" : prev === "gpa_desc" ? "gpa_asc" : "none")}
              title={gpaSortMode === "none" ? "Sort by GPA" : gpaSortMode === "gpa_desc" ? "GPA: High to Low" : "GPA: Low to High"}
            >
              {gpaSortMode === "none" && <ArrowUpDown className="w-4 h-4 mr-1.5" />}
              {gpaSortMode === "gpa_desc" && <ArrowDown className="w-4 h-4 mr-1.5" />}
              {gpaSortMode === "gpa_asc" && <ArrowUp className="w-4 h-4 mr-1.5" />}
              GPA
            </Button>
            {/* Refresh */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              className="text-[var(--text-muted)]"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
            {/* Export CSV */}
            <Button
              variant="ghost"
              size="icon"
              className="text-[var(--text-muted)]"
              onClick={handleExportCSV}
              title="Export CSV"
              disabled={filteredLeads.length === 0}
            >
              <Download className="w-4 h-4" />
            </Button>
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
          ) : topTab === "sf_srj" ? (
            <SearchInput
              value={sfSrjSearchQuery}
              onChange={(e) => setSfSrjSearchQuery(e.target.value)}
              onClear={() => setSfSrjSearchQuery("")}
              placeholder="Search self-funded SRJ leads..."
              className="bg-[var(--bg-sunken)]"
            />
          ) : (
            <SearchInput
              value={sfSearchQuery}
              onChange={(e) => setSfSearchQuery(e.target.value)}
              onClear={() => setSfSearchQuery("")}
              placeholder="Search self-fund leads by name, phone, or civil ID..."
              className="bg-[var(--bg-sunken)]"
            />
          )}

          {/* Stage Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {topTab === "puc" ? (
              <>
                <Button
                  variant={stageFilter === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setStageFilter("all")}
                  className="shrink-0"
                >
                  All
                  <Badge variant="secondary" size="sm" className="ml-2">
                    {stageCounts.all || 0}
                  </Badge>
                </Button>
                {Object.entries(SUBSTAGE_CONFIG).map(([key, config]) => {
                  const count = stageCounts[key] || 0
                  if (count === 0 && stageFilter !== key) return null
                  return (
                    <Button
                      key={key}
                      variant={stageFilter === key ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setStageFilter(stageFilter === key ? "all" : key)}
                      className="shrink-0"
                    >
                      {config.label}
                      {count > 0 && (
                        <Badge variant="secondary" size="sm" className="ml-2">
                          {count}
                        </Badge>
                      )}
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
            ) : topTab === "sf_srj" ? (
              <>
                <Button
                  variant={sfSrjStageFilter === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSfSrjStageFilter("all")}
                  className="shrink-0"
                >
                  All
                  <Badge variant="secondary" size="sm" className="ml-2">
                    {sfSrjStageCounts.all || 0}
                  </Badge>
                </Button>
                {Object.entries(SUBSTAGE_CONFIG).map(([key, config]) => {
                  const count = sfSrjStageCounts[key] || 0
                  if (count === 0 && sfSrjStageFilter !== key) return null
                  return (
                    <Button
                      key={key}
                      variant={sfSrjStageFilter === key ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSfSrjStageFilter(sfSrjStageFilter === key ? "all" : key)}
                      className="shrink-0"
                    >
                      {config.label}
                      {count > 0 && (
                        <Badge variant="secondary" size="sm" className="ml-2">
                          {count}
                        </Badge>
                      )}
                    </Button>
                  )
                })}
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
          className="flex-1 flex flex-col min-h-0 h-full"
        >
          <LeadTable
            leads={filteredLeads}
            loading={loading}
            selectedLeads={selectedLeads}
            onSelectLead={toggleSelectLead}
            onSelectAll={toggleSelectAll}
            onLeadClick={(lead) => {
              if (topTab === "puc" || topTab === "sf_srj") {
                preloadAllForLead(lead.id)
                setWizardLead(lead)
              } else {
                router.push(`/leads/${lead.id}`)
              }
            }}
            currentStageFilter={topTab === "puc" || topTab === "sf_srj" ? "applicant" : sfStageFilter}
            fundingTypeFilter={topTab === "puc" ? "puc" : "self_funded"}
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
            />
          )}
        </AnimatePresence>
      </div>

      {/* PSP Submission Wizard Modal (PUC only) */}
      <PSPSubmissionWizard
        isOpen={!!wizardLead}
        onClose={() => setWizardLead(null)}
        lead={wizardLead}
        onSuccess={() => {
          if (topTab === "sf_srj") sfSrjRefetch()
          else pucRefetch()
          setWizardLead(null)
        }}
      />

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
    </div>
  )
}
