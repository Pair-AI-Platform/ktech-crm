"use client"

import { useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { queryKeys } from "./query-keys"

// Types
export type CampaignType = 'whatsapp' | 'sms'
export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed'

export interface Campaign {
  id: string
  name: string
  type: CampaignType
  status: CampaignStatus
  audience_source: string | null
  audience_filter: string | null
  message_content: string | null
  message_content_ar: string | null
  subject: string | null
  voice_workflow_id: string | null
  schedule_type: string | null
  scheduled_for: string | null
  started_at: string | null
  paused_at: string | null
  completed_at: string | null
  total_contacts: number
  sent_count: number
  delivered_count: number
  failed_count: number
  read_count: number
  replied_count: number
  created_by: string | null
  created_at: string
  updated_at: string
  campaign_contacts?: CampaignContact[] | { count: number }[]
}

export interface CampaignContact {
  id: string
  lead_id: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  email: string | null
  status: string
  sent_at: string | null
  delivered_at: string | null
  error_message: string | null
}

export interface AudienceFilter {
  id: string
  label: string
  count: number
}

interface UseCampaignsFilters extends Record<string, unknown> {
  type?: string
  status?: string
}

// Fetch all campaigns
export function useCampaigns(filters: UseCampaignsFilters = {}) {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.campaigns.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.type && filters.type !== 'all') params.set('type', filters.type)
      if (filters.status) params.set('status', filters.status)

      const res = await fetch(`/api/campaigns?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch campaigns')
      const json = await res.json()
      return json.campaigns as Campaign[]
    },
  })

  return {
    campaigns: data || [],
    isLoading,
    error,
    invalidate: () => queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all }),
  }
}

// Fetch single campaign with contacts
export function useCampaign(id: string | null) {
  return useQuery({
    queryKey: queryKeys.campaigns.detail(id || ''),
    queryFn: async () => {
      if (!id) return null
      const res = await fetch(`/api/campaigns/${id}`)
      if (!res.ok) throw new Error('Failed to fetch campaign')
      const json = await res.json()
      return json.campaign as Campaign
    },
    enabled: !!id,
  })
}

// Create campaign mutation
export function useCreateCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed to create campaign')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all })
    },
  })
}

// Update campaign mutation
export function useUpdateCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed to update campaign')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all })
    },
  })
}

// Delete campaign mutation
export function useDeleteCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed to delete campaign')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all })
    },
  })
}

// Fetch audience filter counts
export function useAudienceCounts() {
  return useQuery({
    queryKey: queryKeys.campaigns.audienceCounts(),
    queryFn: async () => {
      const res = await fetch('/api/campaigns/audience-counts')
      if (!res.ok) throw new Error('Failed to fetch audience counts')
      const json = await res.json()
      return json.filters as AudienceFilter[]
    },
  })
}

// Realtime subscription for a campaign
export function useCampaignRealtime(id: string | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!id) return

    const supabase = createClient()
    const channel = supabase
      .channel(`campaign-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaigns',
          filter: `id=eq.${id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detail(id) })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, queryClient])
}
