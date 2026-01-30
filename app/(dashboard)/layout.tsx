import { Suspense } from "react"
import { getUserProfile } from "@/lib/supabase/server"
import { DashboardShell } from "@/components/layout/dashboard-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getUserProfile()

  return (
    <Suspense>
      <DashboardShell user={profile}>
        {children}
      </DashboardShell>
    </Suspense>
  )
}
