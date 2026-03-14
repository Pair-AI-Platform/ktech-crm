"use client"

import { useState, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { queryKeys } from "./query-keys"
import type { Profile, Semester, AgentTarget, AgentSeasonalTarget } from "@/types"

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// Fields that live on agent_seasonal_targets, not the monthly agent_targets row
const SEASONAL_FIELDS = new Set<string>([
  'sf_applicants', 'weekly_sf_applicants',
  'puc_app_submission', 'weekly_puc_app_submission',
])

export type AgentTargetDraft = Omit<AgentTarget, 'id' | 'created_at' | 'updated_at'>
export type AgentSeasonalDraft = Omit<AgentSeasonalTarget, 'id' | 'created_at' | 'updated_at'>

export function useTargetSettings() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [month, setMonth] = useState(getCurrentMonth)
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null)

  // ── Agents ────────────────────────────────────────────────────────────
  const { data: agents = [], isLoading: agentsLoading } = useQuery<Profile[]>({
    queryKey: queryKeys.agents.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_active", true)
        .order("full_name")
      if (error) throw error
      return data || []
    },
    staleTime: 60_000,
  })

  // ── Monthly targets (PUC Files + SF Files) ───────────────────────────
  const { data: savedTargets = [], isLoading: targetsLoading } = useQuery<AgentTarget[]>({
    queryKey: queryKeys.agentTargets.month(month),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_targets")
        .select("*")
        .eq("month", month)
      if (error) throw error
      return (data || []) as AgentTarget[]
    },
    staleTime: 30_000,
  })

  // ── Semesters list (replaces target_seasons) ────────────────────────
  const { data: seasons = [], isLoading: seasonsLoading } = useQuery<Semester[]>({
    queryKey: queryKeys.semesters.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("semesters")
        .select("*")
        .order("start_date", { ascending: false })
      if (error) throw error
      return (data || []) as Semester[]
    },
    staleTime: 60_000,
  })

  // Derive effective season id after seasons load
  const effectiveSeasonId = selectedSeasonId ?? (() => {
    if (seasons.length === 0) return null
    const active = seasons.find(s => s.is_active)
    if (active) return active.id
    const today = new Date().toISOString().slice(0, 10)
    const current = seasons.find(s => s.start_date <= today && s.end_date >= today)
    return current?.id ?? seasons[0].id
  })()

  const selectedSeason = seasons.find(s => s.id === effectiveSeasonId) ?? null

  // ── Seasonal targets for selected season ─────────────────────────────
  const { data: seasonalTargets = [], isLoading: seasonalLoading } = useQuery<AgentSeasonalTarget[]>({
    queryKey: effectiveSeasonId
      ? queryKeys.agentSeasonalTargets.season(effectiveSeasonId)
      : ['agent-seasonal-targets', 'none'],
    queryFn: async () => {
      if (!effectiveSeasonId) return []
      const { data, error } = await supabase
        .from("agent_seasonal_targets")
        .select("*")
        .eq("season_id", effectiveSeasonId)
      if (error) throw error
      return (data || []) as AgentSeasonalTarget[]
    },
    enabled: !!effectiveSeasonId,
    staleTime: 30_000,
  })

  // ── History (past monthly rows) ───────────────────────────────────────
  const { data: historyTargets = [], isLoading: historyLoading } = useQuery<AgentTarget[]>({
    queryKey: [...queryKeys.agentTargets.all, 'history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_targets")
        .select("*")
        .neq("month", month)
        .neq("month", "overall")  // exclude legacy overall rows
        .order("month", { ascending: false })
        .limit(100)
      if (error) throw error
      return (data || []) as AgentTarget[]
    },
    staleTime: 60_000,
  })

  // ── Draft state ───────────────────────────────────────────────────────
  // Monthly drafts: only puc_files, sf_files, gender sub-targets, weekly monthly
  const [drafts, setDrafts] = useState<Record<string, Partial<AgentTargetDraft>>>({})
  // Seasonal drafts: sf_applicants, puc_app_submission, weekly seasonal
  const [seasonalDrafts, setSeasonalDrafts] = useState<Record<string, Partial<AgentSeasonalDraft>>>({})

  // ── Getters ───────────────────────────────────────────────────────────
  const getTargetForAgent = useCallback((agentId: string): AgentTarget | undefined => {
    return savedTargets.find(t => t.agent_id === agentId)
  }, [savedTargets])

  const getSeasonalTargetForAgent = useCallback((agentId: string): AgentSeasonalTarget | undefined => {
    return seasonalTargets.find(t => t.agent_id === agentId)
  }, [seasonalTargets])

  const getEffectiveTarget = useCallback((agentId: string, field: keyof AgentTargetDraft): number => {
    const isSeasonal = SEASONAL_FIELDS.has(field as string)

    if (isSeasonal) {
      const seasonalDraft = seasonalDrafts[agentId]
      if (seasonalDraft && seasonalDraft[field as keyof AgentSeasonalDraft] !== undefined) {
        return (seasonalDraft[field as keyof AgentSeasonalDraft] as number) ?? 0
      }
      const saved = getSeasonalTargetForAgent(agentId)
      if (saved && (saved as unknown as Record<string, unknown>)[field as string] !== undefined) {
        return ((saved as unknown as Record<string, unknown>)[field as string] as number) ?? 0
      }
      return 0
    }

    const draft = drafts[agentId]
    if (draft && draft[field] !== undefined) return (draft[field] as number) ?? 0
    const saved = getTargetForAgent(agentId)
    if (saved && saved[field] !== undefined) return (saved[field] as number) ?? 0
    return 0
  }, [drafts, seasonalDrafts, getTargetForAgent, getSeasonalTargetForAgent])

  // ── Month navigation ──────────────────────────────────────────────────
  const changeMonth = useCallback((newMonth: string) => {
    // Clear monthly drafts; keep seasonal drafts (they're per season, not month)
    setDrafts({})
    setMonth(newMonth)
  }, [])

  const changeSeason = useCallback((seasonId: string) => {
    // Clear seasonal drafts when switching seasons
    setSeasonalDrafts({})
    setSelectedSeasonId(seasonId)
  }, [])

  // ── Updaters ──────────────────────────────────────────────────────────
  const updateTarget = useCallback((agentId: string, field: keyof AgentTargetDraft, value: number) => {
    const isSeasonal = SEASONAL_FIELDS.has(field as string)
    if (isSeasonal) {
      setSeasonalDrafts(prev => ({
        ...prev,
        [agentId]: { ...prev[agentId], [field]: value },
      }))
    } else {
      setDrafts(prev => ({
        ...prev,
        [agentId]: { ...prev[agentId], [field]: value },
      }))
    }
  }, [])

  const updateWeekly = useCallback((
    agentId: string,
    field: 'weekly_puc_files' | 'weekly_sf_files' | 'weekly_sf_applicants' | 'weekly_puc_app_submission',
    value: number[],
  ) => {
    const isSeasonal = SEASONAL_FIELDS.has(field)
    if (isSeasonal) {
      setSeasonalDrafts(prev => ({
        ...prev,
        [agentId]: { ...prev[agentId], [field]: value },
      }))
    } else {
      setDrafts(prev => ({
        ...prev,
        [agentId]: { ...prev[agentId], [field]: value },
      }))
    }
  }, [])

  // ── Save all ──────────────────────────────────────────────────────────
  const { mutateAsync: saveAll, isPending: saving } = useMutation({
    mutationFn: async () => {
      const agentIds = agents.map(a => a.id)

      // Save monthly rows (PUC Files + SF Files only)
      for (const agentId of agentIds) {
        const savedMonthly = getTargetForAgent(agentId)
        const draft = drafts[agentId]

        if (draft || savedMonthly) {
          const monthlyRow = {
            agent_id: agentId,
            month,
            puc_files: getEffectiveTarget(agentId, 'puc_files'),
            sf_files: getEffectiveTarget(agentId, 'sf_files'),
            sf_applicants: 0,       // no longer stored here
            puc_app_submission: 0,  // no longer stored here
            puc_files_male: getEffectiveTarget(agentId, 'puc_files_male') || null,
            puc_files_female: getEffectiveTarget(agentId, 'puc_files_female') || null,
            sf_files_male: getEffectiveTarget(agentId, 'sf_files_male') || null,
            sf_files_female: getEffectiveTarget(agentId, 'sf_files_female') || null,
            weekly_puc_files: draft?.weekly_puc_files ?? savedMonthly?.weekly_puc_files ?? null,
            weekly_sf_files: draft?.weekly_sf_files ?? savedMonthly?.weekly_sf_files ?? null,
            weekly_sf_applicants: null,
            weekly_puc_app_submission: null,
          }

          const { error } = await supabase
            .from("agent_targets")
            .upsert(monthlyRow, { onConflict: 'agent_id,month' })
          if (error) throw error
        }
      }

      // Save seasonal rows (SF Applicants + PUC App Submission)
      if (effectiveSeasonId) {
        for (const agentId of agentIds) {
          const savedSeasonal = getSeasonalTargetForAgent(agentId)
          const seasonalDraft = seasonalDrafts[agentId]

          if (seasonalDraft || savedSeasonal) {
            const seasonalRow = {
              agent_id: agentId,
              season_id: effectiveSeasonId,
              sf_applicants: getEffectiveTarget(agentId, 'sf_applicants'),
              puc_app_submission: getEffectiveTarget(agentId, 'puc_app_submission'),
              weekly_sf_applicants: seasonalDraft?.weekly_sf_applicants ?? savedSeasonal?.weekly_sf_applicants ?? null,
              weekly_puc_app_submission: seasonalDraft?.weekly_puc_app_submission ?? savedSeasonal?.weekly_puc_app_submission ?? null,
            }

            const { error } = await supabase
              .from("agent_seasonal_targets")
              .upsert(seasonalRow, { onConflict: 'agent_id,season_id' })
            if (error) throw error
          }
        }
      }
    },
    onSuccess: () => {
      setDrafts({})
      setSeasonalDrafts({})
      queryClient.invalidateQueries({ queryKey: queryKeys.agentTargets.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.agentSeasonalTargets.all })
      queryClient.invalidateQueries({ queryKey: ['agent-target-progress'] })
    },
  })

  const loading = agentsLoading || targetsLoading || seasonsLoading

  // Get weekly values from drafts or saved targets
  const getWeekly = useCallback((
    agentId: string,
    field: 'weekly_puc_files' | 'weekly_sf_files' | 'weekly_sf_applicants' | 'weekly_puc_app_submission',
  ): number[] | null => {
    const isSeasonal = SEASONAL_FIELDS.has(field)
    if (isSeasonal) {
      const sd = seasonalDrafts[agentId]
      if (sd && sd[field as keyof AgentSeasonalDraft] !== undefined) {
        return sd[field as keyof AgentSeasonalDraft] as number[] | null
      }
      const saved = getSeasonalTargetForAgent(agentId)
      return (saved?.[field as keyof AgentSeasonalTarget] as number[] | null) ?? null
    }
    const draft = drafts[agentId]
    if (draft && draft[field as keyof AgentTargetDraft] !== undefined) {
      return draft[field as keyof AgentTargetDraft] as number[] | null
    }
    const saved = getTargetForAgent(agentId)
    return (saved?.[field as keyof AgentTarget] as number[] | null) ?? null
  }, [drafts, seasonalDrafts, getTargetForAgent, getSeasonalTargetForAgent])

  const hasUnsavedChanges = Object.keys(drafts).length > 0 || Object.keys(seasonalDrafts).length > 0

  return {
    agents,
    savedTargets,
    seasonalTargets,
    historyTargets,
    historyLoading,
    seasons,
    selectedSeason,
    effectiveSeasonId,
    month,
    changeMonth,
    changeSeason,
    loading,
    saving,
    drafts,
    seasonalDrafts,
    hasUnsavedChanges,
    getEffectiveTarget,
    getWeekly,
    updateTarget,
    updateWeekly,
    saveAll,
    seasonalLoading,
  }
}
