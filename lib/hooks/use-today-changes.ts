"use client"

import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode } from "@/lib/demo-data"
import { queryKeys } from "./query-keys"

export function useTodayChanges() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: [...queryKeys.activities.all, "today-changes"],
    queryFn: async () => {
      if (isDemoMode()) return 20

      const supabase = createClient()
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

      const { count } = await supabase
        .from("activities")
        .select("id", { count: "exact", head: true })
        .in("activity_type", ["stage_change", "status_change"])
        .gte("created_at", `${todayStr}T00:00:00`)

      return count ?? 0
    },
    staleTime: 30_000,
  })

  useEffect(() => {
    if (isDemoMode()) return

    const supabase = createClient()
    const channel = supabase
      .channel("kpi-activity-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activities" },
        () => {
          queryClient.invalidateQueries({ queryKey: [...queryKeys.activities.all, "today-changes"] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return {
    totalChanges: query.data ?? 0,
    loading: query.isLoading,
  }
}
