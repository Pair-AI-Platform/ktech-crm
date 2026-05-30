"use client"

import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode } from "@/lib/demo-data"
import { queryKeys } from "./query-keys"
import type { AuditLog } from "@/types"

interface UseAuditLogsOptions {
  isAdmin: boolean
  userId?: string | null
  page: number
  pageSize: number
  search?: string
  filterTable?: string
  filterAction?: string
  dateFrom?: string
  dateTo?: string
}

interface AuditLogsResult {
  logs: AuditLog[]
  total: number
  loading: boolean
  refetch: () => void
}

type LeadIdRow = { id: string }

export function useAuditLogs(options: UseAuditLogsOptions): AuditLogsResult {
  const { isAdmin, userId, page, pageSize, search, filterTable, filterAction, dateFrom, dateTo } = options
  const queryClient = useQueryClient()

  const queryKey = [...queryKeys.activities.all, "audit-logs", { isAdmin, userId, page, pageSize, search, filterTable, filterAction, dateFrom, dateTo }] as const

  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      if (isDemoMode()) {
        return { logs: [] as AuditLog[], total: 0 }
      }

      const supabase = createClient()

      // For agents, first get their assigned lead IDs
      let assignedLeadIds: string[] | null = null
      if (!isAdmin && userId) {
        const { data: leads } = await supabase
          .from("leads")
          .select("id")
          .eq("assigned_to", userId)
        const rows = (leads ?? []) as LeadIdRow[]
        assignedLeadIds = rows.map((l) => l.id)
      }

      // Build count query
      let countQuery = supabase
        .from("audit_logs")
        .select("*", { count: "exact", head: true })

      // Build data query
      let dataQuery = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      // Agent filter: only see logs for their assigned leads or their own actions
      if (!isAdmin && userId && assignedLeadIds !== null) {
        if (assignedLeadIds.length > 0) {
          // Agent sees: their own actions OR actions on their assigned leads
          dataQuery = dataQuery.or(`user_id.eq.${userId},record_id.in.(${assignedLeadIds.join(",")})`)
          countQuery = countQuery.or(`user_id.eq.${userId},record_id.in.(${assignedLeadIds.join(",")})`)
        } else {
          // No assigned leads - only show their own actions
          dataQuery = dataQuery.eq("user_id", userId)
          countQuery = countQuery.eq("user_id", userId)
        }
      }

      // Apply filters
      if (filterTable && filterTable !== "all") {
        dataQuery = dataQuery.eq("table_name", filterTable)
        countQuery = countQuery.eq("table_name", filterTable)
      }
      if (filterAction && filterAction !== "all") {
        dataQuery = dataQuery.eq("action", filterAction)
        countQuery = countQuery.eq("action", filterAction)
      }
      if (dateFrom) {
        dataQuery = dataQuery.gte("created_at", dateFrom)
        countQuery = countQuery.gte("created_at", dateFrom)
      }
      if (dateTo) {
        dataQuery = dataQuery.lte("created_at", dateTo)
        countQuery = countQuery.lte("created_at", dateTo)
      }
      if (search) {
        const searchFilter = `user_email.ilike.%${search}%,record_id::text.ilike.%${search}%,table_name.ilike.%${search}%`
        dataQuery = dataQuery.or(searchFilter)
        countQuery = countQuery.or(searchFilter)
      }

      const [{ data: logs, error }, { count, error: countError }] = await Promise.all([
        dataQuery,
        countQuery,
      ])

      if (error) throw new Error(error.message)
      if (countError) throw new Error(countError.message)

      return {
        logs: (logs || []) as AuditLog[],
        total: count || 0,
      }
    },
    staleTime: 30_000,
  })

  // Real-time subscription for new audit logs
  useEffect(() => {
    if (isDemoMode()) return

    const supabase = createClient()
    const channel = supabase
      .channel("audit-logs-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_logs" },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.activities.all })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return {
    logs: data?.logs || [],
    total: data?.total || 0,
    loading: isLoading,
    refetch,
  }
}
