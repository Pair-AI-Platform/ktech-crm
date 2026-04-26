export const dynamic = "force-dynamic"

import { Suspense } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getUserProfile } from "@/lib/supabase/server"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { HeartbeatProvider } from "@/components/layout/heartbeat-provider"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const isDemoMode = cookieStore.get("ktech-demo-mode")?.value === "true"
  // In demo mode, skip the Supabase profile fetch entirely — the client-side
  // useUser() hook serves the demo profile from localStorage.
  const profile = isDemoMode ? null : await getUserProfile()

  // Marketing users should use the marketing portal
  if (profile?.role === "marketing") {
    redirect("/marketing")
  }

  return (
    <Suspense>
      <DashboardShell user={profile}>
        <HeartbeatProvider>
          {children}
        </HeartbeatProvider>
      </DashboardShell>
    </Suspense>
  )
}
