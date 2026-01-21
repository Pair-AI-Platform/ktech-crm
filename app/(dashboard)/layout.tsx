import { getUserProfile } from "@/lib/supabase/server"
import { DashboardShell } from "@/components/layout/dashboard-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getUserProfile()

  // For demo purposes, we'll allow access without auth
  // In production, uncomment the redirect
  // if (!profile) {
  //   redirect("/login")
  // }

  return (
    <DashboardShell user={profile}>
      {children}
    </DashboardShell>
  )
}
