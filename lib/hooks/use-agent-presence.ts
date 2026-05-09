'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { isDemoMode, DEMO_AGENTS } from '@/lib/demo-data'
import { queryKeys } from './query-keys'

export type AgentStatus = 'online' | 'meeting' | 'break' | 'offline'

export interface AgentPresenceInfo {
  id: string
  name: string
  status: AgentStatus
}

function deriveStatus(
  lastActivityAt: string | null,
  manualStatus: string | null
): AgentStatus {
  // Manual status overrides heartbeat-derived status (only if agent is active)
  if (manualStatus === 'meeting' || manualStatus === 'break') {
    // Still check heartbeat — if truly offline (>15 min), show offline
    if (!lastActivityAt) return 'offline'
    const diffMs = Date.now() - new Date(lastActivityAt).getTime()
    const diffMin = diffMs / 60_000
    if (diffMin >= 15) return 'offline'
    return manualStatus
  }

  if (!lastActivityAt) return 'offline'

  const diffMs = Date.now() - new Date(lastActivityAt).getTime()
  const diffMin = diffMs / 60_000

  if (diffMin < 15) return 'online'
  return 'offline'
}

// Stable demo statuses keyed by agent id — keeps Team Status populated in demo mode
const DEMO_STATUS_CYCLE: AgentStatus[] = [
  'online', 'online', 'meeting', 'online', 'break',
  'online', 'meeting', 'offline', 'online', 'break',
  'online', 'offline', 'online',
]

interface PresenceRow {
  id: string
  full_name: string | null
  last_activity_at: string | null
  manual_status: string | null
  is_active: boolean | null
}

/**
 * Fetches all active agent profiles and derives their online/meeting/break/offline
 * status based on `last_activity_at` (heartbeat) and `manual_status`.
 */
export function useAgentPresence() {
  const supabase = createClient()

  const { data, isLoading } = useQuery<PresenceRow[]>({
    queryKey: queryKeys.agentPresence.all,
    queryFn: async (): Promise<PresenceRow[]> => {
      if (isDemoMode()) {
        return DEMO_AGENTS
          .filter((a) => a.is_active)
          .map((a, i) => ({
            id: a.id,
            full_name: a.full_name,
            last_activity_at: null,
            manual_status: DEMO_STATUS_CYCLE[i % DEMO_STATUS_CYCLE.length],
            is_active: true,
          }))
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, last_activity_at, manual_status, is_active')
        .neq('is_active', false)

      if (error) {
        // Column doesn't exist yet — fetch without it
        const { data: fallback, error: fbErr } = await supabase
          .from('profiles')
          .select('id, full_name, last_activity_at, is_active')
          .neq('is_active', false)
        if (fbErr) throw new Error(fbErr.message)
        type FallbackRow = { id: string; full_name: string | null; last_activity_at: string | null; is_active: boolean | null }
        return ((fallback ?? []) as FallbackRow[]).map((p): PresenceRow => ({
          id: p.id,
          full_name: p.full_name,
          last_activity_at: null,
          manual_status: null,
          is_active: p.is_active,
        }))
      }

      return (data ?? []) as PresenceRow[]
    },
    staleTime: 30_000,
    refetchInterval: 60_000, // Poll less frequently to reduce load
  })

  const inDemo = isDemoMode()
  const agents: AgentPresenceInfo[] = (data ?? []).map((p) => ({
    id: p.id,
    name: p.full_name ?? 'Unknown',
    status: inDemo
      ? ((p.manual_status as AgentStatus | null) ?? 'offline')
      : deriveStatus(p.last_activity_at, p.manual_status),
  }))

  return { agents, loading: isLoading }
}
