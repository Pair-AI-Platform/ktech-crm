import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { requireDemoMode, getDemoCredentials } from "@/lib/demo-mode"

export async function POST() {
  const gateResponse = requireDemoMode()
  if (gateResponse) return gateResponse

  const adminCreds = getDemoCredentials("admin")
  const agentCreds = getDemoCredentials("agent")
  if (!adminCreds || !agentCreds) {
    return NextResponse.json(
      { error: "Demo credentials not configured (DEMO_ADMIN_PASSWORD / DEMO_AGENT_PASSWORD)" },
      { status: 503 },
    )
  }

  const demoUsers = [
    { ...adminCreds, role: "admin" as const },
    { ...agentCreds, role: "agent" as const },
  ]

  const supabase = createServiceRoleClient()
  const results = []

  for (const user of demoUsers) {
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existing = existingUsers?.users?.find((u) => u.email === user.email)

    let userId: string

    if (existing) {
      await supabase.auth.admin.updateUserById(existing.id, {
        password: user.password,
      })
      userId = existing.id
      results.push({ email: user.email, status: "updated" })
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      })

      if (error) {
        console.error(`[Setup Demo] Failed to create user ${user.email}:`, error.message)
        results.push({ email: user.email, status: "error", error: "Failed to create user" })
        continue
      }
      userId = data.user.id
      results.push({ email: user.email, status: "created" })
    }

    await supabase.from("profiles").upsert({
      id: userId,
      full_name: user.full_name,
      role: user.role,
    }, { onConflict: "id" })
  }

  return NextResponse.json({ results })
}
