import { createServiceRoleClient } from "@/lib/supabase/server"

export type TokenValidationResult =
  | { ok: true; tokenId: string; leadId: string; submittedAt: string | null }
  | { ok: false; reason: "not_found" | "expired" | "phone_mismatch" }

/** Strip everything that isn't a digit. */
function normalizePhone(input: string | null | undefined): string {
  return (input ?? "").replace(/\D+/g, "")
}

/**
 * Returns true if `candidate` matches `expected` as a phone number.
 * Suffix-tolerant: matches when the last 8 digits agree, so a student
 * typing "12345678" matches a lead row of "+965 1234 5678" and vice
 * versa. Empty inputs never match.
 */
export function phoneMatches(candidate: string | null | undefined, expected: string | null | undefined): boolean {
  const a = normalizePhone(candidate)
  const b = normalizePhone(expected)
  if (!a || !b) return false
  if (a === b) return true
  const aTail = a.slice(-8)
  const bTail = b.slice(-8)
  return aTail.length === 8 && aTail === bTail
}

/**
 * Validates a PSP self-service token using service-role privileges.
 *
 * This is the gatekeeper for every public route under
 * `/api/psp/self-service/*`. Returns the lead id if the token exists and
 * has not expired. Records `last_accessed_at` on every successful read so
 * staff can see when the student last touched the form.
 *
 * Never echoes the raw token row to callers — only the minimum the route
 * needs to act.
 */
export async function validatePspToken(token: string): Promise<TokenValidationResult> {
  if (!token || typeof token !== "string" || token.length < 16) {
    return { ok: false, reason: "not_found" }
  }

  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from("psp_self_service_tokens")
    .select("id, lead_id, expires_at, submitted_at")
    .eq("token", token)
    .maybeSingle()

  if (error || !data) {
    return { ok: false, reason: "not_found" }
  }

  if (new Date(data.expires_at).getTime() <= Date.now()) {
    return { ok: false, reason: "expired" }
  }

  // Best-effort access timestamp; ignore errors so a transient write
  // failure does not block the student from using the link.
  await supabase
    .from("psp_self_service_tokens")
    .update({ last_accessed_at: new Date().toISOString() })
    .eq("id", data.id)

  return {
    ok: true,
    tokenId: data.id,
    leadId: data.lead_id,
    submittedAt: data.submitted_at,
  }
}

/**
 * Same as validatePspToken, but ALSO requires `phone` to match the
 * lead row's `phone`. Used by the public self-service endpoints so the
 * token alone is not enough to read or mutate the lead — the student
 * proves possession of the link AND knowledge of the registered phone
 * number. The token still expires after 7 days; the phone check is
 * a per-request gate, not a session.
 *
 * Returns `phone_mismatch` (suggested HTTP 401) when phone is missing
 * or wrong. Falls through to the same `not_found` / `expired`
 * responses as `validatePspToken` for the token itself.
 */
export async function validatePspTokenWithPhone(
  token: string,
  phone: string | null | undefined,
): Promise<TokenValidationResult> {
  const tokenResult = await validatePspToken(token)
  if (!tokenResult.ok) return tokenResult

  const supabase = createServiceRoleClient()
  const { data: lead, error } = await supabase
    .from("leads")
    .select("phone")
    .eq("id", tokenResult.leadId)
    .single()

  if (error || !lead) {
    return { ok: false, reason: "not_found" }
  }

  if (!phoneMatches(phone, lead.phone)) {
    return { ok: false, reason: "phone_mismatch" }
  }

  return tokenResult
}
