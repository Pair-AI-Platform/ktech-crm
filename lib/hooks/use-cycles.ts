"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "./query-keys"
import type { EducationCycle } from "@/types"

export function useCycles() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.cycles.all,
    queryFn: async () => {
      const res = await fetch("/api/settings/cycles")
      if (!res.ok) throw new Error("Failed to fetch cycles")
      return res.json() as Promise<EducationCycle[]>
    },
  })

  return {
    cycles: data || [],
    loading: isLoading,
    error: error?.message || null,
  }
}

export function useActiveCycle() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.cycles.active(),
    queryFn: async () => {
      const res = await fetch("/api/settings/cycles")
      if (!res.ok) throw new Error("Failed to fetch cycles")
      const cycles = (await res.json()) as EducationCycle[]
      return cycles.find((c) => c.is_active) || null
    },
    staleTime: 5 * 60 * 1000,
  })

  return {
    activeCycle: data ?? null,
    loading: isLoading,
  }
}

export function useCreateCycle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      start_year: number
      end_year: number
      fall_start_date?: string
      fall_end_date?: string
      spring_start_date?: string
      spring_end_date?: string
    }) => {
      const res = await fetch("/api/settings/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create cycle")
      }
      return res.json() as Promise<EducationCycle>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.semesters.all })
    },
  })
}

export function useUpdateCycle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; is_active?: boolean; name?: string }) => {
      const res = await fetch("/api/settings/cycles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update cycle")
      }
      return res.json() as Promise<EducationCycle>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.semesters.all })
    },
  })
}

export function useUpdateTerm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; start_date?: string; end_date?: string }) => {
      const res = await fetch("/api/settings/semesters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update term")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.semesters.all })
    },
  })
}

export function useToggleTermOpen() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, is_open }: { id: string; is_open: boolean }) => {
      const res = await fetch("/api/settings/semesters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_open }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to toggle term")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.semesters.all })
    },
  })
}
