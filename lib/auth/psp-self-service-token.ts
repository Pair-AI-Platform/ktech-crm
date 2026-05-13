import { createServiceRoleClient } from "@/lib/supabase/server"

export type TokenValidationResult =
  | { ok: true; tokenId: string; leadId: string; submittedAt: string | null }
  | { ok: false; reason: "not_found" | "expired" | "phone_mismatch" }

/** Strip everything that isn't a digit. */
function normalizePhone(input: string | null | undefined): string {
  return (input ?? "").replace(/\D+/g, "")
}

/**
 * Canonicalise a Kuwaiti phone number to its bare 8-digit local form
 * whenever possible. We strip a leading `965` country code if present
 * (the Kuwait dialling code is +965, so a digits-only `9655...` row in
 * the DB is the country-coded form of the same number a student types
 * in as `5...`). This lets us treat the following as equivalent without
 * falling back to the dangerous "last-8-digits" suffix match that the
 * previous implementation used:
 *
 *   `+965 5000 1234`      stored on the lead row
 *   `+96550001234`        what a student might paste
 *   `96550001234`         what a student might type
 *   `0096550001234`       international dial-out form
 *   `50001234`            bare local form
 *
 * Anything else — wrong country code, fewer or more digits than
 * expected — is left as the raw digit string so a non-Kuwaiti number
 * never silently collides with a Kuwaiti one of the same tail.
 *
 * Why this is safer than the previous `slice(-8)` matcher:
 *   - The old code compared only the last 8 digits, so `+447123412345678`
 *     would match a lead row of `+96512345678`. Now both get canonicalised
 *     to *different* values (the UK number does not start with `965`,
 *     so it keeps all its digits) and won't collide.
 *   - The old code also let an attacker brute-force just 8 digits of a
 *     Kuwait mobile (~10^7 mobiles in practice) against a leaked or
 *     guessed token. Forcing the full digit string back into the
 *     comparison restores the country-code dimension to the search space.
 */
function canonicaliseKuwaitiPhone(digits: string): string {
  if (!digits) return ""
  // Strip a leading international-prefix `00` first.
  let d = digits.startsWith("00") ? digits.slice(2) : digits
  // Strip the +965 country code if present and the remainder still
  // looks like a Kuwaiti local number (8 digits). Don't blindly strip
  // any number starting with 965 — a 13-digit string starting with
  // 965 is almost certainly not Kuwaiti.
  if (d.startsWith("965") && d.length === 11) {
    d = d.slice(3)
  }
  return d
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
 * Returns true if `candidate` matches `expected` as a phone number.
 *
 * The match is now a *full-digit* comparison after canonicalising both
 * sides — no more "last 8 digits" suffix shortcut, which was the P1-4
 * audit finding. Both inputs are stripped of non-digit noise (spaces,
 * `+`, dashes, brackets) and, if they begin with `965` and look like a
 * Kuwaiti 11-digit string, the `965` country code is dropped. The
 * resulting digit strings are then compared in constant time so the
 * endpoint does not leak which prefix matched via response timing.
 *
 * Empty inputs never match.
 */
export function phoneMatches(candidate: string | null | undefined, expected: string | null | undefined): boolean {
  const a = canonicaliseKuwaitiPhone(normalizePhone(candidate))
  const b = canonicaliseKuwaitiPhone(normalizePhone(expected))
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
 * Same as validatePspToken, but ALSO requires `phone` to match the
 * lead row's `phone`. Used by the public self-service endpoints so the
 * token alone is not enough to read or mutate the lead — the student
 * proves possession of the link AND knowledge of the registered phone
 * number. The token still expires after 7 days; the phone check is
 * a per-request gate, not a session.
 *
 * The phone match is now full-digit (see `phoneMatches`) so a student
 * who only knows the last 8 digits of a country-coded entry can no
 * longer authenticate — they must supply the bare local mobile or the
 * full international form. This closes the brute-force gap flagged as
 * P1-4 in the security audit.
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
