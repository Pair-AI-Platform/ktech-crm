"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "./query-keys"
import {
  createSchool,
  getSchools,
  getSchoolStats,
  getSchool,
  updateSchool,
  deleteSchool,
  toggleSchoolActive,
} from "@/services/schoolsService"
import type {
  School,
  SchoolStats,
  CreateSchoolRequest,
  UpdateSchoolRequest,
  ToggleSchoolActiveRequest,
  SchoolsFilters,
} from "@/lib/schools/types"

// Export types for component use
export type { School, SchoolStats }

/**
 * Hook to fetch all schools with optional filters
 */
export function useSchools(filters?: SchoolsFilters) {
  const { data, isLoading, error } = useQuery({
    queryKey: filters 
      ? queryKeys.schools.list(filters)
      : queryKeys.schools.lists(),
    queryFn: async () => {
      return await getSchools(filters)
    },
  })

  return {
    schools: data?.data || [],
    pagination: data?.pagination || null,
    loading: isLoading,
    error: error?.message || null,
  }
}

/**
 * Hook to fetch school statistics
 */
export function useSchoolStats() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.schools.stats(),
    queryFn: async () => {
      return await getSchoolStats()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    stats: data?.stats || null,
    loading: isLoading,
    error: error?.message || null,
  }
}

/**
 * Hook to fetch a single school by ID
 */
export function useSchool(id: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.schools.detail(id),
    queryFn: async () => {
      return await getSchool(id)
    },
    enabled: !!id,
  })

  return {
    school: data?.school || null,
    loading: isLoading,
    error: error?.message || null,
  }
}

/**
 * Hook to create a new school
 */
export function useCreateSchool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: CreateSchoolRequest) => {
      const response = await createSchool(params)
      return response.school
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all })
    },
  })
}

/**
 * Hook to update a school
 */
export function useUpdateSchool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { id: string } & UpdateSchoolRequest) => {
      const { id, ...updateData } = params
      const response = await updateSchool(id, updateData)
      return response.school
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.detail(data.id) })
    },
  })
}

/**
 * Hook to delete a school
 */
export function useDeleteSchool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteSchool(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all })
    },
  })
}

/**
 * Hook to toggle a school's active status
 */
export function useToggleSchoolActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { id: string; active: boolean }) => {
      const { id, active } = params
      const response = await toggleSchoolActive(id, { active })
      return response.school
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.detail(data.id) })
    },
  })
}
