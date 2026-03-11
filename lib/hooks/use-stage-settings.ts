"use client"

import { useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode } from "@/lib/demo-data"
import { queryKeys } from "./query-keys"
import type { PipelineStage } from "@/types"

export interface StageSettings {
  id: string
  stage: PipelineStage
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

// Default stage settings for demo mode
const DEFAULT_STAGE_SETTINGS: StageSettings[] = [
  { id: '1', stage: 'new', is_active: true, display_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', stage: 'test', is_active: true, display_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '4', stage: 'application', is_active: true, display_order: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '5', stage: 'lost', is_active: true, display_order: 5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '6', stage: 'applicant', is_active: true, display_order: 6, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '7', stage: 'enrolled', is_active: true, display_order: 7, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]

const DEMO_STORAGE_KEY = 'ktech_demo_stage_settings'

function getDemoStageSettings(): StageSettings[] {
  if (typeof window === 'undefined') return DEFAULT_STAGE_SETTINGS
  const stored = localStorage.getItem(DEMO_STORAGE_KEY)
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as StageSettings[]
      // Merge any missing default stages into stored settings
      const storedStages = new Set(parsed.map(s => s.stage))
      const missingStages = DEFAULT_STAGE_SETTINGS.filter(d => !storedStages.has(d.stage))
      if (missingStages.length > 0) {
        const merged = [...parsed, ...missingStages]
        saveDemoStageSettings(merged)
        return merged
      }
      return parsed
    } catch {
      return DEFAULT_STAGE_SETTINGS
    }
  }
  return DEFAULT_STAGE_SETTINGS
}

function saveDemoStageSettings(settings: StageSettings[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(settings))
}

export function useStageSettings() {
  const queryClient = useQueryClient()

  const { data: settings = [], isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: queryKeys.stageSettings.all,
    queryFn: async () => {
      if (isDemoMode()) {
        return getDemoStageSettings()
      }

      const supabase = createClient()

      const { data, error } = await supabase
        .from("pipeline_stage_settings")
        .select("*")
        .order("display_order", { ascending: true })

      if (error) throw error
      return (data || []) as StageSettings[]
    },
    staleTime: 60_000,
  })

  const error = queryError?.message ?? null

  const toggleStageMutation = useMutation({
    mutationFn: async ({ stage, isActive }: { stage: PipelineStage; isActive: boolean }) => {
      // Prevent deactivating 'new' stage - leads always need a starting point
      if (stage === 'new' && !isActive) {
        throw new Error("Cannot deactivate the 'New' stage - it's required as the initial stage")
      }

      if (isDemoMode()) {
        const currentSettings = getDemoStageSettings()
        const updated = currentSettings.map(s =>
          s.stage === stage ? { ...s, is_active: isActive, updated_at: new Date().toISOString() } : s
        )
        saveDemoStageSettings(updated)
        return true
      }

      const supabase = createClient()

      const { error } = await supabase
        .from("pipeline_stage_settings")
        .update({ is_active: isActive })
        .eq("stage", stage)

      if (error) throw error
      return true
    },
    onMutate: async ({ stage, isActive }) => {
      // Prevent deactivating 'new' stage before making optimistic update
      if (stage === 'new' && !isActive) return

      await queryClient.cancelQueries({ queryKey: queryKeys.stageSettings.all })

      const previousSettings = queryClient.getQueryData<StageSettings[]>(queryKeys.stageSettings.all)

      queryClient.setQueryData<StageSettings[]>(
        queryKeys.stageSettings.all,
        (old) => old?.map(s =>
          s.stage === stage ? { ...s, is_active: isActive, updated_at: new Date().toISOString() } : s
        ) ?? []
      )

      return { previousSettings }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(queryKeys.stageSettings.all, context.previousSettings)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stageSettings.all })
    },
  })

  const toggleStage = useCallback(
    async (stage: PipelineStage, isActive: boolean) => {
      try {
        await toggleStageMutation.mutateAsync({ stage, isActive })
        return true
      } catch {
        return false
      }
    },
    [toggleStageMutation]
  )

  // Helper to get only active stages
  const activeStages = settings.filter(s => s.is_active).map(s => s.stage)

  // Helper to check if a stage is active
  const isStageActive = useCallback((stage: PipelineStage) => {
    const setting = settings.find(s => s.stage === stage)
    return setting?.is_active ?? true
  }, [settings])

  return {
    settings,
    loading,
    error,
    toggleStage,
    activeStages,
    isStageActive,
    refetch: async () => { await refetch() },
  }
}
