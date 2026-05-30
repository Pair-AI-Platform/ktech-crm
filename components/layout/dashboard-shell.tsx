"use client"

import { useState, createContext, useContext, useSyncExternalStore, useCallback } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useQuickFind } from "@/components/layout/use-quick-find"
import { cn } from "@/lib/utils"
import type { Profile } from "@/types"

const Sidebar = dynamic(
  () => import("@/components/layout/sidebar").then(m => m.Sidebar),
  { ssr: false, loading: () => <SidebarSkeleton /> }
)
const MobileNav = dynamic(
  () => import("@/components/layout/mobile-nav").then(m => m.MobileNav),
  { ssr: false }
)
const QuickActions = dynamic(
  () => import("@/components/layout/mobile-nav").then(m => m.QuickActions),
  { ssr: false }
)
const QuickFind = dynamic(
  () => import("@/components/layout/quick-find").then(m => m.QuickFind),
  { ssr: false }
)

// Lazy-load AI chat panel: pulls in the AI SDK + chat hooks (~hundreds of KB).
// We only need it when the user opens the chat for the first time.
const AIChatPanel = dynamic(
  () => import("@/components/ai-chat/ai-chat-panel").then(m => m.AIChatPanel),
  { ssr: false }
)

function SidebarSkeleton() {
  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-[264px] bg-[var(--bg-surface)] border-r border-[var(--border)] p-4">
      <div className="w-full space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--bg-hover)] animate-pulse" />
          <div className="h-5 w-16 rounded bg-[var(--bg-hover)] animate-pulse" />
        </div>
        <div className="h-px bg-[var(--border)]" />
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="h-10 rounded-lg bg-[var(--bg-sunken)] animate-pulse" />
        ))}
      </div>
    </aside>
  )
}

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
  openAiChat: () => void
}>({ collapsed: false, setCollapsed: () => {}, openQuickFind: () => {}, openAiChat: () => {} })

export const useSidebar = () => useContext(SidebarContext)

// Hook to check demo mode using useSyncExternalStore
// In production, demo mode is disabled unless NEXT_PUBLIC_ENABLE_DEMO=true
function useDemoMode() {
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener("storage", callback)
    return () => window.removeEventListener("storage", callback)
  }, [])

  const getSnapshot = useCallback(() => {
    if (process.env.NEXT_PUBLIC_ALLOW_DEMO_MODE !== "true") return false
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
  // Track first open so the AI chat chunk is fetched on demand, then kept mounted
  // (preserves conversation state without rebuilding once the user starts using it).
  const [aiChatEverOpened, setAiChatEverOpened] = useState(false)
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

  const openAiChat = useCallback(() => {
    setAiChatEverOpened(true)
    setAiChatOpen(true)
  }, [])

  return (
    <SidebarContext.Provider value={{ collapsed: sidebarCollapsed, setCollapsed: setSidebarCollapsed, openQuickFind: quickFind.open, openAiChat }}>
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
        {quickFind.isOpen && (
          <QuickFind
            isOpen={quickFind.isOpen}
            onClose={quickFind.close}
          />
        )}

        {/* AI Chat panel (opened from header Ask Kadi button) */}
        {aiChatEverOpened && (
          <AIChatPanel open={aiChatOpen} onOpenChange={setAiChatOpen} />
        )}
      </div>
    </SidebarContext.Provider>
  )
}
