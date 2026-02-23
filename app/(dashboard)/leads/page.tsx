"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import {
  Plus,
  Download,
  Upload,
  RefreshCw,
  Sparkles,
  GraduationCap,
  BookOpen,
} from "lucide-react"
import { type PipelineStage, type Lead } from "@/types"
import { useLeads, useLeadStats, useLeadMutations } from "@/lib/hooks/use-leads"
import { useUser } from "@/lib/hooks/use-user"
import { LeadForm } from "@/components/leads/lead-form"
import { LeadTable, BulkActionsBar } from "@/components/leads/lead-table"
import { LeadFiltersPanel, QuickFilters, type LeadFilters } from "@/components/leads/lead-filters"
import { BulkAssignModal, BulkDeleteModal, SuccessToast } from "@/components/leads/bulk-operations-modal"
import { CSVImportModal } from "@/components/leads/csv-import-modal"
import { PUCImportDialog } from "@/components/leads/puc-import-dialog"
import { MinistryImportDialog } from "@/components/leads/ministry-import-dialog"
import { PSPTransferModal } from "@/components/leads/psp-transfer-modal"
import { MOEGPAFetchDialog } from "@/components/leads/moe-gpa-fetch-dialog"
import { exportLeadsToCSV, downloadCSV } from "@/lib/csv-utils"
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
  assignedTo: "",
  hasEmail: null,
  hasPhone: null,
  gpaMin: null,
  gpaMax: null,
  isKuwaiti: null,
  ministryBlocked: "all",
  hasNotes: "all",
  paymentStatus: "all",
}

export default function LeadsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { profile } = useUser()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)
  const [filters, setFilters] = useState<LeadFilters>(defaultFilters)
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [stageFilter, setStageFilter] = useState<PipelineStage | "all">("all")
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showPUCImportModal, setShowPUCImportModal] = useState(false)
  const [showPSPTransferModal, setShowPSPTransferModal] = useState(false)
const [showMOEFetchModal, setShowMOEFetchModal] = useState(false)
  const [showMinistryImportModal, setShowMinistryImportModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  const { bulkAssignLeads, bulkDeleteLeads, loading: mutationLoading } = useLeadMutations()
  const initialCheckDone = useRef(false)
  const [studentPaymentMap, setStudentPaymentMap] = useState<Map<string, string>>(new Map())

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
  }, [searchParams])

  // Sync filters from URL params (for sidebar sub-tab navigation like PUC SRJ)
  useEffect(() => {
    const stageParam = searchParams.get("stage") as PipelineStage | null
    if (stageParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing URL params to local state
      setStageFilter(stageParam)
    }

    const fundingTypeParam = searchParams.get("funding_type") as "self_funded" | "puc" | null
    const gpaMinParam = searchParams.get("gpa_min")
    const isKuwaitiParam = searchParams.get("is_kuwaiti")
    const paymentStatusParam = searchParams.get("payment_status") as "pending" | "seat_reserved" | "full_tuition" | null

    if (fundingTypeParam || gpaMinParam || isKuwaitiParam || paymentStatusParam) {

      setFilters(prev => ({
        ...prev,
        ...(fundingTypeParam ? { fundingType: fundingTypeParam } : {}),
        ...(gpaMinParam ? { gpaMin: parseFloat(gpaMinParam) } : {}),
        ...(isKuwaitiParam === "true" ? { isKuwaiti: true } : isKuwaitiParam === "false" ? { isKuwaiti: false } : {}),
        ...(paymentStatusParam ? { paymentStatus: paymentStatusParam } : {}),
      }))
    }
  }, [searchParams])

  const { leads, loading, error, refetch } = useLeads({
    stage: stageFilter,
    searchQuery: filters.searchQuery,
    limit: 100,
  })

  const { stats } = useLeadStats()

  // Fetch student payment data when payment filter is active
  useEffect(() => {
    if (filters.paymentStatus === "all") {
      setStudentPaymentMap(new Map())
      return
    }

    const sfLeadIds = leads.filter(l => l.funding_type === "self_funded").map(l => l.id)
    if (sfLeadIds.length === 0) {
      setStudentPaymentMap(new Map())
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
  }, [filters.paymentStatus, leads])

  // Client-side filtering for advanced filters
  const filteredLeads = leads.filter((lead) => {
    // Exclude lost/withdraw leads from "all" view (they have their own sidebar tabs)
    if (stageFilter === "all" && (lead.pipeline_stage === "lost" || lead.pipeline_stage === "withdraw")) return false
    // Status filter
    if (filters.statuses.length > 0 && (!lead.status || !filters.statuses.includes(lead.status))) {
      return false
    }
    // Source filter
    if (filters.sources.length > 0 && !filters.sources.includes(lead.source)) {
      return false
    }
    // School filter
    if (filters.schools.length > 0 && lead.school && !filters.schools.includes(lead.school)) {
      return false
    }
    // Funding type filter
    if (filters.fundingType !== "all" && lead.funding_type !== filters.fundingType) {
      return false
    }
    // Date range filter
    if (filters.dateRange !== "all") {
      const leadDate = new Date(lead.created_at)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - leadDate.getTime()) / (1000 * 60 * 60 * 24))

      switch (filters.dateRange) {
        case "today":
          if (diffDays > 0) return false
          break
        case "week":
          if (diffDays > 7) return false
          break
        case "month":
          if (diffDays > 30) return false
          break
        case "quarter":
          if (diffDays > 90) return false
          break
      }
    }
    // GPA filter - use highest available GPA
    if (filters.gpaMin !== null || filters.gpaMax !== null) {
      const leadGpa = lead.gpa_grade_12_expected ?? lead.gpa_grade_11 ?? lead.gpa_grade_10
      if (leadGpa === undefined || leadGpa === null) return false
      if (filters.gpaMin !== null && leadGpa < filters.gpaMin) return false
      if (filters.gpaMax !== null && leadGpa > filters.gpaMax) return false
    }
    // Appointment type filter
    if (filters.appointmentTypes.length > 0) {
      const leadAppointments = lead.appointments || []
      const hasMatchingAppointment = leadAppointments.some(apt =>
        apt.appointment_type.some(type => filters.appointmentTypes.includes(type))
      )
      if (!hasMatchingAppointment) return false
    }
    // Ministry blocked filter
    if (filters.ministryBlocked === "blocked" && !lead.ministry_blocked) return false
    if (filters.ministryBlocked === "not_blocked" && lead.ministry_blocked) return false
    // Submission substage filter
    if (filters.submissionSubstages.length > 0) {
      if (!lead.submission_substage || !filters.submissionSubstages.includes(lead.submission_substage)) return false
    }
    // Submission status filter
    if (filters.submissionStatuses.length > 0) {
      if (!lead.submission_status || !filters.submissionStatuses.includes(lead.submission_status)) return false
    }
    // Lost at stage filter - filter lost leads by the stage they were in before being marked lost
    if (filters.lostAtStages.length > 0) {
      if (!lead.lost_at_stage || !filters.lostAtStages.includes(lead.lost_at_stage)) return false
    }
    // Kuwaiti filter
    if (filters.isKuwaiti !== null) {
      if (filters.isKuwaiti && !lead.is_kuwaiti) return false
      if (!filters.isKuwaiti && lead.is_kuwaiti) return false
    }
    // Has notes filter
    if (filters.hasNotes === "with_notes" && (!lead.notes || lead.notes.trim() === "")) return false
    if (filters.hasNotes === "without_notes" && lead.notes && lead.notes.trim() !== "") return false
    // Payment status filter (self-funded only)
    if (filters.paymentStatus !== "all") {
      if (lead.funding_type !== "self_funded") return false
      const status = studentPaymentMap.get(lead.id) ?? "pending"
      if (status !== filters.paymentStatus) return false
    }
    return true
  })

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

  const handlePUCImportSuccess = (count: number) => {
    setSuccessMessage(`${count} PUC student${count !== 1 ? "s" : ""} enrolled successfully`)
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

  // Get the selected lead objects for the MOE dialog
  const selectedLeadObjects = filteredLeads.filter((lead) =>
    selectedLeads.includes(lead.id)
  )

  return (
    <div className="flex-1 bg-[var(--bg-base)] flex flex-col min-h-0">
      <Header
        user={profile}
        title="Leads"
        action={{
          label: "Add Lead",
          onClick: () => setShowAddForm(true),
          icon: <Plus className="w-4 h-4" />
        }}
      />

      <div className="p-6 gap-6 page-enter flex flex-col flex-1 min-h-0 h-full">
        {/* Stats Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
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

          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              className="text-[var(--text-muted)]"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>

            {/* Import/Export */}
            <Button
              variant="ghost"
              size="icon"
              className="text-[var(--text-muted)]"
              onClick={() => setShowImportModal(true)}
              title="Import CSV"
            >
              <Upload className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-[var(--text-muted)]"
              onClick={() => setShowPUCImportModal(true)}
              title="Import PUC List"
            >
              <GraduationCap className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-[var(--text-muted)]"
              onClick={() => setShowMinistryImportModal(true)}
              title="Import Ministry GPA List"
            >
              <BookOpen className="w-4 h-4" />
            </Button>
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

        {/* Quick Filters */}
        <QuickFilters
          searchQuery={filters.searchQuery}
          onSearchChange={(query) => setFilters(prev => ({ ...prev, searchQuery: query }))}
          activeStage={stageFilter}
          onStageChange={setStageFilter}
          onOpenAdvanced={() => setShowFiltersPanel(true)}
          stats={stats.byStage}
          total={stats.total}
        />

        {/* Main Content */}
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
              router.push(`/leads/${lead.id}${stageFilter && stageFilter !== "all" ? `?stage=${stageFilter}` : ""}`)
            }}
            onEditLead={handleEditLead}
            currentStageFilter={stageFilter}
            fundingTypeFilter={filters.fundingType}
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
              onDelete={handleBulkDelete}
              onClear={() => setSelectedLeads([])}
              onMOEFetch={() => setShowMOEFetchModal(true)}
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

      {/* PUC Import Modal */}
      <PUCImportDialog
        isOpen={showPUCImportModal}
        onClose={() => setShowPUCImportModal(false)}
        onSuccess={handlePUCImportSuccess}
      />

      {/* Ministry GPA Import Modal */}
      <MinistryImportDialog
        isOpen={showMinistryImportModal}
        onClose={() => setShowMinistryImportModal(false)}
        onSuccess={handleMinistryImportSuccess}
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

    </div>
  )
}
