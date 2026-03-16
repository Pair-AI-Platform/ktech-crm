import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

const DEMO_USERS = [
  {
    email: "demo-admin@ktech.edu.kw",
    password: "demo-admin-2026!",
    full_name: "Demo Admin",
    role: "admin" as const,
  },
  {
    email: "demo-agent@ktech.edu.kw",
    password: "demo-agent-2026!",
    full_name: "Demo Agent",
    role: "agent" as const,
  },
]

export async function POST(request: Request) {
  // Protect with a secret
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get("secret")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const results = []

  for (const user of DEMO_USERS) {
    // Check if user already exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("full_name", user.full_name)
      .maybeSingle()

    if (existing) {
      results.push({ email: user.email, status: "already exists" })
      continue
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    })

    if (authError) {
      results.push({ email: user.email, status: "error", error: authError.message })
      continue
    }

    // Create/update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: authData.user.id,
        full_name: user.full_name,
        role: user.role,
      })

    if (profileError) {
      results.push({ email: user.email, status: "auth created, profile error", error: profileError.message })
    } else {
      results.push({ email: user.email, status: "created", role: user.role })
    }
  }

  return NextResponse.json({ results })
}
