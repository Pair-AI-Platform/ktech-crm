"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "./query-keys"
import {
  createEducationCycle,
  getEducationCycles,
  getActiveEducationCycle,
  getEducationCycle,
  updateEducationCycle,
  updateTermDates,
  activateEducationCycle,
  deactivateEducationCycle,
  toggleTermActive,
} from "@/services/educationCyclesService"
import type {
  EducationCycle,
  Term,
  CreateEducationCycleRequest,
  UpdateEducationCycleRequest,
  UpdateTermDatesRequest,
  EducationCyclesFilters,
} from "@/lib/education-cycles/types"

// Export types for component use
export type { EducationCycle, Term }

/**
 * Hook to fetch all education cycles with optional filters
 */
export function useEducationCycles(filters?: EducationCyclesFilters) {
  const { data, isLoading, error } = useQuery({
    queryKey: filters 
      ? [...queryKeys.cycles.all, filters]
      : queryKeys.cycles.all,
    queryFn: async () => {
      return await getEducationCycles(filters)
    },
  })

  return {
    cycles: data?.data || [],
    total: data?.total || 0,
    loading: isLoading,
    error: error?.message || null,
  }
}

/**
 * Hook to fetch the active education cycle
 */
export function useActiveEducationCycle() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.cycles.active(),
    queryFn: async () => {
      return await getActiveEducationCycle()
    },
    staleTime: 5 * 60 * 1000,
  })

  return {
    activeCycle: data?.cycle || null,
    loading: isLoading,
    error: error?.message || null,
  }
}

/**
 * Hook to create a new education cycle
 */
export function useCreateEducationCycle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: CreateEducationCycleRequest) => {
      const response = await createEducationCycle(params)
      return response.cycle
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.all })
    },
  })
}

/**
 * Hook to update an education cycle's name and term labels
 */
export function useUpdateEducationCycle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      id: string
      name?: string
      fallLabel?: string
      springLabel?: string
    }) => {
      const { id, ...updateData } = params
      const response = await updateEducationCycle(id, updateData as UpdateEducationCycleRequest)
      return response.cycle
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.all })
    },
  })
}

/**
 * Hook to update term dates
 */
export function useUpdateTermDates() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      cycleId: string
      semester: "fall" | "spring"
      startDate: string
      endDate: string
    }) => {
      const { cycleId, semester, startDate, endDate } = params
      const response = await updateTermDates(cycleId, semester, { startDate, endDate })
      return response.cycle
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.all })
    },
  })
}

/**
 * Hook to activate an education cycle (exclusive)
 */
export function useActivateEducationCycle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await activateEducationCycle(id)
      return response.cycle
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.all })
    },
  })
}

/**
 * Hook to deactivate an education cycle
 */
export function useDeactivateEducationCycle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await deactivateEducationCycle(id)
      return response.cycle
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.all })
    },
  })
}

/**
 * Hook to toggle a term's active status
 */
export function useToggleTermActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      cycleId: string
      semester: "fall" | "spring"
      active: boolean
    }) => {
      const { cycleId, semester, active } = params
      const response = await toggleTermActive(cycleId, semester, { active })
      return response.cycle
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.all })
    },
  })
}

// Backward compatibility exports
export const useCycles = useEducationCycles
export const useActiveCycle = useActiveEducationCycle
