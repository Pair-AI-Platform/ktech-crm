import type { Lead } from "@/types"

export interface MOECredentials {
  civilId: string
  seatNumber: string
}

export interface MOEFetchRequest {
  leadIds: string[]
}

export interface MOEFetchResult {
  leadId: string
  leadName: string
  civilId: string
  seatNumber: string
  success: boolean
  gpa?: number
  error?: string
}

export interface MOEFetchResponse {
  success: boolean
  results: MOEFetchResult[]
  summary: {
    total: number
    successful: number
    failed: number
  }
}

export interface MOEProgressCallback {
  (progress: {
    current: number
    total: number
    currentLead: string
    status: 'processing' | 'success' | 'error'
    error?: string
  }): void
}

export interface EligibleLead {
  id: string
  firstName: string
  lastName: string
  civilId: string
  seatNumber: string
}

export function isEligibleForMOEFetch(lead: Lead): lead is Lead & { civil_id: string; seat_number: string } {
  return !!(lead.civil_id && lead.seat_number)
}

export function getEligibleLeads(leads: Lead[]): EligibleLead[] {
  return leads
    .filter(isEligibleForMOEFetch)
    .map(lead => ({
      id: lead.id,
      firstName: lead.first_name,
      lastName: lead.last_name,
      civilId: lead.civil_id!,
      seatNumber: lead.seat_number!,
    }))
}
