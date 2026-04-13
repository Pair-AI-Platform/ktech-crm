"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "./query-keys"
import type { PUCPeriod } from "@/types"

export function usePUCPeriods() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.pucPeriods.all,
    queryFn: async () => {
      const res = await fetch("/api/settings/puc-periods")
      if (!res.ok) throw new Error("Failed to fetch PUC periods")
      return res.json() as Promise<PUCPeriod[]>
    },
  })

  return {
    periods: data || [],
    loading: isLoading,
    error: error?.message || null,
  }
}

export function useActivePUCPeriod() {
  const { periods, loading } = usePUCPeriods()
  const active = periods.find((p) => p.status === "active") || null

  const today = new Date().toISOString().split("T")[0]
  const isFrozen = active ? active.end_date < today : false

  return {
    period: active,
    isFrozen,
    loading,
  }
}

export function useCreatePUCPeriod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { name: string; start_date: string; end_date: string; set_active?: boolean }) => {
      const res = await fetch("/api/settings/puc-periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create PUC period")
      }
      return res.json() as Promise<PUCPeriod>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pucPeriods.all })
    },
  })
}

export function useUpdatePUCPeriod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { id: string; name?: string; start_date?: string; end_date?: string; status?: "active" | "archived" }) => {
      const res = await fetch("/api/settings/puc-periods", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update PUC period")
      }
      return res.json() as Promise<PUCPeriod>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pucPeriods.all })
    },
  })
}

export function useDeletePUCPeriod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/settings/puc-periods", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete PUC period")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pucPeriods.all })
    },
  })
}
