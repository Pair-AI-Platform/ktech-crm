import { createServiceRoleClient } from "@/lib/supabase/server"

export type TokenValidationResult =
  | { ok: true; tokenId: string; leadId: string; submittedAt: string | null }
  | { ok: false; reason: "not_found" | "expired" | "civil_id_mismatch" }

/** Strip everything that isn't a digit. */
function normalizeDigits(input: string | null | undefined): string {
  return (input ?? "").replace(/\D+/g, "")
}

/**
 * Constant-time string equality. Falls back to a fixed-length scan
 * even when the operands differ in length so an attacker cannot use
 * response timing to learn how many digits of the stored phone they
 * guessed correctly.
 */
function constantTimeEqual(a: string, b: string): boolean {
  // If lengths differ we still want to spend roughly the same time, so
  // compare against `a` itself (guaranteed to be the same length) and
  // remember the length mismatch as an unconditional failure.
  const lenMismatch = a.length !== b.length
  const reference = lenMismatch ? a : b
  let diff = lenMismatch ? 1 : 0
  for (let i = 0; i < a.length; i++) {
    // No short-circuit: always XOR every character code.
    diff |= a.charCodeAt(i) ^ reference.charCodeAt(i)
  }
  return diff === 0
}

/**
 * Returns true if `candidate` matches `expected` as a Kuwaiti Civil ID.
 *
 * Both inputs are stripped of non-digit noise (spaces, dashes) and the
 * resulting digit strings are compared in full, in constant time so the
 * endpoint does not leak which prefix matched via response timing. A
 * Kuwaiti Civil ID is a fixed 12-digit number, so there is no country-code
 * canonicalisation to do — it is a straight whole-string comparison.
 *
 * Empty inputs never match.
 */
export function civilIdMatches(candidate: string | null | undefined, expected: string | null | undefined): boolean {
  const a = normalizeDigits(candidate)
  const b = normalizeDigits(expected)
  if (!a || !b) return false
  return constantTimeEqual(a, b)
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
 * Same as validatePspToken, but ALSO requires `civilId` to match the
 * lead row's `civil_id`. Used by the public self-service endpoints so the
 * token alone is not enough to read or mutate the lead — the student
 * proves possession of the link AND knowledge of the registered Civil ID.
 * The token still expires after 7 days; the Civil ID check is a
 * per-request gate, not a session.
 *
 * The match is a full-digit comparison (see `civilIdMatches`): the student
 * must supply the complete 12-digit Civil ID. Comparison runs in constant
 * time so the endpoint does not leak which prefix matched via response
 * timing, keeping it resistant to digit-by-digit brute force.
 *
 * Returns `civil_id_mismatch` (suggested HTTP 401) when the Civil ID is
 * missing or wrong. Falls through to the same `not_found` / `expired`
 * responses as `validatePspToken` for the token itself.
 */
export async function validatePspTokenWithCivilId(
  token: string,
  civilId: string | null | undefined,
): Promise<TokenValidationResult> {
  const tokenResult = await validatePspToken(token)
  if (!tokenResult.ok) return tokenResult

  const supabase = createServiceRoleClient()
  const { data: lead, error } = await supabase
    .from("leads")
    .select("civil_id")
    .eq("id", tokenResult.leadId)
    .single()

  if (error || !lead) {
    return { ok: false, reason: "not_found" }
  }

  if (!civilIdMatches(civilId, lead.civil_id)) {
    return { ok: false, reason: "civil_id_mismatch" }
  }

  return tokenResult
}
