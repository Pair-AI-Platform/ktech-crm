import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { requireDemoMode, getDemoCredentials } from "@/lib/demo-mode"


type SeedDemoUserResult = {
  email: string
  status: string
  error?: string
  role?: "admin" | "agent"
}

export async function POST(request: Request) {
  const gateResponse = requireDemoMode()
  if (gateResponse) return gateResponse

  // Authenticate via Bearer header rather than query string so the secret
  // does not end up in CDN/proxy access logs.
  const authHeader = request.headers.get("authorization") ?? ""
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 })
  }
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

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
  const results: SeedDemoUserResult[] = []

  for (const user of demoUsers) {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("full_name", user.full_name)
      .maybeSingle()

    if (existing) {
      await supabase
        .from("profiles")
        .update({ role: user.role, full_name: user.full_name })
        .eq("id", existing.id)
      results.push({ email: user.email, status: "updated" })
      continue
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    })

    if (authError) {
      results.push({ email: user.email, status: "error", error: "Failed to create user" })
      continue
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: authData.user.id,
        full_name: user.full_name,
        role: user.role,
      })

    if (profileError) {
      results.push({ email: user.email, status: "auth created, profile error" })
    } else {
      results.push({ email: user.email, status: "created", role: user.role })
    }
  }

  return NextResponse.json({ results })
}
