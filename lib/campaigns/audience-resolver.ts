import type { SupabaseClient } from '@supabase/supabase-js'
import { getArabicLeadNameParts } from '@/lib/lead-name-policy'

export interface AudienceContact {
  first_name: string
  last_name: string
  phone: string | null
  email?: string | null
  lead_id: string
}

type AudienceLeadRow = {
  id: string
  first_name: string | null
  last_name: string | null
  first_name_ar?: string | null
  last_name_ar?: string | null
  phone: string | null
  email?: string | null
}

type FilterKey =
  | 'new_leads_30'
  | 'new_leads_7'
  | 'no_contact'
  | 'callback_requested'
  | 'upcoming_appointments'
  | 'outstanding_payments'
  | 'previous_students'

const FILTER_LABELS: Record<FilterKey, string> = {
  new_leads_30: 'New leads from last 30 days',
  new_leads_7: 'New leads from last 7 days',
  no_contact: 'Leads never contacted',
  callback_requested: 'Callback requested',
  upcoming_appointments: 'Leads with upcoming appointments',
  outstanding_payments: 'Enrolled students (outstanding payments)',
  previous_students: 'Previous students (withdrawn/lost)',
}

export function getFilterLabels() {
  return FILTER_LABELS
}

export async function resolveFilterAudience(
  supabase: SupabaseClient,
  filterKey: string
): Promise<AudienceContact[]> {
  switch (filterKey) {
    case 'new_leads_30': {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const { data } = await supabase
        .from('leads')
        .select('id, first_name, last_name, first_name_ar, last_name_ar, phone, email')
        .gte('created_at', thirtyDaysAgo)
        .not('phone', 'is', null)
        .limit(1000)
      return mapLeads(data)
    }

    case 'new_leads_7': {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data } = await supabase
        .from('leads')
        .select('id, first_name, last_name, first_name_ar, last_name_ar, phone, email')
        .gte('created_at', sevenDaysAgo)
        .not('phone', 'is', null)
        .limit(1000)
      return mapLeads(data)
    }

    case 'no_contact': {
      const { data } = await supabase
        .from('leads')
        .select('id, first_name, last_name, first_name_ar, last_name_ar, phone, email')
        .not('phone', 'is', null)
        .or('contact_count.eq.0,contact_count.is.null,last_contacted_at.is.null')
        .limit(1000)
      return mapLeads(data)
    }

    case 'callback_requested': {
      const { data } = await supabase
        .from('leads')
        .select('id, first_name, last_name, first_name_ar, last_name_ar, phone, email')
        .eq('status', 'callback')
        .not('phone', 'is', null)
        .limit(1000)
      return mapLeads(data)
    }

    case 'upcoming_appointments': {
      const now = new Date().toISOString()
      const { data: appointments } = await supabase
        .from('appointments')
        .select('lead_id, leads(id, first_name, last_name, first_name_ar, last_name_ar, phone, email)')
        .gt('scheduled_date', now)
        .not('lead_id', 'is', null)
        .limit(1000)

      if (!appointments) return []
      const seen = new Set<string>()
      const contacts: AudienceContact[] = []
      for (const apt of appointments) {
        const lead = apt.leads as unknown as AudienceLeadRow | null
        if (lead && lead.phone && !seen.has(lead.id)) {
          const { firstName, lastName } = getArabicLeadNameParts(lead)
          seen.add(lead.id)
          contacts.push({
            first_name: firstName,
            last_name: lastName,
            phone: lead.phone,
            email: lead.email,
            lead_id: lead.id,
          })
        }
      }
      return contacts
    }

    case 'outstanding_payments': {
      const { data } = await supabase
        .from('leads')
        .select('id, first_name, last_name, first_name_ar, last_name_ar, phone, email')
        .in('pipeline_stage', ['enrolled'])
        .not('phone', 'is', null)
        .limit(1000)
      return mapLeads(data)
    }

    case 'previous_students': {
      const { data } = await supabase
        .from('leads')
        .select('id, first_name, last_name, first_name_ar, last_name_ar, phone, email')
        .in('pipeline_stage', ['withdraw', 'lost'])
        .not('phone', 'is', null)
        .limit(1000)
      return mapLeads(data)
    }

    default:
      return []
  }
}

export async function getFilterCounts(
  supabase: SupabaseClient
): Promise<Record<string, number>> {
  const filterKeys: FilterKey[] = [
    'new_leads_30',
    'new_leads_7',
    'no_contact',
    'callback_requested',
    'upcoming_appointments',
    'outstanding_payments',
    'previous_students',
  ]

  const counts: Record<string, number> = {}

  // Run all count queries in parallel
  const results = await Promise.all(
    filterKeys.map(async (key) => {
      const contacts = await resolveFilterAudience(supabase, key)
      return { key, count: contacts.length }
    })
  )

  for (const { key, count } of results) {
    counts[key] = count
  }

  return counts
}

function mapLeads(
  data: AudienceLeadRow[] | null
): AudienceContact[] {
  if (!data) return []
  return data.map((lead) => {
    const { firstName, lastName } = getArabicLeadNameParts(lead)
    return {
      first_name: firstName,
      last_name: lastName,
      phone: lead.phone,
      email: lead.email,
      lead_id: lead.id,
    }
  })
}
