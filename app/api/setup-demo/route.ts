import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

const DEMO_USERS = [
  {
    email: "demo-admin@ktech.edu.kw",
    password: "demo-admin-2026!",
    full_name: "Demo Admin",
    role: "admin",
  },
  {
    email: "demo-agent@ktech.edu.kw",
    password: "demo-agent-2026!",
    full_name: "Khalifa",
    role: "agent",
  },
]

export async function POST() {
  const supabase = createServiceRoleClient()
  const results = []

  for (const user of DEMO_USERS) {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existing = existingUsers?.users?.find((u) => u.email === user.email)

    let userId: string

    if (existing) {
      // Update password in case it changed
      await supabase.auth.admin.updateUserById(existing.id, {
        password: user.password,
      })
      userId = existing.id
      results.push({ email: user.email, status: "updated" })
    } else {
      // Create new user
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      })

      if (error) {
        results.push({ email: user.email, status: "error", error: error.message })
        continue
      }
      userId = data.user.id
      results.push({ email: user.email, status: "created" })
    }

    // Upsert profile
    await supabase.from("profiles").upsert({
      id: userId,
      full_name: user.full_name,
      role: user.role,
    }, { onConflict: "id" })
  }

  return NextResponse.json({ results })
}
