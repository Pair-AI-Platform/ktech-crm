"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode } from "@/lib/demo-data"
import type { Lead, Profile, PipelineStage, ContactStatus, LeadSource, LeadSourceCategory, FundingType } from "@/types"

export interface DeletedLead {
  id: string
  original_lead_id: string

  // Personal Information
  first_name: string
  last_name: string
  first_name_ar?: string
  last_name_ar?: string
  civil_id?: string
  phone: string
  phone_secondary?: string
  email?: string
  date_of_birth?: string
  gender?: string
  nationality?: string
  is_kuwaiti?: boolean

  // Academic Information
  school_id?: string
  school?: {
    id: string
    name_en: string
    name_ar: string
  }
  grade_level?: string
  academic_track?: string
  intended_major?: string

  // Financial
  funding_type?: FundingType

  // Lead Tracking
  source_category?: LeadSourceCategory
  source?: LeadSource
  pipeline_stage?: PipelineStage
  contact_status?: ContactStatus

  // Assignment at time of deletion
  assigned_to?: string
  assigned_agent?: Profile

  // Original timestamps
  original_created_at?: string
  original_updated_at?: string

  // Deletion metadata
  deleted_by: string
  deleted_by_profile?: Profile
  deleted_at: string
  deletion_reason?: string

  // Restoration tracking
  restored_by?: string
  restored_at?: string
  is_restored: boolean

  notes?: string
}

interface UseDeletedLeadsOptions {
  searchQuery?: string
  limit?: number
  showRestored?: boolean
}

export function useDeletedLeads(options: UseDeletedLeadsOptions = {}) {
  const { searchQuery = "", limit = 50, showRestored = false } = options
  const [deletedLeads, setDeletedLeads] = useState<DeletedLead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDeletedLeads = useCallback(async (abortSignal?: AbortSignal) => {
    setLoading(true)
    setError(null)

    // Demo mode - return empty for now
    if (isDemoMode()) {
      setDeletedLeads([])
      setLoading(false)
      return
    }

    const supabase = createClient()

    try {
      let query = supabase
        .from("deleted_leads")
        .select(`
          *,
          school:schools(id, name_en, name_ar),
          assigned_agent:profiles!deleted_leads_assigned_to_fkey(id, full_name, email, avatar_url),
          deleted_by_profile:profiles!deleted_leads_deleted_by_fkey(id, full_name, email, avatar_url)
        `)
        .order("deleted_at", { ascending: false })
        .limit(limit)

      // Filter out restored leads unless explicitly requested
      if (!showRestored) {
        query = query.eq("is_restored", false)
      }

      if (searchQuery) {
        query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,civil_id.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query

      // Check if request was aborted
      if (abortSignal?.aborted) return

      if (error) throw error
      setDeletedLeads(data || [])
    } catch (err) {
      if (abortSignal?.aborted) return
      console.error("Error fetching deleted leads:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch deleted leads")
    } finally {
      if (!abortSignal?.aborted) {
        setLoading(false)
      }
    }
  }, [searchQuery, limit, showRestored])

  useEffect(() => {
    const abortController = new AbortController()
    fetchDeletedLeads(abortController.signal)

    return () => {
      abortController.abort()
    }
  }, [fetchDeletedLeads])

  // Subscribe to real-time changes
  useEffect(() => {
    if (isDemoMode()) return

    const supabase = createClient()
    const channel = supabase
      .channel("deleted-leads-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deleted_leads" },
        () => {
          fetchDeletedLeads()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchDeletedLeads])

  return { deletedLeads, loading, error, refetch: fetchDeletedLeads }
}

export function useDeletedLeadMutations() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const restoreLead = async (deletedLeadId: string) => {
    // Demo mode - simulate success
    if (isDemoMode()) {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 300))
      setLoading(false)
      return { data: null, error: null }
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Check if user is admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profile?.role !== "admin") {
        throw new Error("Only admins can restore deleted leads")
      }

      // Use the restore_deleted_lead function
      const { data, error } = await supabase
        .rpc("restore_deleted_lead", {
          deleted_lead_id: deletedLeadId,
          restoring_user_id: user.id
        })

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      console.error("Error restoring lead:", err)
      return { data: null, error: err instanceof Error ? err.message : "Failed to restore lead" }
    } finally {
      setLoading(false)
    }
  }

  const bulkRestoreLeads = async (deletedLeadIds: string[]) => {
    // Demo mode - simulate success
    if (isDemoMode()) {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 300))
      setLoading(false)
      return { error: null, count: deletedLeadIds.length }
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Check if user is admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profile?.role !== "admin") {
        throw new Error("Only admins can restore deleted leads")
      }

      let successCount = 0
      const errors: string[] = []

      for (const deletedLeadId of deletedLeadIds) {
        const { error } = await supabase
          .rpc("restore_deleted_lead", {
            deleted_lead_id: deletedLeadId,
            restoring_user_id: user.id
          })

        if (error) {
          errors.push(`Failed to restore lead ${deletedLeadId}: ${error.message}`)
        } else {
          successCount++
        }
      }

      if (errors.length > 0 && successCount === 0) {
        throw new Error(errors.join("; "))
      }

      return { error: errors.length > 0 ? errors.join("; ") : null, count: successCount }
    } catch (err) {
      console.error("Error bulk restoring leads:", err)
      return { error: err instanceof Error ? err.message : "Failed to restore leads", count: 0 }
    } finally {
      setLoading(false)
    }
  }

  const permanentlyDeleteLead = async (deletedLeadId: string) => {
    // Demo mode - simulate success
    if (isDemoMode()) {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 300))
      setLoading(false)
      return { error: null }
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Check if user is admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profile?.role !== "admin") {
        throw new Error("Only admins can permanently delete leads")
      }

      // Permanently delete from deleted_leads table
      const { error } = await supabase
        .from("deleted_leads")
        .delete()
        .eq("id", deletedLeadId)

      if (error) throw error
      return { error: null }
    } catch (err) {
      console.error("Error permanently deleting lead:", err)
      return { error: err instanceof Error ? err.message : "Failed to permanently delete lead" }
    } finally {
      setLoading(false)
    }
  }

  return {
    restoreLead,
    bulkRestoreLeads,
    permanentlyDeleteLead,
    loading
  }
}

export function useDeletedLeadsStats() {
  const [stats, setStats] = useState({
    total: 0,
    restoredCount: 0,
    thisMonth: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      if (isDemoMode()) {
        setStats({ total: 0, restoredCount: 0, thisMonth: 0 })
        setLoading(false)
        return
      }

      const supabase = createClient()

      try {
        // Get all deleted leads
        const { data: deletedLeads, error } = await supabase
          .from("deleted_leads")
          .select("deleted_at, is_restored")

        if (error) throw error

        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        let thisMonth = 0
        let restoredCount = 0

        deletedLeads?.forEach(lead => {
          if (lead.is_restored) {
            restoredCount++
          }
          if (new Date(lead.deleted_at) >= startOfMonth) {
            thisMonth++
          }
        })

        const total = deletedLeads?.filter(l => !l.is_restored).length || 0

        setStats({
          total,
          restoredCount,
          thisMonth,
        })
      } catch (err) {
        console.error("Error fetching deleted leads stats:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading }
}
