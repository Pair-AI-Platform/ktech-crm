"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode, getDemoCriticalStats } from "@/lib/demo-data"
import { measureClientAsync } from "@/lib/performance"
import { toDateString } from "@/lib/utils"

interface DashboardCriticalStatsOptions {
  enabled?: boolean
  isAdmin: boolean
  profileId?: string | null
}

export interface DashboardCriticalStats {
  activeLeads: number
  totalFiles: number
  pucFiles: number
  sfFiles: number
  todayAppointments: number
  todayCallbacks: number
}

const EMPTY_STATS: DashboardCriticalStats = {
  activeLeads: 0,
  totalFiles: 0,
  pucFiles: 0,
  sfFiles: 0,
  todayAppointments: 0,
  todayCallbacks: 0,
}

type DashboardCriticalStatsRpcRow = {
  active_leads?: number | string | null
  total_files?: number | string | null
  puc_files?: number | string | null
  sf_files?: number | string | null
  today_appointments?: number | string | null
  today_callbacks?: number | string | null
}

function countOrZero(count: number | null | undefined) {
  return count ?? 0
}

function numberOrZero(value: number | string | null | undefined) {
  return Number(value ?? 0) || 0
}

export function useDashboardCriticalStats({
  enabled = true,
  isAdmin,
  profileId,
}: DashboardCriticalStatsOptions) {
  const query = useQuery({
    queryKey: ["dashboard-critical-stats", isAdmin ? "admin" : profileId ?? "agent"],
    enabled: enabled && (isAdmin || !!profileId),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    queryFn: async (): Promise<DashboardCriticalStats> => {
      if (isDemoMode()) return getDemoCriticalStats({ isAdmin, profileId })

      const supabase = createClient()
      const today = toDateString(new Date())

      const { data: rpcRows, error: rpcError } = await measureClientAsync(
        "supabase.rpc.get_dashboard_critical_stats",
        async () => await supabase.rpc("get_dashboard_critical_stats", {
          p_today: today,
        }),
        { slowMs: 700, data: { surface: "dashboard-fast-stats", role: isAdmin ? "admin" : "agent" } }
      )

      if (!rpcError && Array.isArray(rpcRows) && rpcRows.length > 0) {
        const row = rpcRows[0] as DashboardCriticalStatsRpcRow
        return {
          activeLeads: numberOrZero(row.active_leads),
          totalFiles: numberOrZero(row.total_files),
          pucFiles: numberOrZero(row.puc_files),
          sfFiles: numberOrZero(row.sf_files),
          todayAppointments: numberOrZero(row.today_appointments),
          todayCallbacks: numberOrZero(row.today_callbacks),
        }
      }

      const leadBase = () => {
        let query = supabase.from("leads").select("id", { count: "exact", head: true })
        query = query.eq("actual_lead", true)
        if (!isAdmin && profileId) query = query.eq("assigned_to", profileId)
        return query
      }

      const appointmentsBase = () => {
        let query = supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("scheduled_date", today)
          .not("status", "eq", "cancelled")
        if (!isAdmin && profileId) query = query.eq("assigned_agent", profileId)
        return query
      }

      const [
        activeLeads,
        totalFiles,
        pucFiles,
        sfFiles,
        todayAppointments,
        todayCallbacks,
      ] = await Promise.all([
        leadBase(),
        leadBase().eq("pipeline_stage", "application"),
        leadBase().eq("pipeline_stage", "application").eq("funding_type", "puc"),
        leadBase().eq("pipeline_stage", "application").eq("funding_type", "self_funded"),
        appointmentsBase(),
        leadBase().eq("contact_status", "callback").eq("callback_date", today),
      ])

      const errors = [
        activeLeads.error,
        totalFiles.error,
        pucFiles.error,
        sfFiles.error,
        todayAppointments.error,
        todayCallbacks.error,
      ].filter(Boolean)

      if (errors.length > 0) {
        throw new Error(errors[0]!.message)
      }

      return {
        activeLeads: countOrZero(activeLeads.count),
        totalFiles: countOrZero(totalFiles.count),
        pucFiles: countOrZero(pucFiles.count),
        sfFiles: countOrZero(sfFiles.count),
        todayAppointments: countOrZero(todayAppointments.count),
        todayCallbacks: countOrZero(todayCallbacks.count),
      }
    },
  })

  return {
    stats: query.data ?? EMPTY_STATS,
    loading: !enabled || query.isLoading,
  }
}
