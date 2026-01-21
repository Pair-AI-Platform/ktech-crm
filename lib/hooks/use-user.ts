"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode, DEMO_AGENTS } from "@/lib/demo-data"
import type { User } from "@supabase/supabase-js"

export interface Profile {
  id: string
  email: string
  full_name: string
  full_name_ar?: string
  role: "admin" | "agent"
  avatar_url?: string
  phone?: string
  is_active: boolean
  monthly_target: number
  created_at: string
  updated_at: string
}

// Demo user profile
const DEMO_PROFILE: Profile = {
  id: "demo-user-id",
  email: "demo@ktech.edu.kw",
  full_name: "Demo Admin",
  role: "admin",
  is_active: true,
  monthly_target: 50,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUser() {
      // Check for demo mode
      if (isDemoMode()) {
        setProfile(DEMO_PROFILE)
        setLoading(false)
        return
      }

      const supabase = createClient()

      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single()

          setProfile(profile)
        }
      } catch (error) {
        console.error("Error fetching user:", error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Skip auth state listener in demo mode
    if (isDemoMode()) return

    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single()
          setProfile(profile)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    // Clear demo mode
    if (isDemoMode()) {
      localStorage.removeItem("ktech-demo-mode")
      document.cookie = "ktech-demo-mode=; path=/; max-age=0"
      window.location.href = "/login"
      return
    }

    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  return { user, profile, loading, signOut, isAdmin: profile?.role === "admin" }
}

// Hook to get all team members/agents
export function useAgents() {
  const [agents, setAgents] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAgents() {
      // Check for demo mode
      if (isDemoMode()) {
        setAgents(DEMO_AGENTS as Profile[])
        setLoading(false)
        return
      }

      const supabase = createClient()

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("is_active", true)
          .order("full_name")

        if (error) throw error
        setAgents(data || [])
      } catch (error) {
        console.error("Error fetching agents:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()
  }, [])

  return { agents, loading }
}
