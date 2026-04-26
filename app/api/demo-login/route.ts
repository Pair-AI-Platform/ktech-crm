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

  // Diagnostic: confirm service-role can reach the DB at all
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  const urlHost = (() => {
    try { return new URL(supabaseUrl).host } catch { return "<invalid>" }
  })()
  const probe = await supabase.from("profiles").select("id").limit(1)
  if (probe.error) {
    return NextResponse.json(
      {
        error: "Service role DB probe failed",
        detail: probe.error.message,
        urlHost,
        hasServiceRole,
        urlLength: supabaseUrl.length,
      },
      { status: 500 },
    )
  }

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

  // Try to create the auth user. If the email already exists, look up the
  // existing profile by full_name (which is unique for demo users) and reset
  // its password so signInWithPassword always succeeds.
  let resolvedUserId = ""
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email: demo.email,
    password: demo.password,
    email_confirm: true,
    user_metadata: { full_name: demo.full_name },
  })

  if (created?.user) {
    resolvedUserId = created.user.id
  } else if (createErr) {
    const msg = createErr.message?.toLowerCase() ?? ""
    const isDuplicate =
      msg.includes("already") ||
      msg.includes("exists") ||
      msg.includes("registered") ||
      msg.includes("duplicate")
    if (!isDuplicate) {
      console.error("[Demo Login] createUser failed:", createErr.message)
      return NextResponse.json(
        { error: "Failed to create demo user", detail: createErr.message },
        { status: 500 },
      )
    }

    const { data: existingProfile, error: lookupErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("full_name", demo.full_name)
      .maybeSingle()
    if (lookupErr || !existingProfile) {
      console.error("[Demo Login] profile lookup failed:", lookupErr?.message)
      return NextResponse.json({ error: "Failed to locate demo user" }, { status: 500 })
    }
    resolvedUserId = existingProfile.id

    const { error: updateErr } = await supabase.auth.admin.updateUserById(resolvedUserId, {
      password: demo.password,
      email_confirm: true,
    })
    if (updateErr) {
      console.error("[Demo Login] updateUserById failed:", updateErr.message)
      return NextResponse.json({ error: "Failed to refresh demo user" }, { status: 500 })
    }
  }

  if (!resolvedUserId) {
    return NextResponse.json({ error: "Failed to resolve demo user" }, { status: 500 })
  }

  const { error: upsertErr } = await supabase
    .from("profiles")
    .upsert(
      { id: resolvedUserId, role: demo.role, full_name: demo.full_name },
      { onConflict: "id" },
    )
  if (upsertErr) {
    console.error("[Demo Login] profile upsert failed:", upsertErr.message)
    return NextResponse.json({ error: "Failed to upsert profile" }, { status: 500 })
  }

  return NextResponse.json({ success: true, provisioned: true })
}
