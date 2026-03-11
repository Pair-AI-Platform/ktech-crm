"use client"

import { useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode } from "@/lib/demo-data"
import { queryKeys } from "./query-keys"

export interface FilterPreset {
  id: string
  user_id: string
  name: string
  filters: Record<string, unknown>
  is_shared: boolean
  created_at: string
  updated_at: string
}

const DEMO_PRESETS: FilterPreset[] = [
  {
    id: "demo-preset-1",
    user_id: "demo-user",
    name: "New Leads This Week",
    filters: { stage: "new", date_range: "this_week" },
    is_shared: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-preset-2",
    user_id: "demo-user",
    name: "Contacted - High Priority",
    filters: { stage: "contacted", priority: "high" },
    is_shared: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

interface UseFilterPresetsReturn {
  presets: FilterPreset[]
  loading: boolean
  createPreset: (preset: Pick<FilterPreset, "name" | "filters" | "is_shared">) => Promise<void>
  updatePreset: (id: string, updates: Partial<Pick<FilterPreset, "name" | "filters" | "is_shared">>) => Promise<void>
  deletePreset: (id: string) => Promise<void>
}

export function useFilterPresets(): UseFilterPresetsReturn {
  const queryClient = useQueryClient()

  const { data: presets = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.filterPresets.all,
    queryFn: async () => {
      if (isDemoMode()) {
        return DEMO_PRESETS
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from("filter_presets")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      return (data as FilterPreset[]) ?? []
    },
    staleTime: 30_000,
  })

  const createPresetMutation = useMutation({
    mutationFn: async (preset: Pick<FilterPreset, "name" | "filters" | "is_shared">) => {
      if (isDemoMode()) {
        const newPreset: FilterPreset = {
          ...preset,
          id: `demo-preset-${Date.now()}`,
          user_id: "demo-user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        return newPreset
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from("filter_presets")
        .insert({
          user_id: user?.id,
          name: preset.name,
          filters: preset.filters,
          is_shared: preset.is_shared,
        })
        .select()
        .single()

      if (error) throw error
      return data as FilterPreset
    },
    onSuccess: (newPreset) => {
      queryClient.setQueryData<FilterPreset[]>(
        queryKeys.filterPresets.all,
        (old) => [newPreset, ...(old ?? [])]
      )
    },
  })

  const updatePresetMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Pick<FilterPreset, "name" | "filters" | "is_shared">> }) => {
      if (isDemoMode()) return

      const supabase = createClient()
      const { data, error } = await supabase
        .from("filter_presets")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data as FilterPreset
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.filterPresets.all })

      const previousPresets = queryClient.getQueryData<FilterPreset[]>(queryKeys.filterPresets.all)

      queryClient.setQueryData<FilterPreset[]>(
        queryKeys.filterPresets.all,
        (old) => old?.map((p) => (p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p)) ?? []
      )

      return { previousPresets }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousPresets) {
        queryClient.setQueryData(queryKeys.filterPresets.all, context.previousPresets)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.filterPresets.all })
    },
  })

  const deletePresetMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isDemoMode()) return

      const supabase = createClient()
      const { error } = await supabase
        .from("filter_presets")
        .delete()
        .eq("id", id)

      if (error) throw error
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.filterPresets.all })

      const previousPresets = queryClient.getQueryData<FilterPreset[]>(queryKeys.filterPresets.all)

      queryClient.setQueryData<FilterPreset[]>(
        queryKeys.filterPresets.all,
        (old) => old?.filter((p) => p.id !== id) ?? []
      )

      return { previousPresets }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousPresets) {
        queryClient.setQueryData(queryKeys.filterPresets.all, context.previousPresets)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.filterPresets.all })
    },
  })

  const createPreset = useCallback(
    async (preset: Pick<FilterPreset, "name" | "filters" | "is_shared">) => {
      await createPresetMutation.mutateAsync(preset)
    },
    [createPresetMutation]
  )

  const updatePreset = useCallback(
    async (id: string, updates: Partial<Pick<FilterPreset, "name" | "filters" | "is_shared">>) => {
      await updatePresetMutation.mutateAsync({ id, updates })
    },
    [updatePresetMutation]
  )

  const deletePreset = useCallback(
    async (id: string) => {
      await deletePresetMutation.mutateAsync(id)
    },
    [deletePresetMutation]
  )

  return {
    presets,
    loading,
    createPreset,
    updatePreset,
    deletePreset,
  }
}
