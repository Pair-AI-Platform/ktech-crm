import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { UserRole } from '@/types'

export const getPaymentSummary = (supabase: SupabaseClient, user: User, role: UserRole) =>
  tool({
    description: 'Get payment/revenue summary from payment_transactions table. Shows total revenue, payment counts by status, and average transaction amount.',
    inputSchema: z.object({
      dateFrom: z.string().optional().describe('Start date filter (ISO format)'),
      dateTo: z.string().optional().describe('End date filter (ISO format)'),
      status: z.string().optional().describe('Filter by payment status'),
    }),
    execute: async ({ dateFrom, dateTo, status }) => {
      let query = supabase
        .from('payment_transactions')
        .select('id, amount, status, payment_method, created_at, lead_id')

      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo)
      if (status) query = query.eq('status', status)

      const { data, error } = await query

      if (error) return { error: error.message }
      if (!data || data.length === 0) return { totalRevenue: 0, count: 0, statusBreakdown: [] }

      let filteredData = data
      if (role === 'agent') {
        const leadIds = data.map(p => p.lead_id).filter(Boolean)
        if (leadIds.length > 0) {
          const { data: leads } = await supabase
            .from('leads')
            .select('id')
            .in('id', leadIds)
            .eq('assigned_to', user.id)

          const ownLeadIds = new Set(leads?.map(l => l.id) || [])
          filteredData = data.filter(p => p.lead_id && ownLeadIds.has(p.lead_id))
        }
      }

      const totalRevenue = filteredData.reduce((sum, p) => sum + (p.amount || 0), 0)

      const statusCounts: Record<string, { count: number; amount: number }> = {}
      for (const payment of filteredData) {
        const s = payment.status || 'unknown'
        if (!statusCounts[s]) statusCounts[s] = { count: 0, amount: 0 }
        statusCounts[s].count++
        statusCounts[s].amount += payment.amount || 0
      }

      const statusBreakdown = Object.entries(statusCounts)
        .map(([s, d]) => ({ status: s, ...d }))

      return {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        count: filteredData.length,
        averageAmount: filteredData.length > 0 ? Math.round((totalRevenue / filteredData.length) * 100) / 100 : 0,
        statusBreakdown,
      }
    },
  })
