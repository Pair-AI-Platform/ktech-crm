'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from './query-keys'

export interface AgentStatusTotals {
  userId: string
  meetingSeconds: number
  breakSeconds: number
  breakCount: number
  meetingCount: number
}

/**
 * Aggregates today's agent status history into per-agent totals
 * (time in meeting, time on break). Open rows are counted up to now.
 */
export function useAgentStatusHistoryToday(enabled: boolean) {
  const supabase = createClient()

  return useQuery({
    queryKey: queryKeys.agentStatusHistory.today(),
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: async (): Promise<AgentStatusTotals[]> => {
      const dayStart = new Date()
      dayStart.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('agent_status_history')
        .select('user_id, status, started_at, ended_at')
        .gte('started_at', dayStart.toISOString())
        .in('status', ['meeting', 'break'])

      if (error) {
        // Table may not exist yet — degrade gracefully
        return []
      }

      const now = Date.now()
      const totals = new Map<string, AgentStatusTotals>()

      for (const row of data ?? []) {
        const start = new Date(row.started_at).getTime()
        const end = row.ended_at ? new Date(row.ended_at).getTime() : now
        const duration = Math.max(0, Math.floor((end - start) / 1000))

        const entry = totals.get(row.user_id) ?? {
          userId: row.user_id,
          meetingSeconds: 0,
          breakSeconds: 0,
          breakCount: 0,
          meetingCount: 0,
        }

        if (row.status === 'meeting') {
          entry.meetingSeconds += duration
          entry.meetingCount += 1
        } else if (row.status === 'break') {
          entry.breakSeconds += duration
          entry.breakCount += 1
        }
        totals.set(row.user_id, entry)
      }

      return [...totals.values()]
    },
  })
}
