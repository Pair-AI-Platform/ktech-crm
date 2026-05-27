"use client"

import { useEffect, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode, getDemoRole, DEMO_AGENTS } from "@/lib/demo-data"
import type { User } from "@supabase/supabase-js"

export interface Profile {
  id: string
  email: string
  full_name: string
  full_name_ar?: string
  role: "admin" | "agent" | "marketing"
  avatar_url?: string
  phone?: string
  is_active: boolean
  monthly_target: number
  created_at: string
  updated_at: string
}

// Demo user profiles
const DEMO_ADMIN_PROFILE: Profile = {
  id: "demo-admin-id",
  email: "aldana@ktech.edu.kw",
  full_name: "Aldana Ali",
  role: "admin",
  is_active: true,
  monthly_target: 50,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const DEMO_AGENT_PROFILE: Profile = {
  id: "agent-1",
  email: "demo-agent@ktech.edu.kw",
  full_name: "Demo Agent",
  role: "agent",
  is_active: true,
  monthly_target: 40,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const USER_QUERY_KEY = ['current-user'] as const

export function useUser() {
  const queryClient = useQueryClient()
  const demoMode = isDemoMode()
  const demoRole = demoMode ? getDemoRole() : null

  const { data, isLoading: queryLoading } = useQuery({
    queryKey: [...USER_QUERY_KEY, demoMode ? demoRole : "auth"],
    queryFn: async (): Promise<{ user: User | null; profile: Profile | null }> => {
      if (demoMode) {
        return {
          user: null,
          profile: demoRole === "admin" ? DEMO_ADMIN_PROFILE : DEMO_AGENT_PROFILE,
        }
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return { user: null, profile: null }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      return { user, profile }
    },
    staleTime: 5 * 60_000, // User data rarely changes, cache for 5 minutes
    gcTime: 10 * 60_000,
    retry: 2,
  })

  // Listen for auth state changes and invalidate the query
  useEffect(() => {
    if (isDemoMode()) return

    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY })
    })

    return () => subscription.unsubscribe()
  }, [queryClient])

  const demoProfile = demoMode
    ? demoRole === "admin" ? DEMO_ADMIN_PROFILE : DEMO_AGENT_PROFILE
    : null
  const user = demoMode ? null : data?.user ?? null
  const profile = demoMode ? demoProfile : data?.profile ?? null
  const loading = demoMode ? false : queryLoading

  const signOut = useCallback(async () => {
    if (isDemoMode()) {
      localStorage.removeItem("ktech-demo-mode")
      localStorage.removeItem("ktech-demo-role")
      document.cookie = "ktech-demo-mode=; path=/; max-age=0"
      document.cookie = "ktech-demo-role=; path=/; max-age=0"
      window.location.href = "/login"
      return
    }

    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/login"
  }, [])

  return {
    user,
    profile,
    loading,
    signOut,
    isAdmin: profile?.role === "admin",
    isAgent: profile?.role === "agent",
    isMarketing: profile?.role === "marketing",
  }
}

// Hook to get all team members/agents
export function useAgents() {
  const { data: agents = [], isLoading: loading } = useQuery({
    queryKey: ['agents-list'],
    queryFn: async (): Promise<Profile[]> => {
      if (isDemoMode()) {
        return DEMO_AGENTS as Profile[]
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_active", true)
        .order("full_name")

      if (error) throw new Error(error.message)
      return data || []
    },
    staleTime: 2 * 60_000, // Agents list rarely changes
    gcTime: 5 * 60_000,
  })

  return { agents, loading }
}
