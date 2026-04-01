"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "./query-keys"

export interface ExhibitionRow {
  id: string
  name: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export function useExhibitions() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.exhibitions.all,
    queryFn: async () => {
      const res = await fetch("/api/settings/exhibitions")
      if (!res.ok) throw new Error("Failed to fetch exhibitions")
      return res.json() as Promise<ExhibitionRow[]>
    },
  })

  return {
    exhibitions: data || [],
    loading: isLoading,
    error: error?.message || null,
  }
}

export function useActiveExhibitions() {
  const { exhibitions, loading } = useExhibitions()
  return {
    exhibitions: exhibitions.filter((e) => e.is_active),
    loading,
  }
}

export function useCreateExhibition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { name: string }) => {
      const res = await fetch("/api/settings/exhibitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create exhibition")
      }
      return res.json() as Promise<ExhibitionRow>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exhibitions.all })
    },
  })
}

export function useUpdateExhibition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      id: string
      name?: string
      is_active?: boolean
      sort_order?: number
    }) => {
      const res = await fetch("/api/settings/exhibitions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update exhibition")
      }
      return res.json() as Promise<ExhibitionRow>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exhibitions.all })
    },
  })
}

export function useDeleteExhibition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/settings/exhibitions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete exhibition")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exhibitions.all })
    },
  })
}
