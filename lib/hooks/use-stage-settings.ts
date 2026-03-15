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

// Default stage settings — all pipeline stages
const DEFAULT_STAGE_SETTINGS: StageSettings[] = [
  { id: '1', stage: 'new', is_active: true, display_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', stage: 'contacted', is_active: true, display_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '3', stage: 'visit', is_active: true, display_order: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '4', stage: 'test', is_active: true, display_order: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '5', stage: 'application', is_active: true, display_order: 5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '6', stage: 'puc_document_submission', is_active: true, display_order: 6, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '7', stage: 'puc_application_submission', is_active: true, display_order: 7, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '8', stage: 'applicant', is_active: true, display_order: 8, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '9', stage: 'enrolled', is_active: true, display_order: 9, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '10', stage: 'withdraw', is_active: true, display_order: 10, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '11', stage: 'lost', is_active: true, display_order: 11, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
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

      if (error) throw new Error(error.message)
      const existing = (data || []) as StageSettings[]

      // Auto-seed any missing stages into the DB
      const existingStages = new Set(existing.map(s => s.stage))
      const maxOrder = existing.reduce((max, s) => Math.max(max, s.display_order), 0)
      const missingDefaults = DEFAULT_STAGE_SETTINGS.filter(d => !existingStages.has(d.stage))

      if (missingDefaults.length > 0) {
        const inserts = missingDefaults.map((d, i) => ({
          stage: d.stage,
          is_active: d.is_active,
          display_order: maxOrder + i + 1,
        }))

        const { data: inserted, error: insertError } = await supabase
          .from("pipeline_stage_settings")
          .insert(inserts)
          .select()

        if (!insertError && inserted) {
          const merged = [...existing, ...(inserted as StageSettings[])]
            .sort((a, b) => a.display_order - b.display_order)
          return merged
        }
      }

      return existing
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

      if (error) throw new Error(error.message)
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

  const reorderStagesMutation = useMutation({
    mutationFn: async (reorderedStages: { stage: PipelineStage; display_order: number }[]) => {
      if (isDemoMode()) {
        const currentSettings = getDemoStageSettings()
        const updated = currentSettings.map(s => {
          const newOrder = reorderedStages.find(r => r.stage === s.stage)
          return newOrder ? { ...s, display_order: newOrder.display_order, updated_at: new Date().toISOString() } : s
        })
        saveDemoStageSettings(updated)
        return true
      }

      const supabase = createClient()

      // Update all display_order values in parallel
      const updates = reorderedStages.map(({ stage, display_order }) =>
        supabase
          .from("pipeline_stage_settings")
          .update({ display_order })
          .eq("stage", stage)
      )

      const results = await Promise.all(updates)
      const failed = results.find(r => r.error)
      if (failed?.error) throw new Error(failed.error.message)
      return true
    },
    onMutate: async (reorderedStages) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.stageSettings.all })

      const previousSettings = queryClient.getQueryData<StageSettings[]>(queryKeys.stageSettings.all)

      queryClient.setQueryData<StageSettings[]>(
        queryKeys.stageSettings.all,
        (old) => {
          if (!old) return []
          const updated = old.map(s => {
            const newOrder = reorderedStages.find(r => r.stage === s.stage)
            return newOrder ? { ...s, display_order: newOrder.display_order } : s
          })
          return updated.sort((a, b) => a.display_order - b.display_order)
        }
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

  const reorderStages = useCallback(
    async (reorderedStages: { stage: PipelineStage; display_order: number }[]) => {
      try {
        await reorderStagesMutation.mutateAsync(reorderedStages)
        return true
      } catch {
        return false
      }
    },
    [reorderStagesMutation]
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
    reorderStages,
    activeStages,
    isStageActive,
    refetch: async () => { await refetch() },
  }
}
