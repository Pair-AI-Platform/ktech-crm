"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { isArabicText } from "@/lib/string-utils"
import { queryKeys } from "./query-keys"
import type { LeadSource, LeadSourceCategory, PipelineStage, ContactStatus } from "@/types"

export interface MarketingLead {
  id: string
  first_name: string
  last_name: string
  first_name_ar?: string | null
  last_name_ar?: string | null
  phone: string
  pipeline_stage: PipelineStage
  contact_status: ContactStatus
  assigned_to: string | null
  created_at: string
  source: LeadSource
  assigned_agent: { full_name: string } | null
}

interface CreateMarketingLeadData {
  first_name: string
  last_name: string
  phone: string
  school?: string
  source: LeadSource
  source_category: LeadSourceCategory
  source_detail?: string
  notes?: string
  semester_id: string
  created_by: string
}

type MarketingLeadRow = Omit<MarketingLead, "assigned_agent"> & {
  assigned_agent: { full_name: string } | { full_name: string }[] | null
}

export function useMarketingLeads() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const leadsQuery = useQuery<MarketingLead[]>({
    queryKey: queryKeys.marketingLeads.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, first_name, last_name, first_name_ar, last_name_ar, phone, pipeline_stage, contact_status, assigned_to, created_at, source, assigned_agent:profiles!leads_assigned_to_fkey(full_name)")
        .order("created_at", { ascending: false })

      if (error) throw new Error(error.message)
      // Supabase returns the join as array; normalize to single object or null
      const rows = (data ?? []) as MarketingLeadRow[]
      return rows.map((row): MarketingLead => ({
        id: row.id,
        first_name: row.first_name,
        last_name: row.last_name,
        phone: row.phone,
        pipeline_stage: row.pipeline_stage,
        contact_status: row.contact_status,
        assigned_to: row.assigned_to,
        created_at: row.created_at,
        source: row.source,
        assigned_agent: Array.isArray(row.assigned_agent) && row.assigned_agent.length > 0
          ? (row.assigned_agent[0] as { full_name: string })
          : !Array.isArray(row.assigned_agent) ? (row.assigned_agent as { full_name: string } | null) : null,
      }))
    },
  })

  const createLead = useMutation({
    mutationFn: async (data: CreateMarketingLeadData) => {
      if (!isArabicText(data.first_name)) {
        throw new Error('First name must be in Arabic')
      }
      if (!isArabicText(data.last_name)) {
        throw new Error('Last name must be in Arabic')
      }

      const { error } = await supabase
        .from("leads")
        .insert({
          ...data,
          pipeline_stage: "new",
          contact_status: "uncontacted",
          nationality: "kuwaiti",
          is_kuwaiti: true,
          is_transfer_student: false,
          is_special_needs: false,
          is_diplomatic: false,
          is_athlete: false,
          is_married: false,
          is_employee: false,
          funding_type: "puc",
          has_weyay_account: false,
          has_bank_account: false,
        })

      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.marketingLeads.all })
    },
  })

  return {
    leads: leadsQuery.data ?? [],
    isLoading: leadsQuery.isLoading,
    error: leadsQuery.error,
    createLead,
  }
}

export function useActiveSemester() {
  const supabase = createClient()

  return useQuery({
    queryKey: queryKeys.semesters.active(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("semesters")
        .select("id, name")
        .eq("is_active", true)
        .single()

      if (error) throw new Error(error.message)
      return data as { id: string; name: string }
    },
  })
}
