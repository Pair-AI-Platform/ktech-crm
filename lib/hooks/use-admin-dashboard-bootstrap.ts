"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { isDemoMode } from "@/lib/demo-data"
import { queryKeys } from "@/lib/hooks/query-keys"
import { measureClientAsync } from "@/lib/performance"
import {
  EMPTY_ADMIN_DASHBOARD_OVERVIEW_DATA,
  PUC_STAGES,
  SF_STAGES,
  buildFunnelData,
  normalizeOverview,
  type AdminDashboardOverview,
} from "@/lib/hooks/use-admin-dashboard-overview"
import type { DashboardCriticalStats } from "@/lib/hooks/use-dashboard-critical-stats"
import type { AgentStatus } from "@/lib/hooks/use-agent-presence"
import type { Appointment, AppointmentLead, Lead } from "@/types"

interface AdminDashboardBootstrapPayload {
  criticalStats?: unknown
  overview?: unknown
  todayAppointments?: unknown[]
  noUpdatedAppointments?: unknown[]
  agentPresence?: unknown[]
  agentWorkload?: unknown[]
  errors?: string[]
  generatedAt?: string
}

interface PresenceRow {
  id: string
  full_name: string | null
  last_activity_at: string | null
  manual_status: string | null
  is_active: boolean | null
}

interface AgentWorkloadRow {
  agent_id: string | null
  active_leads: number | string | null
  enrolled_count: number | string | null
  total_assigned: number | string | null
  new_this_month: number | string | null
  overdue_followups: number | string | null
}

interface AgentWorkloadStats {
  activeLeads: number
  enrolled: number
  totalAssigned: number
  newThisMonth: number
  overdueFollowUps: number
}

export interface AdminDashboardAgentCard {
  id: string
  name: string
  status: AgentStatus
  activeLeadCount: number
  filesOpenedThisMonth: number
  todayChanges: number
  conversionRate: number
  todayAppointments: number
  lastMonthFiles: number
  overdueFollowUps: number
  totalAssigned: number
}

export interface AdminDashboardBootstrap {
  criticalStats: DashboardCriticalStats
  overview: AdminDashboardOverview
  todayAppointments: Appointment[]
  noUpdatedAppointments: Appointment[]
  agentHeatmapData: AdminDashboardAgentCard[]
  errors: string[]
  generatedAt: string | null
}

type DashboardCriticalStatsRpcRow = {
  active_leads?: number | string | null
  total_files?: number | string | null
  puc_files?: number | string | null
  sf_files?: number | string | null
  today_appointments?: number | string | null
  today_callbacks?: number | string | null
}

type AppointmentLeadRow = AppointmentLead & { lead?: Lead | null }
type RawAppointmentRow = Appointment & {
  appointment_leads?: AppointmentLeadRow[] | null
  lead?: Lead | null
}

const EMPTY_CRITICAL_STATS: DashboardCriticalStats = {
  activeLeads: 0,
  totalFiles: 0,
  pucFiles: 0,
  sfFiles: 0,
  todayAppointments: 0,
  todayCallbacks: 0,
}

const EMPTY_BOOTSTRAP: AdminDashboardBootstrap = {
  criticalStats: EMPTY_CRITICAL_STATS,
  overview: {
    ...EMPTY_ADMIN_DASHBOARD_OVERVIEW_DATA,
    sfFunnelData: [],
    pucFunnelData: [],
    agentActivityByAgent: new Map(),
  },
  todayAppointments: [],
  noUpdatedAppointments: [],
  agentHeatmapData: [],
  errors: [],
  generatedAt: null,
}

const EMPTY_AGENT_STATS: AgentWorkloadStats = {
  activeLeads: 0,
  enrolled: 0,
  totalAssigned: 0,
  newThisMonth: 0,
  overdueFollowUps: 0,
}

const PLACEHOLDER_AGENT_NAMES = new Set(["admin", "agent", "demo", "khalifa", "test"])

// Seed/demo agents (created 2026-03-11). They still own historical leads so the
// accounts are kept in the DB, but they are hidden from the Team Status grid.
const DEMO_AGENT_IDS = new Set([
  "4834428f-4e81-43de-80d8-86ee2c3239ed", // Sarah Jones
  "0e68966e-b982-4f92-889e-e25dcbbb7e28", // Ahmed Hassan
  "5fdadd43-0fa3-43da-9622-2d138f0df6f4", // Nora Khalid
  "ec28d450-eda7-44b0-8bb6-cc0f95d9d284", // Omar Farid
  "503af133-7977-4f3a-9ed6-7a3b7589fe7c", // Lina Mahmoud
  "2268f9ac-3880-4506-92e4-7ede3a81df5b", // Khalid Nasser
  "9305db3e-88f3-4d0d-8771-df0701511470", // Dana Ali
  "1f976666-2f57-475c-ad5d-ee4c1c0004f3", // Faisal Khaled
  "dd5d78bb-6f8b-43af-8330-197f55e39c49", // Reem Salem
  "9d39bd25-2a09-4a9c-b737-ec1e1e0d2993", // Yousef Ward
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function numberOrZero(value: number | string | null | undefined) {
  return Number(value ?? 0) || 0
}

function normalizeCriticalStats(raw: unknown): DashboardCriticalStats {
  const row = Array.isArray(raw) ? raw[0] : raw
  if (!isRecord(row)) return EMPTY_CRITICAL_STATS

  const stats = row as DashboardCriticalStatsRpcRow
  return {
    activeLeads: numberOrZero(stats.active_leads),
    totalFiles: numberOrZero(stats.total_files),
    pucFiles: numberOrZero(stats.puc_files),
    sfFiles: numberOrZero(stats.sf_files),
    todayAppointments: numberOrZero(stats.today_appointments),
    todayCallbacks: numberOrZero(stats.today_callbacks),
  }
}

function leadIsReal(lead: Pick<Lead, "actual_lead"> | null | undefined): boolean {
  return lead?.actual_lead !== false
}

function normalizeRealLeadAppointment(appointment: RawAppointmentRow): Appointment | null {
  const rawAppointmentLeads = Array.isArray(appointment.appointment_leads)
    ? appointment.appointment_leads
    : []
  const realAppointmentLeads = rawAppointmentLeads.filter(row => leadIsReal(row.lead))
  const legacyLead = leadIsReal(appointment.lead) ? appointment.lead : null
  const hasKnownNonRealLead =
    rawAppointmentLeads.some(row => row.lead?.actual_lead === false) ||
    appointment.lead?.actual_lead === false
  const hasKnownRealLead =
    realAppointmentLeads.some(row => Boolean(row.lead)) ||
    Boolean(legacyLead)

  if (hasKnownNonRealLead && !hasKnownRealLead) return null

  const primaryLead = realAppointmentLeads.find(row => row.lead)?.lead ?? legacyLead ?? null

  return {
    ...appointment,
    appointment_leads: realAppointmentLeads,
    lead: primaryLead ?? undefined,
    lead_id:
      realAppointmentLeads.find(row => row.lead_id)?.lead_id ??
      primaryLead?.id ??
      (legacyLead ? appointment.lead_id : null) ??
      undefined,
  } as Appointment
}

function normalizeAppointments(raw: unknown[] | undefined): Appointment[] {
  return (raw ?? [])
    .map(appointment => normalizeRealLeadAppointment(appointment as RawAppointmentRow))
    .filter((appointment): appointment is Appointment => Boolean(appointment))
}

function normalizePresenceRows(raw: unknown[] | undefined): PresenceRow[] {
  return (raw ?? [])
    .map((value): PresenceRow | null => {
      if (!isRecord(value)) return null
      return {
        id: typeof value.id === "string" ? value.id : "",
        full_name: typeof value.full_name === "string" ? value.full_name : null,
        last_activity_at: typeof value.last_activity_at === "string" ? value.last_activity_at : null,
        manual_status: typeof value.manual_status === "string" ? value.manual_status : null,
        is_active: typeof value.is_active === "boolean" ? value.is_active : null,
      }
    })
    .filter((row): row is PresenceRow => Boolean(row?.id))
}

function normalizeWorkloadRows(raw: unknown[] | undefined) {
  const result = new Map<string, AgentWorkloadStats>()

  ;(raw ?? []).forEach(value => {
    if (!isRecord(value) || typeof value.agent_id !== "string") return
    const agentId = value.agent_id
    const row = value as unknown as AgentWorkloadRow
    result.set(agentId, {
      activeLeads: numberOrZero(row.active_leads),
      enrolled: numberOrZero(row.enrolled_count),
      totalAssigned: numberOrZero(row.total_assigned),
      newThisMonth: numberOrZero(row.new_this_month),
      overdueFollowUps: numberOrZero(row.overdue_followups),
    })
  })

  return result
}

function deriveStatus(lastActivityAt: string | null, manualStatus: string | null): AgentStatus {
  if (manualStatus === "meeting" || manualStatus === "break") {
    if (!lastActivityAt) return "offline"
    const diffMin = (Date.now() - new Date(lastActivityAt).getTime()) / 60_000
    if (diffMin >= 15) return "offline"
    return manualStatus
  }

  if (!lastActivityAt) return "offline"

  const diffMin = (Date.now() - new Date(lastActivityAt).getTime()) / 60_000
  return diffMin < 15 ? "online" : "offline"
}

function buildBootstrap(payload: AdminDashboardBootstrapPayload): AdminDashboardBootstrap {
  const overviewData = normalizeOverview(payload.overview)
  const sfFunnelData = buildFunnelData(overviewData.pipelineCounts, "self_funded", SF_STAGES)
  const pucFunnelData = buildFunnelData(overviewData.pipelineCounts, "puc", PUC_STAGES)
  const agentActivityByAgent = new Map(
    overviewData.agentActivity.map((stats) => [stats.agentId, stats])
  )
  const overview = {
    ...overviewData,
    sfFunnelData,
    pucFunnelData,
    agentActivityByAgent,
  } satisfies AdminDashboardOverview

  const agentWorkloadStats = normalizeWorkloadRows(payload.agentWorkload)
  const agentHeatmapData = normalizePresenceRows(payload.agentPresence)
    .map((agent) => {
      const stats = agentWorkloadStats.get(agent.id) ?? EMPTY_AGENT_STATS
      const activity = agentActivityByAgent.get(agent.id)
      return {
        id: agent.id,
        name: agent.full_name ?? "Unknown",
        status: deriveStatus(agent.last_activity_at, agent.manual_status),
        activeLeadCount: stats.activeLeads,
        filesOpenedThisMonth: stats.newThisMonth,
        todayChanges: activity?.todayChanges ?? 0,
        conversionRate: stats.totalAssigned > 0 ? Math.round((stats.enrolled / stats.totalAssigned) * 100) : 0,
        todayAppointments: activity?.todayAppointments ?? 0,
        lastMonthFiles: activity?.lastMonthFiles ?? 0,
        overdueFollowUps: stats.overdueFollowUps,
        totalAssigned: stats.totalAssigned,
      }
    })
    .filter((agent) => !DEMO_AGENT_IDS.has(agent.id))
    .filter((agent) => !PLACEHOLDER_AGENT_NAMES.has(agent.name.trim().split(/\s+/)[0].toLowerCase()))
    .sort((a, b) => b.activeLeadCount - a.activeLeadCount || a.name.localeCompare(b.name))

  return {
    criticalStats: normalizeCriticalStats(payload.criticalStats),
    overview,
    todayAppointments: normalizeAppointments(payload.todayAppointments),
    noUpdatedAppointments: normalizeAppointments(payload.noUpdatedAppointments),
    agentHeatmapData,
    errors: Array.isArray(payload.errors) ? payload.errors.filter((e): e is string => typeof e === "string") : [],
    generatedAt: typeof payload.generatedAt === "string" ? payload.generatedAt : null,
  }
}

export function useAdminDashboardBootstrap(options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true

  const query = useQuery({
    queryKey: queryKeys.adminDashboardBootstrap.all,
    enabled,
    staleTime: 45_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
    queryFn: async (): Promise<AdminDashboardBootstrap> => {
      if (isDemoMode()) return EMPTY_BOOTSTRAP

      const response = await measureClientAsync(
        "api.dashboard.admin-bootstrap",
        () => fetch("/api/dashboard/admin-bootstrap", {
          headers: { Accept: "application/json" },
        }),
        { slowMs: 900, data: { surface: "admin-dashboard" } }
      )

      if (!response.ok) {
        throw new Error(`Dashboard bootstrap failed (${response.status})`)
      }

      return buildBootstrap(await response.json())
    },
  })

  const data = query.data ?? EMPTY_BOOTSTRAP

  return useMemo(
    () => ({
      ...data,
      loading: enabled && query.isLoading && !query.data,
      fetching: query.isFetching,
      error: query.error instanceof Error ? query.error.message : null,
      refetch: query.refetch,
    }),
    [data, enabled, query.error, query.isFetching, query.isLoading, query.data, query.refetch]
  )
}
