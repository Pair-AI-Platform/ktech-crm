'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isDemoMode, getDemoLeads } from '@/lib/demo-data'
import { useUser } from './use-user'

/**
 * Lightweight lead shape — only the columns the dashboard page actually reads.
 * Fetching these instead of full Lead objects avoids transferring dozens of
 * unused columns (GPA, school, notes, etc.) for every row.
 */
export interface DashboardLead {
  id: string
  first_name: string
  last_name: string
  phone: string
  pipeline_stage: string
  status: string | null
  funding_type: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
  last_contacted_at: string | null
  callback_date: string | null
  date_of_birth: string | null
}

const DASHBOARD_LEAD_COLUMNS =
  'id, first_name, last_name, phone, pipeline_stage, status, funding_type, assigned_to, created_at, updated_at, last_contacted_at, callback_date, date_of_birth'

/**
 * Single lightweight query that replaces the three useLeads(limit:200) calls
 * on the dashboard page.  Returns the full set (no limit) but only the columns
 * the dashboard actually reads, plus pre-split arrays for SF / PUC leads.
 */
export function useDashboardStats() {
  const [allLeads, setAllLeads] = useState<DashboardLead[]>([])
  const [loading, setLoading] = useState(true)
  const { profile, isAdmin } = useUser()

  useEffect(() => {
    const abortController = new AbortController()

    async function fetchStats() {
      if (isDemoMode()) {
        // Map demo leads to the lightweight shape
        const demoLeads = getDemoLeads()
        const mapped: DashboardLead[] = demoLeads.map(l => ({
          id: l.id,
          first_name: l.first_name,
          last_name: l.last_name,
          phone: l.phone,
          pipeline_stage: l.pipeline_stage,
          status: l.status ?? null,
          funding_type: l.funding_type ?? null,
          assigned_to: l.assigned_to ?? null,
          created_at: l.created_at,
          updated_at: l.updated_at,
          last_contacted_at: l.last_contacted_at ?? null,
          callback_date: l.callback_date ?? null,
          date_of_birth: l.date_of_birth ?? null,
        }))
        setAllLeads(mapped)
        setLoading(false)
        return
      }

      const supabase = createClient()

      const { data, error } = await supabase
        .from('leads')
        .select(DASHBOARD_LEAD_COLUMNS)
        .order('created_at', { ascending: false })

      if (abortController.signal.aborted) return

      if (!error && data) {
        setAllLeads(data as DashboardLead[])
      }
      setLoading(false)
    }

    fetchStats()
    return () => abortController.abort()
  }, [])

  // ---------- Derived data (memoised) ----------

  const myLeads = useMemo(() => {
    if (!profile?.id) return allLeads
    if (isAdmin) return allLeads
    return allLeads.filter(l => l.assigned_to === profile.id)
  }, [allLeads, profile?.id, isAdmin])

  const sfLeads = useMemo(() => {
    const base = allLeads.filter(l => l.funding_type === 'self_funded')
    if (isAdmin || !profile?.id) return base
    return base.filter(l => l.assigned_to === profile.id)
  }, [allLeads, profile?.id, isAdmin])

  const pucLeads = useMemo(() => {
    const base = allLeads.filter(l => l.funding_type === 'puc')
    if (isAdmin || !profile?.id) return base
    return base.filter(l => l.assigned_to === profile.id)
  }, [allLeads, profile?.id, isAdmin])

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
