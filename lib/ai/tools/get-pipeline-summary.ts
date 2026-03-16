import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { UserRole } from '@/types'

export const getPipelineSummary = (supabase: SupabaseClient, user: User, role: UserRole) =>
  tool({
    description: 'Get lead counts grouped by pipeline stage. Use this to understand the current pipeline distribution.',
    inputSchema: z.object({
      dateFrom: z.string().optional().describe('Start date filter (ISO format, e.g. 2025-01-01)'),
      dateTo: z.string().optional().describe('End date filter (ISO format)'),
    }),
    execute: async ({ dateFrom, dateTo }) => {
      let query = supabase
        .from('leads')
        .select('pipeline_stage')

      if (role === 'agent') {
        query = query.eq('assigned_to', user.id)
      }
      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo)

      const { data, error } = await query

      if (error) return { error: error.message }
      if (!data || data.length === 0) return { summary: [], total: 0 }

      const counts: Record<string, number> = {}
      for (const lead of data) {
        const stage = lead.pipeline_stage || 'unknown'
        counts[stage] = (counts[stage] || 0) + 1
      }

      const summary = Object.entries(counts)
        .map(([stage, count]) => ({ stage, count }))
        .sort((a, b) => b.count - a.count)

      return { summary, total: data.length }
    },
  })
