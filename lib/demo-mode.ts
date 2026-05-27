import { NextResponse } from "next/server"

export function isDemoModeEnabled(): boolean {
  return process.env.DEMO_MODE_ENABLED === "true"
}

export function requireDemoMode(): NextResponse | null {
  if (isDemoModeEnabled()) return null
  return NextResponse.json({ error: "Not found" }, { status: 404 })
}

export function getDemoCredentials(role: "admin" | "agent"): { email: string; password: string; full_name: string } | null {
  if (!isDemoModeEnabled()) return null
  if (role === "admin") {
    const password = process.env.DEMO_ADMIN_PASSWORD
    if (!password) return null
    return { email: "demo-admin@ktech.edu.kw", password, full_name: "Demo Admin" }
  }
  const password = process.env.DEMO_AGENT_PASSWORD
  if (!password) return null
  return { email: "demo-agent@ktech.edu.kw", password, full_name: "Demo Agent" }
}
