export const dynamic = "force-dynamic"

import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getUserProfile } from "@/lib/supabase/server"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { HeartbeatProvider } from "@/components/layout/heartbeat-provider"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getUserProfile()

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
