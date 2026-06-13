'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { isDemoMode, getDemoAgentWorkload } from '@/lib/demo-data'
import { measureClientAsync } from '@/lib/performance'
import { queryKeys } from './query-keys'

export interface AgentWorkloadStats {
  activeLeads: number
  enrolled: number
  totalAssigned: number
  newThisMonth: number
  overdueFollowUps: number
}

type AgentWorkloadRow = {
  agent_id: string | null
  active_leads: number | string | null
  enrolled_count: number | string | null
  total_assigned: number | string | null
  new_this_month: number | string | null
  overdue_followups: number | string | null
}

function num(value: number | string | null | undefined) {
  return Number(value ?? 0) || 0
}

/**
 * Fetches per-agent lead aggregates computed server-side against the full
 * leads table. Replaces the client-side fold over the 1k-sample `allLeads`
 * array, which silently hid agents whose assignments fell outside that window.
 */
export function useAgentWorkloadStats(options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true

  const { data, isLoading } = useQuery<Map<string, AgentWorkloadStats>>({
    queryKey: queryKeys.agentWorkloadStats.all,
    enabled,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    queryFn: async () => {
      const result = new Map<string, AgentWorkloadStats>()
      if (isDemoMode()) return getDemoAgentWorkload() as Map<string, AgentWorkloadStats>

      const supabase = createClient()
      const { data, error } = await measureClientAsync(
        'supabase.rpc.get_dashboard_agent_workload',
        async () => await supabase.rpc('get_dashboard_agent_workload'),
        { slowMs: 900, data: { surface: 'admin-dashboard' } }
      )

      if (error) {
        console.error('[useAgentWorkloadStats] RPC error:', error.message)
        return result
      }

      const rows = (data ?? []) as AgentWorkloadRow[]
      rows.forEach(r => {
        if (!r.agent_id) return
        result.set(r.agent_id, {
          activeLeads: num(r.active_leads),
          enrolled: num(r.enrolled_count),
          totalAssigned: num(r.total_assigned),
          newThisMonth: num(r.new_this_month),
          overdueFollowUps: num(r.overdue_followups),
        })
      })
      return result
    },
  })

  return {
    stats: data ?? new Map<string, AgentWorkloadStats>(),
    loading: !enabled || isLoading,
  }
}
