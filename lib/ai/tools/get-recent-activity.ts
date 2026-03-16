import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { UserRole } from '@/types'

export const getRecentActivity = (supabase: SupabaseClient, user: User, role: UserRole) =>
  tool({
    description: 'Get recently updated leads to see recent CRM activity. Returns the most recently modified leads with their current stage and status.',
    inputSchema: z.object({
      limit: z.number().optional().default(10).describe('Number of recent leads to return (max 20)'),
      pipelineStage: z.string().optional().describe('Filter by pipeline stage'),
    }),
    execute: async ({ limit, pipelineStage }) => {
      const safeLimit = Math.min(limit, 20)

      let query = supabase
        .from('leads')
        .select('id, full_name, pipeline_stage, contact_status, source, updated_at, assigned_to')
        .order('updated_at', { ascending: false })
        .limit(safeLimit)

      if (role === 'agent') {
        query = query.eq('assigned_to', user.id)
      }
      if (pipelineStage) query = query.eq('pipeline_stage', pipelineStage)

      const { data, error } = await query

      if (error) return { error: error.message }
      if (!data || data.length === 0) return { leads: [], message: 'No recent activity found' }

      let profileMap = new Map<string, string>()
      if (role === 'admin') {
        const agentIds = [...new Set(data.map(l => l.assigned_to).filter(Boolean))]
        if (agentIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', agentIds)
          profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || [])
        }
      }

      const leads = data.map(lead => ({
        name: lead.full_name,
        stage: lead.pipeline_stage,
        status: lead.contact_status,
        source: lead.source,
        updatedAt: lead.updated_at,
        ...(role === 'admin' && lead.assigned_to ? { agent: profileMap.get(lead.assigned_to) || 'Unassigned' } : {}),
      }))

      return { leads }
    },
  })
