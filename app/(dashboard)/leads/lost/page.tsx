"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Header } from "@/components/layout/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Search,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Ban,
  Phone,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { PIPELINE_STAGES, type PipelineStage, type LostReasonCategory } from "@/types"
import { useLeads, useLostReasons } from "@/lib/hooks/use-leads"
import { useUser } from "@/lib/hooks/use-user"
import { cn, formatKuwaitPhone, getInitials } from "@/lib/utils"
import { exportLeadsToCSV, downloadCSV } from "@/lib/csv-utils"

const LOST_REASON_CATEGORIES: { value: LostReasonCategory; label: string }[] = [
  { value: "competitors", label: "Competitors" },
  { value: "military_security", label: "Military/Security" },
  { value: "academic", label: "Academic" },
  { value: "administrative", label: "Administrative" },
  { value: "financial", label: "Financial" },
  { value: "personal", label: "Personal" },
]

type SortField = "name" | "lost_at" | "reason" | "date"
type SortDirection = "asc" | "desc"

export default function LostLeadsPage() {
  const router = useRouter()
  const { profile } = useUser()
  const { reasons: lostReasons } = useLostReasons()

  const [searchQuery, setSearchQuery] = useState("")
  const [lostAtFilter, setLostAtFilter] = useState<PipelineStage | "all">("all")
  const [categoryFilter, setCategoryFilter] = useState<LostReasonCategory | "all">("all")
  const [reasonFilter, setReasonFilter] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const pageSize = 50

  const serverFilters = {
    lostAtFilter: lostAtFilter !== "all" ? lostAtFilter : undefined,
    lostReasonIds: reasonFilter.length > 0 ? reasonFilter : undefined,
    statuses: [],
    sources: [],
    schools: [],
    academicTrack: "all" as const,
    dateRange: "all" as const,
    dateFrom: "",
    dateTo: "",
    assignedTo: "",
    gpaMin: null,
    gpaMax: null,
    isKuwaiti: null,
    blockReasons: [],
    submissionSubstages: [],
    submissionStatuses: [],
    lostAtStages: [],
    hasNotes: "all" as const,
    withdrawalReasons: [],
    genders: [],
    governorates: [],
    ministryAssigned: "all" as const,
    docStatuses: [],
    placementLevels: [],
    campaignIds: [],
  }

  const { leads, loading, totalCount, totalPages, refetch } = useLeads({
    stage: "lost",
    searchQuery,
    page: currentPage,
    pageSize,
    filters: serverFilters,
  })

  // Compute lost-at stage counts
  const lostAtStats = useMemo(() => {
    return leads.reduce<Record<string, number>>((acc, lead) => {
      if (lead.lost_at_stage) {
        acc[lead.lost_at_stage] = (acc[lead.lost_at_stage] || 0) + 1
      }
      return acc
    }, {})
  }, [leads])

  // Filter by category (client-side since API doesn't support it)
  const filteredLeads = useMemo(() => {
    let result = leads
    if (categoryFilter !== "all") {
      const reasonIdsInCategory = lostReasons
        .filter(r => r.category === categoryFilter)
        .map(r => r.id)
      result = result.filter(l => l.lost_reason_id && reasonIdsInCategory.includes(l.lost_reason_id))
    }
    return result
  }, [leads, categoryFilter, lostReasons])

  // Sort
  const sortedLeads = useMemo(() => {
    const sorted = [...filteredLeads]
    sorted.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case "name":
          cmp = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
          break
        case "lost_at":
          cmp = (a.lost_at_stage || "").localeCompare(b.lost_at_stage || "")
          break
        case "reason":
          cmp = (a.lost_reason?.reason_en || "").localeCompare(b.lost_reason?.reason_en || "")
          break
        case "date":
          cmp = new Date(a.updated_at || 0).getTime() - new Date(b.updated_at || 0).getTime()
          break
      }
      return sortDirection === "asc" ? cmp : -cmp
    })
    return sorted
  }, [filteredLeads, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />
    return sortDirection === "asc"
      ? <ArrowUp className="w-3 h-3 ml-1 text-[var(--primary)]" />
      : <ArrowDown className="w-3 h-3 ml-1 text-[var(--primary)]" />
  }

  const handleExport = () => {
    const csvContent = exportLeadsToCSV(sortedLeads)
    downloadCSV(csvContent, `lost_leads_${new Date().toISOString().split("T")[0]}.csv`)
  }

  // Active pipeline stages (for lost-at filter pills)
  const lostAtStages = PIPELINE_STAGES.filter(
    s => !["lost", "withdraw", "puc_document_submission", "puc_application_submission"].includes(s.value)
  )

  return (
    <div className="flex-1 bg-[var(--bg-base)] flex flex-col min-h-0 min-w-0">
      <Header user={profile} title="Lost Leads" />

      <div className="px-3 py-4 sm:p-6 gap-4 sm:gap-6 page-enter flex flex-col flex-1 min-h-0 min-w-0 h-full">
        {/* Top Bar: Search + Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by name, phone, civil ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              className="text-[var(--text-muted)] w-8 h-8 sm:w-9 sm:h-9"
              aria-label="Refresh"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExport}
              className="text-[var(--text-muted)] w-8 h-8 sm:w-9 sm:h-9"
              disabled={sortedLeads.length === 0}
              aria-label="Export CSV"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Lost-At Stage Pills */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => { setLostAtFilter("all"); setCurrentPage(1) }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              lostAtFilter === "all"
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)]"
            )}
          >
            All ({totalCount})
          </button>
          {lostAtStages.map((stage) => {
            const count = lostAtStats[stage.value] || 0
            if (count === 0 && lostAtFilter !== stage.value) return null
            return (
              <button
                key={stage.value}
                onClick={() => { setLostAtFilter(stage.value); setCurrentPage(1) }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  lostAtFilter === stage.value
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)]"
                )}
              >
                {stage.label} ({count})
              </button>
            )
          })}
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] self-center mr-1">
            Reason:
          </span>
          <button
            onClick={() => { setCategoryFilter("all"); setCurrentPage(1) }}
            className={cn(
              "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all",
              categoryFilter === "all"
                ? "bg-[var(--primary-muted)] text-[var(--primary)] border border-[var(--primary)]/30"
                : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)]"
            )}
          >
            All
          </button>
          {LOST_REASON_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => { setCategoryFilter(cat.value); setCurrentPage(1) }}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all",
                categoryFilter === cat.value
                  ? "bg-[var(--primary-muted)] text-[var(--primary)] border border-[var(--primary)]/30"
                  : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)]"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col min-h-0 min-w-0"
        >
          <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="overflow-auto scrollbar-thin flex-1">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-[var(--bg-surface)] border-b border-[var(--border)]">
                  <tr>
                    <th className="px-3 py-2 text-left w-[220px] min-w-[180px]">
                      <button
                        onClick={() => handleSort("name")}
                        className="flex items-center text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                      >
                        Lead {getSortIcon("name")}
                      </button>
                    </th>
                    <th className="px-3 py-2 text-left w-[120px] min-w-[100px]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Phone
                      </span>
                    </th>
                    <th className="px-3 py-2 text-left w-[120px] min-w-[110px]">
                      <button
                        onClick={() => handleSort("lost_at")}
                        className="flex items-center text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                      >
                        Lost At {getSortIcon("lost_at")}
                      </button>
                    </th>
                    <th className="px-3 py-2 text-left w-[180px] min-w-[160px]">
                      <button
                        onClick={() => handleSort("reason")}
                        className="flex items-center text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                      >
                        Loss Reason {getSortIcon("reason")}
                      </button>
                    </th>
                    <th className="px-3 py-2 text-left w-[200px] min-w-[160px]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Notes
                      </span>
                    </th>
                    <th className="px-3 py-2 text-left w-[140px] min-w-[120px]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Agent
                      </span>
                    </th>
                    <th className="px-3 py-2 text-left w-[100px] min-w-[90px]">
                      <button
                        onClick={() => handleSort("date")}
                        className="flex items-center text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                      >
                        Date {getSortIcon("date")}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-16 text-center">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--text-muted)]" />
                        <span className="text-sm text-[var(--text-muted)]">Loading lost leads...</span>
                      </td>
                    </tr>
                  ) : sortedLeads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-16 text-center">
                        <Ban className="w-8 h-8 mx-auto mb-2 text-[var(--text-muted)] opacity-40" />
                        <p className="text-sm text-[var(--text-muted)]">No lost leads found</p>
                        {(searchQuery || lostAtFilter !== "all" || categoryFilter !== "all") && (
                          <p className="text-xs text-[var(--text-muted)] mt-1">Try adjusting your filters</p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    sortedLeads.map((lead) => {
                      const lostAtStage = lead.lost_at_stage
                        ? PIPELINE_STAGES.find(s => s.value === lead.lost_at_stage)
                        : null
                      const agentProfile = lead.assigned_agent

                      return (
                        <tr
                          key={lead.id}
                          onClick={() => router.push(`/leads/${lead.id}`)}
                          className="hover:bg-[var(--bg-elevated)] cursor-pointer transition-colors"
                        >
                          {/* Lead Name */}
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="w-7 h-7 shrink-0">
                                <AvatarImage src={undefined} />
                                <AvatarFallback className="text-[10px] bg-[var(--bg-sunken)] text-[var(--text-muted)]">
                                  {getInitials(`${lead.first_name_ar || ''} ${lead.last_name_ar || ''}`)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                  {lead.first_name_ar} {lead.last_name_ar}
                                </p>
                                {lead.civil_id && (
                                  <p className="text-[10px] text-[var(--text-muted)] truncate">{lead.civil_id}</p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Phone */}
                          <td className="px-3 py-3">
                            {lead.phone ? (
                              <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                                <Phone className="w-3 h-3 text-[var(--text-muted)]" />
                                {formatKuwaitPhone(lead.phone)}
                              </span>
                            ) : (
                              <span className="text-xs text-[var(--text-muted)]">&mdash;</span>
                            )}
                          </td>

                          {/* Lost At Stage */}
                          <td className="px-3 py-3">
                            {lostAtStage ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--bg-sunken)] text-[var(--text-secondary)] border border-[var(--border)]">
                                {lostAtStage.label}
                              </span>
                            ) : (
                              <span className="text-xs text-[var(--text-muted)]">&mdash;</span>
                            )}
                          </td>

                          {/* Loss Reason */}
                          <td className="px-3 py-3">
                            {lead.lost_reason?.reason_en ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-medium text-[var(--text-primary)] truncate max-w-[170px]" title={lead.lost_reason.reason_en}>
                                  {lead.lost_reason.reason_en}
                                </span>
                                {lead.lost_reason.category && (
                                  <span className="text-[10px] text-[var(--text-muted)] capitalize">
                                    {lead.lost_reason.category.replace("_", " ")}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-[var(--text-muted)] italic">No reason</span>
                            )}
                          </td>

                          {/* Notes */}
                          <td className="px-3 py-3">
                            {lead.lost_reason_notes ? (
                              <span className="text-xs text-[var(--text-secondary)] italic truncate max-w-[190px] block" title={lead.lost_reason_notes}>
                                {lead.lost_reason_notes}
                              </span>
                            ) : (
                              <span className="text-xs text-[var(--text-muted)]">&mdash;</span>
                            )}
                          </td>

                          {/* Agent */}
                          <td className="px-3 py-3">
                            {agentProfile ? (
                              <div className="flex items-center gap-1.5">
                                <Avatar className="w-5 h-5 shrink-0">
                                  <AvatarImage src={agentProfile.avatar_url || undefined} />
                                  <AvatarFallback className="text-[8px] bg-[var(--bg-sunken)] text-[var(--text-muted)]">
                                    {getInitials(agentProfile.full_name || "")}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-[var(--text-secondary)] truncate">
                                  {agentProfile.full_name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-[var(--text-muted)]">Unassigned</span>
                            )}
                          </td>

                          {/* Date */}
                          <td className="px-3 py-3">
                            <span className="text-xs text-[var(--text-muted)]">
                              {lead.updated_at
                                ? new Date(lead.updated_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                                : "\u2014"}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] bg-[var(--bg-surface)]">
                <p className="text-xs text-[var(--text-muted)]">
                  Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, totalCount || 0)} of {totalCount} lost leads
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="w-8 h-8"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-xs text-[var(--text-secondary)] px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="w-8 h-8"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
