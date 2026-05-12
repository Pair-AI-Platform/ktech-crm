import { NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { validatePspTokenWithPhone } from "@/lib/auth/psp-self-service-token"

/**
 * Public endpoint: returns the editable PSP form state for a token holder.
 * Requires the lead's phone number as a per-request password.
 *
 * 400 — token missing
 * 401 — phone missing or doesn't match the lead's phone
 * 404 — token unknown or tampered
 * 410 — token expired
 */
export async function GET(request: NextRequest) {
  const logger = createLogger("psp-self-service-details")
  const token = request.nextUrl.searchParams.get("token")
  const phone = request.nextUrl.searchParams.get("phone")

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

  const result = await validatePspTokenWithPhone(token, phone)
  if (!result.ok) {
    const status =
      result.reason === "expired" ? 410 :
      result.reason === "phone_mismatch" ? 401 :
      404
    return NextResponse.json({ error: result.reason }, { status })
  }

  const supabase = createServiceRoleClient()

  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select(
      "id, first_name, last_name, first_name_ar, last_name_ar, civil_id, phone, phone_secondary, email, date_of_birth, school_id, graduation_year, gpa_grade_11, education_type, is_diplomatic, is_special_needs, funding_type",
    )
    .eq("id", result.leadId)
    .single()

  if (leadErr || !lead) {
    logger.error("Lead vanished for valid token", { tokenId: result.tokenId })
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }

  const { data: documents } = await supabase
    .from("psp_documents")
    .select("id, document_type, graduate_type, file_name, public_url, is_verified, uploaded_at, expiration_date")
    .eq("lead_id", result.leadId)

  return NextResponse.json({
    lead,
    documents: documents ?? [],
    submitted_at: result.submittedAt,
  })
}
