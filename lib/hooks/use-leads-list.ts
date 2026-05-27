"use client"

import { useCallback, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { getDemoLeads, getDemoLeadStats, isDemoMode } from "@/lib/demo-data"
import { queryKeys } from "./query-keys"
import type { FundingType, Lead, LeadStatus, LostReason, PipelineStage } from "@/types"

interface UseLeadsFilters {
  statuses?: string[]
  sources?: string[]
  schools?: string[]
  academicTrack?: string
  dateRange?: string
  dateFrom?: string
  dateTo?: string
  assignedTo?: string
  gpaMin?: number | null
  gpaMax?: number | null
  isKuwaiti?: boolean | null
  blockReasons?: string[]
  submissionSubstages?: string[]
  submissionStatuses?: string[]
  lostAtStages?: string[]
  lostAtFilter?: string
  hasNotes?: string
  lostReasonIds?: string[]
  withdrawalReasons?: string[]
  genders?: string[]
  governorates?: string[]
  ministryAssigned?: string
  pucImportFlagged?: string
  docStatuses?: string[]
  placementLevels?: string[]
  campaignIds?: string[]
  semesterIds?: string[]
}

interface UseLeadsOptions {
  stage?: PipelineStage | "all"
  fundingType?: FundingType | "all"
  searchQuery?: string
  limit?: number
  page?: number
  pageSize?: number
  filters?: UseLeadsFilters
  enabled?: boolean
  includeCount?: boolean
  realtime?: boolean
  view?: "compact" | "full"
}

type LeadStats = {
  total: number
  byStage: Record<PipelineStage, number>
  thisMonth: number
  conversionRate: number
}

type StageCountRow = {
  stage?: PipelineStage | null
  pipeline_stage?: PipelineStage | null
  lead_count?: number | string | null
  count?: number | string | null
}

const EMPTY_STATS: LeadStats = {
  total: 0,
  byStage: {} as Record<PipelineStage, number>,
  thisMonth: 0,
  conversionRate: 0,
}

export function useLeads(options: UseLeadsOptions = {}) {
  const {
    stage = "all",
    fundingType = "all",
    searchQuery = "",
    limit = 50,
    page,
    pageSize = 25,
    filters: advancedFilters,
    enabled = true,
    includeCount = true,
    realtime = true,
    view = "full",
  } = options
  const usePagination = page !== undefined
  const queryClient = useQueryClient()

  const filters = { stage, fundingType, searchQuery, limit, page, pageSize, includeCount, view, ...advancedFilters }

  const { data, isLoading, isFetching, isPlaceholderData, error } = useQuery({
    queryKey: queryKeys.leads.list(filters),
    queryFn: async () => {
      if (isDemoMode()) {
        let demoLeads = getDemoLeads()

        if (stage !== "all") {
          demoLeads = demoLeads.filter(l => l.pipeline_stage === stage)
        } else {
          demoLeads = demoLeads.filter(l => l.pipeline_stage !== "lost")
        }

        if (fundingType !== "all") {
          demoLeads = demoLeads.filter(l => l.funding_type === fundingType)
        }

        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          demoLeads = demoLeads.filter(l =>
            l.first_name.toLowerCase().includes(query) ||
            l.last_name.toLowerCase().includes(query) ||
            l.phone?.includes(query) ||
            l.civil_id?.includes(query)
          )
        }

        const totalCount = demoLeads.length
        if (usePagination) {
          const start = (page! - 1) * pageSize
          return { leads: demoLeads.slice(start, start + pageSize), totalCount }
        }
        return { leads: demoLeads.slice(0, limit), totalCount }
      }

      const params = new URLSearchParams()
      if (stage !== "all") params.set("stage", stage)
      if (fundingType !== "all") params.set("fundingType", fundingType)
      if (searchQuery) params.set("search", searchQuery)
      params.set("limit", String(limit))
      params.set("includeCount", includeCount ? "true" : "false")
      params.set("view", view)
      if (usePagination) {
        params.set("page", String(page))
        params.set("pageSize", String(pageSize))
      }
      if (advancedFilters) {
        params.set("filters", JSON.stringify(advancedFilters))
      }

      const res = await fetch(`/api/leads?${params.toString()}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(body.error || `Failed to fetch leads (${res.status})`)
      }

      const result = await res.json()
      const leads = (result.leads || []).map((l: Record<string, unknown>) => ({
        ...l,
        status: l.contact_status ?? l.status,
      }))

      return {
        leads: leads as Lead[],
        totalCount: result.totalCount ?? leads.length,
      }
    },
    staleTime: 30_000,
    enabled,
    placeholderData: (prev) => prev,
  })

  useEffect(() => {
    if (isDemoMode() || !enabled || !realtime) return

    const supabase = createClient()
    const filter = stage !== "all" ? `pipeline_stage=eq.${stage}` : undefined
    const channel = supabase
      .channel(`leads-changes-${stage}-${fundingType}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "leads",
          ...(filter ? { filter } : {}),
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.leads.lists() })
          queryClient.invalidateQueries({ queryKey: queryKeys.leads.stats() })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, stage, fundingType, enabled, realtime])

  const leads = data?.leads ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = usePagination ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.leads.list(filters) })
  }, [queryClient, filters])

  return {
    leads,
    loading: isLoading,
    fetching: isFetching,
    isPlaceholderData,
    error: error ? (error instanceof Error ? error.message : "Failed to fetch leads") : null,
    totalCount,
    totalPages,
    refetch,
  }
}

export function useLeadStats(options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true
  const { data: stats, isLoading } = useQuery<LeadStats>({
    queryKey: queryKeys.leads.stats(),
    enabled,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      if (isDemoMode()) return getDemoLeadStats()

      const supabase = createClient()
      const { data: rpcRows, error: rpcError } = await supabase.rpc("get_lead_stage_counts")
      if (!rpcError && Array.isArray(rpcRows)) {
        const byStage = {} as Record<PipelineStage, number>
        let total = 0
        let enrolled = 0

        for (const row of rpcRows as StageCountRow[]) {
          const stage = row.stage ?? row.pipeline_stage
          if (!stage) continue
          const count = Number(row.lead_count ?? row.count ?? 0) || 0
          byStage[stage] = count
          total += count
          if (stage === "enrolled") enrolled = count
        }

        return {
          total,
          byStage,
          thisMonth: 0,
          conversionRate: total > 0 ? Math.round((enrolled / total) * 100) : 0,
        }
      }

      const stages: PipelineStage[] = [
        "new", "contacted", "visit", "test", "application", "applicant", "enrolled", "lost"
      ]
      const stageResults = await Promise.all(
        stages.map(stage =>
          supabase
            .from("leads")
            .select("id", { count: "exact", head: true })
            .eq("pipeline_stage", stage)
        )
      )

      const byStage = {} as Record<PipelineStage, number>
      stages.forEach((pipelineStage, i) => {
        byStage[pipelineStage] = stageResults[i].count ?? 0
      })

      const total = Object.values(byStage).reduce((sum, count) => sum + count, 0)
      const enrolled = byStage.enrolled ?? 0
      return {
        total,
        byStage,
        thisMonth: 0,
        conversionRate: total > 0 ? Math.round((enrolled / total) * 100) : 0,
      }
    },
  })

  return { stats: stats ?? EMPTY_STATS, loading: !enabled || isLoading }
}

export function useLostReasons(options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true
  const { data: reasons = [], isLoading } = useQuery<LostReason[]>({
    queryKey: queryKeys.leads.lostReasons(),
    enabled,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (isDemoMode()) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from("lost_reasons")
        .select("*")
        .eq("is_active", true)
        .order("category")

      if (error) throw new Error(error.message)
      return data || []
    },
  })

  return { reasons, loading: !enabled || isLoading }
}
