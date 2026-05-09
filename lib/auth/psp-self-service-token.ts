import { createServiceRoleClient } from "@/lib/supabase/server"

export type TokenValidationResult =
  | { ok: true; tokenId: string; leadId: string; submittedAt: string | null }
  | { ok: false; reason: "not_found" | "expired" }

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
