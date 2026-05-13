// Handoff layer for "Create Campaign from selected leads".
//
// Lead tables on /leads, /leads/archive, and /puc-psp expose a Campaign action
// in their bulk-action bar. Clicking it stashes the selected leads here and
// routes the user to /campaigns?prefill=1, which on mount reads this back,
// clears it, and pre-fills the campaign wizard with those leads as the
// audience (audienceSource = "upload"). The wizard treats them as if they
// had been uploaded via CSV, so no new audience pipeline is needed.

import type { Lead } from "@/types"

export const CAMPAIGN_PREFILL_KEY = "campaign-prefill-contacts:v1"

export interface CampaignPrefillContact {
  leadId: string
  firstName: string
  lastName: string
  phone?: string
  email?: string
}

export interface CampaignPrefillPayload {
  origin: "leads" | "puc-psp" | "archive"
  contacts: CampaignPrefillContact[]
  createdAt: number
}

/** Pick the campaign-relevant fields off a Lead row. */
export function leadToPrefillContact(lead: Pick<Lead,
  | "id"
  | "first_name"
  | "last_name"
  | "first_name_ar"
  | "last_name_ar"
  | "phone"
  | "email"
>): CampaignPrefillContact {
  return {
    leadId: lead.id,
    firstName: lead.first_name_ar || lead.first_name || "",
    lastName: lead.last_name_ar || lead.last_name || "",
    phone: lead.phone || undefined,
    email: lead.email || undefined,
  }
}

/** Stash contacts in sessionStorage; safe no-op outside the browser. */
export function stashCampaignPrefill(payload: CampaignPrefillPayload): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(CAMPAIGN_PREFILL_KEY, JSON.stringify(payload))
  } catch {
    // sessionStorage can throw in private windows / when full; treat as no-op.
  }
}

/** Read and clear the stashed payload. Returns null when nothing is staged. */
export function consumeCampaignPrefill(): CampaignPrefillPayload | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(CAMPAIGN_PREFILL_KEY)
    if (!raw) return null
    sessionStorage.removeItem(CAMPAIGN_PREFILL_KEY)
    const parsed = JSON.parse(raw) as CampaignPrefillPayload
    if (!parsed || !Array.isArray(parsed.contacts)) return null
    return parsed
  } catch {
    return null
  }
}
