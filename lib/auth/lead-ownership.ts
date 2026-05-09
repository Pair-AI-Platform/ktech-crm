import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { UserRole } from "@/types"

interface CallerIdentity {
  userId: string
  role: UserRole | undefined
}

/**
 * Defense-in-depth ownership check for routes that act on a lead identified
 * by request input. Returns null if the caller is allowed (admin OR the
 * lead's assigned agent). Returns a 404 NextResponse otherwise.
 *
 * 404 (not 403) is intentional: do not leak whether the lead exists to
 * non-owners.
 *
 * Layers on top of leads_select_policy. Use this in every route that
 * trusts a `leadId` parameter from the request before mutating or sending
 * messages on behalf of that lead.
 *
 * Accepts the caller as `{ userId, role }` so the same helper works with
 * both `withApiHandler` (which exposes `user` + `profile.role`) and routes
 * that resolve user/profile manually.
 */
export async function requireLeadOwnership(
  supabase: SupabaseClient,
  caller: CallerIdentity,
  leadId: string,
): Promise<NextResponse | null> {
  if (!leadId) {
    return NextResponse.json({ error: "Lead ID is required" }, { status: 400 })
  }
  if (caller.role === "admin") return null

  const { data, error } = await supabase
    .from("leads")
    .select("assigned_to")
    .eq("id", leadId)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }
  if (!caller.userId || data.assigned_to !== caller.userId) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }
  return null
}
