"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode, getDemoLeads, getDemoAppointments, DEMO_AGENTS } from "@/lib/demo-data"
import { queryKeys } from "@/lib/hooks/query-keys"
import { measureClientAsync } from "@/lib/performance"
import { toDateString } from "@/lib/utils"
import type { DashboardLead } from "@/lib/hooks/use-dashboard-stats"

export interface AdminPipelineCountRow {
  fundingType: string
  stage: string
  count: number
  percent: number
}

export interface AdminPipelineStageData {
  stage: string
  label: string
  count: number
  percent: number
  movesIn: number
  movesOut: number
}

export interface AdminSourcePerformanceRow {
  source: string
  total: number
  files: number
  conversionRate: number
}

export interface AdminAgentActivityStats {
  agentId: string
  todayChanges: number
  todayAppointments: number
  lastMonthFiles: number
}

export interface AdminPriorityLead {
  lead: DashboardLead
  reason: string
  urgency: "high" | "medium" | "low"
}

export interface AdminBirthdayLead {
  lead: {
    id: string
    first_name: string
    last_name: string
    first_name_ar?: string | null
    last_name_ar?: string | null
    date_of_birth: string | null
    phone?: string
    pipeline_stage: string
  }
  daysUntil: number
  isToday: boolean
}

export interface AdminDashboardOverview {
  pipelineCounts: AdminPipelineCountRow[]
  sfFunnelData: AdminPipelineStageData[]
  pucFunnelData: AdminPipelineStageData[]
  sourcePerformance: AdminSourcePerformanceRow[]
  agentActivity: AdminAgentActivityStats[]
  agentActivityByAgent: Map<string, AdminAgentActivityStats>
  priorityLeads: AdminPriorityLead[]
  birthdayLeads: AdminBirthdayLead[]
}

export interface AdminDashboardOverviewData {
  pipelineCounts: AdminPipelineCountRow[]
  sourcePerformance: AdminSourcePerformanceRow[]
  agentActivity: AdminAgentActivityStats[]
  priorityLeads: AdminPriorityLead[]
  birthdayLeads: AdminBirthdayLead[]
}

export const SF_STAGES = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "test", label: "Test" },
  { key: "application", label: "File" },
  { key: "applicant", label: "Applicant" },
  { key: "enrolled", label: "Enrolled" },
]

export const PUC_STAGES = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "visit", label: "Visit" },
  { key: "test", label: "Test" },
  { key: "application", label: "File" },
  { key: "puc_document_submission", label: "Documents" },
  { key: "puc_application_submission", label: "Submission" },
  { key: "applicant", label: "Applicant" },
  { key: "enrolled", label: "Enrolled" },
]

export const EMPTY_ADMIN_DASHBOARD_OVERVIEW_DATA: AdminDashboardOverviewData = {
  pipelineCounts: [],
  sourcePerformance: [],
  agentActivity: [],
  priorityLeads: [],
  birthdayLeads: [],
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function maybeStr(value: unknown): string | null {
  return typeof value === "string" ? value : null
}

function num(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function normalizeUrgency(value: unknown): "high" | "medium" | "low" {
  return value === "high" || value === "medium" || value === "low" ? value : "low"
}

function normalizeLead(value: unknown): DashboardLead {
  const row = isRecord(value) ? value : {}
  const contactStatus = maybeStr(row.contact_status) ?? maybeStr(row.status)
  const now = new Date(0).toISOString()

  return {
    id: str(row.id),
    first_name: str(row.first_name),
    last_name: str(row.last_name),
    first_name_ar: maybeStr(row.first_name_ar),
    last_name_ar: maybeStr(row.last_name_ar),
    phone: str(row.phone),
    pipeline_stage: str(row.pipeline_stage, "new"),
    contact_status: contactStatus,
    status: contactStatus,
    funding_type: maybeStr(row.funding_type),
    assigned_to: maybeStr(row.assigned_to),
    created_at: str(row.created_at, now),
    updated_at: str(row.updated_at, now),
    last_contacted_at: maybeStr(row.last_contacted_at),
    callback_date: maybeStr(row.callback_date),
    date_of_birth: maybeStr(row.date_of_birth),
    priority: maybeStr(row.priority),
    source: maybeStr(row.source),
  }
}

export function buildFunnelData(
  counts: AdminPipelineCountRow[],
  fundingType: string,
  stages: { key: string; label: string }[]
): AdminPipelineStageData[] {
  const byStage = new Map(
    counts
      .filter((row) => row.fundingType === fundingType)
      .map((row) => [row.stage, row.count])
  )
  const total = stages.reduce((sum, stage) => sum + (byStage.get(stage.key) ?? 0), 0)

  return stages.map((stage) => {
    const count = byStage.get(stage.key) ?? 0
    return {
      stage: stage.key,
      label: stage.label,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
      movesIn: 0,
      movesOut: 0,
    }
  })
}

export function normalizeOverview(raw: unknown): AdminDashboardOverviewData {
  if (!isRecord(raw)) return EMPTY_ADMIN_DASHBOARD_OVERVIEW_DATA

  const pipelineCounts = toArray(raw.pipeline_counts).map((item): AdminPipelineCountRow => {
    const row = isRecord(item) ? item : {}
    return {
      fundingType: str(row.funding_type),
      stage: str(row.stage),
      count: num(row.count),
      percent: num(row.percent),
    }
  }).filter((row) => row.fundingType && row.stage)

  const sourcePerformance = toArray(raw.source_performance).map((item): AdminSourcePerformanceRow => {
    const row = isRecord(item) ? item : {}
    return {
      source: str(row.source, "other"),
      total: num(row.total),
      files: num(row.files),
      conversionRate: num(row.conversion_rate),
    }
  })

  const agentActivity = toArray(raw.agent_activity).map((item): AdminAgentActivityStats => {
    const row = isRecord(item) ? item : {}
    return {
      agentId: str(row.agent_id),
      todayChanges: num(row.today_changes),
      todayAppointments: num(row.today_appointments),
      lastMonthFiles: num(row.last_month_files),
    }
  }).filter((row) => row.agentId)

  const priorityLeads = toArray(raw.priority_leads).map((item): AdminPriorityLead => {
    const row = isRecord(item) ? item : {}
    return {
      lead: normalizeLead(row.lead),
      reason: str(row.reason),
      urgency: normalizeUrgency(row.urgency),
    }
  }).filter((item) => item.lead.id)

  const birthdayLeads = toArray(raw.birthday_leads).map((item): AdminBirthdayLead => {
    const row = isRecord(item) ? item : {}
    const leadRow = isRecord(row.lead) ? row.lead : {}
    return {
      lead: {
        id: str(leadRow.id),
        first_name: str(leadRow.first_name),
        last_name: str(leadRow.last_name),
        first_name_ar: maybeStr(leadRow.first_name_ar),
        last_name_ar: maybeStr(leadRow.last_name_ar),
        date_of_birth: maybeStr(leadRow.date_of_birth),
        phone: maybeStr(leadRow.phone) ?? undefined,
        pipeline_stage: str(leadRow.pipeline_stage, "new"),
      },
      daysUntil: num(row.days_until),
      isToday: row.is_today === true,
    }
  }).filter((item) => item.lead.id)

  return {
    pipelineCounts,
    sourcePerformance,
    agentActivity,
    priorityLeads,
    birthdayLeads,
  }
}

function getDemoOverview(): AdminDashboardOverviewData {
  const leads = getDemoLeads().map((lead) => ({
    id: lead.id,
    first_name: lead.first_name,
    last_name: lead.last_name,
    phone: lead.phone,
    pipeline_stage: lead.pipeline_stage,
    contact_status: lead.status ?? null,
    status: lead.status ?? null,
    funding_type: lead.funding_type ?? null,
    assigned_to: lead.assigned_to ?? null,
    created_at: lead.created_at,
    updated_at: lead.updated_at,
    last_contacted_at: lead.last_contacted_at ?? null,
    callback_date: lead.callback_date ?? null,
    date_of_birth: lead.date_of_birth ?? null,
    priority: null,
    source: lead.source ?? null,
  })) satisfies DashboardLead[]

  const pipelineCounts = [...SF_STAGES, ...PUC_STAGES].flatMap((stage) => {
    return ["self_funded", "puc"].map((fundingType) => {
      const matching = leads.filter((lead) =>
        lead.funding_type === fundingType &&
        lead.pipeline_stage === stage.key &&
        lead.pipeline_stage !== "lost" &&
        lead.pipeline_stage !== "withdraw"
      )
      return {
        fundingType,
        stage: stage.key,
        count: matching.length,
        percent: 0,
      }
    })
  })

  const sourceMap = new Map<string, { total: number; files: number }>()
  leads.forEach((lead) => {
    if (lead.pipeline_stage === "lost") return
    const key = lead.source || "other"
    const current = sourceMap.get(key) ?? { total: 0, files: 0 }
    current.total += 1
    if (lead.pipeline_stage === "application") current.files += 1
    sourceMap.set(key, current)
  })

  const sourcePerformance = [...sourceMap.entries()].map(([source, value]) => ({
    source,
    total: value.total,
    files: value.files,
    conversionRate: value.total > 0 ? Math.round((value.files / value.total) * 100) : 0,
  }))

  return {
    pipelineCounts,
    sourcePerformance,
    agentActivity: [],
    priorityLeads: leads.slice(0, 5).map((lead) => ({
      lead,
      reason: "Demo lead",
      urgency: "low",
    })),
    birthdayLeads: [],
  }
}

// Full overview (data + funnels + per-agent activity map) for demo mode, shared
// by the admin dashboard bootstrap so its charts and Team grid are populated.
export function buildDemoAdminOverview(): AdminDashboardOverview {
  const data = getDemoOverview()
  const leads = getDemoLeads()
  const appointments = getDemoAppointments()
  const today = toDateString(new Date())

  const agentActivity: AdminAgentActivityStats[] = DEMO_AGENTS
    .filter((a) => a.role === "agent")
    .map((agent) => {
      const mine = leads.filter((l) => l.assigned_to === agent.id)
      return {
        agentId: agent.id,
        todayChanges: mine.filter((l) => (l.updated_at ?? "").slice(0, 10) === today).length,
        todayAppointments: appointments.filter(
          (a) => a.assigned_agent === agent.id && a.scheduled_date === today
        ).length,
        lastMonthFiles: mine.filter((l) => l.pipeline_stage === "application").length,
      }
    })

  return {
    ...data,
    agentActivity,
    sfFunnelData: buildFunnelData(data.pipelineCounts, "self_funded", SF_STAGES),
    pucFunnelData: buildFunnelData(data.pipelineCounts, "puc", PUC_STAGES),
    agentActivityByAgent: new Map(agentActivity.map((s) => [s.agentId, s])),
  }
}

export function useAdminDashboardOverview(options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true

  const { data = EMPTY_ADMIN_DASHBOARD_OVERVIEW_DATA, isLoading } = useQuery({
    queryKey: queryKeys.adminDashboardOverview.all,
    enabled,
    queryFn: async (): Promise<AdminDashboardOverviewData> => {
      if (isDemoMode()) return getDemoOverview()

      const supabase = createClient()
      const { data, error } = await measureClientAsync(
        "supabase.rpc.get_admin_dashboard_overview",
        async () => await supabase.rpc("get_admin_dashboard_overview"),
        { slowMs: 900, data: { surface: "admin-dashboard" } }
      )

      if (error) {
        console.error("[useAdminDashboardOverview] Supabase error:", error.message)
        return EMPTY_ADMIN_DASHBOARD_OVERVIEW_DATA
      }

      return normalizeOverview(data)
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    placeholderData: (prev) => prev,
  })

  const sfFunnelData = useMemo(
    () => buildFunnelData(data.pipelineCounts, "self_funded", SF_STAGES),
    [data.pipelineCounts]
  )
  const pucFunnelData = useMemo(
    () => buildFunnelData(data.pipelineCounts, "puc", PUC_STAGES),
    [data.pipelineCounts]
  )
  const agentActivityByAgent = useMemo(() => {
    return new Map(data.agentActivity.map((stats) => [stats.agentId, stats]))
  }, [data.agentActivity])

  return {
    overview: {
      ...data,
      sfFunnelData,
      pucFunnelData,
      agentActivityByAgent,
    } satisfies AdminDashboardOverview,
    loading: !enabled || isLoading,
  }
}
