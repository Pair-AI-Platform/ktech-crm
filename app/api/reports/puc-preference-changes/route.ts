import { withApiHandler } from '@/lib/api-handler'
import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export const GET = withApiHandler(
  { context: 'get-puc-preference-changes', roles: ['admin'] },
  async ({ req }) => {
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'start_date and end_date are required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Query audit_logs for leads with intended_major or preferred_major changes.
    // changed_fields is a TEXT[]; old/new live in old_values / new_values JSONB.
    const { data: auditLogs, error } = await supabase
      .from('audit_logs')
      .select('id, record_id, user_id, changed_fields, old_values, new_values, created_at')
      .eq('table_name', 'leads')
      .eq('action', 'UPDATE')
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Filter for preference changes client-side (Supabase doesn't support JSONB array element filtering easily)
    const preferenceFields = ['intended_major', 'preferred_major']
    const changes: Array<{
      id: string
      leadId: string
      field: string
      oldValue: string | null
      newValue: string | null
      changedAt: string
      changedBy: string | null
    }> = []

    for (const log of auditLogs || []) {
      const changedFields = log.changed_fields as string[] | null
      if (!changedFields || !Array.isArray(changedFields)) continue
      const oldValues = (log.old_values || {}) as Record<string, unknown>
      const newValues = (log.new_values || {}) as Record<string, unknown>

      for (const field of changedFields) {
        if (preferenceFields.includes(field)) {
          const oldVal = oldValues[field]
          const newVal = newValues[field]
          changes.push({
            id: log.id,
            leadId: log.record_id,
            field,
            oldValue: oldVal != null ? String(oldVal).replace(/^"|"$/g, '') : null,
            newValue: newVal != null ? String(newVal).replace(/^"|"$/g, '') : null,
            changedAt: log.created_at,
            changedBy: log.user_id,
          })
        }
      }
    }

    if (changes.length === 0) {
      return NextResponse.json([])
    }

    // Fetch lead names and agent names in batch
    const leadIds = [...new Set(changes.map(c => c.leadId))]
    const userIds = [...new Set(changes.map(c => c.changedBy).filter(Boolean))] as string[]

    const [leadsResult, profilesResult] = await Promise.all([
      supabase
        .from('leads')
        .select('id, first_name_en, last_name_en, first_name_ar, last_name_ar, funding_type')
        .in('id', leadIds),
      userIds.length > 0
        ? supabase.from('profiles').select('id, full_name').in('id', userIds)
        : Promise.resolve({ data: [], error: null }),
    ])

    const leadsMap = new Map(
      (leadsResult.data || []).map(l => [l.id, l])
    )
    const profilesMap = new Map(
      (profilesResult.data || []).map(p => [p.id, p.full_name])
    )

    // Only return changes for PUC leads
    const result = changes
      .filter(c => {
        const lead = leadsMap.get(c.leadId)
        return lead?.funding_type === 'puc'
      })
      .map(c => {
        const lead = leadsMap.get(c.leadId)
        const leadName = lead
          ? `${lead.first_name_en || lead.first_name_ar || ''} ${lead.last_name_en || lead.last_name_ar || ''}`.trim()
          : 'Unknown'

        return {
          id: c.id,
          leadId: c.leadId,
          leadName,
          field: c.field,
          oldValue: c.oldValue,
          newValue: c.newValue,
          changedAt: c.changedAt,
          changedBy: c.changedBy,
          changedByName: c.changedBy ? profilesMap.get(c.changedBy) || 'Unknown' : 'System',
        }
      })

    return NextResponse.json(result)
  }
)
