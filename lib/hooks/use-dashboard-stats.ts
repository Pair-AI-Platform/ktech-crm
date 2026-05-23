'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { isDemoMode, getDemoLeads } from '@/lib/demo-data'
import { useUser } from './use-user'
import { queryKeys } from './query-keys'

/**
 * Lightweight lead shape — only the columns the dashboard page actually reads.
 * Fetching these instead of full Lead objects avoids transferring dozens of
 * unused columns (GPA, school, notes, etc.) for every row.
 */
export interface DashboardLead {
  id: string
  first_name: string
  last_name: string
  first_name_ar?: string | null
  last_name_ar?: string | null
  phone: string
  pipeline_stage: string
  contact_status: string | null
  /** Alias for contact_status — kept for backward compat with page.tsx */
  status: string | null
  funding_type: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
  last_contacted_at: string | null
  callback_date: string | null
  date_of_birth: string | null
  priority: string | null
  source: string | null
}

const DASHBOARD_LEAD_COLUMNS =
  'id, first_name, last_name, first_name_ar, last_name_ar, phone, pipeline_stage, contact_status, funding_type, assigned_to, created_at, updated_at, last_contacted_at, callback_date, date_of_birth, priority, source'

/**
 * Single lightweight query that replaces the three useLeads(limit:200) calls
 * on the dashboard page.  Returns the full set but only the columns
 * the dashboard actually reads, plus pre-split arrays for SF / PUC leads.
 *
 * Now uses React Query for caching, deduplication, and retry.
 */
export function useDashboardStats() {
  const { profile, isAdmin } = useUser()

  const { data: allLeads = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.dashboardStats.all,
    queryFn: async (): Promise<DashboardLead[]> => {
      if (isDemoMode()) {
        const demoLeads = getDemoLeads()
        return demoLeads.map(l => ({
          id: l.id,
          first_name: l.first_name,
          last_name: l.last_name,
          phone: l.phone,
          pipeline_stage: l.pipeline_stage,
          contact_status: l.status ?? null,
          status: l.status ?? null,
          funding_type: l.funding_type ?? null,
          assigned_to: l.assigned_to ?? null,
          created_at: l.created_at,
          updated_at: l.updated_at,
          last_contacted_at: l.last_contacted_at ?? null,
          callback_date: l.callback_date ?? null,
          date_of_birth: l.date_of_birth ?? null,
          priority: null,
          source: l.source ?? null,
        }))
      }

      const supabase = createClient()

      // Fetch in batches to avoid timeout on large datasets
      const PAGE_SIZE = 1000
      let allData: DashboardLead[] = []
      let from = 0
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from('leads')
          .select(DASHBOARD_LEAD_COLUMNS)
          .order('created_at', { ascending: false })
          .range(from, from + PAGE_SIZE - 1)

        if (error) {
          console.error('[useDashboardStats] Supabase error:', error.message)
          break
        }

        const mapped = (data || []).map((l: any) => ({ ...l, status: l.contact_status })) as DashboardLead[]
        allData = allData.concat(mapped)

        if (!data || data.length < PAGE_SIZE) {
          hasMore = false
        } else {
          from += PAGE_SIZE
        }
      }

      return allData
    },
    staleTime: 60_000, // Cache for 1 minute
    gcTime: 5 * 60_000,
  })

  // ---------- Derived data (memoised) ----------

  const myLeads = useMemo(() => {
    if (!profile?.id) return allLeads
    if (isAdmin) return allLeads
    return allLeads.filter(l => l.assigned_to === profile.id)
  }, [allLeads, profile, isAdmin])

  const sfLeads = useMemo(() => {
    const base = allLeads.filter(l => l.funding_type === 'self_funded')
    if (isAdmin || !profile?.id) return base
    return base.filter(l => l.assigned_to === profile.id)
  }, [allLeads, profile, isAdmin])

  const pucLeads = useMemo(() => {
    const base = allLeads.filter(l => l.funding_type === 'puc')
    if (isAdmin || !profile?.id) return base
    return base.filter(l => l.assigned_to === profile.id)
  }, [allLeads, profile, isAdmin])

  const attentionPool = useMemo(() => {
    return isAdmin ? allLeads : myLeads
  }, [allLeads, myLeads, isAdmin])

  return {
    allLeads,
    myLeads,
    sfLeads,
    pucLeads,
    attentionPool,
    loading,
  }
}
