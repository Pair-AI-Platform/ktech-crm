export const dynamic = "force-dynamic"

import { Suspense } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getUserProfile } from "@/lib/supabase/server"
import { AppProviders } from "@/components/app-providers"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { HeartbeatProvider } from "@/components/layout/heartbeat-provider"
import { UserProfileProvider } from "@/lib/hooks/use-user"
import type { Profile } from "@/types"

function getDemoProfile(role: string | undefined): Profile {
  const now = new Date().toISOString()
  if (role === "admin") {
    return {
      id: "demo-admin-id",
      email: "aldana@ktech.edu.kw",
      full_name: "Aldana Ali",
      role: "admin",
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
    is_active: true,
    monthly_target: 40,
    created_at: now,
    updated_at: now,
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const demoModeAllowed =
    process.env.NODE_ENV !== "production" &&
    (process.env.NEXT_PUBLIC_ALLOW_DEMO_MODE === "true" ||
      process.env.DEMO_MODE_ENABLED === "true")
  const isDemoMode = demoModeAllowed && cookieStore.get("ktech-demo-mode")?.value === "true"
  const demoRole = cookieStore.get("ktech-demo-role")?.value
  const profile = isDemoMode ? getDemoProfile(demoRole) : await getUserProfile()

  // Not signed in (and not in demo mode) → bounce to login.
  if (!profile && !isDemoMode) {
    redirect("/login")
  }

  // Marketing users should use the marketing portal
  if (profile?.role === "marketing") {
    redirect("/marketing")
  }

  return (
    <Suspense>
      <AppProviders>
        <UserProfileProvider profile={profile}>
          <DashboardShell user={profile}>
            <HeartbeatProvider>
              {children}
            </HeartbeatProvider>
          </DashboardShell>
        </UserProfileProvider>
      </AppProviders>
    </Suspense>
  )
}
