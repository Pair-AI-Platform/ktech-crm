"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "./query-keys"
import {
  sendInvitation,
  acceptInvitation,
  getInvitationByToken,
} from "@/services/invitationsService"
import type {
  Invitation,
  CreateInvitationRequest,
  AcceptInvitationRequest,
} from "@/lib/invitations/types"

// Export types for component use
export type { Invitation }

/**
 * Hook to send team invitation
 */
export function useSendInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateInvitationRequest) => {
      const response = await sendInvitation(data)
      return response.invitation
    },
    onSuccess: () => {
      // Invalidate any invitation lists if they exist
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.all })
    },
  })
}

/**
 * Hook to accept invitation
 */
export function useAcceptInvitation() {
  return useMutation({
    mutationFn: async (data: AcceptInvitationRequest) => {
      return await acceptInvitation(data)
    },
  })
}

/**
 * Hook to fetch invitation details by token
 */
export function useInvitationByToken(token: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.invitations.detail(token),
    queryFn: async () => {
      return await getInvitationByToken(token)
    },
    enabled: !!token,
    retry: false,
  })

  return {
    invitation: data?.invitation || null,
    loading: isLoading,
    error: error?.message || null,
  }
}
