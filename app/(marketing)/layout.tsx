export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getUserProfile } from "@/lib/supabase/server"
import { AppProviders } from "@/components/app-providers"
import { MarketingShell } from "@/components/marketing/marketing-shell"


export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getUserProfile()

  if (!profile) {
    redirect("/login")
  }

  // Only marketing users can access this portal
  if (profile.role !== "marketing") {
    redirect("/dashboard")
  }

  return (
    <AppProviders>
      <MarketingShell userName={profile.full_name}>
        {children}
      </MarketingShell>
    </AppProviders>
  )
}
