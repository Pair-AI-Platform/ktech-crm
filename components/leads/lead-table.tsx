"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
  UserPlus,
  Calendar,
  Trash2,
  BookOpen,
  Send,
} from "lucide-react"
import { PIPELINE_STAGES, LEAD_STATUSES, LOCKED_STAGES, SF_DOCUMENTS, type Lead, type PipelineStage, type LeadStatus, type SubmissionSubstage, type SubmissionStatus, type OrientationStatus, type PUCDocumentStatus } from "@/types"
import { getDocumentsForGraduateType, type GraduateType } from "@/lib/psp/document-rules"
import { useLeadMutations } from "@/lib/hooks/use-leads"
import { useStageSettings } from "@/lib/hooks/use-stage-settings"
import { createClient } from "@/lib/supabase/client"
import type { SubmissionBlockedReason } from "@/types"

import { checkAllDocumentsUploaded, type SortField, type SortDirection } from "./lead-table-utils"
import { LeadTableHeader } from "./lead-table-columns"
import { LeadTableRow } from "./lead-table-row"
import { LeadTableDialogs } from "./lead-table-dialogs"
import { getLeadDisplayName } from "@/lib/lead-utils"
import { checkStageTransition } from "@/lib/lead-stage-guards"

interface LeadTableProps {
  leads: Lead[]
  loading?: boolean
  selectedLeads: string[]
  onSelectLead: (id: string) => void
  onSelectAll: () => void
  onLeadClick?: (lead: Lead) => void
  onEditLead?: (lead: Lead) => void
  currentStageFilter?: PipelineStage | "all"
  fundingTypeFilter?: "all" | "self_funded" | "puc"
  currentPage?: number
  totalPages?: number
  totalCount?: number
  pageSize?: number
  onPageChange?: (page: number) => void
}

export function LeadTable({
  leads,
  loading,
  selectedLeads,
  onSelectLead,
  onSelectAll,
  onLeadClick,
  currentStageFilter,
  fundingTypeFilter,
  currentPage = 1,
  totalPages = 1,
  totalCount,
  pageSize = 50,
  onPageChange,
}: LeadTableProps) {
  const { updateLeadStage, updateLead, incrementContactCount } = useLeadMutations()
  const { settings: stageSettings } = useStageSettings()
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [editingStage, setEditingStage] = useState<string | null>(null)
  const [editingSchool, setEditingSchool] = useState<string | null>(null)
  const [editingStatus, setEditingStatus] = useState<string | null>(null)
  const [editingGpa, setEditingGpa] = useState<{ leadId: string; field: 'expected_gpa' | 'actual_gpa' } | null>(null)
  const [gpaInputValue, setGpaInputValue] = useState<string>("")
  const [openPreferenceForLead, setOpenPreferenceForLead] = useState<string | null>(null)
  const [editingSubmissionSubstage, setEditingSubmissionSubstage] = useState<string | null>(null)
  const [editingSubmissionStatus, setEditingSubmissionStatus] = useState<string | null>(null)
  const [editingDocStatus, setEditingDocStatus] = useState<string | null>(null)
  const [bookingLead, setBookingLead] = useState<Lead | null>(null)
  const [, setBookingSimpleMode] = useState(false)
  const [bookingCallbackMode, setBookingCallbackMode] = useState(false)
  const [callbackLead, setCallbackLead] = useState<Lead | null>(null)
  const [callbackFromStage, setCallbackFromStage] = useState<PipelineStage | undefined>(undefined)
  const [documentCompleteLeads, setDocumentCompleteLeads] = useState<Set<string>>(new Set())
  const [, setSfGreenLeads] = useState<Set<string>>(new Set())
  const [sfPaymentData, setSfPaymentData] = useState<Record<string, { amount_paid: number; sf_enrolled_stage?: string }>>({})
  const [registrationSentLeads, setRegistrationSentLeads] = useState<Set<string>>(new Set())
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null)
  const [lostDialogLead, setLostDialogLead] = useState<Lead | null>(null)
  const [assignReasonMode, setAssignReasonMode] = useState(false)
  const [contactedDialogLead, setContactedDialogLead] = useState<Lead | null>(null)
  const [blockedDialogLead, setBlockedDialogLead] = useState<Lead | null>(null)
  const [withdrawDialogLead, setWithdrawDialogLead] = useState<Lead | null>(null)
  const [editWithdrawReasonLead, setEditWithdrawReasonLead] = useState<Lead | null>(null)
  const [paymentDialogLead, setPaymentDialogLead] = useState<Lead | null>(null)
  const [fileFeeDialogLead, setFileFeeDialogLead] = useState<Lead | null>(null)
  const [pspWizardLead, setPspWizardLead] = useState<Lead | null>(null)
  const [pucPaymentLeads, setPucPaymentLeads] = useState<Set<string>>(new Set())
  const [pucDocCounts, setPucDocCounts] = useState<Record<string, { uploaded: number; required: number }>>({})
  const [editingOrientationStatus, setEditingOrientationStatus] = useState<string | null>(null)
  const [viewingAppointment, setViewingAppointment] = useState<import("@/types").Appointment | null>(null)

  // Check if we're viewing submission stage
  // Auto-enable PUC view when viewing PUC-specific stages (even without funding type filter)
  const isPucSrjView = fundingTypeFilter === 'puc' || currentStageFilter === 'puc_document_submission' || currentStageFilter === 'puc_application_submission'
  const isWithdrawView = currentStageFilter === 'withdraw'
  const isSubmissionView = !isWithdrawView && (currentStageFilter === 'applicant' || isPucSrjView)
  const isLostView = currentStageFilter === 'lost'
  const isEnrolledView = currentStageFilter === 'enrolled'
  // SF applicant view: show orientation status column
  const isApplicantSFView = currentStageFilter === 'applicant' && !isPucSrjView
  // PUC Applicant view: show orientation instead of status
  const isPucApplicantView = isPucSrjView && currentStageFilter === 'applicant'
  // PUC Doc Submission view: show doc status column
  const isPucDocSubmissionView = currentStageFilter === 'puc_document_submission'
  const isPucContactedView = isPucSrjView && currentStageFilter === 'contacted'
  const isPucAppSubmissionView = currentStageFilter === 'puc_application_submission'

  // Function to refresh document completion status
  const refreshDocumentStatus = React.useCallback(() => {
    const submissionLeads = leads.filter(
      lead => ['application', 'applicant'].includes(lead.pipeline_stage)
    )

    if (submissionLeads.length === 0) {
      setDocumentCompleteLeads(new Set())
      return
    }

    const completeLeadIds = new Set<string>()
    submissionLeads.forEach(lead => {
      if (checkAllDocumentsUploaded(lead.id)) {
        completeLeadIds.add(lead.id)
      }
    })

    setDocumentCompleteLeads(completeLeadIds)
  }, [leads])

  // Check document completion status for leads in submission stage
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshDocumentStatus()
  }, [refreshDocumentStatus])

  // Fetch student data for SF leads to check payment > 150 KD + documents done
  const refreshSfGreenStatus = useCallback(async () => {
    const sfLeads = leads.filter(l => l.funding_type === 'self_funded')
    if (sfLeads.length === 0) {
      setSfGreenLeads(new Set())
      return
    }

    try {
      const supabase = createClient()
      const sfLeadIds = sfLeads.map(l => l.id)

      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('lead_id, amount_paid, sf_enrolled_stage, sf_declaration_submitted, sf_passport_submitted, sf_civil_id_submitted, sf_payment_receipt_submitted, sf_official_transcript_submitted, transfer_type')
        .in('lead_id', sfLeadIds)

      if (studentsError) {
        console.warn('[LeadTable] Failed to fetch SF student data:', studentsError?.message || studentsError)
        return
      }

      const greenIds = new Set<string>()
      const paymentMap: Record<string, { amount_paid: number; sf_enrolled_stage?: string }> = {}

      // Build set of lead IDs that have a student record
      const leadsWithStudent = new Set<string>()

      if (students && students.length > 0) {
        for (const student of students) {
          if (!student.lead_id) continue
          leadsWithStudent.add(student.lead_id)

          // Store payment data for display
          paymentMap[student.lead_id] = {
            amount_paid: student.amount_paid || 0,
            sf_enrolled_stage: student.sf_enrolled_stage ?? undefined,
          }

          // Check paid more than 150 KD
          const paidOver150 = student.amount_paid > 150 ||
            student.sf_enrolled_stage === '400' ||
            student.sf_enrolled_stage === 'other'
          if (!paidOver150) continue

          // Check all SF documents are done
          const isTransfer = !!student.transfer_type
          const allDocsDone = SF_DOCUMENTS.every(doc => {
            if ('transferOnly' in doc && doc.transferOnly && !isTransfer) return true
            return !!student[doc.key as keyof typeof student]
          })
          if (!allDocsDone) continue

          greenIds.add(student.lead_id)
        }
      }

      // For SF leads without a student record, check payment_transactions
      const leadsWithoutStudent = sfLeadIds.filter(id => !leadsWithStudent.has(id))
      if (leadsWithoutStudent.length > 0) {
        const { data: transactions, error: txError } = await supabase
          .from('payment_transactions')
          .select('lead_id, amount')
          .in('lead_id', leadsWithoutStudent)
          .eq('status', 'completed')

        if (txError) {
          console.warn('[LeadTable] Failed to fetch SF payment transactions:', txError?.message || txError)
        } else if (transactions && transactions.length > 0) {
          // Sum completed transaction amounts per lead
          const txTotals: Record<string, number> = {}
          for (const tx of transactions) {
            if (!tx.lead_id) continue
            txTotals[tx.lead_id] = (txTotals[tx.lead_id] || 0) + (tx.amount || 0)
          }
          for (const [leadId, total] of Object.entries(txTotals)) {
            paymentMap[leadId] = {
              amount_paid: total,
            }
          }
        }
      }

      setSfGreenLeads(greenIds)
      setSfPaymentData(paymentMap)
    } catch (error) {
      console.warn('[LeadTable] Unexpected error refreshing SF green status:', error)
    }
  }, [leads])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- triggers data fetch on mount
    refreshSfGreenStatus()
  }, [refreshSfGreenStatus])

  // Fetch PUC payment status for PUC leads
  const refreshPucPaymentStatus = useCallback(async () => {
    if (!isPucSrjView) {
      setPucPaymentLeads(new Set())
      return
    }
    const pucLeads = leads.filter(l => l.funding_type === 'puc')
    if (pucLeads.length === 0) {
      setPucPaymentLeads(new Set())
      return
    }
    try {
      const supabase = createClient()
      const pucLeadIds = pucLeads.map(l => l.id)
      const { data: transactions, error } = await supabase
        .from('payment_transactions')
        .select('lead_id')
        .in('lead_id', pucLeadIds)
        .eq('status', 'completed')
        .eq('notes', 'PSP Fee Payment')
      if (error) {
        console.warn('[LeadTable] Failed to fetch PUC payment status:', error?.message || error)
        return
      }
      if (transactions) {
        setPucPaymentLeads(new Set(transactions.map(t => t.lead_id)))
      }
    } catch (error) {
      console.warn('[LeadTable] Unexpected error refreshing PUC payment status:', error)
    }
  }, [leads, isPucSrjView])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- triggers data fetch on mount
    refreshPucPaymentStatus()
  }, [refreshPucPaymentStatus])

  // Fetch PUC document counts from psp_documents table + DB configs for required counts
  const refreshPucDocCounts = useCallback(async () => {
    const pucLeads = leads.filter(l => l.funding_type === 'puc')
    if (pucLeads.length === 0) {
      setPucDocCounts({})
      return
    }
    try {
      const supabase = createClient()
      const pucLeadIds = pucLeads.map(l => l.id)

      // Fetch uploaded docs and DB document configs in parallel
      const [docsResult, configsResult] = await Promise.all([
        supabase
          .from('psp_documents')
          .select('lead_id, document_type, graduate_type')
          .in('lead_id', pucLeadIds),
        supabase
          .from('psp_document_configs')
          .select('graduate_type, document_id, required')
          .eq('is_active', true),
      ])

      if (docsResult.error) {
        console.warn('[LeadTable] Failed to fetch PUC documents:', docsResult.error?.message || docsResult.error)
        return
      }
      if (configsResult.error) {
        console.warn('[LeadTable] Failed to fetch PUC document configs:', configsResult.error?.message || configsResult.error)
        return
      }

      const docs = docsResult.data
      const dbConfigs = configsResult.data

      // Build required counts from DB configs, grouped by graduate type
      const dbRequiredCounts: Record<string, number> = {}
      if (dbConfigs && dbConfigs.length > 0) {
        for (const cfg of dbConfigs) {
          if (cfg.required) {
            const key = cfg.graduate_type.toUpperCase()
            dbRequiredCounts[key] = (dbRequiredCounts[key] || 0) + 1
          }
        }
      }

      // Group uploaded docs by lead_id and track graduate type
      const uploadedMap: Record<string, { count: number; gradType: string }> = {}
      if (docs) {
        for (const doc of docs) {
          if (!uploadedMap[doc.lead_id]) {
            uploadedMap[doc.lead_id] = { count: 0, gradType: doc.graduate_type?.toUpperCase() || '' }
          }
          uploadedMap[doc.lead_id].count += 1
          if (!uploadedMap[doc.lead_id].gradType && doc.graduate_type) {
            uploadedMap[doc.lead_id].gradType = doc.graduate_type.toUpperCase()
          }
        }
      }

      // Build result for ALL PUC leads, using education_type as fallback for graduate type
      const hasDbConfigs = dbConfigs && dbConfigs.length > 0
      const result: Record<string, { uploaded: number; required: number }> = {}
      for (const lead of pucLeads) {
        const uploaded = uploadedMap[lead.id]?.count ?? 0
        const gradType = uploadedMap[lead.id]?.gradType || lead.education_type?.toUpperCase() || ''

        let requiredCount = 0
        if (gradType) {
          if (hasDbConfigs && dbRequiredCounts[gradType] !== undefined) {
            // Use DB configs if available
            requiredCount = dbRequiredCounts[gradType]
          } else {
            // Fallback to hardcoded rules
            const allDocs = getDocumentsForGraduateType(gradType as GraduateType, {
              isTransfer: lead.is_transfer_student,
              isSpecialNeeds: lead.is_special_needs,
              isDiplomatic: lead.is_diplomatic,
            })
            requiredCount = allDocs.filter(d => d.required).length
          }
        }
        result[lead.id] = { uploaded, required: requiredCount }
      }
      setPucDocCounts(result)
    } catch (error) {
      console.warn('[LeadTable] Unexpected error refreshing PUC doc counts:', error)
    }
  }, [leads])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- triggers data fetch on mount
    refreshPucDocCounts()
  }, [refreshPucDocCounts])

  // Check which SF leads have been sent to registration (localStorage flag)
  const refreshRegistrationStatus = useCallback(() => {
    const sfLeads = leads.filter(l => l.funding_type === 'self_funded')
    const sentIds = new Set<string>()
    sfLeads.forEach(l => {
      if (localStorage.getItem(`sf-sent-to-registration-${l.id}`) === 'true') {
        sentIds.add(l.id)
      }
    })
    setRegistrationSentLeads(sentIds)
  }, [leads])

  useEffect(() => {
    refreshRegistrationStatus()
    // Listen for storage events (from sf-document-manager dispatching)
    const handler = () => refreshRegistrationStatus()
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [refreshRegistrationStatus])

  // Optimistic updates - store pending changes locally
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, Partial<Lead>>>({})

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const PRIORITY_WEIGHT: Record<string, number> = { critical: 0, important: 1, normal: 2 }

  const sortedLeads = [...leads].sort((a, b) => {
    // Always sort by priority first (critical > important > normal/undefined)
    const aPriority = PRIORITY_WEIGHT[a.priority || 'normal'] ?? 2
    const bPriority = PRIORITY_WEIGHT[b.priority || 'normal'] ?? 2
    if (aPriority !== bPriority) return aPriority - bPriority

    let comparison = 0
    switch (sortField) {
      case "name":
        comparison = getLeadDisplayName(a).localeCompare(getLeadDisplayName(b), 'ar')
        break
      case "pipeline_stage":
        const stageOrder = stageSettings.length > 0
          ? stageSettings.map(s => s.stage)
          : PIPELINE_STAGES.map(s => s.value)
        comparison = stageOrder.indexOf(a.pipeline_stage) - stageOrder.indexOf(b.pipeline_stage)
        break
      case "source":
        comparison = a.source.localeCompare(b.source)
        break
      case "school":
        comparison = (a.school || "").localeCompare(b.school || "")
        break
      case "expected_gpa":
        // nulls last: leads without value go to bottom regardless of direction
        if (a.expected_gpa == null && b.expected_gpa == null) { comparison = 0; break }
        if (a.expected_gpa == null) { return 1 }
        if (b.expected_gpa == null) { return -1 }
        comparison = a.expected_gpa - b.expected_gpa
        break
      case "actual_gpa":
        if (a.actual_gpa == null && b.actual_gpa == null) { comparison = 0; break }
        if (a.actual_gpa == null) { return 1 }
        if (b.actual_gpa == null) { return -1 }
        comparison = a.actual_gpa - b.actual_gpa
        break
    }
    return sortDirection === "asc" ? comparison : -comparison
  })

  const showSubstageColumn = sortedLeads.some(
    lead => !(lead.funding_type === 'self_funded' && lead.pipeline_stage === 'applicant')
  )

  const handleStageChange = async (leadId: string, newStage: PipelineStage) => {
    const lead = leads.find(l => l.id === leadId)
    if (lead) {
      const guard = checkStageTransition({
        lead,
        newStage,
        amountPaid: sfPaymentData[leadId]?.amount_paid ?? 0,
        isPucSrjView,
      })
      switch (guard.kind) {
        case "lost":
          setLostDialogLead(guard.lead)
          return
        case "withdraw":
          setWithdrawDialogLead(guard.lead)
          return
        case "contacted":
          setContactedDialogLead(guard.lead)
          return
        case "file_fee":
          setFileFeeDialogLead(guard.lead)
          return
        case "enrollment_payment":
          setPaymentDialogLead(guard.lead)
          return
        case "allow":
          break
      }
    }

    // Optimistic update - immediately show the new value
    // Always clear status when changing stage so user must re-select
    const nextCount = getNextCount(leadId)
    setPendingUpdates(prev => ({
      ...prev,
      [leadId]: { ...prev[leadId], pipeline_stage: newStage, status: undefined, contact_count: nextCount }
    }))
    setEditingStage(leadId)

    // Update stage and clear status
    let result
    result = await updateLead(leadId, { pipeline_stage: newStage, status: null as unknown as Lead['status'] })

    setEditingStage(null)
    // Clear pending update after API call (whether success or failure)
    // On success, the real-time subscription will update with actual data
    // On failure, we revert by clearing the pending update
    if (result.error) {
      setPendingUpdates(prev => {
        const updated = { ...prev }
        if (updated[leadId]) {
          delete updated[leadId].pipeline_stage
          delete updated[leadId].contact_count
          delete updated[leadId].status
          if (Object.keys(updated[leadId]).length === 0) {
            delete updated[leadId]
          }
        }
        return updated
      })
    }

    // After moving to "puc_document_submission", open PSP wizard
    if (newStage === 'puc_document_submission' && !result.error && isPucSrjView) {
      const lead = leads.find(l => l.id === leadId)
      if (lead) {
        setPspWizardLead({ ...lead, pipeline_stage: newStage })
      }
    }

    // Note: "applicant" stage for unpaid non-PUC leads is intercepted above (before stage update)
    // Payment dialog opens first, and the RPC promotes the lead after payment
  }

  const handleLostConfirm = async (reasonId: string, notes?: string) => {
    if (!lostDialogLead) return

    const leadId = lostDialogLead.id
    // Optimistic update
    const nextCount = getNextCount(leadId)
    setPendingUpdates(prev => ({ ...prev, [leadId]: { ...prev[leadId], pipeline_stage: 'lost' as PipelineStage, contact_count: nextCount } }))
    setEditingStage(leadId)

    const result = await updateLeadStage(leadId, 'lost' as PipelineStage, reasonId, notes)

    setEditingStage(null)
    setLostDialogLead(null)
    setAssignReasonMode(false)
    if (result.error) {
      setPendingUpdates(prev => {
        const updated = { ...prev }
        if (updated[leadId]) {
          delete updated[leadId].pipeline_stage
          delete updated[leadId].contact_count
          if (Object.keys(updated[leadId]).length === 0) {
            delete updated[leadId]
          }
        }
        return updated
      })
    }
  }

  const handleAssignLostReason = async (reasonId: string, notes?: string) => {
    if (!lostDialogLead) return
    const leadId = lostDialogLead.id
    setLostDialogLead(null)
    setAssignReasonMode(false)
    await updateLead(leadId, { lost_reason_id: reasonId, lost_reason_notes: notes || null } as Partial<Lead>)
  }

  const openAssignReasonDialog = useCallback((lead: Lead) => {
    setAssignReasonMode(true)
    setLostDialogLead(lead)
  }, [])

  const handleContactedConfirm = async (status: LeadStatus, notes?: string) => {
    if (!contactedDialogLead) return

    const leadId = contactedDialogLead.id
    const nextCount = getNextCount(leadId)
    // Optimistic update - set both stage and status
    setPendingUpdates(prev => ({
      ...prev,
      [leadId]: { ...prev[leadId], pipeline_stage: 'contacted' as PipelineStage, status, contact_count: nextCount }
    }))
    setEditingStage(leadId)

    const updateData: Partial<Lead> = { pipeline_stage: 'contacted' as PipelineStage, status }
    if (notes) updateData.notes = notes
    const result = await updateLead(leadId, updateData)

    setEditingStage(null)
    setContactedDialogLead(null)
    if (result.error) {
      setPendingUpdates(prev => {
        const updated = { ...prev }
        if (updated[leadId]) {
          delete updated[leadId].pipeline_stage
          delete updated[leadId].status
          delete updated[leadId].contact_count
          if (Object.keys(updated[leadId]).length === 0) {
            delete updated[leadId]
          }
        }
        return updated
      })
    }
  }


  const handleBlockedConfirm = async (reason: SubmissionBlockedReason, notes?: string) => {
    if (!blockedDialogLead) return
    const leadId = blockedDialogLead.id
    await updateLead(leadId, {
      submission_blocked_reason: reason,
      submission_blocked_reason_notes: notes || undefined,
    })
    setBlockedDialogLead(null)
  }

  const handleWithdrawConfirm = async (reason: string, notes?: string) => {
    if (!withdrawDialogLead) return

    const leadId = withdrawDialogLead.id
    const nextCount = getNextCount(leadId)
    // Optimistic update
    setPendingUpdates(prev => ({ ...prev, [leadId]: { ...prev[leadId], pipeline_stage: 'withdraw' as PipelineStage, contact_count: nextCount } }))
    setEditingStage(leadId)

    const result = await updateLeadStage(leadId, 'withdraw' as PipelineStage, undefined, undefined, reason, notes)

    setEditingStage(null)
    setWithdrawDialogLead(null)
    if (result.error) {
      setPendingUpdates(prev => {
        const updated = { ...prev }
        if (updated[leadId]) {
          delete updated[leadId].pipeline_stage
          delete updated[leadId].contact_count
          if (Object.keys(updated[leadId]).length === 0) {
            delete updated[leadId]
          }
        }
        return updated
      })
    }
  }

  const handleEditWithdrawReasonConfirm = async (reason: string, notes?: string) => {
    if (!editWithdrawReasonLead) return
    const leadId = editWithdrawReasonLead.id
    const nextCount = getNextCount(leadId)
    // Optimistic update
    setPendingUpdates(prev => ({ ...prev, [leadId]: { ...prev[leadId], withdrawal_reason: reason, withdrawal_notes: notes || null, contact_count: nextCount } }))
    setEditWithdrawReasonLead(null)
    const result = await updateLead(leadId, {
      withdrawal_reason: reason,
      withdrawal_notes: notes || null,
    })
    if (result.error) {
      setPendingUpdates(prev => {
        const updated = { ...prev }
        if (updated[leadId]) {
          delete updated[leadId].withdrawal_reason
          delete updated[leadId].withdrawal_notes
          delete updated[leadId].contact_count
          if (Object.keys(updated[leadId]).length === 0) {
            delete updated[leadId]
          }
        }
        return updated
      })
    }
  }

  const handleSchoolChange = async (leadId: string, newSchool: string) => {
    // Optimistic update
    const nextCount = getNextCount(leadId)
    setPendingUpdates(prev => ({ ...prev, [leadId]: { ...prev[leadId], school: newSchool as Lead['school'], contact_count: nextCount } }))
    setEditingSchool(leadId)

    const result = await updateLead(leadId, { school: newSchool as Lead['school'] })

    setEditingSchool(null)
    if (result.error) {
      setPendingUpdates(prev => {
        const updated = { ...prev }
        if (updated[leadId]) {
          delete updated[leadId].school
          delete updated[leadId].contact_count
          if (Object.keys(updated[leadId]).length === 0) {
            delete updated[leadId]
          }
        }
        return updated
      })
    }
  }

  const handleGpaEdit = (leadId: string, field: 'expected_gpa' | 'actual_gpa', currentValue?: number) => {
    setEditingGpa({ leadId, field })
    setGpaInputValue(currentValue != null ? String(currentValue) : "")
  }

  const handleGpaSave = async () => {
    if (!editingGpa) return
    const { leadId, field } = editingGpa
    const parsed = gpaInputValue === "" ? null : parseFloat(gpaInputValue)
    if (parsed !== null && (isNaN(parsed) || parsed < 0 || parsed > 100)) {
      setEditingGpa(null)
      return
    }
    const value = parsed ?? undefined
    const nextCount = getNextCount(leadId)
    setPendingUpdates(prev => ({ ...prev, [leadId]: { ...prev[leadId], [field]: value, contact_count: nextCount } }))
    setEditingGpa(null)
    const result = await updateLead(leadId, { [field]: value })
    if (result.error) {
      setPendingUpdates(prev => {
        const updated = { ...prev }
        if (updated[leadId]) {
          delete updated[leadId][field]
          delete updated[leadId].contact_count
          if (Object.keys(updated[leadId]).length === 0) delete updated[leadId]
        }
        return updated
      })
    }
  }

  // Maps blocked statuses to their corresponding preferred college
  const STATUS_TO_COLLEGE: Record<string, string> = {
    blocked_ku: 'KU',
    blocked_paaet: 'PAAET',
    blocked_aasu: 'AASU',
    blocked_abroad: 'abroad',
    blocked_auk: 'AUK',
    blocked_gust: 'GUST',
    blocked_acm: 'ACM',
    blocked_other: 'other',
  }

  const handleCollegeChange = async (leadId: string, value: string) => {
    const college = value || undefined
    setPendingUpdates(prev => ({ ...prev, [leadId]: { ...prev[leadId], preferred_college: college } }))
    const result = await updateLead(leadId, { preferred_college: college })
    if (result.error) {
      setPendingUpdates(prev => {
        const updated = { ...prev }
        if (updated[leadId]) {
          delete updated[leadId].preferred_college
          if (Object.keys(updated[leadId]).length === 0) delete updated[leadId]
        }
        return updated
      })
    }
  }

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    // Optimistic update - increment contact_count on every status change
    const nextCount = getNextCount(leadId)
    setPendingUpdates(prev => ({
      ...prev,
      [leadId]: {
        ...prev[leadId],
        status: newStatus,
        contact_count: nextCount,
      },
    }))
    setEditingStatus(leadId)

    const result = await updateLead(leadId, { status: newStatus })

    setEditingStatus(null)
    if (result.error) {
      setPendingUpdates(prev => {
        const updated = { ...prev }
        if (updated[leadId]) {
          delete updated[leadId].status
          delete updated[leadId].contact_count
          if (Object.keys(updated[leadId]).length === 0) {
            delete updated[leadId]
          }
        }
        return updated
      })
    } else {
      // If status changed to Callback, open dedicated callback scheduler popup
      if (newStatus === 'callback') {
        const lead = leads.find(l => l.id === leadId)
        if (lead) {
          setCallbackFromStage(lead.pipeline_stage)
          setCallbackLead(lead)
        }
      }
      // If status changed to Postponed, open appointment booking popup to reschedule
      if (newStatus === 'postponed') {
        const lead = leads.find(l => l.id === leadId)
        if (lead) {
          setBookingSimpleMode(true)
          setBookingCallbackMode(false)
          setBookingLead(lead)
        }
      }
      // If status changed to changed_preferences, open the preference dropdown
      if (newStatus === 'changed_preferences') {
        setOpenPreferenceForLead(leadId)
      }

      // Auto-set preferred_college if this blocked status maps to a college and none is set yet
      if (newStatus.startsWith('blocked_')) {
        const mappedCollege = STATUS_TO_COLLEGE[newStatus]
        const currentCollege = pendingUpdates[leadId]?.preferred_college ?? leads.find(l => l.id === leadId)?.preferred_college
        if (mappedCollege && !currentCollege) {
          handleCollegeChange(leadId, mappedCollege)
        }
      }
    }
  }

  const handleSubmissionSubstageChange = async (leadId: string, newSubstage: SubmissionSubstage) => {
    // Optimistic update
    const nextCount = getNextCount(leadId)
    setPendingUpdates(prev => ({ ...prev, [leadId]: { ...prev[leadId], submission_substage: newSubstage, contact_count: nextCount } }))
    setEditingSubmissionSubstage(leadId)

    const result = await updateLead(leadId, { submission_substage: newSubstage })

    setEditingSubmissionSubstage(null)
    if (result.error) {
      setPendingUpdates(prev => {
        const updated = { ...prev }
        if (updated[leadId]) {
          delete updated[leadId].submission_substage
          delete updated[leadId].contact_count
          if (Object.keys(updated[leadId]).length === 0) {
            delete updated[leadId]
          }
        }
        return updated
      })
    }
  }

  const handleSubmissionStatusChange = async (leadId: string, newStatus: SubmissionStatus) => {
    // Optimistic update
    const nextCount = getNextCount(leadId)
    setPendingUpdates(prev => ({ ...prev, [leadId]: { ...prev[leadId], submission_status: newStatus, contact_count: nextCount } }))
    setEditingSubmissionStatus(leadId)

    const result = await updateLead(leadId, { submission_status: newStatus })

    setEditingSubmissionStatus(null)
    if (result.error) {
      setPendingUpdates(prev => {
        const updated = { ...prev }
        if (updated[leadId]) {
          delete updated[leadId].submission_status
          delete updated[leadId].contact_count
          if (Object.keys(updated[leadId]).length === 0) {
            delete updated[leadId]
          }
        }
        return updated
      })
    }
  }

  const handleOrientationStatusChange = async (leadId: string, newStatus: OrientationStatus | '') => {
    const value = newStatus === '' ? null : newStatus
    const nextCount = getNextCount(leadId)
    setPendingUpdates(prev => ({ ...prev, [leadId]: { ...prev[leadId], orientation_status: value ?? undefined, contact_count: nextCount } }))
    setEditingOrientationStatus(leadId)

    const result = await updateLead(leadId, { orientation_status: value } as Partial<Lead>)

    setEditingOrientationStatus(null)
    if (result.error) {
      setPendingUpdates(prev => {
        const updated = { ...prev }
        if (updated[leadId]) {
          delete updated[leadId].orientation_status
          delete updated[leadId].contact_count
          if (Object.keys(updated[leadId]).length === 0) {
            delete updated[leadId]
          }
        }
        return updated
      })
    }
  }

  const handleDocStatusOverrideChange = async (leadId: string, newStatus: PUCDocumentStatus | '') => {
    const value = newStatus === '' ? null : newStatus
    setPendingUpdates(prev => ({ ...prev, [leadId]: { ...prev[leadId], puc_document_status_override: value ?? undefined } }))
    setEditingDocStatus(leadId)

    const result = await updateLead(leadId, { puc_document_status_override: value } as Partial<Lead>)

    setEditingDocStatus(null)
    if (result.error) {
      setPendingUpdates(prev => {
        const updated = { ...prev }
        if (updated[leadId]) {
          delete updated[leadId].puc_document_status_override
          if (Object.keys(updated[leadId]).length === 0) {
            delete updated[leadId]
          }
        }
        return updated
      })
    }
  }

  // Helper to get effective value with pending updates
  const getEffectiveValue = <K extends keyof Lead>(leadId: string, field: K, originalValue: Lead[K]): Lead[K] => {
    const pending = pendingUpdates[leadId]
    if (pending && field in pending) {
      return pending[field] as Lead[K]
    }
    return originalValue
  }

  // Helper to get the next optimistic contact_count for a lead
  const getNextCount = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId)
    const current = lead ? (getEffectiveValue(leadId, 'contact_count', lead.contact_count) || 0) : 0
    return current + 1
  }

  // Clear pending updates only for leads that have been updated in the new data
  // This prevents clearing pending updates while the API call is still in progress
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPendingUpdates(prev => {
      if (Object.keys(prev).length === 0) return prev

      const updated = { ...prev }
      // Only clear pending updates for leads where the server data matches the pending value
      for (const leadId of Object.keys(prev)) {
        const lead = leads.find(l => l.id === leadId)
        const pending = prev[leadId]
        if (lead && pending) {
          let shouldClear = true
          // Check if all pending fields now match the server data
          for (const field of Object.keys(pending) as (keyof Lead)[]) {
            if (lead[field] !== pending[field]) {
              shouldClear = false
              break
            }
          }
          if (shouldClear) {
            delete updated[leadId]
          }
        }
      }
      return updated
    })
  }, [leads])

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-50" />
    }
    return sortDirection === "asc"
      ? <ArrowUp className="w-3.5 h-3.5 ml-1 text-[var(--primary)]" />
      : <ArrowDown className="w-3.5 h-3.5 ml-1 text-[var(--primary)]" />
  }

  if (loading) {
    return (
      <Card className="flex items-center justify-center py-24" elevated>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-14 h-14 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-[var(--primary)]" />
            </div>
            <div className="absolute inset-0 rounded-xl bg-[var(--primary)] opacity-20 animate-ping" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--text-primary)]">Loading leads</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Please wait...</p>
          </div>
        </motion.div>
      </Card>
    )
  }

  if (leads.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-24" elevated>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-xl bg-[var(--bg-sunken)] flex items-center justify-center mb-5 mx-auto border border-[var(--border)]">
            <Search className="w-9 h-9 text-[var(--text-muted)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No leads found</h3>
          <p className="text-sm text-[var(--text-muted)] max-w-xs">
            Try adjusting your filters or add a new lead to get started
          </p>
        </motion.div>
      </Card>
    )
  }

  return (
    <>
    <Card className="overflow-hidden border-[var(--border)] flex-1 flex flex-col min-h-0 min-w-0 h-full" elevated>
      <div className="overflow-auto scrollbar-thin flex-1 min-h-0 h-full">
        <table className="w-full table-fixed min-w-[1450px]">
          <LeadTableHeader
            isSubmissionView={isSubmissionView}
            isLostView={isLostView}
            isWithdrawView={isWithdrawView}
            isEnrolledView={isEnrolledView}
            isPucSrjView={isPucSrjView}
            isPucApplicantView={isPucApplicantView}
            isPucDocSubmissionView={isPucDocSubmissionView}
            isPucContactedView={isPucContactedView}
            isPucAppSubmissionView={isPucAppSubmissionView}
            showSubstageColumn={showSubstageColumn}
            selectedLeads={selectedLeads}
            leads={leads}
            onSelectAll={onSelectAll}
            handleSort={handleSort}
            getSortIcon={getSortIcon}
          />
          <tbody>
            {sortedLeads.map((lead, index) => (
              <LeadTableRow
                key={lead.id}
                lead={lead}
                index={index}
                isSelected={selectedLeads.includes(lead.id)}
                isSubmissionView={isSubmissionView}
                isLostView={isLostView}
                isWithdrawView={isWithdrawView}
                isPucSrjView={isPucSrjView}
                isPucApplicantView={isPucApplicantView}
                isPucDocSubmissionView={isPucDocSubmissionView}
                isPucContactedView={isPucContactedView}
                isPucAppSubmissionView={isPucAppSubmissionView}
                showSubstageColumn={showSubstageColumn}
                currentStageFilter={currentStageFilter}
                documentCompleteLeads={documentCompleteLeads}
                sfPaymentData={sfPaymentData}
                registrationSentLeads={registrationSentLeads}
                pucPaymentLeads={pucPaymentLeads}
                pucDocCounts={pucDocCounts}
                copiedPhone={copiedPhone}
                editingStage={editingStage}
                editingSchool={editingSchool}
                editingStatus={editingStatus}
                editingGpa={editingGpa}
                gpaInputValue={gpaInputValue}
                editingSubmissionSubstage={editingSubmissionSubstage}
                editingSubmissionStatus={editingSubmissionStatus}
                editingOrientationStatus={editingOrientationStatus}
                onSelectLead={onSelectLead}
                onLeadClick={onLeadClick}
                setCopiedPhone={setCopiedPhone}
                handleStageChange={handleStageChange}
                handleSchoolChange={handleSchoolChange}
                handleStatusChange={handleStatusChange}
                handleSubmissionSubstageChange={handleSubmissionSubstageChange}
                handleSubmissionStatusChange={handleSubmissionStatusChange}
                handleOrientationStatusChange={handleOrientationStatusChange}
                handleDocStatusOverrideChange={handleDocStatusOverrideChange}
                editingDocStatus={editingDocStatus}
                handleGpaEdit={handleGpaEdit}
                handleGpaSave={handleGpaSave}
                setEditingGpa={setEditingGpa}
                setGpaInputValue={setGpaInputValue}
                handleCollegeChange={handleCollegeChange}
                openPreferenceForLead={openPreferenceForLead}
                onPreferenceOpened={() => setOpenPreferenceForLead(null)}
                setBookingLead={setBookingLead}
                setBookingSimpleMode={setBookingSimpleMode}
                setBookingCallbackMode={setBookingCallbackMode}
                setCallbackLead={setCallbackLead}
                setCallbackFromStage={setCallbackFromStage}
                setLostDialogLead={setLostDialogLead}
                openAssignReasonDialog={openAssignReasonDialog}
                setPspWizardLead={setPspWizardLead}
                setViewingAppointment={setViewingAppointment}
                getEffectiveValue={getEffectiveValue}
                onEditWithdrawReason={setEditWithdrawReasonLead}
                onPaymentClick={setPaymentDialogLead}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between p-4 border-t border-[var(--border)] bg-[var(--bg-sunken)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
            <span className="text-2xl font-bold text-[var(--primary)]">{totalCount ?? leads.length}</span>
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">leads</span>
          </div>
          {totalPages > 1 && (
            <span className="text-xs text-[var(--text-muted)]">
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalCount ?? leads.length)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange?.(currentPage - 1)}
            className="rounded-lg"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <div className="px-3 py-1.5 rounded-lg bg-[var(--primary-muted)] text-[var(--primary)] text-sm font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange?.(currentPage + 1)}
            className="rounded-lg"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </Card>

    <LeadTableDialogs
      bookingLead={bookingLead}
      bookingCallbackMode={bookingCallbackMode}
      callbackLead={callbackLead}
      callbackFromStage={callbackFromStage}
      lostDialogLead={lostDialogLead}
      contactedDialogLead={contactedDialogLead}
      blockedDialogLead={blockedDialogLead}
      withdrawDialogLead={withdrawDialogLead}
      fileFeeDialogLead={fileFeeDialogLead}
      paymentDialogLead={paymentDialogLead}
      pspWizardLead={pspWizardLead}
      viewingAppointment={viewingAppointment}
      setBookingLead={setBookingLead}
      setBookingSimpleMode={setBookingSimpleMode}
      setBookingCallbackMode={setBookingCallbackMode}
      setCallbackLead={setCallbackLead}
      setCallbackFromStage={setCallbackFromStage}
      setLostDialogLead={setLostDialogLead}
      setContactedDialogLead={setContactedDialogLead}
      setBlockedDialogLead={setBlockedDialogLead}
      setWithdrawDialogLead={setWithdrawDialogLead}
      setFileFeeDialogLead={setFileFeeDialogLead}
      setPaymentDialogLead={setPaymentDialogLead}
      setPspWizardLead={setPspWizardLead}
      setViewingAppointment={setViewingAppointment}
      handleLostConfirm={handleLostConfirm}
      handleAssignLostReason={handleAssignLostReason}
      assignReasonMode={assignReasonMode}
      handleContactedConfirm={handleContactedConfirm}
      handleBlockedConfirm={handleBlockedConfirm}
      handleWithdrawConfirm={handleWithdrawConfirm}
      editWithdrawReasonLead={editWithdrawReasonLead}
      setEditWithdrawReasonLead={setEditWithdrawReasonLead}
      handleEditWithdrawReasonConfirm={handleEditWithdrawReasonConfirm}
      incrementContactCount={incrementContactCount}
      updateLead={updateLead}
      refreshPucDocCounts={refreshPucDocCounts}
      refreshPucPaymentStatus={refreshPucPaymentStatus}
    />

    </>
  )
}

// Bulk actions bar component
interface BulkActionsProps {
  selectedCount: number
  onAssign: () => void
  onBook: () => void
  onLost?: () => void
  onDelete: () => void
  onClear: () => void
  onMOEFetch?: () => void
  onSendRSVP?: () => void
}

export function BulkActionsBar({ selectedCount, onAssign, onBook, onLost, onDelete, onClear, onMOEFetch, onSendRSVP }: BulkActionsProps) {
  if (selectedCount === 0) return null

  return (
    <motion.div
      initial={{ y: 100, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 100, opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:left-[calc(50%+130px)] z-40 max-w-[calc(100vw-2rem)]"
    >
      <div className="flex items-center gap-4 px-5 py-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] shadow-md overflow-x-auto">
        {/* Selected count */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--primary)] flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-[var(--text-primary)]">{selectedCount}</span>
            <span className="text-sm text-[var(--text-muted)] ml-1">selected</span>
          </div>
        </div>

        <div className="w-px h-8 bg-[var(--border)]" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onAssign} className="rounded-lg hover:bg-[var(--primary-muted)] hover:text-[var(--primary)]">
            <UserPlus className="w-4 h-4 mr-1.5" />
            Assign
          </Button>
          <Button variant="ghost" size="sm" onClick={onBook} className="rounded-lg hover:bg-[var(--success-bg)] hover:text-[var(--success)]">
            <Calendar className="w-4 h-4 mr-1.5" />
            Book
          </Button>
          {onMOEFetch && (
            <Button variant="ghost" size="sm" onClick={onMOEFetch} className="rounded-lg hover:bg-blue-50 hover:text-blue-600">
              <BookOpen className="w-4 h-4 mr-1.5" />
              Fetch GPA
            </Button>
          )}
          {onSendRSVP && (
            <Button variant="ghost" size="sm" onClick={onSendRSVP} className="rounded-lg hover:bg-emerald-50 hover:text-emerald-600">
              <Send className="w-4 h-4 mr-1.5" />
              RSVP
            </Button>
          )}
        </div>

        <div className="w-px h-8 bg-[var(--border)]" />

        {/* Destructive Actions */}
        <div className="flex items-center gap-1">
          {onLost && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLost}
              className="rounded-lg text-[var(--error)] hover:bg-[var(--error-bg)]"
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              Lost
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="rounded-lg text-[var(--error)] hover:bg-[var(--error-bg)]"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete
          </Button>
        </div>

        <div className="w-px h-8 bg-[var(--border)]" />

        {/* Clear */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClear}
          className="rounded-lg hover:bg-[var(--bg-hover)]"
          title="Clear selection"
        >
          <XCircle className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  )
}
