import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { UserRole } from '@/types'

export const getLeadStats = (supabase: SupabaseClient, user: User, role: UserRole) =>
  tool({
    description: 'Get lead statistics grouped by a chosen dimension: status, source, source_category, or pipeline_stage. Useful for understanding lead distribution.',
    inputSchema: z.object({
      groupBy: z.enum(['contact_status', 'source', 'source_category', 'pipeline_stage'])
        .describe('Dimension to group leads by'),
      dateFrom: z.string().optional().describe('Start date filter (ISO format)'),
      dateTo: z.string().optional().describe('End date filter (ISO format)'),
      pipelineStage: z.string().optional().describe('Filter by specific pipeline stage'),
    }),
    execute: async ({ groupBy, dateFrom, dateTo, pipelineStage }) => {
      let query = supabase
        .from('leads')
        .select(groupBy)

      if (role === 'agent') {
        query = query.eq('assigned_to', user.id)
      }
      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo)
      if (pipelineStage) query = query.eq('pipeline_stage', pipelineStage)

      const { data, error } = await query

      if (error) return { error: error.message }
      if (!data || data.length === 0) return { stats: [], total: 0 }

      const counts: Record<string, number> = {}
      for (const lead of data) {
        const value = (lead as Record<string, unknown>)[groupBy] as string || 'unknown'
        counts[value] = (counts[value] || 0) + 1
      }

      const stats = Object.entries(counts)
        .map(([value, count]) => ({ [groupBy]: value, count }))
        .sort((a, b) => b.count - a.count)

      return { stats, total: data.length, groupedBy: groupBy }
    },
  })
