// Handoff layer for "Create Campaign from selected leads".
//
// Lead tables on /leads, /leads/archive, and /puc expose a Campaign action
// in their bulk-action bar. Clicking it stashes the selected leads here and
// routes the user to /campaigns?prefill=1, which on mount reads this back,
// clears it, and pre-fills the campaign wizard with those leads as the
// audience (audienceSource = "upload"). The wizard treats them as if they
// had been uploaded via CSV, so no new audience pipeline is needed.

import type { Lead } from "@/types"
import { getArabicLeadNameParts } from "@/lib/lead-name-policy"

export const CAMPAIGN_PREFILL_KEY = "campaign-prefill-contacts:v1"

export interface CampaignPrefillContact {
  leadId: string
  firstName: string
  lastName: string
  phone?: string
  email?: string
}

export interface CampaignPrefillPayload {
  origin: "leads" | "puc" | "archive"
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
  const { firstName, lastName } = getArabicLeadNameParts(lead)

  return {
    leadId: lead.id,
    firstName,
    lastName,
    phone: lead.phone || undefined,
    email: lead.email || undefined,
  }
}

/** Stash contacts in sessionStorage; safe no-op outside the browser. */
export function stashCampaignPrefill(payload: CampaignPrefillPayload): boolean {
  if (typeof window === "undefined") return false
  const serialized = JSON.stringify(payload)
  let saved = false

  try {
    sessionStorage.setItem(CAMPAIGN_PREFILL_KEY, serialized)
    saved = true
  } catch {}

  try {
    localStorage.setItem(CAMPAIGN_PREFILL_KEY, serialized)
    saved = true
  } catch {}

  return saved
}

export function openCampaignPrefill(payload: CampaignPrefillPayload): boolean {
  if (payload.contacts.length === 0) {
    if (typeof window !== "undefined") {
      window.alert("Select at least one lead with campaign contact details first.")
    }
    return false
  }

  const stashed = stashCampaignPrefill(payload)
  if (!stashed) {
    if (typeof window !== "undefined") {
      window.alert("Could not prepare the selected leads for a campaign. Please try again.")
    }
    return false
  }

  window.location.assign("/campaigns?prefill=1")
  return true
}

/** Read and clear the stashed payload. Returns null when nothing is staged. */
export function consumeCampaignPrefill(): CampaignPrefillPayload | null {
  if (typeof window === "undefined") return null
  try {
    const raw =
      sessionStorage.getItem(CAMPAIGN_PREFILL_KEY) ||
      localStorage.getItem(CAMPAIGN_PREFILL_KEY)
    if (!raw) return null
    sessionStorage.removeItem(CAMPAIGN_PREFILL_KEY)
    localStorage.removeItem(CAMPAIGN_PREFILL_KEY)
    const parsed = JSON.parse(raw) as CampaignPrefillPayload
    if (!parsed || !Array.isArray(parsed.contacts)) return null
    return parsed
  } catch {
    return null
  }
}
