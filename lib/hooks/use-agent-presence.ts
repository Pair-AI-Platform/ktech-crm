'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
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

/**
 * Fetches all active agent profiles and derives their online/meeting/break/offline
 * status based on `last_activity_at` (heartbeat) and `manual_status`.
 */
export function useAgentPresence() {
  const supabase = createClient()

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.agentPresence.all,
    queryFn: async () => {
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
        return (fallback ?? []).map((p) => ({
          ...p,
          last_activity_at: null as string | null,
          manual_status: null as string | null,
        }))
      }

      return data
    },
    staleTime: 30_000,
    refetchInterval: 60_000, // Poll less frequently to reduce load
  })

  const agents: AgentPresenceInfo[] = (data ?? []).map((p) => ({
    id: p.id,
    name: p.full_name ?? 'Unknown',
    status: deriveStatus(p.last_activity_at, p.manual_status),
  }))

  return { agents, loading: isLoading }
}
