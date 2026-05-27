"use client"

import { useState, createContext, useContext, useSyncExternalStore, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav, QuickActions } from "@/components/layout/mobile-nav"
import { QuickFind, useQuickFind } from "@/components/layout/quick-find"
import { AIChatButton } from "@/components/ai-chat/ai-chat-button"
import { AIChatPanel } from "@/components/ai-chat/ai-chat-panel"
import { cn } from "@/lib/utils"
import type { Profile } from "@/types"

function getDemoShellUser(): Profile {
  const now = new Date().toISOString()
  const role = typeof window !== "undefined" ? localStorage.getItem("ktech-demo-role") : null
  if (role === "admin") {
    return {
      id: "demo-user-id",
      email: "aldana@ktech.edu.kw",
      full_name: "Aldana Ali",
      role: "admin",
      avatar_url: undefined,
      is_active: true,
      monthly_target: 50,
      created_at: now,
      updated_at: now,
    }
  }

  return {
    id: "agent-1",
    email: "demo-agent@ktech.edu.kw",
    full_name: "Demo Agent",
    role: "agent",
    avatar_url: undefined,
    is_active: true,
    monthly_target: 40,
    created_at: now,
    updated_at: now,
  }
}

// Context for sidebar state
const SidebarContext = createContext<{
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  openQuickFind: () => void
}>({ collapsed: false, setCollapsed: () => {}, openQuickFind: () => {} })

export const useSidebar = () => useContext(SidebarContext)

// Hook to check demo mode using useSyncExternalStore
// In production, demo mode is disabled unless NEXT_PUBLIC_ENABLE_DEMO=true
function useDemoMode() {
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener("storage", callback)
    return () => window.removeEventListener("storage", callback)
  }, [])

  const getSnapshot = useCallback(() => {
    return localStorage.getItem("ktech-demo-mode") === "true"
  }, [])

  const getServerSnapshot = useCallback(() => false, [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

interface DashboardShellProps {
  user: Profile | null
  children: React.ReactNode
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [aiChatOpen, setAiChatOpen] = useState(false)
  const quickFind = useQuickFind()
  const router = useRouter()
  const isDemoMode = useDemoMode()

  // Compute active user based on props and demo mode
  const activeUser = isDemoMode ? getDemoShellUser() : user

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
    <SidebarContext.Provider value={{ collapsed: sidebarCollapsed, setCollapsed: setSidebarCollapsed, openQuickFind: quickFind.open }}>
      <div className="h-screen bg-[var(--background)] overflow-hidden">
        <Sidebar user={activeUser} />
        <main className={cn(
          "h-screen pb-20 lg:pb-0 transition-all duration-300 flex flex-col overflow-y-auto overflow-x-hidden hide-scrollbar",
          sidebarCollapsed ? "lg:pl-[76px]" : "lg:pl-[264px]"
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

        {/* Quick Find Modal (⌘K) */}
        <QuickFind
          isOpen={quickFind.isOpen}
          onClose={quickFind.close}
        />

        {/* AI Chat */}
        <AIChatButton onClick={() => setAiChatOpen(true)} />
        <AIChatPanel open={aiChatOpen} onOpenChange={setAiChatOpen} />
      </div>
    </SidebarContext.Provider>
  )
}
