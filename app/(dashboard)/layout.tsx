export const dynamic = "force-dynamic"

import { Suspense } from "react";
import { AppProviders } from "@/components/app-providers";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { HeartbeatProvider } from "@/components/layout/heartbeat-provider";
import DashboardLayoutClient from "./layout-client";
import { UserProfileProvider } from "@/lib/hooks/use-user";


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The profile logic is removed as it will be handled by the auth context
  const profile = {
    id: "1",
    email: "test@test.com",
    full_name: "Test User",
    role: "agent" as const,
    is_active: true,
    monthly_target: 50,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <Suspense>
      <AppProviders>
        <UserProfileProvider profile={profile}>
          <DashboardLayoutClient>
            <DashboardShell user={profile}>
              <HeartbeatProvider>{children}</HeartbeatProvider>
            </DashboardShell>
          </DashboardLayoutClient>
        </UserProfileProvider>
      </AppProviders>
    </Suspense>
  );
}
