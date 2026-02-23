"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode } from "@/lib/demo-data"
import type { Activity } from "@/types"

export function useActivityFeed(options: {
  isAdmin: boolean
  userId?: string | null
  limit?: number
}) {
  const { isAdmin, userId, limit = 20 } = options
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = useCallback(async () => {
    setLoading(true)

    // Demo mode - generate some placeholder activities
    if (isDemoMode()) {
      const now = new Date()
      const demoActivities: Activity[] = [
        {
          id: "act-1",
          lead_id: "lead-1",
          activity_type: "stage_change",
          title: "Stage Changed",
          description: "Ahmad Al-Rashidi: New \u2192 Contacted",
          metadata: { old_stage: "new", new_stage: "contacted" },
          created_by: "demo-user-id",
          created_at: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
          created_by_profile: { id: "demo-user-id", full_name: "Demo Admin", email: "demo@ktech.edu.kw" } as Activity["created_by_profile"],
        },
        {
          id: "act-2",
          lead_id: "lead-2",
          activity_type: "status_change",
          title: "Status Changed",
          description: "Sara Al-Mutairi: None \u2192 Interested",
          metadata: { old_status: null, new_status: "interested" },
          created_by: "demo-user-id",
          created_at: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
          created_by_profile: { id: "demo-user-id", full_name: "Demo Admin", email: "demo@ktech.edu.kw" } as Activity["created_by_profile"],
        },
        {
          id: "act-3",
          lead_id: "lead-3",
          activity_type: "note",
          title: "Note Added",
          description: "Called and discussed program details with Fahad",
          metadata: {},
          created_by: "demo-agent-1",
          created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          created_by_profile: { id: "demo-agent-1", full_name: "Ahmed Ali", email: "ahmed@ktech.edu.kw" } as Activity["created_by_profile"],
        },
        {
          id: "act-4",
          lead_id: "lead-4",
          activity_type: "stage_change",
          title: "Stage Changed",
          description: "Noor Al-Sabah: Contacted \u2192 Test",
          metadata: { old_stage: "contacted", new_stage: "test" },
          created_by: "demo-agent-2",
          created_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
          created_by_profile: { id: "demo-agent-2", full_name: "Fatima Hassan", email: "fatima@ktech.edu.kw" } as Activity["created_by_profile"],
        },
        {
          id: "act-5",
          lead_id: "lead-5",
          activity_type: "funding_type_change",
          title: "Auto Self-Funded (Low GPA)",
          description: "Khalid Mohammed set to Self-Funded due to GPA below 70",
          metadata: { reason: "gpa_below_70" },
          created_by: "demo-user-id",
          created_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
          created_by_profile: { id: "demo-user-id", full_name: "Demo Admin", email: "demo@ktech.edu.kw" } as Activity["created_by_profile"],
        },
      ]

      setActivities(isAdmin ? demoActivities : demoActivities.filter((a) => a.created_by === userId))
      setLoading(false)
      return
    }

    const supabase = createClient()

    try {
      let query = supabase
        .from("activities")
        .select(`
          *,
          created_by_profile:profiles!activities_created_by_fkey(id, full_name, email, avatar_url)
        `)
        .order("created_at", { ascending: false })
        .limit(limit)

      // Agent only sees own activities
      if (!isAdmin && userId) {
        query = query.eq("created_by", userId)
      }

      const { data, error } = await query
      if (error) throw error
      setActivities((data || []) as Activity[])
    } catch (err) {
      console.error("Error fetching activity feed:", err)
    } finally {
      setLoading(false)
    }
  }, [isAdmin, userId, limit])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  // Real-time subscription
  useEffect(() => {
    if (isDemoMode()) return

    const supabase = createClient()
    const channel = supabase
      .channel("dashboard-activities")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activities" },
        () => {
          fetchActivities()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchActivities])

  return { activities, loading, refetch: fetchActivities }
}
