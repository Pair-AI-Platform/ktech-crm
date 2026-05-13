"use client"

import { useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { getDemoLeads, isDemoMode } from "@/lib/demo-data"
import { queryKeys } from "./query-keys"

// Types
export type CampaignType = 'whatsapp'
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

const DEMO_CAMPAIGNS_STORAGE_KEY = "ktech-demo-campaigns:v1"

const DEMO_AUDIENCE_COUNTS: AudienceFilter[] = [
  { id: "all_leads", label: "All Leads", count: 440 },
  { id: "new_leads", label: "New Leads", count: 118 },
  { id: "interested_leads", label: "Interested Leads", count: 164 },
  { id: "qualified_leads", label: "Qualified Leads", count: 96 },
  { id: "stale_leads", label: "Stale Leads", count: 72 },
  { id: "upcoming_appointments", label: "Upcoming Appointments", count: 39 },
  { id: "pending_payments", label: "Pending Payments", count: 28 },
]

const DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: "demo-campaign-puc-followup",
    name: "May PUC Applicant Follow-up",
    type: "whatsapp",
    status: "active",
    audience_source: "filter",
    audience_filter: "all_leads",
    message_content: "Hi {{first_name}}, your KTECH PUC application is moving forward. Please confirm your preferred appointment time so our admissions team can finalize the next step.",
    message_content_ar: null,
    subject: null,
    voice_workflow_id: null,
    schedule_type: "immediate",
    scheduled_for: null,
    started_at: "2026-05-12T08:30:00.000Z",
    paused_at: null,
    completed_at: null,
    total_contacts: 440,
    sent_count: 398,
    delivered_count: 372,
    failed_count: 8,
    read_count: 266,
    replied_count: 39,
    created_by: "demo-admin-id",
    created_at: "2026-05-12T08:15:00.000Z",
    updated_at: "2026-05-13T08:45:00.000Z",
  },
  {
    id: "demo-campaign-documents",
    name: "Missing Documents Reminder",
    type: "whatsapp",
    status: "active",
    audience_source: "filter",
    audience_filter: "qualified_leads",
    message_content: "Hi {{first_name}}, we are missing one or more documents from your admission file. Upload them today to keep your KTECH enrollment on track.",
    message_content_ar: null,
    subject: null,
    voice_workflow_id: null,
    schedule_type: "immediate",
    scheduled_for: null,
    started_at: "2026-05-11T10:00:00.000Z",
    paused_at: null,
    completed_at: null,
    total_contacts: 96,
    sent_count: 91,
    delivered_count: 87,
    failed_count: 4,
    read_count: 61,
    replied_count: 18,
    created_by: "demo-admin-id",
    created_at: "2026-05-11T09:45:00.000Z",
    updated_at: "2026-05-13T07:20:00.000Z",
  },
  {
    id: "demo-campaign-scholarship-deadline",
    name: "Scholarship Deadline Reminder",
    type: "whatsapp",
    status: "scheduled",
    audience_source: "filter",
    audience_filter: "interested_leads",
    message_content: "Hi {{first_name}}, scholarship applications close soon. Reply APPLY and an advisor will send you the checklist.",
    message_content_ar: null,
    subject: null,
    voice_workflow_id: null,
    schedule_type: "scheduled",
    scheduled_for: "2026-05-14T09:00:00.000Z",
    started_at: null,
    paused_at: null,
    completed_at: null,
    total_contacts: 164,
    sent_count: 0,
    delivered_count: 0,
    failed_count: 0,
    read_count: 0,
    replied_count: 0,
    created_by: "demo-admin-id",
    created_at: "2026-05-10T12:00:00.000Z",
    updated_at: "2026-05-10T12:00:00.000Z",
  },
  {
    id: "demo-campaign-open-day",
    name: "Open Day RSVP Confirmation",
    type: "whatsapp",
    status: "completed",
    audience_source: "upload",
    audience_filter: null,
    message_content: "Hi {{first_name}}, thank you for attending KTECH Open Day. Reply YES if you want an advisor to reserve your admission consultation.",
    message_content_ar: null,
    subject: null,
    voice_workflow_id: null,
    schedule_type: "immediate",
    scheduled_for: null,
    started_at: "2026-05-05T11:00:00.000Z",
    paused_at: null,
    completed_at: "2026-05-05T14:30:00.000Z",
    total_contacts: 132,
    sent_count: 132,
    delivered_count: 126,
    failed_count: 6,
    read_count: 103,
    replied_count: 31,
    created_by: "demo-admin-id",
    created_at: "2026-05-05T10:45:00.000Z",
    updated_at: "2026-05-05T14:30:00.000Z",
  },
  {
    id: "demo-campaign-reengagement",
    name: "Dormant Lead Re-engagement",
    type: "whatsapp",
    status: "paused",
    audience_source: "filter",
    audience_filter: "stale_leads",
    message_content: "Hi {{first_name}}, are you still considering studying with KTECH? Reply 1 for programs, 2 for fees, or 3 to speak to an advisor.",
    message_content_ar: null,
    subject: null,
    voice_workflow_id: null,
    schedule_type: "immediate",
    scheduled_for: null,
    started_at: "2026-05-02T13:00:00.000Z",
    paused_at: "2026-05-04T16:30:00.000Z",
    completed_at: null,
    total_contacts: 72,
    sent_count: 45,
    delivered_count: 41,
    failed_count: 3,
    read_count: 27,
    replied_count: 7,
    created_by: "demo-admin-id",
    created_at: "2026-05-02T12:40:00.000Z",
    updated_at: "2026-05-04T16:30:00.000Z",
  },
  {
    id: "demo-campaign-new-leads",
    name: "New Lead Welcome Sequence",
    type: "whatsapp",
    status: "draft",
    audience_source: "filter",
    audience_filter: "new_leads",
    message_content: "Welcome to KTECH {{first_name}}. We received your inquiry and an admissions advisor will contact you shortly.",
    message_content_ar: null,
    subject: null,
    voice_workflow_id: null,
    schedule_type: "immediate",
    scheduled_for: null,
    started_at: null,
    paused_at: null,
    completed_at: null,
    total_contacts: 118,
    sent_count: 0,
    delivered_count: 0,
    failed_count: 0,
    read_count: 0,
    replied_count: 0,
    created_by: "demo-admin-id",
    created_at: "2026-05-13T07:30:00.000Z",
    updated_at: "2026-05-13T07:30:00.000Z",
  },
]

function getDemoCampaignRows(): Campaign[] {
  if (typeof window === "undefined") return DEMO_CAMPAIGNS

  try {
    const stored = localStorage.getItem(DEMO_CAMPAIGNS_STORAGE_KEY)
    if (!stored) return DEMO_CAMPAIGNS

    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return DEMO_CAMPAIGNS
    return parsed as Campaign[]
  } catch {
    return DEMO_CAMPAIGNS
  }
}

function saveDemoCampaignRows(campaigns: Campaign[]) {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(DEMO_CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns))
  } catch {
    // Demo persistence is best-effort only.
  }
}

function getAudienceCount(filter?: string) {
  return DEMO_AUDIENCE_COUNTS.find(item => item.id === filter)?.count ?? 0
}

function withDemoContacts(campaign: Campaign): Campaign {
  const leads = getDemoLeads()
  const now = new Date("2026-05-13T09:00:00.000Z").getTime()
  const contacts = Array.from({ length: campaign.total_contacts }, (_, index): CampaignContact => {
    const lead = leads[index % Math.max(leads.length, 1)]
    const sent = index < campaign.sent_count
    const failed = sent && index >= Math.max(campaign.sent_count - campaign.failed_count, 0)
    const delivered = !failed && index < campaign.delivered_count

    return {
      id: `${campaign.id}-contact-${index + 1}`,
      lead_id: lead?.id ?? null,
      first_name: lead?.first_name ?? "Student",
      last_name: lead?.last_name ?? `${index + 1}`,
      phone: lead?.phone ?? null,
      email: lead?.email ?? null,
      status: failed ? "failed" : delivered ? "delivered" : sent ? "sent" : "pending",
      sent_at: sent ? new Date(now - index * 90_000).toISOString() : null,
      delivered_at: delivered ? new Date(now - index * 90_000 + 45_000).toISOString() : null,
      error_message: failed ? "WhatsApp delivery failed; invalid or unreachable number" : null,
    }
  })

  return { ...campaign, campaign_contacts: contacts }
}

function filterDemoCampaigns(filters: UseCampaignsFilters) {
  return getDemoCampaignRows()
    .filter(campaign => !filters.type || filters.type === "all" || campaign.type === filters.type)
    .filter(campaign => !filters.status || campaign.status === filters.status)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

// Fetch all campaigns
export function useCampaigns(filters: UseCampaignsFilters = {}) {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.campaigns.list(filters),
    queryFn: async () => {
      if (isDemoMode()) {
        return filterDemoCampaigns(filters)
      }

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
      if (isDemoMode()) {
        const campaign = getDemoCampaignRows().find(item => item.id === id)
        return campaign ? withDemoContacts(campaign) : null
      }

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
      if (isDemoMode()) {
        const now = new Date().toISOString()
        const uploadedContacts = Array.isArray(data.uploadedContacts)
          ? data.uploadedContacts as { firstName?: string; lastName?: string; phone?: string; email?: string }[]
          : []
        const audienceFilter = typeof data.audienceFilter === "string" ? data.audienceFilter : undefined
        const totalContacts = uploadedContacts.length > 0 ? uploadedContacts.length : getAudienceCount(audienceFilter)
        const scheduleType = typeof data.scheduleType === "string" ? data.scheduleType : "immediate"
        const scheduledDate = typeof data.scheduledDate === "string" ? data.scheduledDate : null
        const scheduledTime = typeof data.scheduledTime === "string" ? data.scheduledTime : "09:00"
        const scheduledFor = scheduleType === "scheduled" && scheduledDate
          ? `${scheduledDate}T${scheduledTime}:00.000Z`
          : null
        const status: CampaignStatus = scheduleType === "scheduled" ? "scheduled" : "active"
        const campaign: Campaign = {
          id: `demo-campaign-${Date.now()}`,
          name: typeof data.name === "string" ? data.name : "Untitled Campaign",
          type: "whatsapp",
          status,
          audience_source: data.audienceSource === "upload" ? "upload" : "filter",
          audience_filter: audienceFilter ?? null,
          message_content: typeof data.messageContent === "string" ? data.messageContent : null,
          message_content_ar: typeof data.messageContentAr === "string" ? data.messageContentAr : null,
          subject: typeof data.subject === "string" ? data.subject : null,
          voice_workflow_id: null,
          schedule_type: scheduleType,
          scheduled_for: scheduledFor,
          started_at: status === "active" ? now : null,
          paused_at: null,
          completed_at: null,
          total_contacts: totalContacts,
          sent_count: 0,
          delivered_count: 0,
          failed_count: 0,
          read_count: 0,
          replied_count: 0,
          created_by: "demo-admin-id",
          created_at: now,
          updated_at: now,
        }

        saveDemoCampaignRows([campaign, ...getDemoCampaignRows()])
        return { success: true, campaign }
      }

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
      if (isDemoMode()) {
        const now = new Date().toISOString()
        let updatedCampaign: Campaign | null = null
        const campaigns = getDemoCampaignRows().map(campaign => {
          if (campaign.id !== id) return campaign

          const status = typeof data.status === "string" ? data.status as CampaignStatus : campaign.status
          updatedCampaign = {
            ...campaign,
            ...data,
            status,
            paused_at: status === "paused" ? now : campaign.paused_at,
            started_at: status === "active" ? campaign.started_at ?? now : campaign.started_at,
            updated_at: now,
          } as Campaign
          return updatedCampaign
        })

        saveDemoCampaignRows(campaigns)
        return { success: true, campaign: updatedCampaign }
      }

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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detail(variables.id) })
    },
  })
}

// Delete campaign mutation
export function useDeleteCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (isDemoMode()) {
        saveDemoCampaignRows(getDemoCampaignRows().filter(campaign => campaign.id !== id))
        return { success: true }
      }

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
      if (isDemoMode()) {
        return DEMO_AUDIENCE_COUNTS
      }

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
    if (isDemoMode()) return

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
