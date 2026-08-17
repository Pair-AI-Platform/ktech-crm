"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "./query-keys"
import {
  createLeadSource,
  getLeadSources,
  updateLeadSource,
  deleteLeadSource,
  toggleLeadSourceActive,
} from "@/services/leadSourcesService"
import type {
  LeadSource,
  CreateLeadSourceRequest,
  UpdateLeadSourceRequest,
  LeadSourcesFilters,
} from "@/lib/lead-sources/types"

// Export the LeadSource type for use in components
export type { LeadSource }

/**
 * Hook to fetch all lead sources with optional filters
 */
export function useSources(filters?: LeadSourcesFilters) {
  const { data, isLoading, error } = useQuery({
    queryKey: filters 
      ? queryKeys.leadSources.list(filters)
      : queryKeys.leadSources.all,
    queryFn: async () => {
      return await getLeadSources(filters)
    },
  })

  return {
    sources: data?.data || [],
    countsByCategory: data?.countsByCategory,
    total: data?.total || 0,
    loading: isLoading,
    error: error?.message || null,
  }
}

/**
 * Hook to fetch only active lead sources
 */
export function useActiveSources() {
  const { sources, loading } = useSources({ active: true })
  return {
    sources,
    loading,
  }
}

/**
 * Hook to create a new lead source
 */
export function useCreateSource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: CreateLeadSourceRequest) => {
      const response = await createLeadSource(params)
      return response.source
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leadSources.all })
    },
  })
}

/**
 * Hook to update a lead source's label and category
 */
export function useUpdateSource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      id: string
      label: string
      category: string
    }) => {
      const { id, ...updateData } = params
      const response = await updateLeadSource(id, updateData as UpdateLeadSourceRequest)
      return response.source
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leadSources.all })
    },
  })
}

/**
 * Hook to toggle a lead source's active status
 */
export function useToggleSourceActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { id: string; active: boolean }) => {
      const { id, active } = params
      const response = await toggleLeadSourceActive(id, { active })
      return response.source
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leadSources.all })
    },
  })
}

/**
 * Hook to delete a lead source (soft delete)
 */
export function useDeleteSource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteLeadSource(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leadSources.all })
    },
  })
}
