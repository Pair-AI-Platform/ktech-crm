"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode } from "@/lib/demo-data"
import type { Activity } from "@/types"

export function useLeadActivities(leadId: string) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = useCallback(async () => {
    if (!leadId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Demo mode - return empty array
    if (isDemoMode()) {
      setActivities([])
      setLoading(false)
      return
    }

    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("activities")
        .select(`
          *,
          created_by_profile:profiles!activities_created_by_fkey(id, full_name, email, avatar_url)
        `)
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw new Error(error.message)
      setActivities(data || [])
    } catch (err) {
      console.error("Error fetching activities:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch activities")
    } finally {
      setLoading(false)
    }
  }, [leadId])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  // Subscribe to real-time changes
  useEffect(() => {
    if (isDemoMode() || !leadId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`activities-${leadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activities",
          filter: `lead_id=eq.${leadId}`
        },
        () => {
          fetchActivities()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [leadId, fetchActivities])

  return { activities, loading, error, refetch: fetchActivities }
}
