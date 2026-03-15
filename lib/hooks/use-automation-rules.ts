"use client"

import { useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode } from "@/lib/demo-data"
import { queryKeys } from "./query-keys"
import type { AutomationRule } from "@/lib/automation/engine"

export type { AutomationRule }

const DEMO_RULES: AutomationRule[] = [
  {
    id: "demo-rule-1",
    name: "Notify agent on stage change to Contacted",
    description: "Sends a notification to the assigned agent when a lead moves to the Contacted stage",
    trigger_type: "stage_change",
    trigger_conditions: { new_stage: "contacted" },
    action_type: "create_notification",
    action_config: { title: "{lead_name} moved to Contacted", body: "Follow up with this lead soon.", type: "stage_change" },
    is_active: true,
    priority: 10,
  },
  {
    id: "demo-rule-2",
    name: "Create follow-up on new lead",
    description: "Automatically creates a follow-up reminder 1 day after a new lead is created",
    trigger_type: "lead_created",
    trigger_conditions: {},
    action_type: "create_follow_up",
    action_config: { days_from_now: 1, title: "Follow up with {lead_name}", notes: "New lead - make first contact" },
    is_active: true,
    priority: 5,
  },
]

interface UseAutomationRulesReturn {
  rules: AutomationRule[]
  loading: boolean
  error: string | null
  createRule: (rule: Omit<AutomationRule, "id" | "priority">) => Promise<void>
  updateRule: (id: string, updates: Partial<AutomationRule>) => Promise<void>
  deleteRule: (id: string) => Promise<void>
  toggleRule: (id: string, isActive: boolean) => Promise<void>
  refetch: () => Promise<void>
}

export function useAutomationRules(): UseAutomationRulesReturn {
  const queryClient = useQueryClient()

  const { data: rules = [], isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: queryKeys.automationRules.all,
    queryFn: async () => {
      if (isDemoMode()) {
        return DEMO_RULES
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from("automation_rules")
        .select("*")
        .order("priority", { ascending: false })

      if (error) throw new Error(error.message)
      return (data as AutomationRule[]) ?? []
    },
    staleTime: 30_000,
  })

  const error = queryError?.message ?? null

  const createRuleMutation = useMutation({
    mutationFn: async (rule: Omit<AutomationRule, "id" | "priority">) => {
      if (isDemoMode()) {
        const newRule: AutomationRule = {
          ...rule,
          id: `demo-rule-${Date.now()}`,
          priority: 0,
        }
        return newRule
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from("automation_rules")
        .insert({ ...rule, created_by: user?.id })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data as AutomationRule
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.automationRules.all })
    },
  })

  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AutomationRule> }) => {
      if (isDemoMode()) return

      const supabase = createClient()
      const { error } = await supabase
        .from("automation_rules")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw new Error(error.message)
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.automationRules.all })

      const previousRules = queryClient.getQueryData<AutomationRule[]>(queryKeys.automationRules.all)

      queryClient.setQueryData<AutomationRule[]>(
        queryKeys.automationRules.all,
        (old) => old?.map((r) => (r.id === id ? { ...r, ...updates } : r)) ?? []
      )

      return { previousRules }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousRules) {
        queryClient.setQueryData(queryKeys.automationRules.all, context.previousRules)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.automationRules.all })
    },
  })

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isDemoMode()) return

      const supabase = createClient()
      const { error } = await supabase
        .from("automation_rules")
        .delete()
        .eq("id", id)

      if (error) throw new Error(error.message)
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.automationRules.all })

      const previousRules = queryClient.getQueryData<AutomationRule[]>(queryKeys.automationRules.all)

      queryClient.setQueryData<AutomationRule[]>(
        queryKeys.automationRules.all,
        (old) => old?.filter((r) => r.id !== id) ?? []
      )

      return { previousRules }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousRules) {
        queryClient.setQueryData(queryKeys.automationRules.all, context.previousRules)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.automationRules.all })
    },
  })

  const createRule = useCallback(
    async (rule: Omit<AutomationRule, "id" | "priority">) => {
      await createRuleMutation.mutateAsync(rule)
    },
    [createRuleMutation]
  )

  const updateRule = useCallback(
    async (id: string, updates: Partial<AutomationRule>) => {
      await updateRuleMutation.mutateAsync({ id, updates })
    },
    [updateRuleMutation]
  )

  const deleteRule = useCallback(
    async (id: string) => {
      await deleteRuleMutation.mutateAsync(id)
    },
    [deleteRuleMutation]
  )

  const toggleRule = useCallback(
    async (id: string, isActive: boolean) => {
      await updateRule(id, { is_active: isActive })
    },
    [updateRule]
  )

  return {
    rules,
    loading,
    error,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    refetch: async () => { await refetch() },
  }
}
