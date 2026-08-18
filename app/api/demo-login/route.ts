import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { requireDemoMode, getDemoCredentials } from "@/lib/demo-mode"


export async function POST(request: Request) {
  const gateResponse = requireDemoMode()
  if (gateResponse) return gateResponse

  let body: { role?: "admin" | "agent" }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const role = body.role
  if (role !== "admin" && role !== "agent") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  const demo = getDemoCredentials(role)
  if (!demo) {
    return NextResponse.json(
      { error: "Demo credentials not configured" },
      { status: 503 },
    )
  }

  const supabase = createServiceRoleClient()

  // Try to create the auth user. If the email already exists, look up the
  // existing user by email via admin.listUsers and reset its password.
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
        { error: "Failed to create demo user" },
        { status: 500 },
      )
    }

    const { data: list } = await supabase.auth.admin.listUsers()
    const existing = list?.users?.find((u) => u.email === demo.email)
    if (!existing) {
      return NextResponse.json({ error: "Failed to locate demo user" }, { status: 500 })
    }
    resolvedUserId = existing.id

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
      { id: resolvedUserId, role, full_name: demo.full_name },
      { onConflict: "id" },
    )
  if (upsertErr) {
    console.error("[Demo Login] profile upsert failed:", upsertErr.message)
    return NextResponse.json({ error: "Failed to upsert profile" }, { status: 500 })
  }

  return NextResponse.json({ success: true, provisioned: true })
}
