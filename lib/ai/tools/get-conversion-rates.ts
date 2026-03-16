import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { UserRole } from '@/types'

const FUNNEL_STAGES = ['new', 'contacted', 'visit', 'test', 'application', 'applicant', 'enrolled'] as const

export const getConversionRates = (supabase: SupabaseClient, user: User, role: UserRole) =>
  tool({
    description: 'Get funnel conversion rates showing how leads progress through pipeline stages. Shows the count and percentage at each stage.',
    inputSchema: z.object({
      dateFrom: z.string().optional().describe('Start date filter (ISO format)'),
      dateTo: z.string().optional().describe('End date filter (ISO format)'),
    }),
    execute: async ({ dateFrom, dateTo }) => {
      let query = supabase
        .from('leads')
        .select('pipeline_stage, completed_stages')

      if (role === 'agent') {
        query = query.eq('assigned_to', user.id)
      }
      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo)

      const { data, error } = await query

      if (error) return { error: error.message }
      if (!data || data.length === 0) return { funnel: [], total: 0 }

      const total = data.length

      const stageReached: Record<string, number> = {}
      for (const stage of FUNNEL_STAGES) {
        stageReached[stage] = 0
      }

      for (const lead of data) {
        const completed = (lead.completed_stages as string[] | null) || []
        const current = lead.pipeline_stage

        for (const stage of FUNNEL_STAGES) {
          if (completed.includes(stage) || current === stage) {
            stageReached[stage]++
          }
        }
      }

      const funnel = FUNNEL_STAGES.map((stage, i) => ({
        stage,
        count: stageReached[stage],
        percentOfTotal: total > 0 ? Math.round((stageReached[stage] / total) * 100) : 0,
        dropoffFromPrevious: i > 0 && stageReached[FUNNEL_STAGES[i - 1]] > 0
          ? Math.round(((stageReached[FUNNEL_STAGES[i - 1]] - stageReached[stage]) / stageReached[FUNNEL_STAGES[i - 1]]) * 100)
          : 0,
      }))

      return { funnel, total }
    },
  })
