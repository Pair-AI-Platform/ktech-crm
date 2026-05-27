"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { DEMO_AGENTS, getDemoLeads, isDemoMode } from "@/lib/demo-data"

export interface WeeklyTarget {
  weekNumber: number
  weekLabel: string
  target: number
  applications: number
  progress: number
  isCurrent: boolean
  startDate: Date
  endDate: Date
}

export interface AgentTargetProgress {
  agentId: string
  agentName: string
  target: number
  applications: number
  progress: number
  remaining: number
  weeklyTargets?: WeeklyTarget[]
  currentWeek?: WeeklyTarget
  categories?: {
    puc?: { target: number; applications: number; progress: number }
    sf?: { target: number; applications: number; progress: number }
  }
}

export interface MonthlyTargetHistory {
  month: string
  monthLabel: string
  target: number
  applications: number
  progress: number
  weeklyTargets: WeeklyTarget[]
}

interface AgentTargetRow {
  agent_id: string
  month?: string
  puc_files?: number | null
  sf_files?: number | null
  sf_applicants?: number | null
}

interface TargetLeadRow {
  created_at: string
  pipeline_stage: string | null
  funding_type: string | null
}

const TARGET_STAGES = [
  "application",
  "applicant",
  "puc_document_submission",
  "puc_application_submission",
]

function getWeeksInMonth(year: number, month: number): { start: Date; end: Date; label: string; weekNum: number }[] {
  const weeks: { start: Date; end: Date; label: string; weekNum: number }[] = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const monthName = firstDay.toLocaleDateString("en-US", { month: "short" })
  let weekStart = new Date(firstDay)
  let weekNum = 1

  while (weekStart <= lastDay) {
    const weekEnd = new Date(weekStart)
    const daysUntilSat = (6 - weekStart.getDay() + 7) % 7
    weekEnd.setDate(weekStart.getDate() + daysUntilSat)
    if (weekEnd > lastDay) weekEnd.setTime(lastDay.getTime())

    weeks.push({
      start: new Date(weekStart),
      end: new Date(weekEnd),
      label: `Week ${weekNum} (${monthName} ${weekStart.getDate()}-${weekEnd.getDate()})`,
      weekNum,
    })

    weekStart = new Date(weekEnd)
    weekStart.setDate(weekStart.getDate() + 1)
    weekNum++
  }

  return weeks
}

function computeWeeklyTargets(
  monthlyTarget: number,
  leads: { created_at: string }[],
  year: number,
  month: number,
  now: Date
): WeeklyTarget[] {
  const weeks = getWeeksInMonth(year, month)
  const basePerWeek = Math.floor(monthlyTarget / weeks.length)
  const remainder = monthlyTarget - basePerWeek * weeks.length

  return weeks.map((week, i) => {
    const weekTarget = basePerWeek + (i === weeks.length - 1 ? remainder : 0)
    const weekEnd = new Date(week.end.getFullYear(), week.end.getMonth(), week.end.getDate(), 23, 59, 59)
    const weekLeads = leads.filter(l => {
      const d = new Date(l.created_at)
      return d >= week.start && d <= weekEnd
    })
    const isCurrent = now >= week.start && now <= weekEnd

    return {
      weekNumber: week.weekNum,
      weekLabel: week.label,
      target: weekTarget,
      applications: weekLeads.length,
      progress: weekTarget > 0 ? Math.min(100, Math.round((weekLeads.length / weekTarget) * 100)) : 0,
      isCurrent,
      startDate: week.start,
      endDate: week.end,
    }
  })
}

function buildProgress(
  agentId: string,
  agentName: string,
  currentTarget: AgentTargetRow | null,
  overallTarget: AgentTargetRow | null,
  leads: TargetLeadRow[],
  now: Date
): AgentTargetProgress {
  const pucLeads = leads.filter(l => l.funding_type === "puc" && l.pipeline_stage === "application")
  const sfLeads = leads.filter(l => l.funding_type === "self_funded" && l.pipeline_stage === "application")
  const sfApplicantLeads = leads.filter(l => l.funding_type === "self_funded" && l.pipeline_stage === "applicant")

  const targetPuc = currentTarget?.puc_files || 0
  const targetSf = currentTarget?.sf_files || 0
  const targetSfApp = currentTarget?.sf_applicants || overallTarget?.sf_applicants || 0
  const target = targetPuc + targetSf + targetSfApp
  const applications = pucLeads.length + sfLeads.length + sfApplicantLeads.length
  const weeklyTargets = computeWeeklyTargets(target, leads, now.getFullYear(), now.getMonth(), now)
  const currentWeek = weeklyTargets.find(w => w.isCurrent)

  return {
    agentId,
    agentName,
    target,
    applications,
    progress: target > 0 ? Math.min(100, Math.round((applications / target) * 100)) : 0,
    remaining: Math.max(0, target - applications),
    weeklyTargets,
    currentWeek,
    categories: {
      puc: {
        target: targetPuc,
        applications: pucLeads.length,
        progress: targetPuc > 0 ? Math.min(100, Math.round((pucLeads.length / targetPuc) * 100)) : 0,
      },
      sf: {
        target: targetSf,
        applications: sfLeads.length,
        progress: targetSf > 0 ? Math.min(100, Math.round((sfLeads.length / targetSf) * 100)) : 0,
      },
    },
  }
}

export function useAgentTargetProgress(agentId?: string, options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true
  const { data: allProgress = [], isLoading: loading } = useQuery<AgentTargetProgress[]>({
    queryKey: ["agent-target-progress-lite", agentId],
    enabled: enabled && !!agentId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!agentId) return []

      const now = new Date()
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]

      if (isDemoMode()) {
        const agent = DEMO_AGENTS.find(a => a.id === agentId)
        const demoLeads = getDemoLeads().filter(l => {
          const createdAt = new Date(l.created_at)
          return l.assigned_to === agentId &&
            createdAt >= new Date(now.getFullYear(), now.getMonth(), 1) &&
            createdAt <= new Date(now.getFullYear(), now.getMonth() + 1, 0)
        }) as TargetLeadRow[]

        return [
          buildProgress(
            agentId,
            agent?.full_name || "Agent",
            { agent_id: agentId, puc_files: agent?.target_puc || 0, sf_files: agent?.target_sf || 0, sf_applicants: 0 },
            null,
            demoLeads,
            now
          ),
        ]
      }

      const supabase = createClient()
      const [{ data: target }, { data: overallTarget }, { data: profile, error: profileError }, { data: leads, error: leadsError }] =
        await Promise.all([
          supabase.from("agent_targets").select("*").eq("agent_id", agentId).eq("month", currentMonth).maybeSingle(),
          supabase.from("agent_targets").select("*").eq("agent_id", agentId).eq("month", "overall").maybeSingle(),
          supabase.from("profiles").select("id, full_name").eq("id", agentId).maybeSingle(),
          supabase
            .from("leads")
            .select("created_at, pipeline_stage, funding_type")
            .eq("assigned_to", agentId)
            .in("pipeline_stage", TARGET_STAGES)
            .gte("created_at", startOfMonth)
            .lte("created_at", `${endOfMonth}T23:59:59`),
        ])

      if (profileError) throw new Error(profileError.message)
      if (leadsError) throw new Error(leadsError.message)

      return [
        buildProgress(
          agentId,
          profile?.full_name || "Agent",
          target as AgentTargetRow | null,
          overallTarget as AgentTargetRow | null,
          (leads || []) as TargetLeadRow[],
          now
        ),
      ]
    },
  })

  const progress = useMemo(() => {
    if (!agentId) return null
    return allProgress.find(p => p.agentId === agentId) ?? null
  }, [agentId, allProgress])

  return { progress, allAgentsProgress: allProgress, loading: !enabled || loading }
}

export function useAgentTargetHistory(agentId?: string, monthsBack: number = 6, options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true
  const { data: history = [], isLoading: loading } = useQuery<MonthlyTargetHistory[]>({
    queryKey: ["agent-target-history-lite", agentId, monthsBack],
    enabled: enabled && !!agentId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!agentId) return []

      if (isDemoMode()) {
        const now = new Date()
        return Array.from({ length: monthsBack }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - i - 1, 1)
          const target = 20
          const applications = Math.floor(Math.random() * 25)
          const weeklyTargets = getWeeksInMonth(d.getFullYear(), d.getMonth()).map((week) => ({
            weekNumber: week.weekNum,
            weekLabel: week.label,
            target: Math.max(1, Math.floor(target / 4)),
            applications: Math.floor(Math.random() * 7),
            progress: 0,
            isCurrent: false,
            startDate: week.start,
            endDate: week.end,
          }))

          return {
            month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
            monthLabel: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
            target,
            applications,
            progress: target > 0 ? Math.min(100, Math.round((applications / target) * 100)) : 0,
            weeklyTargets,
          }
        })
      }

      const supabase = createClient()
      const now = new Date()
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      const oldestDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1)
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const [{ data: pastTargets }, { data: overallRow }, { data: leads, error: leadsError }] = await Promise.all([
        supabase
          .from("agent_targets")
          .select("*")
          .eq("agent_id", agentId)
          .neq("month", currentMonth)
          .neq("month", "overall")
          .order("month", { ascending: false })
          .limit(monthsBack),
        supabase
          .from("agent_targets")
          .select("sf_applicants")
          .eq("agent_id", agentId)
          .eq("month", "overall")
          .maybeSingle(),
        supabase
          .from("leads")
          .select("created_at, pipeline_stage, funding_type")
          .eq("assigned_to", agentId)
          .in("pipeline_stage", TARGET_STAGES)
          .gte("created_at", oldestDate.toISOString().split("T")[0])
          .lt("created_at", currentMonthStart.toISOString().split("T")[0]),
      ])

      if (leadsError) throw new Error(leadsError.message)
      if (!pastTargets || pastTargets.length === 0) return []

      const rows = (leads || []) as TargetLeadRow[]
      const overallSfApplicants = (overallRow as AgentTargetRow | null)?.sf_applicants || 0

      return (pastTargets as AgentTargetRow[]).map(t => {
        const [year, month] = (t.month || "").split("-").map(Number)
        const monthStart = new Date(year, month - 1, 1)
        const monthEnd = new Date(year, month, 0, 23, 59, 59)
        const monthLeads = rows.filter(l => {
          const d = new Date(l.created_at)
          return d >= monthStart && d <= monthEnd
        })
        const target = (t.puc_files || 0) + (t.sf_files || 0) + ((t.sf_applicants || 0) > 0 ? t.sf_applicants || 0 : overallSfApplicants)
        const weeklyTargets = computeWeeklyTargets(target, monthLeads, year, month - 1, monthStart)
        weeklyTargets.forEach(w => {
          w.isCurrent = false
        })

        return {
          month: t.month || "",
          monthLabel: monthStart.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
          target,
          applications: monthLeads.length,
          progress: target > 0 ? Math.min(100, Math.round((monthLeads.length / target) * 100)) : 0,
          weeklyTargets,
        }
      })
    },
  })

  return { history, loading: !enabled || loading }
}
