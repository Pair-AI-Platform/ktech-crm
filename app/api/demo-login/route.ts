import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

const DEMO_USERS = {
  admin: {
    email: "demo-admin@ktech.edu.kw",
    password: "demo-admin-2026!",
    full_name: "Demo Admin",
    role: "admin",
  },
  agent: {
    email: "demo-agent@ktech.edu.kw",
    password: "demo-agent-2026!",
    full_name: "Khalifa",
    role: "agent",
  },
} as const

type DemoRole = keyof typeof DEMO_USERS

export async function POST(request: Request) {
  let body: { role?: DemoRole; userId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { role, userId } = body
  if (!role || !DEMO_USERS[role]) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  const demo = DEMO_USERS[role]
  const supabase = createServiceRoleClient()

  if (userId) {
    const { error } = await supabase
      .from("profiles")
      .update({ role: demo.role, full_name: demo.full_name })
      .eq("id", userId)
    if (error) {
      console.error("[Demo Login] Profile update failed:", error.message)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  }

  let existingUserId: string | null = null
  let page = 1
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) {
      console.error("[Demo Login] listUsers failed:", error.message)
      return NextResponse.json({ error: "Failed to query users" }, { status: 500 })
    }
    const match = data.users.find((u) => u.email?.toLowerCase() === demo.email.toLowerCase())
    if (match) {
      existingUserId = match.id
      break
    }
    if (data.users.length < 1000) break
    page += 1
  }

  if (existingUserId) {
    const { error: updateErr } = await supabase.auth.admin.updateUserById(existingUserId, {
      password: demo.password,
      email_confirm: true,
    })
    if (updateErr) {
      console.error("[Demo Login] updateUserById failed:", updateErr.message)
      return NextResponse.json({ error: "Failed to update demo user" }, { status: 500 })
    }
  } else {
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: demo.email,
      password: demo.password,
      email_confirm: true,
      user_metadata: { full_name: demo.full_name },
    })
    if (createErr || !created.user) {
      console.error("[Demo Login] createUser failed:", createErr?.message)
      return NextResponse.json({ error: "Failed to create demo user" }, { status: 500 })
    }
    existingUserId = created.user.id
  }

  const { error: upsertErr } = await supabase
    .from("profiles")
    .upsert(
      { id: existingUserId, role: demo.role, full_name: demo.full_name, email: demo.email },
      { onConflict: "id" },
    )
  if (upsertErr) {
    console.error("[Demo Login] profile upsert failed:", upsertErr.message)
    return NextResponse.json({ error: "Failed to upsert profile" }, { status: 500 })
  }

  return NextResponse.json({ success: true, provisioned: true })
}
