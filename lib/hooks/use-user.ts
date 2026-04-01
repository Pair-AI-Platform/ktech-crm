"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
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
  email: "adel@ktech.edu.kw",
  full_name: "Adel",
  role: "admin",
  is_active: true,
  monthly_target: 50,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const DEMO_AGENT_PROFILE: Profile = {
  id: "agent-1",
  email: "demo-agent@ktech.edu.kw",
  full_name: "Khalifa",
  role: "agent",
  is_active: true,
  monthly_target: 40,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const USER_QUERY_KEY = ['current-user'] as const

export function useUser() {
  const queryClient = useQueryClient()

  const { data, isLoading: loading } = useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: async (): Promise<{ user: User | null; profile: Profile | null }> => {
      if (isDemoMode()) {
        const demoRole = getDemoRole()
        return {
          user: null,
          profile: demoRole === "agent" ? DEMO_AGENT_PROFILE : DEMO_ADMIN_PROFILE,
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

      // Override profile for demo accounts to ensure correct role
      const email = user.email || profile?.email
      if (profile && email === "demo-agent@ktech.edu.kw") {
        profile.role = "agent"
        profile.full_name = "Khalifa"
      } else if (profile && email === "demo-admin@ktech.edu.kw") {
        profile.role = "admin"
        profile.full_name = "Demo Admin"
      }

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

  const user = data?.user ?? null
  const profile = data?.profile ?? null

  const signOut = useCallback(async () => {
    if (isDemoMode()) {
      localStorage.removeItem("ktech-demo-mode")
      localStorage.removeItem("ktech-demo-role")
      document.cookie = "ktech-demo-mode=; path=/; max-age=0"
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
