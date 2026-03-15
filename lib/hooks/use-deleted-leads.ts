"use client"

import { useEffect, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode } from "@/lib/demo-data"
import { queryKeys } from "./query-keys"
import type { Profile, PipelineStage, ContactStatus, LeadSource, LeadSourceCategory, FundingType } from "@/types"

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
  const queryClient = useQueryClient()

  const listQueryKey = queryKeys.deletedLeads.list({ searchQuery, limit, showRestored })

  const { data: deletedLeads = [], isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: listQueryKey,
    queryFn: async () => {
      // Demo mode - return empty for now
      if (isDemoMode()) {
        return [] as DeletedLead[]
      }

      const supabase = createClient()

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

      if (error) throw new Error(error.message)
      return (data || []) as DeletedLead[]
    },
    staleTime: 30_000,
  })

  const error = queryError?.message ?? null

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
          queryClient.invalidateQueries({ queryKey: queryKeys.deletedLeads.all })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return { deletedLeads, loading, error, refetch }
}

export function useDeletedLeadMutations() {
  const queryClient = useQueryClient()

  const restoreLeadMutation = useMutation({
    mutationFn: async (deletedLeadId: string) => {
      // Demo mode - simulate success
      if (isDemoMode()) {
        await new Promise(resolve => setTimeout(resolve, 300))
        return { data: null, error: null }
      }

      const supabase = createClient()
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

      if (error) throw new Error(error.message)
      return { data, error: null }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deletedLeads.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
    },
  })

  const bulkRestoreLeadsMutation = useMutation({
    mutationFn: async (deletedLeadIds: string[]) => {
      // Demo mode - simulate success
      if (isDemoMode()) {
        await new Promise(resolve => setTimeout(resolve, 300))
        return { error: null, count: deletedLeadIds.length }
      }

      const supabase = createClient()
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deletedLeads.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
    },
  })

  const permanentlyDeleteLeadMutation = useMutation({
    mutationFn: async (deletedLeadId: string) => {
      // Demo mode - simulate success
      if (isDemoMode()) {
        await new Promise(resolve => setTimeout(resolve, 300))
        return { error: null }
      }

      const supabase = createClient()
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

      if (error) throw new Error(error.message)
      return { error: null }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deletedLeads.all })
    },
  })

  const restoreLead = useCallback(
    async (deletedLeadId: string) => {
      try {
        const result = await restoreLeadMutation.mutateAsync(deletedLeadId)
        return result
      } catch (err) {
        console.error("Error restoring lead:", err)
        return { data: null, error: err instanceof Error ? err.message : "Failed to restore lead" }
      }
    },
    [restoreLeadMutation]
  )

  const bulkRestoreLeads = useCallback(
    async (deletedLeadIds: string[]) => {
      try {
        const result = await bulkRestoreLeadsMutation.mutateAsync(deletedLeadIds)
        return result
      } catch (err) {
        console.error("Error bulk restoring leads:", err)
        return { error: err instanceof Error ? err.message : "Failed to restore leads", count: 0 }
      }
    },
    [bulkRestoreLeadsMutation]
  )

  const permanentlyDeleteLead = useCallback(
    async (deletedLeadId: string) => {
      try {
        const result = await permanentlyDeleteLeadMutation.mutateAsync(deletedLeadId)
        return result
      } catch (err) {
        console.error("Error permanently deleting lead:", err)
        return { error: err instanceof Error ? err.message : "Failed to permanently delete lead" }
      }
    },
    [permanentlyDeleteLeadMutation]
  )

  const loading = restoreLeadMutation.isPending || bulkRestoreLeadsMutation.isPending || permanentlyDeleteLeadMutation.isPending

  return {
    restoreLead,
    bulkRestoreLeads,
    permanentlyDeleteLead,
    loading
  }
}

export function useDeletedLeadsStats() {
  const { data: stats = { total: 0, restoredCount: 0, thisMonth: 0 }, isLoading: loading } = useQuery({
    queryKey: queryKeys.deletedLeads.stats(),
    queryFn: async () => {
      if (isDemoMode()) {
        return { total: 0, restoredCount: 0, thisMonth: 0 }
      }

      const supabase = createClient()

      const { data: deletedLeads, error } = await supabase
        .from("deleted_leads")
        .select("deleted_at, is_restored")

      if (error) throw new Error(error.message)

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

      return { total, restoredCount, thisMonth }
    },
    staleTime: 60_000,
  })

  return { stats, loading }
}
