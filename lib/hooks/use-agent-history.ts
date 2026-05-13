"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode } from "@/lib/demo-data"
import { queryKeys } from "./query-keys"
import type { PipelineStage } from "@/types"

export interface AgentHistory {
  totalLeads: number
  totalContacted: number
  enrolled: number
  lost: number
  applicants: number
  totalAppointments: number
  completedAppointments: number
  totalStudents: number
  memberSince: string | null
  byStage: Record<string, number>
}

const EMPTY_HISTORY: AgentHistory = {
  totalLeads: 0,
  totalContacted: 0,
  enrolled: 0,
  lost: 0,
  applicants: 0,
  totalAppointments: 0,
  completedAppointments: 0,
  totalStudents: 0,
  memberSince: null,
  byStage: {},
}

type AgentHistoryLeadRow = {
  pipeline_stage: PipelineStage | null
  last_contacted_at: string | null
}

type AgentHistoryAppointmentRow = {
  status: string | null
}

export function useAgentHistory(agentId?: string) {
  const { data: history = EMPTY_HISTORY, isLoading: loading } = useQuery({
    queryKey: agentId ? queryKeys.agentHistory.detail(agentId) : queryKeys.agentHistory.all,
    queryFn: async () => {
      if (!agentId) return EMPTY_HISTORY

      if (isDemoMode()) {
        return {
          totalLeads: 187,
          totalContacted: 142,
          enrolled: 34,
          lost: 48,
          applicants: 12,
          totalAppointments: 215,
          completedAppointments: 178,
          totalStudents: 34,
          memberSince: "2024-09-01T00:00:00Z",
          byStage: {
            new: 8,
            contacted: 15,
            visit: 6,
            test: 22,
            application: 42,
            applicant: 12,
            enrolled: 34,
            lost: 48,
          },
        } satisfies AgentHistory
      }

      const supabase = createClient()

      const [leadsRes, appointmentsRes, studentsRes, profileRes] = await Promise.all([
        supabase
          .from("leads")
          .select("pipeline_stage, last_contacted_at", { count: "exact" })
          .eq("assigned_to", agentId),
        supabase
          .from("appointments")
          .select("status", { count: "exact" })
          .eq("assigned_agent", agentId),
        supabase
          .from("students")
          .select("id", { count: "exact" })
          .eq("assigned_to", agentId),
        supabase
          .from("profiles")
          .select("created_at")
          .eq("id", agentId)
          .single(),
      ])

      // Count leads by stage
      const leads = (leadsRes.data ?? []) as AgentHistoryLeadRow[]
      const byStage: Record<string, number> = {}
      leads.forEach((l) => {
        const stage = l.pipeline_stage as string
        byStage[stage] = (byStage[stage] || 0) + 1
      })

      // Count appointments by status
      const appointments = (appointmentsRes.data ?? []) as AgentHistoryAppointmentRow[]
      const completedAppointments = appointments.filter(
        (a) => a.status === "completed"
      ).length

      return {
        totalLeads: leads.length,
        totalContacted: leads.filter(l => l.last_contacted_at != null).length,
        enrolled: byStage["enrolled"] || 0,
        lost: byStage["lost"] || 0,
        applicants: byStage["applicant"] || 0,
        totalAppointments: appointments.length,
        completedAppointments,
        totalStudents: studentsRes.count || 0,
        memberSince: profileRes.data?.created_at || null,
        byStage,
      } satisfies AgentHistory
    },
    enabled: !!agentId,
    staleTime: 60_000,
  })

  return { history, loading }
}
