"use client"

import { createContext, createElement, useCallback, useContext, useEffect, type ReactNode } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getProfile } from "@/services/profileService"
// import { getRoleById } from "@/services/roleService"
import { isDemoMode, getDemoRole, DEMO_AGENTS } from "@/lib/demo-data"
import type { Profile, Role } from "@/lib/profile/types"
import type { User } from "@supabase/supabase-js"

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

const PROFILE_QUERY_KEY = ['current-profile'] as const
const InitialProfileContext = createContext<Profile | null | undefined>(undefined)

export function UserProfileProvider({
  profile,
  children,
}: {
  profile: Profile | null
  children: ReactNode
}) {
  return createElement(InitialProfileContext.Provider, { value: profile }, children)
}

// Helper function to map API response to Profile interface
async function mapUserProfileToProfile(userProfile: any): Promise<Profile> {
  // Fetch role name from roleId
  // let roleName: Role = "agent" // default
  // try {
  //   const roleResponse = await getRoleById(userProfile.roleId)
  //   const roleNameLower = roleResponse.role.name.toLowerCase()
  //   if (roleNameLower === "admin" || roleNameLower === "agent" || roleNameLower === "marketing") {
  //     roleName = roleNameLower as Role
  //   }
  // } catch (error) {
  //   console.error("Failed to fetch role, defaulting to agent:", error)
  // }

  return {
    id: userProfile.id,
    email: userProfile.email,
    full_name: userProfile.name,
    role: 'admin',
    avatar_url: userProfile.profilePic || undefined,
    phone: userProfile.phone || undefined,
    is_active: userProfile.active,
    monthly_target: userProfile.monthlyTarget || 0,
    created_at: userProfile.createdAt,
    updated_at: userProfile.updatedAt,
  }
}

export function useProfile() {
  const queryClient = useQueryClient()
  const demoMode = isDemoMode()
  const demoRole = demoMode ? getDemoRole() : null
  const initialProfile = useContext(InitialProfileContext)

  const { data, isLoading: queryLoading } = useQuery({
    queryKey: [...PROFILE_QUERY_KEY, demoMode ? demoRole : "auth"],
    initialData: !demoMode && initialProfile !== undefined
      ? { user: null, profile: initialProfile }
      : undefined,
    queryFn: async (): Promise<{ user: User | null; profile: Profile | null }> => {
      if (demoMode) {
        return {
          user: null,
          profile: demoRole === "admin" ? DEMO_ADMIN_PROFILE : DEMO_AGENT_PROFILE,
        }
      }

      try {
        const response = await getProfile()
        const profile = await mapUserProfileToProfile(response.profile)
        return { user: null, profile }
      } catch (error) {
        console.error("Failed to load profile:", error)
        return { user: null, profile: null }
      }
    },
    staleTime: 5 * 60_000, // User data rarely changes, cache for 5 minutes
    gcTime: 10 * 60_000,
    retry: 2,
  })

  // Listen for auth state changes and invalidate the query
  useEffect(() => {
    if (isDemoMode()) return

    // Check for token changes in localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "accessToken") {
        queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY })
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
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

    // Clear auth tokens
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
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

      try {
        // In a real implementation, this would call an API endpoint like /users or /agents
        // For now, we'll return an empty array since the endpoint isn't specified
        // TODO: Implement proper agents list API endpoint
        console.warn("useAgents: No API endpoint available for fetching agents list")
        return []
      } catch (error) {
        console.error("Failed to fetch agents:", error)
        return []
      }
    },
    staleTime: 2 * 60_000, // Agents list rarely changes
    gcTime: 5 * 60_000,
  })

  return { agents, loading }
}
