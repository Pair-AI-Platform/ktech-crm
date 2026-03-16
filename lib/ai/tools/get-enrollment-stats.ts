import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { UserRole } from '@/types'

export const getEnrollmentStats = (supabase: SupabaseClient, user: User, role: UserRole) =>
  tool({
    description: 'Get enrollment statistics from the students table. Can group by agent, funding type, or gender.',
    inputSchema: z.object({
      groupBy: z.enum(['assigned_agent', 'funding_type', 'gender']).optional()
        .describe('Dimension to group enrollments by'),
      dateFrom: z.string().optional().describe('Start date filter (ISO format)'),
      dateTo: z.string().optional().describe('End date filter (ISO format)'),
    }),
    execute: async ({ groupBy, dateFrom, dateTo }) => {
      let query = supabase
        .from('students')
        .select('id, assigned_agent, funding_type, gender, created_at')

      if (role === 'agent') {
        query = query.eq('assigned_agent', user.id)
      }
      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo)

      const { data, error } = await query

      if (error) return { error: error.message }
      if (!data || data.length === 0) return { stats: [], total: 0 }

      if (!groupBy) {
        return { total: data.length }
      }

      const counts: Record<string, number> = {}
      for (const student of data) {
        const value = (student as Record<string, unknown>)[groupBy] as string || 'unknown'
        counts[value] = (counts[value] || 0) + 1
      }

      if (groupBy === 'assigned_agent') {
        const agentIds = Object.keys(counts).filter(id => id !== 'unknown')
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', agentIds)

        const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || [])
        const namedStats = Object.entries(counts).map(([agentId, count]) => ({
          agent: profileMap.get(agentId) || agentId,
          count,
        })).sort((a, b) => b.count - a.count)

        return { stats: namedStats, total: data.length, groupedBy: groupBy }
      }

      const stats = Object.entries(counts)
        .map(([value, count]) => ({ [groupBy]: value, count }))
        .sort((a, b) => b.count - a.count)

      return { stats, total: data.length, groupedBy: groupBy }
    },
  })
