import { Suspense } from "react"
import { getUserProfile } from "@/lib/supabase/server"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { HeartbeatProvider } from "@/components/layout/heartbeat-provider"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getUserProfile()

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
