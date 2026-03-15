"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode, getDemoLeads } from "@/lib/demo-data"
import { queryKeys } from "./query-keys"
import type { PipelineStage } from "@/types"

export interface FunnelStage {
  stage: PipelineStage
  label: string
  count: number
  dropOff: number // percentage drop from previous stage
}

export interface FunnelData {
  stages: FunnelStage[]
  totalLeads: number
}

const FUNNEL_STAGES: { stage: PipelineStage; label: string }[] = [
  { stage: "new", label: "New Leads" },
  { stage: "contacted", label: "Contacted" },
  { stage: "visit", label: "Visit" },
  { stage: "test", label: "Test" },
  { stage: "application", label: "File" },
  { stage: "enrolled", label: "Enrolled" },
]

function buildFunnel(leads: { pipeline_stage: string }[]): FunnelStage[] {
  const stageCounts: Record<string, number> = {}

  // Count leads that have reached each stage (cumulative - leads at later stages count for earlier ones)
  const stageOrder = FUNNEL_STAGES.map((s) => s.stage)

  leads.forEach((lead) => {
    const currentIndex = stageOrder.indexOf(lead.pipeline_stage as PipelineStage)
    if (currentIndex === -1) return
    // Count this lead for its current stage
    stageCounts[lead.pipeline_stage] = (stageCounts[lead.pipeline_stage] || 0) + 1
  })

  // For the funnel, we want to show how many leads are at or past each stage
  const cumulativeCounts: number[] = []
  let running = 0
  for (let i = stageOrder.length - 1; i >= 0; i--) {
    running += stageCounts[stageOrder[i]] || 0
    cumulativeCounts[i] = running
  }

  return FUNNEL_STAGES.map((s, i) => {
    const count = cumulativeCounts[i] || 0
    const prevCount = i === 0 ? count : cumulativeCounts[i - 1] || 0
    const dropOff = prevCount > 0 ? Math.round(((prevCount - count) / prevCount) * 100) : 0
    return { ...s, count, dropOff }
  })
}

const EMPTY_DATA = {
  all: { stages: [] as FunnelStage[], totalLeads: 0 },
  puc: { stages: [] as FunnelStage[], totalLeads: 0 },
  selfFunded: { stages: [] as FunnelStage[], totalLeads: 0 },
}

export function useConversionFunnel(
  startDate: Date,
  endDate: Date,
  agentId?: string | null
) {
  const { data = EMPTY_DATA, isLoading: loading, refetch } = useQuery({
    queryKey: queryKeys.conversionFunnel.detail({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      agentId: agentId ?? null,
    }),
    queryFn: async () => {
      if (isDemoMode()) {
        let leads = getDemoLeads()

        // Date filter
        leads = leads.filter((l) => {
          const d = new Date(l.created_at)
          return d >= startDate && d <= endDate
        })

        if (agentId) {
          leads = leads.filter((l) => l.assigned_to === agentId)
        }

        const pucLeads = leads.filter((l) => l.funding_type === "puc")
        const sfLeads = leads.filter((l) => l.funding_type === "self_funded")

        return {
          all: { stages: buildFunnel(leads), totalLeads: leads.length },
          puc: { stages: buildFunnel(pucLeads), totalLeads: pucLeads.length },
          selfFunded: { stages: buildFunnel(sfLeads), totalLeads: sfLeads.length },
        }
      }

      const supabase = createClient()

      let query = supabase
        .from("leads")
        .select("pipeline_stage, funding_type")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())

      if (agentId) {
        query = query.eq("assigned_to", agentId)
      }

      const { data: leads, error } = await query
      if (error) throw new Error(error.message)

      const allLeads = leads || []
      const pucLeads = allLeads.filter((l) => l.funding_type === "puc")
      const sfLeads = allLeads.filter((l) => l.funding_type === "self_funded")

      return {
        all: { stages: buildFunnel(allLeads), totalLeads: allLeads.length },
        puc: { stages: buildFunnel(pucLeads), totalLeads: pucLeads.length },
        selfFunded: { stages: buildFunnel(sfLeads), totalLeads: sfLeads.length },
      }
    },
    staleTime: 60_000,
  })

  return { data, loading, refetch }
}
