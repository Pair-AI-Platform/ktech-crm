"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode, getDemoLeads, getDemoLeadStats, saveDemoLeadUpdate, getDemoLeadById } from "@/lib/demo-data"
import type { Lead, PipelineStage, LeadStatus } from "@/types"
import { PIPELINE_STAGES, LEAD_STATUSES } from "@/types"

interface UseLeadsOptions {
  stage?: PipelineStage | "all"
  searchQuery?: string
  limit?: number
}

export function useLeads(options: UseLeadsOptions = {}) {
  const { stage = "all", searchQuery = "", limit = 50 } = options
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeads = useCallback(async (abortSignal?: AbortSignal) => {
    setLoading(true)
    setError(null)

    // Check for demo mode
    if (isDemoMode()) {
      let demoLeads = getDemoLeads()

      if (stage !== "all") {
        demoLeads = demoLeads.filter(l => l.pipeline_stage === stage)
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        demoLeads = demoLeads.filter(l =>
          l.first_name.toLowerCase().includes(query) ||
          l.last_name.toLowerCase().includes(query) ||
          l.phone?.includes(query) ||
          l.civil_id?.includes(query)
        )
      }

      setLeads(demoLeads.slice(0, limit))
      setLoading(false)
      return
    }

    const supabase = createClient()

    try {
      let query = supabase
        .from("leads")
        .select(`
          *,
          school:schools(id, name_en, name_ar),
          assigned_agent:profiles!leads_assigned_to_fkey(id, full_name, email, avatar_url),
          appointments(id, appointment_type, status, scheduled_date)
        `)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (stage !== "all") {
        query = query.eq("pipeline_stage", stage)
      }

      if (searchQuery) {
        query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,civil_id.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query

      // Check if request was aborted
      if (abortSignal?.aborted) return

      if (error) throw error
      setLeads(data || [])
    } catch (err) {
      if (abortSignal?.aborted) return
      console.error("Error fetching leads:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch leads")
    } finally {
      if (!abortSignal?.aborted) {
        setLoading(false)
      }
    }
  }, [stage, searchQuery, limit])

  useEffect(() => {
    const abortController = new AbortController()
    fetchLeads(abortController.signal)

    return () => {
      abortController.abort()
    }
  }, [fetchLeads])

  // Subscribe to real-time changes (only in non-demo mode)
  useEffect(() => {
    if (isDemoMode()) return

    const supabase = createClient()
    const channel = supabase
      .channel("leads-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        () => {
          fetchLeads()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchLeads])

  return { leads, loading, error, refetch: fetchLeads }
}

export function useLead(id: string) {
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLead = useCallback(async () => {
    if (!id) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Check for demo mode
    if (isDemoMode()) {
      const demoLeads = getDemoLeads()
      const demoLead = demoLeads.find(l => l.id === id)
      if (demoLead) {
        setLead(demoLead)
      } else {
        setError("Lead not found")
      }
      setLoading(false)
      return
    }

    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("leads")
        .select(`
          *,
          school:schools(id, name_en, name_ar),
          assigned_agent:profiles!leads_assigned_to_fkey(id, full_name, email, avatar_url),
          lost_reason:lost_reasons(id, reason_en, reason_ar, category)
        `)
        .eq("id", id)
        .single()

      if (error) throw error
      setLead(data)
    } catch (err) {
      console.error("Error fetching lead:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch lead")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchLead()
  }, [fetchLead])

  return { lead, loading, error, refetch: fetchLead }
}

// Helper function to check if lead should be automatically set to self-funded based on GPA
function shouldBeAutoSelfFunded(leadData: Partial<Lead>): boolean {
  const gpaThreshold = 70
  const gpa10 = leadData.gpa_grade_10
  const gpa11 = leadData.gpa_grade_11
  const gpa12 = leadData.gpa_grade_12_expected

  // Check if any GPA value is below 70
  if (gpa10 !== undefined && gpa10 !== null && gpa10 < gpaThreshold) return true
  if (gpa11 !== undefined && gpa11 !== null && gpa11 < gpaThreshold) return true
  if (gpa12 !== undefined && gpa12 !== null && gpa12 < gpaThreshold) return true

  return false
}

export function useLeadMutations() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const createLead = async (leadData: Partial<Lead>) => {
    // Demo mode - simulate success
    if (isDemoMode()) {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 300))
      setLoading(false)
      return { data: { ...leadData, id: `lead-${Date.now()}` } as Lead, error: null }
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Auto-set funding_type to self_funded if any GPA is below 70
      const finalLeadData = { ...leadData }
      if (shouldBeAutoSelfFunded(finalLeadData)) {
        finalLeadData.funding_type = 'self_funded'
      }

      const { data, error } = await supabase
        .from("leads")
        .insert({
          ...finalLeadData,
          status: null,
          assigned_to: finalLeadData.assigned_to || user?.id,
          assigned_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      console.error("Error creating lead:", err)
      return { data: null, error: err instanceof Error ? err.message : "Failed to create lead" }
    } finally {
      setLoading(false)
    }
  }

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    // Demo mode - save to localStorage and simulate success
    if (isDemoMode()) {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Get old values for activity logging
      const oldLead = getDemoLeadById(id)

      saveDemoLeadUpdate(id, updates)
      const updatedLead = getDemoLeadById(id)
      setLoading(false)
      return { data: updatedLead || { id, ...updates } as Lead, error: null }
    }

    setLoading(true)
    try {
      // Get current user for audit trail
      const { data: { user } } = await supabase.auth.getUser()

      // Get old values before update for activity logging
      const { data: oldLead } = await supabase
        .from("leads")
        .select("pipeline_stage, status, first_name, last_name, funding_type, gpa_grade_10, gpa_grade_11, gpa_grade_12_expected, gpa_grade_10_override, gpa_grade_11_override, gpa_grade_12_expected_override, gpa_overridden_by")
        .eq("id", id)
        .single()

      // Auto-set funding_type to self_funded if any GPA (new or existing) is below 70
      const mergedGpaData = {
        gpa_grade_10: updates.gpa_grade_10 ?? oldLead?.gpa_grade_10,
        gpa_grade_11: updates.gpa_grade_11 ?? oldLead?.gpa_grade_11,
        gpa_grade_12_expected: updates.gpa_grade_12_expected ?? oldLead?.gpa_grade_12_expected,
      }
      const wasAutoSF = shouldBeAutoSelfFunded(mergedGpaData) && oldLead?.funding_type !== 'self_funded'
      if (wasAutoSF) {
        updates.funding_type = 'self_funded'
      }

      // Check if this is a new GPA override (any override flag being turned on for the first time)
      const isNewGpaOverride = (
        (updates.gpa_grade_10_override && !oldLead?.gpa_grade_10_override) ||
        (updates.gpa_grade_11_override && !oldLead?.gpa_grade_11_override) ||
        (updates.gpa_grade_12_expected_override && !oldLead?.gpa_grade_12_expected_override)
      )

      // Add audit fields if this is a new GPA override
      if (isNewGpaOverride && !oldLead?.gpa_overridden_by) {
        updates.gpa_overridden_by = user?.id
        updates.gpa_overridden_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from("leads")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      // Log activity for GPA override
      if (isNewGpaOverride && oldLead) {
        await supabase.from('activities').insert({
          lead_id: id,
          activity_type: 'gpa_override',
          title: 'GPA Override Applied',
          description: `Agent manually overrode GPA values for ${oldLead.first_name} ${oldLead.last_name}`,
          metadata: {
            gpa_grade_10_override: updates.gpa_grade_10_override,
            gpa_grade_11_override: updates.gpa_grade_11_override,
            gpa_grade_12_expected_override: updates.gpa_grade_12_expected_override,
            original_gpa_10: oldLead.gpa_grade_10,
            original_gpa_11: oldLead.gpa_grade_11,
            original_gpa_12: oldLead.gpa_grade_12_expected,
          },
          created_by: user?.id,
        })
      }

      // Log activity for stage change
      if (updates.pipeline_stage && oldLead && updates.pipeline_stage !== oldLead.pipeline_stage) {
        const oldStageLabel = PIPELINE_STAGES.find(s => s.value === oldLead.pipeline_stage)?.label || oldLead.pipeline_stage
        const newStageLabel = PIPELINE_STAGES.find(s => s.value === updates.pipeline_stage)?.label || updates.pipeline_stage

        await supabase.from('activities').insert({
          lead_id: id,
          activity_type: 'stage_change',
          title: 'Stage Changed',
          description: `${oldLead.first_name} ${oldLead.last_name}: ${oldStageLabel} → ${newStageLabel}`,
          metadata: {
            old_stage: oldLead.pipeline_stage,
            new_stage: updates.pipeline_stage,
            old_stage_label: oldStageLabel,
            new_stage_label: newStageLabel,
          },
          created_by: user?.id,
        })
      }

      // Log activity for status change
      if (updates.status !== undefined && oldLead && updates.status !== oldLead.status) {
        const oldStatusLabel = oldLead.status ? (LEAD_STATUSES.find(s => s.value === oldLead.status)?.label || oldLead.status) : 'None'
        const newStatusLabel = updates.status ? (LEAD_STATUSES.find(s => s.value === updates.status)?.label || updates.status) : 'None'

        await supabase.from('activities').insert({
          lead_id: id,
          activity_type: 'status_change',
          title: 'Status Changed',
          description: `${oldLead.first_name} ${oldLead.last_name}: ${oldStatusLabel} → ${newStatusLabel}`,
          metadata: {
            old_status: oldLead.status || null,
            new_status: updates.status || null,
            old_status_label: oldStatusLabel,
            new_status_label: newStatusLabel,
          },
          created_by: user?.id,
        })
      }

      // Log activity for automatic funding type change due to low GPA
      if (wasAutoSF && oldLead) {
        const lowGpaValues = []
        if (mergedGpaData.gpa_grade_10 !== undefined && mergedGpaData.gpa_grade_10 !== null && mergedGpaData.gpa_grade_10 < 70) {
          lowGpaValues.push(`Grade 10: ${mergedGpaData.gpa_grade_10}`)
        }
        if (mergedGpaData.gpa_grade_11 !== undefined && mergedGpaData.gpa_grade_11 !== null && mergedGpaData.gpa_grade_11 < 70) {
          lowGpaValues.push(`Grade 11: ${mergedGpaData.gpa_grade_11}`)
        }
        if (mergedGpaData.gpa_grade_12_expected !== undefined && mergedGpaData.gpa_grade_12_expected !== null && mergedGpaData.gpa_grade_12_expected < 70) {
          lowGpaValues.push(`Grade 12 Expected: ${mergedGpaData.gpa_grade_12_expected}`)
        }

        await supabase.from('activities').insert({
          lead_id: id,
          activity_type: 'funding_type_change',
          title: 'Auto Self-Funded (Low GPA)',
          description: `${oldLead.first_name} ${oldLead.last_name} automatically set to Self-Funded due to GPA below 70 (${lowGpaValues.join(', ')})`,
          metadata: {
            old_funding_type: oldLead.funding_type,
            new_funding_type: 'self_funded',
            reason: 'gpa_below_70',
            gpa_grade_10: mergedGpaData.gpa_grade_10,
            gpa_grade_11: mergedGpaData.gpa_grade_11,
            gpa_grade_12_expected: mergedGpaData.gpa_grade_12_expected,
          },
          created_by: user?.id,
        })
      }

      return { data, error: null }
    } catch (err) {
      console.error("Error updating lead:", err)
      return { data: null, error: err instanceof Error ? err.message : "Failed to update lead" }
    } finally {
      setLoading(false)
    }
  }

  const updateLeadStage = async (id: string, stage: PipelineStage, lostReasonId?: string, lostReasonNotes?: string) => {
    const updates: Partial<Lead> = { pipeline_stage: stage }

    if (stage === "lost" && lostReasonId) {
      updates.lost_reason_id = lostReasonId
      updates.lost_reason_notes = lostReasonNotes
    }

    updates.last_contacted_at = new Date().toISOString()

    // Get old stage before update to check for test → application transition
    let oldStage: PipelineStage | null = null
    if (!isDemoMode()) {
      const { data: oldLead } = await supabase
        .from("leads")
        .select("pipeline_stage")
        .eq("id", id)
        .single()
      oldStage = oldLead?.pipeline_stage || null
    }

    const result = await updateLead(id, updates)

    // Trigger LMS sync when moving from 'test' to 'application'
    if (result.data && oldStage === "test" && stage === "application") {
      try {
        // Call LMS sync API in background (don't block the stage change)
        fetch("/api/lms/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId: id }),
        }).catch(err => {
          console.error("LMS sync failed:", err)
        })
      } catch (err) {
        // Log but don't fail the stage change
        console.error("Error triggering LMS sync:", err)
      }
    }

    return result
  }

  const deleteLead = async (id: string, reason?: string) => {
    // Demo mode - simulate success
    if (isDemoMode()) {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 300))
      setLoading(false)
      return { error: null }
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Use the soft_delete_lead function to move the lead to deleted_leads table
      const { data, error } = await supabase
        .rpc("soft_delete_lead", {
          lead_id: id,
          deleting_user_id: user.id,
          reason: reason || null
        })

      if (error) throw error
      return { error: null, deletedRecordId: data }
    } catch (err) {
      console.error("Error deleting lead:", err)
      return { error: err instanceof Error ? err.message : "Failed to delete lead" }
    } finally {
      setLoading(false)
    }
  }

  const bulkAssignLeads = async (leadIds: string[], agentId: string) => {
    // Demo mode - simulate success
    if (isDemoMode()) {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 300))
      setLoading(false)
      return { error: null, count: leadIds.length }
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from("leads")
        .update({
          assigned_to: agentId,
          assigned_at: new Date().toISOString(),
        })
        .in("id", leadIds)

      if (error) throw error
      return { error: null, count: leadIds.length }
    } catch (err) {
      console.error("Error bulk assigning leads:", err)
      return { error: err instanceof Error ? err.message : "Failed to assign leads", count: 0 }
    } finally {
      setLoading(false)
    }
  }

  const bulkDeleteLeads = async (leadIds: string[], reason?: string) => {
    // Demo mode - simulate success
    if (isDemoMode()) {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 300))
      setLoading(false)
      return { error: null, count: leadIds.length }
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Soft delete each lead using the soft_delete_lead function
      let successCount = 0
      const errors: string[] = []

      for (const leadId of leadIds) {
        const { error } = await supabase
          .rpc("soft_delete_lead", {
            lead_id: leadId,
            deleting_user_id: user.id,
            reason: reason || null
          })

        if (error) {
          errors.push(`Failed to delete lead ${leadId}: ${error.message}`)
        } else {
          successCount++
        }
      }

      if (errors.length > 0 && successCount === 0) {
        throw new Error(errors.join("; "))
      }

      return { error: errors.length > 0 ? errors.join("; ") : null, count: successCount }
    } catch (err) {
      console.error("Error bulk deleting leads:", err)
      return { error: err instanceof Error ? err.message : "Failed to delete leads", count: 0 }
    } finally {
      setLoading(false)
    }
  }

  const bulkUpdateStage = async (leadIds: string[], stage: PipelineStage) => {
    // Demo mode - simulate success
    if (isDemoMode()) {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 300))
      setLoading(false)
      return { error: null, count: leadIds.length }
    }

    setLoading(true)
    try {
      const updates: Partial<Lead> = {
        pipeline_stage: stage,
        last_contacted_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from("leads")
        .update(updates)
        .in("id", leadIds)

      if (error) throw error
      return { error: null, count: leadIds.length }
    } catch (err) {
      console.error("Error bulk updating stage:", err)
      return { error: err instanceof Error ? err.message : "Failed to update leads", count: 0 }
    } finally {
      setLoading(false)
    }
  }

  return {
    createLead,
    updateLead,
    updateLeadStage,
    deleteLead,
    bulkAssignLeads,
    bulkDeleteLeads,
    bulkUpdateStage,
    loading
  }
}

export function useLeadStats() {
  const [stats, setStats] = useState({
    total: 0,
    byStage: {} as Record<PipelineStage, number>,
    thisMonth: 0,
    conversionRate: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      // Check for demo mode
      if (isDemoMode()) {
        const demoStats = getDemoLeadStats()
        setStats(demoStats)
        setLoading(false)
        return
      }

      const supabase = createClient()

      try {
        // Get all leads for stage counts
        const { data: leads, error } = await supabase
          .from("leads")
          .select("pipeline_stage, created_at")

        if (error) throw error

        const byStage: Record<string, number> = {}
        // Initialize all pipeline stages to 0
        const stages: PipelineStage[] = [
          "new", "contacted", "visit", "appointment", "test", "application", "submission", "enrolled", "lost"
        ]

        stages.forEach(stage => {
          byStage[stage] = 0
        })

        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        let thisMonth = 0
        let enrolled = 0

        leads?.forEach(lead => {
          if (lead.pipeline_stage) {
            byStage[lead.pipeline_stage] = (byStage[lead.pipeline_stage] || 0) + 1
          }
          if (new Date(lead.created_at) >= startOfMonth) {
            thisMonth++
          }
          if (lead.pipeline_stage === "enrolled") {
            enrolled++
          }
        })

        const total = leads?.length || 0
        const conversionRate = total > 0 ? Math.round((enrolled / total) * 100) : 0

        setStats({
          total,
          byStage: byStage as Record<PipelineStage, number>,
          thisMonth,
          conversionRate,
        })
      } catch (err) {
        console.error("Error fetching lead stats:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading }
}

export function useLostReasons() {
  const [reasons, setReasons] = useState<{
    id: string
    category: string
    reason_en: string
    reason_ar: string
    is_active: boolean
  }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReasons() {
      if (isDemoMode()) {
        // Demo data - all lost reasons matching database
        setReasons([
          // Competitors
          { id: '1', category: 'competitors', reason_en: 'ACM', reason_ar: 'ACM', is_active: true },
          { id: '2', category: 'competitors', reason_en: 'AUM', reason_ar: 'AUM', is_active: true },
          { id: '3', category: 'competitors', reason_en: 'AUK', reason_ar: 'AUK', is_active: true },
          { id: '4', category: 'competitors', reason_en: 'GUST', reason_ar: 'GUST', is_active: true },
          { id: '5', category: 'competitors', reason_en: 'PAAET', reason_ar: 'PAAET', is_active: true },
          { id: '6', category: 'competitors', reason_en: 'KU', reason_ar: 'جامعة الكويت', is_active: true },
          { id: '7', category: 'competitors', reason_en: 'KILAW', reason_ar: 'كيلاو', is_active: true },
          { id: '8', category: 'competitors', reason_en: 'IUK', reason_ar: 'الجامعة الدولية بالكويت', is_active: true },
          // Military / Security
          { id: '9', category: 'military_security', reason_en: 'Military', reason_ar: 'عسكري', is_active: true },
          { id: '10', category: 'military_security', reason_en: 'Police', reason_ar: 'شرطة', is_active: true },
          { id: '11', category: 'military_security', reason_en: 'Fire Force', reason_ar: 'إطفاء', is_active: true },
          { id: '12', category: 'military_security', reason_en: 'Army', reason_ar: 'الجيش', is_active: true },
          { id: '13', category: 'military_security', reason_en: 'National Guard', reason_ar: 'الحرس الوطني', is_active: true },
          // Academic
          { id: '14', category: 'academic', reason_en: 'High GPA +89', reason_ar: 'معدل عالي +89', is_active: true },
          { id: '15', category: 'academic', reason_en: 'Bachelors', reason_ar: 'بكالوريوس', is_active: true },
          { id: '16', category: 'academic', reason_en: 'Current Student', reason_ar: 'طالب حالي', is_active: true },
          { id: '17', category: 'academic', reason_en: 'Wrong Major', reason_ar: 'لا يرغب بالتخصص', is_active: true },
          { id: '18', category: 'academic', reason_en: 'PAAET Second Course', reason_ar: 'التطبيقي الكورس الثاني', is_active: true },
          { id: '19', category: 'academic', reason_en: 'Foundation Year Too Long', reason_ar: 'سنة التمهيدي طويلة', is_active: true },
          { id: '20', category: 'academic', reason_en: 'Accepted Second Choice', reason_ar: 'قبول على الرغبة الثانية', is_active: true },
          // Administrative
          { id: '21', category: 'administrative', reason_en: 'Wrong Number', reason_ar: 'رقم خاطئ', is_active: true },
          { id: '22', category: 'administrative', reason_en: "DON'T CALL", reason_ar: 'لا تتصل', is_active: true },
          // Financial
          { id: '23', category: 'financial', reason_en: 'Payment Issue', reason_ar: 'مشكلة في الدفع', is_active: true },
          // Personal
          { id: '24', category: 'personal', reason_en: 'Personal Reasons', reason_ar: 'أسباب شخصية', is_active: true },
          { id: '25', category: 'personal', reason_en: 'Traveling', reason_ar: 'مسافر', is_active: true },
          { id: '26', category: 'personal', reason_en: 'Not Interested', reason_ar: 'غير مهتم', is_active: true },
          { id: '27', category: 'personal', reason_en: 'Medical Travel Abroad', reason_ar: 'مسافر علاج بالخارج', is_active: true },
          { id: '28', category: 'personal', reason_en: 'Fear of Payment Loss', reason_ar: 'متخوف من الدفع', is_active: true },
          { id: '29', category: 'personal', reason_en: 'No Interest in College', reason_ar: 'لا يرغب بالكلية', is_active: true },
        ])
        setLoading(false)
        return
      }

      const supabase = createClient()

      try {
        const { data, error } = await supabase
          .from('lost_reasons')
          .select('*')
          .eq('is_active', true)
          .order('category')

        if (error) throw error
        setReasons(data || [])
      } catch (err) {
        console.error('Error fetching lost reasons:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReasons()
  }, [])

  return { reasons, loading }
}
