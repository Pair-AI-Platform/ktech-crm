import { NextResponse } from "next/server"
import crypto from "crypto"
import { withApiHandler } from "@/lib/api-handler"
import { requireLeadOwnership } from "@/lib/auth/lead-ownership"
import { createServiceRoleClient } from "@/lib/supabase/server"

const TOKEN_TTL_DAYS = 7

/**
 * Generates a new PSP self-service token for a lead and returns the public
 * URL the student can use. Rotates: any active token for the same lead has
 * its expires_at moved to NOW(), so a leaked old token dies immediately.
 *
 * Auth: admin or the lead's assigned agent.
 */
export const POST = withApiHandler(
  { context: "psp-self-service-generate" },
  async ({ req, supabase, user, profile, logger }) => {
    let body: { leadId?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const { leadId } = body
    if (!leadId) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 })
    }

    const ownershipBlock = await requireLeadOwnership(
      supabase,
      { userId: user.id, role: profile?.role },
      leadId,
    )
    if (ownershipBlock) return ownershipBlock

    // Service role for the rotate-and-insert: we want this to bypass RLS
    // so a non-admin agent can deactivate prior tokens for their lead.
    const service = createServiceRoleClient()

    const nowIso = new Date().toISOString()
    await service
      .from("psp_self_service_tokens")
      .update({ expires_at: nowIso })
      .eq("lead_id", leadId)
      .gt("expires_at", nowIso)

    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()

    const { error: insertErr } = await service
      .from("psp_self_service_tokens")
      .insert({
        token,
        lead_id: leadId,
        expires_at: expiresAt,
        created_by: user.id,
      })

    if (insertErr) {
      logger.error("Failed to insert PSP self-service token", { leadId, error: insertErr.message })
      return NextResponse.json({ error: "Failed to generate link" }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get("origin") || ""
    const url = `${baseUrl}/psp/${token}`

    logger.info("Generated PSP self-service link", { leadId, expiresAt })
    return NextResponse.json({ token, url, expires_at: expiresAt })
  },
)
