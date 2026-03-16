"use client"

import { LogOut, Megaphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface MarketingShellProps {
  userName: string
  children: React.ReactNode
}

export function MarketingShell({ userName, children }: MarketingShellProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg-surface)]/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img
              src="/ktech-logo.jpeg"
              alt="ktech"
              className="w-9 h-9 rounded-lg"
            />
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-[var(--text-primary)]">ktech</h1>
              <span className="text-[var(--text-muted)]">/</span>
              <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                <Megaphone className="w-4 h-4" />
                Marketing Portal
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="text-sm text-[var(--text-secondary)] hidden sm:block">{userName}</span>
            <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
