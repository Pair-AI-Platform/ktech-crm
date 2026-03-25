import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

const DEMO_PROFILES: Record<string, { full_name: string; role: string }> = {
  admin: { full_name: "Demo Admin", role: "admin" },
  agent: { full_name: "Khalifa", role: "agent" },
}

export async function POST(request: Request) {
  const { userId, role } = await request.json()

  if (!userId || !role || !DEMO_PROFILES[role]) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const profile = DEMO_PROFILES[role]

  const { error } = await supabase
    .from("profiles")
    .update({ role: profile.role, full_name: profile.full_name })
    .eq("id", userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
