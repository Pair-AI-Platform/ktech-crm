'use client'

import { useEffect, useMemo, useState } from 'react'
import type { DashboardLead } from './use-dashboard-stats'

const TERMINAL_STAGES = ['lost', 'enrolled', 'withdraw']
const STUCK_STAGES = ['contacted', 'test', 'application']

const DAY_MS = 24 * 60 * 60 * 1000

interface StaleByAgent {
  agentId: string
  agentName: string
  count: number
  leads: DashboardLead[]
}

/**
 * Pure client-side computation (no DB query) that categorises leads into
 * three "attention needed" buckets:
 *
 * 1. No contact in 5+ days — grouped by assigned agent
 * 2. Unassigned — not in terminal stages
 * 3. Stuck in stage — no update for 7+ days in contacted/test/application
 */
export function useStaleLeads(
  allLeads: DashboardLead[],
  agents: Array<{ id: string; full_name: string }>
) {
  const [now, setNow] = useState(0)

  useEffect(() => {
    const initialTimer = window.setTimeout(() => setNow(Date.now()), 0)
    const interval = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => {
      window.clearTimeout(initialTimer)
      window.clearInterval(interval)
    }
  }, [])

  const agentMap = useMemo(
    () => new Map(agents.map((a) => [a.id, a.full_name])),
    [agents]
  )

  const staleByAgent = useMemo(() => {
    const threshold = now - 5 * DAY_MS

    const grouped = new Map<string, DashboardLead[]>()

    for (const lead of allLeads) {
      if (TERMINAL_STAGES.includes(lead.pipeline_stage)) continue
      if (!lead.assigned_to) continue
      if (!lead.last_contacted_at) continue

      const contactedAt = new Date(lead.last_contacted_at).getTime()
      if (contactedAt > threshold) continue

      const existing = grouped.get(lead.assigned_to) ?? []
      existing.push(lead)
      grouped.set(lead.assigned_to, existing)
    }

    const result: StaleByAgent[] = []
    for (const [agentId, leads] of grouped) {
      result.push({
        agentId,
        agentName: agentMap.get(agentId) ?? 'Unknown',
        count: leads.length,
        leads,
      })
    }

    return result.sort((a, b) => b.count - a.count)
  }, [allLeads, agentMap, now])

  const unassignedCount = useMemo(() => {
    return allLeads.filter(
      (l) => !l.assigned_to && !TERMINAL_STAGES.includes(l.pipeline_stage)
    ).length
  }, [allLeads, now])

  const stuckLeads = useMemo(() => {
    const threshold = now - 7 * DAY_MS

    return allLeads.filter((l) => {
      if (!STUCK_STAGES.includes(l.pipeline_stage)) return false
      const updatedAt = new Date(l.updated_at).getTime()
      return updatedAt < threshold
    })
  }, [allLeads])

  return { staleByAgent, unassignedCount, stuckLeads }
}
