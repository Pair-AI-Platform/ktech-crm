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

      // Defense-in-depth: scope to own-lead payments at the query layer for
      // agents, on top of payment_transactions RLS. Pulling org-wide rows
      // and filtering in JS leaks data via aggregation tools even if the
      // JS filter strips the lines.
      if (role === 'agent') {
        const { data: ownLeads, error: leadsErr } = await supabase
          .from('leads')
          .select('id')
          .eq('assigned_to', user.id)

        if (leadsErr) return { error: leadsErr.message }
        const ownLeadIds = (ownLeads ?? []).map(l => l.id)
        if (ownLeadIds.length === 0) {
          return { totalRevenue: 0, count: 0, averageAmount: 0, statusBreakdown: [] }
        }
        query = query.in('lead_id', ownLeadIds)
      }

      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo)
      if (status) query = query.eq('status', status)

      const { data, error } = await query

      if (error) return { error: error.message }
      if (!data || data.length === 0) return { totalRevenue: 0, count: 0, averageAmount: 0, statusBreakdown: [] }

      const totalRevenue = data.reduce((sum, p) => sum + (p.amount || 0), 0)

      const statusCounts: Record<string, { count: number; amount: number }> = {}
      for (const payment of data) {
        const s = payment.status || 'unknown'
        if (!statusCounts[s]) statusCounts[s] = { count: 0, amount: 0 }
        statusCounts[s].count++
        statusCounts[s].amount += payment.amount || 0
      }

      const statusBreakdown = Object.entries(statusCounts)
        .map(([s, d]) => ({ status: s, ...d }))

      return {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        count: data.length,
        averageAmount: data.length > 0 ? Math.round((totalRevenue / data.length) * 100) / 100 : 0,
        statusBreakdown,
      }
    },
  })
