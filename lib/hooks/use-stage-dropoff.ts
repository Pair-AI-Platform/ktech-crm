'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from './query-keys'
import { PIPELINE_STAGES } from '@/types'
import { isDemoMode } from '@/lib/demo-data'
import { useUser } from './use-user'

/**
 * Fetches leads that were lost and groups them by the stage they were
 * lost at, producing a ranked list of drop-off points in the pipeline.
 * Uses a server-side API route (service role) to bypass RLS and get
 * accurate org-wide drop-off data.
 */
export function useStageDropoff() {
  const { isAdmin } = useUser()

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.stageDropoff.all,
    queryFn: async () => {
      if (isDemoMode()) {
        return {
          hasStage: [
            ...Array(35).fill(null).map((_, i) => ({ id: `demo-c-${i}`, lost_at_stage: 'contacted' })),
            ...Array(25).fill(null).map((_, i) => ({ id: `demo-n-${i}`, lost_at_stage: 'new' })),
            ...Array(20).fill(null).map((_, i) => ({ id: `demo-v-${i}`, lost_at_stage: 'visit' })),
            ...Array(15).fill(null).map((_, i) => ({ id: `demo-t-${i}`, lost_at_stage: 'test' })),
            ...Array(10).fill(null).map((_, i) => ({ id: `demo-a-${i}`, lost_at_stage: 'application' })),
            ...Array(5).fill(null).map((_, i) => ({ id: `demo-d-${i}`, lost_at_stage: 'puc_document_submission' })),
            ...Array(5).fill(null).map((_, i) => ({ id: `demo-p-${i}`, lost_at_stage: 'puc_application_submission' })),
          ],
          activityRows: [],
        }
      }
      const res = await fetch('/api/dashboard/dropoff')
      if (!res.ok) throw new Error('Failed to fetch drop-off data')
      return res.json() as Promise<{
        hasStage: Array<{ id: string; lost_at_stage: string | null }>
        activityRows: Array<{ lead_id: string; metadata: Record<string, string> }>
      }>
    },
    enabled: isAdmin,
  })

  const stageLabels: Record<string, string> = {
    ...Object.fromEntries(PIPELINE_STAGES.map((s) => [s.value, s.label])),
    // Shorter labels for dashboard chart
    puc_document_submission: 'Document',
    puc_application_submission: 'Submission',
  }

  // Normalize old/variant stage values to canonical ones
  const stageAliases: Record<string, string> = {
    applied: 'applicant',
    document_submission: 'puc_document_submission',
    application_submission: 'puc_application_submission',
  }
  const normalize = (s: string) => stageAliases[s] ?? s

  const countMap = new Map<string, number>()

  // Count from lost_at_stage column
  for (const row of data?.hasStage ?? []) {
    const stage = normalize(row.lost_at_stage as string)
    countMap.set(stage, (countMap.get(stage) ?? 0) + 1)
  }

  // Count from activity logs (take the last stage_change to 'lost' per lead)
  const seenLeads = new Set<string>()
  for (const row of data?.activityRows ?? []) {
    if (seenLeads.has(row.lead_id)) continue
    const meta = row.metadata
    if (meta?.new_stage === 'lost' && meta?.old_stage) {
      seenLeads.add(row.lead_id)
      const stage = normalize(meta.old_stage)
      countMap.set(stage, (countMap.get(stage) ?? 0) + 1)
    }
  }

  // Order by pipeline funnel order, not by count
  const stageOrder = PIPELINE_STAGES.map(s => s.value)
  const dropoffData = Array.from(countMap.entries())
    .map(([stage, count]) => ({
      stage,
      count,
      label: stageLabels[stage] ?? stage,
    }))
    .sort((a, b) => {
      const ai = stageOrder.indexOf(a.stage as typeof stageOrder[number])
      const bi = stageOrder.indexOf(b.stage as typeof stageOrder[number])
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })

  return { dropoffData, loading: isLoading }
}