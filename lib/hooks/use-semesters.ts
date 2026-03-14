"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "./query-keys"
import type { Semester } from "@/types"

export function useSemesters() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.semesters.all,
    queryFn: async () => {
      const res = await fetch("/api/settings/semesters")
      if (!res.ok) throw new Error("Failed to fetch semesters")
      return res.json() as Promise<Semester[]>
    },
  })

  return {
    semesters: data || [],
    loading: isLoading,
    error: error?.message || null,
  }
}

export function useActiveSemester() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.semesters.active(),
    queryFn: async () => {
      const res = await fetch("/api/settings/semesters")
      if (!res.ok) throw new Error("Failed to fetch semesters")
      const semesters = (await res.json()) as Semester[]
      return semesters.find((s) => s.is_active) || null
    },
    staleTime: 5 * 60 * 1000, // 5 min
  })

  return {
    activeSemester: data ?? null,
    loading: isLoading,
  }
}

export function useCreateSemester() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (semester: Partial<Semester>) => {
      const res = await fetch("/api/settings/semesters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(semester),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create semester")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.semesters.all })
    },
  })
}

export function useUpdateSemester() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Semester> }) => {
      const res = await fetch("/api/settings/semesters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update semester")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.semesters.all })
    },
  })
}

export function useReRegisterLeads() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (leadIds: string[]) => {
      const res = await fetch("/api/leads/re-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_ids: leadIds }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to re-register leads")
      }
      return res.json() as Promise<{ count: number }>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.semesters.all })
    },
  })
}
