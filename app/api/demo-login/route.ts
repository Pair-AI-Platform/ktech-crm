import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

const DEMO_PROFILES: Record<string, { full_name: string; role: string }> = {
  admin: { full_name: "Demo Admin", role: "admin" },
  agent: { full_name: "Khalifa", role: "agent" },
}

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { userId, role } = body

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
    console.error("[Demo Login] Profile update failed:", error.message)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
