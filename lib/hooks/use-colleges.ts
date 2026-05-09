"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "./query-keys"

export interface CollegeRow {
  id: string
  name: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export function useColleges() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.colleges.all,
    queryFn: async () => {
      const res = await fetch("/api/settings/colleges")
      if (!res.ok) throw new Error("Failed to fetch colleges")
      return res.json() as Promise<CollegeRow[]>
    },
  })

  return {
    colleges: data || [],
    loading: isLoading,
    error: error?.message || null,
  }
}

export function useActiveColleges() {
  const { colleges, loading } = useColleges()
  return {
    colleges: colleges.filter((c) => c.is_active),
    loading,
  }
}

export function useCreateCollege() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { name: string }) => {
      const res = await fetch("/api/settings/colleges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create college")
      }
      return res.json() as Promise<CollegeRow>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.colleges.all })
    },
  })
}

export function useUpdateCollege() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      id: string
      name?: string
      is_active?: boolean
      sort_order?: number
    }) => {
      const res = await fetch("/api/settings/colleges", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update college")
      }
      return res.json() as Promise<CollegeRow>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.colleges.all })
    },
  })
}

export function useDeleteCollege() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/settings/colleges", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete college")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.colleges.all })
    },
  })
}
