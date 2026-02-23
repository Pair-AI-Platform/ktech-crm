"use client"

import { useEffect, useState, useCallback, startTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode } from "@/lib/demo-data"
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
  {
    id: "demo-rule-3",
    name: "SMS on appointment scheduled",
    description: "Sends a confirmation SMS when an appointment is scheduled",
    trigger_type: "appointment_scheduled",
    trigger_conditions: {},
    action_type: "send_sms",
    action_config: { message: "Hi {lead_name}, your appointment at KTECH has been confirmed. See you soon!" },
    is_active: false,
    priority: 3,
  },
]

interface UseAutomationRulesReturn {
  rules: AutomationRule[]
  loading: boolean
  createRule: (rule: Omit<AutomationRule, "id" | "priority">) => Promise<void>
  updateRule: (id: string, updates: Partial<AutomationRule>) => Promise<void>
  deleteRule: (id: string) => Promise<void>
  toggleRule: (id: string, isActive: boolean) => Promise<void>
  refetch: () => Promise<void>
}

export function useAutomationRules(): UseAutomationRulesReturn {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRules = useCallback(async () => {
    if (isDemoMode()) {
      startTransition(() => {
        setRules(DEMO_RULES)
        setLoading(false)
      })
      return
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from("automation_rules")
      .select("*")
      .order("priority", { ascending: false })

    if (!error && data) {
      setRules(data as AutomationRule[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    startTransition(() => { fetchRules() })
  }, [fetchRules])

  const createRule = useCallback(async (rule: Omit<AutomationRule, "id" | "priority">) => {
    if (isDemoMode()) {
      const newRule: AutomationRule = {
        ...rule,
        id: `demo-rule-${Date.now()}`,
        priority: 0,
      }
      setRules(prev => [newRule, ...prev])
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from("automation_rules")
      .insert({ ...rule, created_by: user?.id })
      .select()
      .single()

    if (!error && data) {
      setRules(prev => [data as AutomationRule, ...prev])
    }
  }, [])

  const updateRule = useCallback(async (id: string, updates: Partial<AutomationRule>) => {
    if (isDemoMode()) {
      setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from("automation_rules")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (!error) {
      setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
    }
  }, [])

  const deleteRule = useCallback(async (id: string) => {
    if (isDemoMode()) {
      setRules(prev => prev.filter(r => r.id !== id))
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from("automation_rules")
      .delete()
      .eq("id", id)

    if (!error) {
      setRules(prev => prev.filter(r => r.id !== id))
    }
  }, [])

  const toggleRule = useCallback(async (id: string, isActive: boolean) => {
    await updateRule(id, { is_active: isActive })
  }, [updateRule])

  return {
    rules,
    loading,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    refetch: fetchRules,
  }
}
