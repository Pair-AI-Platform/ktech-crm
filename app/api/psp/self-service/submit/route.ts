import { NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { validatePspToken } from "@/lib/auth/psp-self-service-token"

/**
 * Public endpoint: marks the token row as submitted and advances the
 * lead to the applicant stage with submission_substage='submissions'.
 *
 * Idempotent: re-submitting before token expiry just refreshes
 * submitted_at. The link stays editable until expires_at (per product
 * decision — students can amend their info up until the link dies).
 */
export async function POST(request: NextRequest) {
  const logger = createLogger("psp-self-service-submit")

  let body: { token?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { token } = body
  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 })
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

  const supabase = createServiceRoleClient()
  const nowIso = new Date().toISOString()

  const { error: tokenErr } = await supabase
    .from("psp_self_service_tokens")
    .update({ submitted_at: nowIso })
    .eq("id", result.tokenId)

  if (tokenErr) {
    logger.error("Failed to mark token submitted", { tokenId: result.tokenId, error: tokenErr.message })
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 })
  }

  const { error: leadErr } = await supabase
    .from("leads")
    .update({
      pipeline_stage: "applicant",
      submission_substage: "submissions",
      last_contacted_at: nowIso,
    })
    .eq("id", result.leadId)

  if (leadErr) {
    logger.error("Failed to advance lead stage on submit", { leadId: result.leadId, error: leadErr.message })
    return NextResponse.json({ error: "Failed to advance lead stage" }, { status: 500 })
  }

  await supabase.from("activities").insert({
    lead_id: result.leadId,
    activity_type: "psp_self_service_submitted",
    title: "PSP self-service submitted",
    description: "Student submitted PSP info and documents via self-service link.",
    metadata: { token_id: result.tokenId, submitted_at: nowIso },
  })

  return NextResponse.json({ success: true, submitted_at: nowIso })
}
