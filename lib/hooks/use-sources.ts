"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "./query-keys"

export interface LeadSourceRow {
  id: string
  value: string
  label: string
  category: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export function useSources() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.leadSources.all,
    queryFn: async () => {
      const res = await fetch("/api/settings/sources")
      if (!res.ok) throw new Error("Failed to fetch sources")
      return res.json() as Promise<LeadSourceRow[]>
    },
  })

  return {
    sources: data || [],
    loading: isLoading,
    error: error?.message || null,
  }
}

export function useActiveSources() {
  const { sources, loading } = useSources()
  return {
    sources: sources.filter((s) => s.is_active),
    loading,
  }
}

export function useCreateSource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { value: string; label: string; category: string }) => {
      const res = await fetch("/api/settings/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create source")
      }
      return res.json() as Promise<LeadSourceRow>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leadSources.all })
    },
  })
}

export function useUpdateSource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      id: string
      label?: string
      category?: string
      is_active?: boolean
      sort_order?: number
    }) => {
      const res = await fetch("/api/settings/sources", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update source")
      }
      return res.json() as Promise<LeadSourceRow>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leadSources.all })
    },
  })
}

export function useDeleteSource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/settings/sources", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete source")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leadSources.all })
    },
  })
}
