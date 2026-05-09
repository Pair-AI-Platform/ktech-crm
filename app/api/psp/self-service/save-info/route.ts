import { NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { validatePspToken } from "@/lib/auth/psp-self-service-token"

// Strict allow-list of fields a student may change via the public flow.
// Anything else in the payload is silently dropped so a malicious caller
// cannot write `funding_type`, `assigned_to`, `pipeline_stage`, etc.
const ALLOWED_FIELDS = new Set([
  "first_name",
  "last_name",
  "first_name_ar",
  "last_name_ar",
  "civil_id",
  "phone",
  "phone_secondary",
  "email",
  "date_of_birth",
  "school_id",
  "graduation_year",
  "gpa_grade_11",
  "education_type",
  "is_diplomatic",
  "is_special_needs",
])

export async function POST(request: NextRequest) {
  const logger = createLogger("psp-self-service-save-info")

  let body: { token?: string; updates?: Record<string, unknown> }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { token, updates } = body
  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 })
  }
  if (!updates || typeof updates !== "object") {
    return NextResponse.json({ error: "Updates payload is required" }, { status: 400 })
  }

  const rl = await rateLimit(`psp-self-service:${token}`, RATE_LIMITS["psp-self-service"])
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetIn / 1000)) } },
    )
  }

  const result = await validatePspToken(token)
  if (!result.ok) {
    const status = result.reason === "expired" ? 410 : 404
    return NextResponse.json({ error: result.reason }, { status })
  }

  const filtered: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(updates)) {
    if (ALLOWED_FIELDS.has(key)) filtered[key] = value
  }

  if (Object.keys(filtered).length === 0) {
    return NextResponse.json({ error: "No editable fields in payload" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const { error: updateErr } = await supabase
    .from("leads")
    .update(filtered)
    .eq("id", result.leadId)

  if (updateErr) {
    logger.error("Failed to apply student updates", { leadId: result.leadId, error: updateErr.message })
    return NextResponse.json({ error: "Failed to save changes" }, { status: 500 })
  }

  return NextResponse.json({ success: true, updated: Object.keys(filtered) })
}
