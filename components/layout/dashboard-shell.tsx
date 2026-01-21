"use client"

import { useState, createContext, useContext } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav, QuickActions } from "@/components/layout/mobile-nav"
import { cn } from "@/lib/utils"
import type { Profile } from "@/types"

// Demo user profile for testing
const DEMO_USER: Profile = {
  id: "demo-user-id",
  email: "demo@ktech.edu.kw",
  full_name: "Demo Admin",
  role: "admin",
  avatar_url: undefined,
  is_active: true,
  monthly_target: 50,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

// Context for sidebar state
const SidebarContext = createContext<{
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}>({ collapsed: false, setCollapsed: () => {} })

export const useSidebar = () => useContext(SidebarContext)

interface DashboardShellProps {
  user: Profile | null
  children: React.ReactNode
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeUser] = useState<Profile | null>(() => {
    if (user) return user
    if (typeof window !== "undefined") {
      const isDemoMode = localStorage.getItem("ktech-demo-mode") === "true"
      if (isDemoMode) return DEMO_USER
    }
    return null
  })
  const router = useRouter()

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "lead":
        router.push("/leads?new=true")
        break
      case "appointment":
        router.push("/calendar?new=true")
        break
    }
  }

  return (
    <SidebarContext.Provider value={{ collapsed: sidebarCollapsed, setCollapsed: setSidebarCollapsed }}>
      <div className="h-screen bg-[var(--background)] overflow-hidden">
        <Sidebar user={activeUser} />
        <main className={cn(
          "h-screen pb-20 lg:pb-0 transition-all duration-300 flex flex-col overflow-y-auto",
          sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
        )}>
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav onAddClick={() => setShowQuickActions(true)} />

        {/* Quick Actions Menu */}
        <QuickActions
          isOpen={showQuickActions}
          onClose={() => setShowQuickActions(false)}
          onAction={handleQuickAction}
        />
      </div>
    </SidebarContext.Provider>
  )
}
