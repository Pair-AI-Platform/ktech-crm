import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { UserRole } from '@/types'

export const getAgentPerformance = (supabase: SupabaseClient, user: User, role: UserRole) =>
  tool({
    description: 'Get agent performance metrics: total leads, enrolled count, conversion rate, and contact rate. Admin-only: shows all agents. Agents: shows only their own stats.',
    inputSchema: z.object({
      dateFrom: z.string().optional().describe('Start date filter (ISO format)'),
      dateTo: z.string().optional().describe('End date filter (ISO format)'),
      limit: z.number().optional().default(10).describe('Max number of agents to return'),
    }),
    execute: async ({ dateFrom, dateTo, limit }) => {
      let query = supabase
        .from('leads')
        .select('assigned_to, pipeline_stage, contact_status, created_at')

      if (role === 'agent') {
        query = query.eq('assigned_to', user.id)
      }
      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo)

      const { data: leads, error: leadsError } = await query

      if (leadsError) return { error: leadsError.message }
      if (!leads || leads.length === 0) return { agents: [], message: 'No leads found for this period' }

      const agentIds = [...new Set(leads.map(l => l.assigned_to).filter(Boolean))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', agentIds)

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || [])

      const agentStats: Record<string, { total: number; enrolled: number; contacted: number }> = {}
      for (const lead of leads) {
        const agentId = lead.assigned_to
        if (!agentId) continue

        if (!agentStats[agentId]) {
          agentStats[agentId] = { total: 0, enrolled: 0, contacted: 0 }
        }
        agentStats[agentId].total++
        if (lead.pipeline_stage === 'enrolled') agentStats[agentId].enrolled++
        if (lead.contact_status !== 'uncontacted') agentStats[agentId].contacted++
      }

      const agents = Object.entries(agentStats)
        .map(([agentId, stats]) => ({
          agentName: profileMap.get(agentId) || 'Unknown',
          totalLeads: stats.total,
          enrolled: stats.enrolled,
          conversionRate: stats.total > 0 ? Math.round((stats.enrolled / stats.total) * 100) : 0,
          contactRate: stats.total > 0 ? Math.round((stats.contacted / stats.total) * 100) : 0,
        }))
        .sort((a, b) => b.enrolled - a.enrolled)
        .slice(0, limit)

      return { agents }
    },
  })
