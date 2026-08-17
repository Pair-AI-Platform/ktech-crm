"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "./query-keys"
import {
  createExhibition,
  getExhibitions,
  updateExhibition,
  deleteExhibition,
  toggleExhibitionActive,
} from "@/services/exhibitionsService"
import type {
  Exhibition,
  CreateExhibitionRequest,
  UpdateExhibitionRequest,
  ExhibitionsFilters,
} from "@/lib/exhibitions/types"

// Export the Exhibition type for use in components
export type { Exhibition }

/**
 * Hook to fetch all exhibitions with optional filters
 */
export function useExhibitions(filters?: ExhibitionsFilters) {
  const { data, isLoading, error } = useQuery({
    queryKey: filters 
      ? [...queryKeys.exhibitions.all, filters]
      : queryKeys.exhibitions.all,
    queryFn: async () => {
      return await getExhibitions(filters)
    },
  })

  return {
    exhibitions: data?.data || [],
    total: data?.total || 0,
    loading: isLoading,
    error: error?.message || null,
  }
}

/**
 * Hook to fetch only active exhibitions
 */
export function useActiveExhibitions() {
  const { exhibitions, loading } = useExhibitions({ active: true })
  return {
    exhibitions,
    loading,
  }
}

/**
 * Hook to create a new exhibition
 */
export function useCreateExhibition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: CreateExhibitionRequest) => {
      const response = await createExhibition(params)
      return response.exhibition
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exhibitions.all })
    },
  })
}

/**
 * Hook to update an exhibition's name
 */
export function useUpdateExhibition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      id: string
      name: string
    }) => {
      const { id, ...updateData } = params
      const response = await updateExhibition(id, updateData as UpdateExhibitionRequest)
      return response.exhibition
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exhibitions.all })
    },
  })
}

/**
 * Hook to toggle an exhibition's active status
 */
export function useToggleExhibitionActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { id: string; active: boolean }) => {
      const { id, active } = params
      const response = await toggleExhibitionActive(id, { active })
      return response.exhibition
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exhibitions.all })
    },
  })
}

/**
 * Hook to delete an exhibition (soft delete)
 */
export function useDeleteExhibition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteExhibition(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exhibitions.all })
    },
  })
}
