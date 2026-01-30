"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode } from "@/lib/demo-data"
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
  { id: '2', stage: 'visit', is_active: true, display_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '3', stage: 'test', is_active: true, display_order: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
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
  const [settings, setSettings] = useState<StageSettings[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (isDemoMode()) {
      setSettings(getDemoStageSettings())
      setLoading(false)
      return
    }

    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("pipeline_stage_settings")
        .select("*")
        .order("display_order", { ascending: true })

      if (error) throw error
      setSettings(data || [])
    } catch (err) {
      console.error("Error fetching stage settings:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch stage settings")
      // Fall back to default settings if table doesn't exist yet
      setSettings(DEFAULT_STAGE_SETTINGS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const toggleStage = useCallback(async (stage: PipelineStage, isActive: boolean) => {
    // Prevent deactivating 'new' stage - leads always need a starting point
    if (stage === 'new' && !isActive) {
      setError("Cannot deactivate the 'New' stage - it's required as the initial stage")
      return false
    }

    // Optimistically update UI
    setSettings(prev =>
      prev.map(s => s.stage === stage ? { ...s, is_active: isActive, updated_at: new Date().toISOString() } : s)
    )

    if (isDemoMode()) {
      const currentSettings = getDemoStageSettings()
      const updated = currentSettings.map(s =>
        s.stage === stage ? { ...s, is_active: isActive, updated_at: new Date().toISOString() } : s
      )
      saveDemoStageSettings(updated)
      return true
    }

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("pipeline_stage_settings")
        .update({ is_active: isActive })
        .eq("stage", stage)

      if (error) throw error
      return true
    } catch (err) {
      console.error("Error updating stage setting:", err)
      setError(err instanceof Error ? err.message : "Failed to update stage setting")
      // Revert optimistic update
      await fetchSettings()
      return false
    }
  }, [fetchSettings])

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
    refetch: fetchSettings,
  }
}
