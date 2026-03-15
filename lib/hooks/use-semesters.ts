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

export function useActiveSemesters() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.semesters.active(),
    queryFn: async () => {
      const res = await fetch("/api/settings/semesters")
      if (!res.ok) throw new Error("Failed to fetch semesters")
      const semesters = (await res.json()) as Semester[]
      // Return open terms from the active cycle
      return semesters.filter((s) => s.is_active && s.is_open)
    },
    staleTime: 5 * 60 * 1000, // 5 min
  })

  return {
    activeSemesters: data ?? [],
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
    mutationFn: async ({ leadIds, targetSemesterId, assignedTo }: { leadIds: string[]; targetSemesterId?: string; assignedTo?: string }) => {
      const res = await fetch("/api/leads/re-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_ids: leadIds, target_semester_id: targetSemesterId, assigned_to: assignedTo }),
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
