"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "./query-keys"
import {
  getUserAnalytics,
  getUsers,
  updateUserActive,
  updateUserManagement,
} from "@/services/usersService"
import type {
  User,
  UserAnalytics,
  UpdateUserManagementRequest,
  UsersFilters,
} from "@/lib/users/types"

// Export types for component use
export type { User, UserAnalytics }

/**
 * Hook to fetch user analytics
 */
export function useUserAnalytics() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.users.analytics(),
    queryFn: async () => {
      return await getUserAnalytics()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    analytics: data?.analytics || null,
    loading: isLoading,
    error: error?.message || null,
  }
}

/**
 * Hook to fetch all users with optional filters
 */
export function useUsers(filters?: UsersFilters) {
  const { data, isLoading, error } = useQuery({
    queryKey: filters 
      ? queryKeys.users.list(filters)
      : queryKeys.users.lists(),
    queryFn: async () => {
      return await getUsers(filters)
    },
  })

  return {
    users: data?.data || [],
    pagination: data?.pagination || null,
    loading: isLoading,
    error: error?.message || null,
  }
}

/**
 * Hook to update user active status
 */
export function useUpdateUserActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { id: string; active: boolean }) => {
      const response = await updateUserActive(params.id, params.active)
      return response.user
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}

/**
 * Hook to update user management details
 */
export function useUpdateUserManagement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { id: string; payload: UpdateUserManagementRequest }) => {
      const response = await updateUserManagement(params.id, params.payload)
      return response.user
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}
