"use client"

import { useEffect, useCallback } from "react"
import { useQuery, useMutation, useQueryClient, useIsMutating } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode, getDemoLeads, getDemoLeadStats, saveDemoLeadUpdate, getDemoLeadById } from "@/lib/demo-data"
import type { Lead, PipelineStage, FundingType, LeadStatus, LostReason } from "@/types"
import { PIPELINE_STAGES, LEAD_STATUSES, PUC_DOCUMENT_STATUSES } from "@/types"
import { GPA_SELF_FUNDED_THRESHOLD, PUC_PSP_AUTO_ROUTE } from "@/lib/config/constants"
import { executeAutomations } from "@/lib/automation/engine"
import { isArabicText } from "@/lib/string-utils"
import { queryKeys } from "./query-keys"

interface UseLeadsFilters {
  statuses?: string[]
  sources?: string[]
  schools?: string[]
  academicTrack?: string
  dateRange?: string
  dateFrom?: string
  dateTo?: string
  assignedTo?: string
  gpaMin?: number | null
  gpaMax?: number | null
  isKuwaiti?: boolean | null
  blockReasons?: string[]
  submissionSubstages?: string[]
  submissionStatuses?: string[]
  lostAtStages?: string[]
  lostAtFilter?: string
  hasNotes?: string
  lostReasonIds?: string[]
  withdrawalReasons?: string[]
  genders?: string[]
  governorates?: string[]
  ministryAssigned?: string
}

interface UseLeadsOptions {
  stage?: PipelineStage | "all"
  fundingType?: FundingType | "all"
  searchQuery?: string
  limit?: number
  page?: number
  pageSize?: number
  filters?: UseLeadsFilters
  enabled?: boolean
}

type LeadStatsRow = Pick<Lead, "created_at" | "pipeline_stage" | "funding_type">

export function useLeads(options: UseLeadsOptions = {}) {
  const { stage = "all", fundingType = "all", searchQuery = "", limit = 50, page, pageSize = 25, filters: advancedFilters, enabled = true } = options
  const usePagination = page !== undefined
  const queryClient = useQueryClient()

  const filters = { stage, fundingType, searchQuery, limit, page, pageSize, ...advancedFilters }

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.leads.list(filters),
    queryFn: async () => {
      // Check for demo mode
      if (isDemoMode()) {
        let demoLeads = getDemoLeads()

        if (stage !== "all") {
          demoLeads = demoLeads.filter(l => l.pipeline_stage === stage)
        }

        if (fundingType !== "all") {
          demoLeads = demoLeads.filter(l => l.funding_type === fundingType)
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

        const totalCount = demoLeads.length
        if (usePagination) {
          const start = (page! - 1) * pageSize
          return { leads: demoLeads.slice(start, start + pageSize), totalCount }
        } else {
          return { leads: demoLeads.slice(0, limit), totalCount }
        }
      }

      // Fetch via API route (server-side query with proper auth)
      const params = new URLSearchParams()
      if (stage !== "all") params.set("stage", stage)
      if (fundingType !== "all") params.set("fundingType", fundingType)
      if (searchQuery) params.set("search", searchQuery)
      params.set("limit", String(limit))
      if (usePagination) {
        params.set("page", String(page))
        params.set("pageSize", String(pageSize))
      }
      if (advancedFilters) {
        params.set("filters", JSON.stringify(advancedFilters))
      }

      const res = await fetch(`/api/leads?${params.toString()}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(body.error || `Failed to fetch leads (${res.status})`)
      }

      const result = await res.json()

      // Map contact_status to status for backward compat
      const leads = (result.leads || []).map((l: any) => ({
        ...l,
        status: l.contact_status ?? l.status,
      }))

      return {
        leads: leads as Lead[],
        totalCount: result.totalCount ?? leads.length,
      }
    },
    staleTime: 30_000,
    enabled,
  })

  // Subscribe to real-time changes (only in non-demo mode)
  // On realtime event, invalidate the React Query cache instead of fetching directly
  useEffect(() => {
    if (isDemoMode() || !enabled) return

    const supabase = createClient()

    // Build a filter for the subscription to only react to relevant changes
    const filter = stage !== "all" ? `pipeline_stage=eq.${stage}` : undefined

    const channel = supabase
      .channel(`leads-changes-${stage}-${fundingType}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "leads",
          ...(filter ? { filter } : {}),
        },
        () => {
          // Only invalidate on new leads — updates are handled in-place by mutations
          queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, stage, fundingType, enabled])

  const leads = data?.leads ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = usePagination ? Math.ceil(totalCount / pageSize) : 1

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.leads.list(filters) })
  }, [queryClient, filters])

  return {
    leads,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : "Failed to fetch leads") : null,
    totalCount,
    totalPages,
    refetch,
  }
}

export function useLead(id: string) {
  const queryClient = useQueryClient()

  const { data: lead = null, isLoading, error } = useQuery({
    queryKey: queryKeys.leads.detail(id),
    queryFn: async () => {
      if (!id) return null

      // Check for demo mode
      if (isDemoMode()) {
        const demoLeads = getDemoLeads()
        const demoLead = demoLeads.find(l => l.id === id)
        if (demoLead) return demoLead
        return null
      }

      const res = await fetch(`/api/leads/${id}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(body.error || `Failed to fetch lead (${res.status})`)
      }

      return (await res.json()) as Lead
    },
    enabled: !!id,
    staleTime: 30_000,
  })

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.leads.detail(id) })
  }, [queryClient, id])

  return {
    lead,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : "Failed to fetch lead") : null,
    refetch,
  }
}

// Helper function to check if lead should be automatically set to self-funded based on GPA
function shouldBeAutoSelfFunded(leadData: Partial<Lead>): boolean {
  const gpa10 = leadData.gpa_grade_10
  const gpa11 = leadData.gpa_grade_11
  const gpa12 = leadData.gpa_grade_12_expected

  if (gpa10 !== undefined && gpa10 !== null && gpa10 < GPA_SELF_FUNDED_THRESHOLD) return true
  if (gpa11 !== undefined && gpa11 !== null && gpa11 < GPA_SELF_FUNDED_THRESHOLD) return true
  if (gpa12 !== undefined && gpa12 !== null && gpa12 < GPA_SELF_FUNDED_THRESHOLD) return true

  return false
}

// Helper: calculate age from date of birth
function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  return age
}

// Helper: check if a lead qualifies for automatic PUC PSP routing
// Conditions: Kuwaiti, actual_gpa >= 70, graduation within 2 years, age < 23, not an employee
function shouldAutoRouteToPucPsp(leadData: Partial<Lead>): boolean {
  // Must be Kuwaiti
  const isKuwaiti = leadData.is_kuwaiti === true || leadData.nationality === 'Kuwaiti'
  if (!isKuwaiti) return false

  // Must have actual_gpa >= 70
  if (leadData.actual_gpa === undefined || leadData.actual_gpa === null || leadData.actual_gpa < PUC_PSP_AUTO_ROUTE.MIN_GPA) return false

  // Graduation year must be within the last 2 years
  const currentYear = new Date().getFullYear()
  if (!leadData.graduation_year || leadData.graduation_year < currentYear - PUC_PSP_AUTO_ROUTE.MAX_GRADUATION_GAP_YEARS) return false

  // Must be under 23 years old
  if (!leadData.date_of_birth) return false
  const age = calculateAge(leadData.date_of_birth)
  if (age >= PUC_PSP_AUTO_ROUTE.MAX_AGE) return false

  // Must NOT be an employee
  if (leadData.is_employee === true) return false

  return true
}

export function useLeadMutations() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const mutatingCount = useIsMutating({ mutationKey: ['lead-mutation'] })
  const loading = mutatingCount > 0

  const getTopPosition = async (stage: PipelineStage): Promise<number> => {
    // Shift all existing leads in the target stage down by 1
    await supabase.rpc("shift_stage_positions", { target_stage: stage })
    return 0
  }

  const createLeadMutation = useMutation({
    mutationKey: ['lead-mutation'],
    mutationFn: async (leadData: Partial<Lead>) => {
      // Validate Arabic names
      if (leadData.first_name && !isArabicText(leadData.first_name)) {
        throw new Error('First name must be in Arabic')
      }
      if (leadData.last_name && !isArabicText(leadData.last_name)) {
        throw new Error('Last name must be in Arabic')
      }

      // Demo mode - simulate success
      if (isDemoMode()) {
        await new Promise(resolve => setTimeout(resolve, 300))
        return { data: { ...leadData, id: `lead-${Date.now()}` } as Lead, error: null }
      }

      const { data: { user } } = await supabase.auth.getUser()

      // Auto-set funding_type to self_funded if any GPA is below 70
      const finalLeadData = { ...leadData }
      if (shouldBeAutoSelfFunded(finalLeadData)) {
        finalLeadData.funding_type = 'self_funded'
      }

      // Auto-route to PUC PSP if all conditions are met
      const shouldRouteToPuc = shouldAutoRouteToPucPsp(finalLeadData)
      if (shouldRouteToPuc && finalLeadData.funding_type !== 'puc') {
        finalLeadData.funding_type = 'puc'
      }

      // Auto-assign to active cycle's open term if no semester selected
      if (!finalLeadData.semester_id) {
        const { data: openTerm } = await supabase
          .from("semesters")
          .select("id")
          .eq("is_active", true)
          .eq("is_open", true)
          .limit(1)
          .single()
        if (openTerm) {
          finalLeadData.semester_id = openTerm.id
        }
      }

      const { data, error } = await supabase
        .from("leads")
        .insert({
          ...finalLeadData,
          contact_status: null,
          assigned_to: finalLeadData.assigned_to || user?.id,
          assigned_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw new Error(error.message)

      // Log activity for auto PUC PSP routing
      if (shouldRouteToPuc && data) {
        await supabase.from('activities').insert({
          lead_id: data.id,
          activity_type: 'funding_type_change',
          title: 'Auto-Routed to PUC PSP',
          description: `${data.first_name} ${data.last_name} automatically routed to PUC PSP (Kuwaiti, GPA: ${data.actual_gpa}, Age: under ${PUC_PSP_AUTO_ROUTE.MAX_AGE}, Grad Year: ${data.graduation_year}, Not Employee)`,
          metadata: {
            old_funding_type: leadData.funding_type || null,
            new_funding_type: 'puc',
            reason: 'puc_psp_auto_route',
            actual_gpa: data.actual_gpa,
            graduation_year: data.graduation_year,
            is_employee: data.is_employee,
          },
          created_by: user?.id,
        })
      }

      // Fire automation triggers for new lead (fire-and-forget)
      if (data) {
        executeAutomations({
          trigger: 'lead_created',
          leadId: data.id,
          leadData: data as unknown as Record<string, unknown>,
          userId: user?.id,
        }).catch(() => {}) // fire-and-forget
      }

      return { data, error: null }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
    },
  })

  const updateLeadMutation = useMutation({
    mutationKey: ['lead-mutation'],
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Lead> }) => {
      // Validate Arabic names if being updated
      if (updates.first_name && !isArabicText(updates.first_name)) {
        throw new Error('First name must be in Arabic')
      }
      if (updates.last_name && !isArabicText(updates.last_name)) {
        throw new Error('Last name must be in Arabic')
      }

      // Demo mode - save to localStorage and simulate success
      if (isDemoMode()) {
        await new Promise(resolve => setTimeout(resolve, 300))
        saveDemoLeadUpdate(id, updates)
        const updatedLead = getDemoLeadById(id)
        return { data: updatedLead || { id, ...updates } as Lead, error: null }
      }

      // Get current user for audit trail
      const { data: { user } } = await supabase.auth.getUser()

      // Get old values before update for activity logging
      const { data: oldLead } = await supabase
        .from("leads")
        .select("pipeline_stage, contact_status, first_name, last_name, funding_type, gpa_grade_10, gpa_grade_11, gpa_grade_12_expected, gpa_grade_10_override, gpa_grade_11_override, gpa_grade_12_expected_override, gpa_overridden_by, nationality, is_kuwaiti, actual_gpa, graduation_year, date_of_birth, is_employee, assigned_to, contact_count, puc_document_status_override, intended_major, preferred_major, ministry_accepted_major, preferred_college, source")
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

      // Auto-route to PUC PSP if all conditions are met (merge updates with old lead data)
      const mergedLeadForPuc = {
        nationality: updates.nationality ?? oldLead?.nationality,
        is_kuwaiti: updates.is_kuwaiti ?? oldLead?.is_kuwaiti,
        actual_gpa: updates.actual_gpa ?? oldLead?.actual_gpa,
        graduation_year: updates.graduation_year ?? oldLead?.graduation_year,
        date_of_birth: updates.date_of_birth ?? oldLead?.date_of_birth,
        is_employee: updates.is_employee ?? oldLead?.is_employee,
      }
      const currentFundingType = updates.funding_type ?? oldLead?.funding_type
      const wasAutoRoutedToPuc = shouldAutoRouteToPucPsp(mergedLeadForPuc) && currentFundingType !== 'puc'
      if (wasAutoRoutedToPuc) {
        updates.funding_type = 'puc'
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

      // Assign next position when moving to a different stage
      if (updates.pipeline_stage && oldLead && updates.pipeline_stage !== oldLead.pipeline_stage) {
        updates.position_in_stage = await getTopPosition(updates.pipeline_stage)
      }

      // Map client-side 'status' field to DB column 'contact_status'
      if ('status' in updates) {
        updates.contact_status = updates.status as unknown as Lead['contact_status']
        delete updates.status
      }

      const { data, error } = await supabase
        .from("leads")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw new Error(error.message)

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

        // Notify assigned agent of stage change (if changed by someone else)
        if (oldLead.assigned_to && oldLead.assigned_to !== user?.id) {
          supabase.from('notifications').insert({
            user_id: oldLead.assigned_to,
            type: 'stage_change',
            title: `Lead moved to ${newStageLabel}`,
            body: `${oldLead.first_name} ${oldLead.last_name} was moved from ${oldStageLabel} to ${newStageLabel}`,
            lead_id: id,
            action_url: `/leads/${id}`,
            created_by: user?.id,
          }).then(() => {}) // fire-and-forget
        }

        // Fire automation triggers for stage change (fire-and-forget)
        executeAutomations({
          trigger: 'stage_change',
          leadId: id,
          leadData: { ...oldLead, ...updates } as unknown as Record<string, unknown>,
          userId: user?.id,
          metadata: {
            old_stage: oldLead.pipeline_stage,
            new_stage: updates.pipeline_stage,
          },
        }).catch(() => {}) // fire-and-forget
      }

      // Log activity for status change
      const newStatus = updates.contact_status ?? updates.status
      const oldStatus = oldLead?.contact_status
      if (newStatus !== undefined && oldLead && newStatus !== oldStatus) {
        const oldStatusLabel = oldStatus ? (LEAD_STATUSES.find(s => s.value === oldStatus)?.label || oldStatus) : 'None'
        const newStatusLabel = newStatus ? (LEAD_STATUSES.find(s => s.value === newStatus)?.label || newStatus) : 'None'

        await supabase.from('activities').insert({
          lead_id: id,
          activity_type: 'status_change',
          title: 'Status Changed',
          description: `${oldLead.first_name} ${oldLead.last_name}: ${oldStatusLabel} → ${newStatusLabel}`,
          metadata: {
            old_status: oldStatus || null,
            new_status: newStatus || null,
            old_status_label: oldStatusLabel,
            new_status_label: newStatusLabel,
          },
          created_by: user?.id,
        })
      }

      // Fire automation trigger for preference change on applied leads (fire-and-forget)
      const APPLIED_STAGES = ['applicant', 'application', 'puc_application_submission', 'puc_document_submission']
      const majorChanged = (
        updates.intended_major !== undefined && oldLead && updates.intended_major !== oldLead.intended_major
      ) || (
        updates.preferred_major !== undefined && oldLead && updates.preferred_major !== oldLead.preferred_major
      )
      const collegeChanged = updates.preferred_college !== undefined && oldLead && updates.preferred_college !== (oldLead as Record<string, unknown>).preferred_college
      if ((majorChanged || collegeChanged) && oldLead && APPLIED_STAGES.includes(oldLead.pipeline_stage as string)) {
        const oldMajor = (updates.intended_major !== undefined ? oldLead?.intended_major : oldLead?.preferred_major) || null
        const newMajor = updates.intended_major ?? updates.preferred_major ?? null
        executeAutomations({
          trigger: 'preference_changed',
          leadId: id,
          leadData: { ...oldLead, ...updates } as unknown as Record<string, unknown>,
          userId: user?.id,
          metadata: {
            old_major: oldMajor,
            new_major: newMajor,
            new_college: updates.preferred_college ?? null,
            pipeline_stage: oldLead.pipeline_stage,
          },
        }).catch(() => {}) // fire-and-forget
      }

      // Log activity for automatic funding type change due to low GPA
      if (wasAutoSF && oldLead) {
        const lowGpaValues: string[] = []
        if (mergedGpaData.gpa_grade_10 !== undefined && mergedGpaData.gpa_grade_10 !== null && mergedGpaData.gpa_grade_10 < GPA_SELF_FUNDED_THRESHOLD) {
          lowGpaValues.push(`Grade 10: ${mergedGpaData.gpa_grade_10}`)
        }
        if (mergedGpaData.gpa_grade_11 !== undefined && mergedGpaData.gpa_grade_11 !== null && mergedGpaData.gpa_grade_11 < GPA_SELF_FUNDED_THRESHOLD) {
          lowGpaValues.push(`Grade 11: ${mergedGpaData.gpa_grade_11}`)
        }
        if (mergedGpaData.gpa_grade_12_expected !== undefined && mergedGpaData.gpa_grade_12_expected !== null && mergedGpaData.gpa_grade_12_expected < GPA_SELF_FUNDED_THRESHOLD) {
          lowGpaValues.push(`Grade 12 Expected: ${mergedGpaData.gpa_grade_12_expected}`)
        }

        await supabase.from('activities').insert({
          lead_id: id,
          activity_type: 'funding_type_change',
          title: 'Auto Self-Funded (Low GPA)',
          description: `${oldLead.first_name} ${oldLead.last_name} automatically set to Self-Funded due to GPA below ${GPA_SELF_FUNDED_THRESHOLD} (${lowGpaValues.join(', ')})`,
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

      // Log activity for document status override change
      if (updates.puc_document_status_override !== undefined && oldLead) {
        const oldStatus = (oldLead as Record<string, unknown>).puc_document_status_override as string | null
        const newStatus = updates.puc_document_status_override as string | null
        if (oldStatus !== newStatus) {
          const oldLabel = oldStatus ? (PUC_DOCUMENT_STATUSES.find(s => s.value === oldStatus)?.label || oldStatus) : 'None'
          const newLabel = newStatus ? (PUC_DOCUMENT_STATUSES.find(s => s.value === newStatus)?.label || newStatus) : 'None'
          const isSystemChange = !user
          await supabase.from('activities').insert({
            lead_id: id,
            activity_type: 'doc_status_change',
            title: isSystemChange ? 'Doc Status Updated (System)' : 'Doc Status Override',
            description: `${oldLead.first_name} ${oldLead.last_name}: ${oldLabel} → ${newLabel}`,
            metadata: {
              old_status: oldStatus,
              new_status: newStatus,
              old_label: oldLabel,
              new_label: newLabel,
              changed_by: isSystemChange ? 'system' : 'agent',
            },
            created_by: user?.id,
          })
        }
      }

      // Log activity for auto PUC PSP routing
      if (wasAutoRoutedToPuc && oldLead) {
        await supabase.from('activities').insert({
          lead_id: id,
          activity_type: 'funding_type_change',
          title: 'Auto-Routed to PUC PSP',
          description: `${oldLead.first_name} ${oldLead.last_name} automatically routed to PUC PSP (Kuwaiti, GPA: ${mergedLeadForPuc.actual_gpa}, Grad Year: ${mergedLeadForPuc.graduation_year}, Not Employee)`,
          metadata: {
            old_funding_type: oldLead.funding_type,
            new_funding_type: 'puc',
            reason: 'puc_psp_auto_route',
            actual_gpa: mergedLeadForPuc.actual_gpa,
            graduation_year: mergedLeadForPuc.graduation_year,
            is_employee: mergedLeadForPuc.is_employee,
          },
          created_by: user?.id,
        })
      }

      // Log activity for lead source change
      if (updates.source !== undefined && oldLead && updates.source !== (oldLead as Record<string, unknown>).source) {
        const oldSource = (oldLead as Record<string, unknown>).source as string | null
        const oldCategory = (oldLead as Record<string, unknown>).source_category as string | null
        await supabase.from('activities').insert({
          lead_id: id,
          activity_type: 'source_change',
          title: 'Lead Source Changed',
          description: `${oldLead.first_name} ${oldLead.last_name}: ${oldSource || 'None'} → ${updates.source || 'None'}`,
          metadata: {
            old_source: oldSource || null,
            new_source: updates.source || null,
            old_category: oldCategory || null,
            new_category: updates.source_category || oldCategory || null,
          },
          created_by: user?.id,
        })
      }

      return { data, error: null }
    },
    onSuccess: () => {
      // Invalidate all lead lists so tab switches show updated stages immediately
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.stats() })
    },
  })

  const deleteLeadMutation = useMutation({
    mutationKey: ['lead-mutation'],
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      // Demo mode - simulate success
      if (isDemoMode()) {
        await new Promise(resolve => setTimeout(resolve, 300))
        return { error: null }
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Use the soft_delete_lead function to move the lead to deleted_leads table
      const { data, error } = await supabase
        .rpc("soft_delete_lead", {
          lead_id: id,
          deleting_user_id: user.id,
          reason: reason || null
        })

      if (error) throw new Error(error.message)
      return { error: null, deletedRecordId: data }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
    },
  })

  const bulkAssignMutation = useMutation({
    mutationKey: ['lead-mutation'],
    mutationFn: async ({ leadIds, agentId }: { leadIds: string[]; agentId: string }) => {
      // Demo mode - simulate success
      if (isDemoMode()) {
        await new Promise(resolve => setTimeout(resolve, 300))
        return { error: null, count: leadIds.length }
      }

      const { data: { user: currentUser } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from("leads")
        .update({
          assigned_to: agentId,
          assigned_at: new Date().toISOString(),
        })
        .in("id", leadIds)

      if (error) throw new Error(error.message)

      // Notify the assigned agent
      supabase.from('notifications').insert({
        user_id: agentId,
        type: 'new_assignment',
        title: `${leadIds.length} lead${leadIds.length > 1 ? 's' : ''} assigned to you`,
        body: `You have been assigned ${leadIds.length} new lead${leadIds.length > 1 ? 's' : ''}`,
        action_url: '/leads',
        created_by: currentUser?.id,
      }).then(() => {}) // fire-and-forget

      return { error: null, count: leadIds.length }
    },
    onSuccess: () => {
      // Intentionally not invalidating — leads stay in current view until user manually refreshes
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationKey: ['lead-mutation'],
    mutationFn: async ({ leadIds, reason }: { leadIds: string[]; reason?: string }) => {
      // Demo mode - simulate success
      if (isDemoMode()) {
        await new Promise(resolve => setTimeout(resolve, 300))
        return { error: null, count: leadIds.length }
      }

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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
    },
  })

  const bulkUpdateStageMutation = useMutation({
    mutationKey: ['lead-mutation'],
    mutationFn: async ({ leadIds, stage, lostReasonId, lostReasonNotes }: { leadIds: string[]; stage: PipelineStage; lostReasonId?: string; lostReasonNotes?: string }) => {
      // Demo mode - simulate success
      if (isDemoMode()) {
        await new Promise(resolve => setTimeout(resolve, 300))
        return { error: null, count: leadIds.length }
      }

      // Place bulk-moved leads at top of target stage
      let nextPos = await getTopPosition(stage)

      // Update each lead individually with sequential positions
      const errors: string[] = []
      for (const id of leadIds) {
        // Get old stage for lost_at_stage tracking
        let oldStage: PipelineStage | null = null
        if (stage === 'lost') {
          const { data: oldLead } = await supabase
            .from("leads")
            .select("pipeline_stage")
            .eq("id", id)
            .single()
          oldStage = oldLead?.pipeline_stage || null
        }

        const updateData: Record<string, unknown> = {
          pipeline_stage: stage,
          position_in_stage: nextPos,
          last_contacted_at: new Date().toISOString(),
        }

        if (stage === 'lost') {
          if (lostReasonId) {
            updateData.lost_reason_id = lostReasonId
          }
          if (lostReasonNotes) {
            updateData.lost_reason_notes = lostReasonNotes
          }
          if (oldStage && oldStage !== 'lost') {
            updateData.lost_at_stage = oldStage
          }
        }

        const { error } = await supabase
          .from("leads")
          .update(updateData)
          .eq("id", id)

        if (error) {
          errors.push(error.message)
        } else {
          nextPos++
        }
      }

      if (errors.length > 0) throw new Error(errors.join("; "))
      return { error: null, count: leadIds.length }
    },
    onSuccess: () => {
      // Intentionally not invalidating — leads stay in current view until user manually refreshes
    },
  })

  // Wrap mutations to preserve the same return type interface
  const createLead = async (leadData: Partial<Lead>) => {
    try {
      const result = await createLeadMutation.mutateAsync(leadData)
      return result
    } catch (err) {
      console.error("Error creating lead:", err)
      return { data: null, error: err instanceof Error ? err.message : "Failed to create lead" }
    }
  }

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    try {
      const result = await updateLeadMutation.mutateAsync({ id, updates })
      return result
    } catch (err) {
      console.error("Error updating lead:", err)
      return { data: null, error: err instanceof Error ? err.message : "Failed to update lead" }
    }
  }

  const updateLeadStage = async (id: string, stage: PipelineStage, lostReasonId?: string, lostReasonNotes?: string, withdrawalReason?: string, withdrawalNotes?: string) => {
    const updates: Partial<Lead> = { pipeline_stage: stage }

    if (stage === "lost" && lostReasonId) {
      updates.lost_reason_id = lostReasonId
      updates.lost_reason_notes = lostReasonNotes
    }

    if (stage === "withdraw" && withdrawalReason) {
      updates.withdrawal_reason = withdrawalReason
      updates.withdrawal_notes = withdrawalNotes
    }

    updates.last_contacted_at = new Date().toISOString()

    // Clear contact_status when moving to enrolled (no longer relevant)
    if (stage === "enrolled") {
      updates.contact_status = null as unknown as Lead['contact_status']
    }

    // Get old stage before update to check for test → application transition
    // and to track lost_at_stage when marking as lost
    let oldStage: PipelineStage | null = null
    if (!isDemoMode()) {
      const { data: oldLead } = await supabase
        .from("leads")
        .select("pipeline_stage")
        .eq("id", id)
        .single()
      oldStage = oldLead?.pipeline_stage || null
    }

    // Track which stage the lead was lost at
    if (stage === "lost" && oldStage && oldStage !== "lost") {
      updates.lost_at_stage = oldStage
    }

    const result = await updateLead(id, updates)

    // Trigger LMS sync when moving from 'test' to 'application'
    if (result.data && oldStage === "test" && stage === "application") {
      try {
        const lmsResponse = await fetch("/api/lms/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId: id }),
        })
        if (!lmsResponse.ok) {
          console.error("LMS sync returned error:", lmsResponse.status)
        }
      } catch (err) {
        // Log but don't fail the stage change
        console.error("LMS sync failed:", err)
      }
    }

    return result
  }

  const deleteLead = async (id: string, reason?: string) => {
    try {
      const result = await deleteLeadMutation.mutateAsync({ id, reason })
      return result
    } catch (err) {
      console.error("Error deleting lead:", err)
      return { error: err instanceof Error ? err.message : "Failed to delete lead" }
    }
  }

  const bulkAssignLeads = async (leadIds: string[], agentId: string) => {
    try {
      const result = await bulkAssignMutation.mutateAsync({ leadIds, agentId })
      return result
    } catch (err) {
      console.error("Error bulk assigning leads:", err)
      return { error: err instanceof Error ? err.message : "Failed to assign leads", count: 0 }
    }
  }

  const bulkDeleteLeads = async (leadIds: string[], reason?: string) => {
    try {
      const result = await bulkDeleteMutation.mutateAsync({ leadIds, reason })
      return result
    } catch (err) {
      console.error("Error bulk deleting leads:", err)
      return { error: err instanceof Error ? err.message : "Failed to delete leads", count: 0 }
    }
  }

  const bulkUpdateStage = async (leadIds: string[], stage: PipelineStage, lostReasonId?: string, lostReasonNotes?: string) => {
    try {
      const result = await bulkUpdateStageMutation.mutateAsync({ leadIds, stage, lostReasonId, lostReasonNotes })
      return result
    } catch (err) {
      console.error("Error bulk updating stage:", err)
      return { error: err instanceof Error ? err.message : "Failed to update leads", count: 0 }
    }
  }

  // TODO: This uses read-then-write which has a race condition under concurrent calls.
  // Ideally, replace with a Supabase RPC like: supabase.rpc('increment_contact_count', { lead_id: leadId })
  // For now, the read-then-write approach is acceptable for typical usage patterns.
  const incrementContactCount = async (leadId: string) => {
    try {
      const { data: lead } = await supabase
        .from("leads")
        .select("contact_count")
        .eq("id", leadId)
        .single()

      await supabase
        .from("leads")
        .update({
          contact_count: ((lead as unknown as Record<string, number>)?.contact_count || 0) + 1,
          last_contacted_at: new Date().toISOString(),
        })
        .eq("id", leadId)

      // Invalidate to reflect updated contact count
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.detail(leadId) })
    } catch (err) {
      console.error("Error incrementing contact count:", err)
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
    incrementContactCount,
    loading
  }
}

export function useLeadStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: queryKeys.leads.stats(),
    queryFn: async () => {
      // Check for demo mode
      if (isDemoMode()) {
        return getDemoLeadStats()
      }

      const supabase = createClient()

      // Get all leads for stage counts
      const { data: leads, error } = await supabase
        .from("leads")
        .select("pipeline_stage, created_at")

      if (error) throw new Error(error.message)

      const byStage: Record<string, number> = {}
      // Initialize all pipeline stages to 0
      const stages: PipelineStage[] = [
        "new", "contacted", "visit", "test", "application", "applicant", "enrolled", "lost"
      ]

      stages.forEach(stage => {
        byStage[stage] = 0
      })

      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      let thisMonth = 0
      let enrolled = 0

      const rows = (leads ?? []) as LeadStatsRow[]
      rows.forEach(lead => {
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

      return {
        total,
        byStage: byStage as Record<PipelineStage, number>,
        thisMonth,
        conversionRate,
      }
    },
    staleTime: 30_000,
  })

  return {
    stats: stats ?? {
      total: 0,
      byStage: {} as Record<PipelineStage, number>,
      thisMonth: 0,
      conversionRate: 0,
    },
    loading: isLoading,
  }
}

export function useLostReasons() {
  const { data: reasons = [], isLoading } = useQuery<LostReason[]>({
    queryKey: queryKeys.leads.lostReasons(),
    queryFn: async () => {
      if (isDemoMode()) {
        // Demo data - all lost reasons matching database
        return [
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
          // Academic (additional)
          { id: '30', category: 'academic', reason_en: 'Repeat School Year', reason_ar: 'إعادة سنة دراسية', is_active: true },
        ]
      }

      const supabase = createClient()

      const { data, error } = await supabase
        .from('lost_reasons')
        .select('*')
        .eq('is_active', true)
        .order('category')

      if (error) throw new Error(error.message)
      return data || []
    },
    staleTime: 5 * 60_000, // Lost reasons rarely change, cache for 5 minutes
  })

  return { reasons, loading: isLoading }
}
