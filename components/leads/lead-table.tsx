"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { InlineTagSelect, type RowVariant } from "@/components/ui/notion-tag-select"
import {
  Phone,
  Mail,
  Calendar,
  Trash2,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
  Flame,
  Thermometer,
  Snowflake,
  Lock,
  BookOpen,
  Check,
  PhoneForwarded
} from "lucide-react"
import { SimpleTooltip } from "@/components/ui/tooltip"
import { PIPELINE_STAGES, SCHOOLS, LEAD_STATUSES, APPLICANT_ONLY_STATUSES, LOCKED_STAGES, SUBMISSION_SUBSTAGES, SUBMISSION_STATUSES, SF_DOCUMENTS, PUC_DOCUMENT_STATUSES, type Lead, type PipelineStage, type LeadStatus, type SubmissionSubstage, type SubmissionStatus, type PUCDocumentStatus } from "@/types"
import { computePUCDocumentStatus } from "@/lib/psp/document-status"
import { formatKuwaitPhone, getRelativeTime, getInitials } from "@/lib/utils"
import { useLeadMutations } from "@/lib/hooks/use-leads"
import { AppointmentBooking } from "@/components/calendar/appointment-booking"
import { CallbackScheduler } from "@/components/leads/callback-scheduler"
import { createClient } from "@/lib/supabase/client"
import { MarkLostDialog } from "@/components/leads/mark-lost-dialog"
import { ContactedStatusDialog } from "@/components/leads/contacted-status-dialog"
import { BlockedReasonDialog } from "@/components/leads/blocked-reason-dialog"
import { WithdrawReasonDialog } from "@/components/leads/withdraw-reason-dialog"
import type { SubmissionBlockedReason } from "@/types"

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
}

type SortField = "name" | "updated_at" | "pipeline_stage" | "source" | "school"
type SortDirection = "asc" | "desc"
type LeadTemperature = "hot" | "warm" | "cold"

// Calculate lead temperature based on activity and pipeline stage
function getLeadTemperature(lead: Lead): { temperature: LeadTemperature; description: string } {
  const now = Date.now()
  const daysSinceContact = lead.last_contacted_at
    ? Math.floor((now - new Date(lead.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24))
    : null

  // HOT: contacted in last 3 days AND in advanced pipeline stages
  if (
    daysSinceContact !== null &&
    daysSinceContact <= 3 &&
    ["test", "application"].includes(lead.pipeline_stage)
  ) {
    return {
      temperature: "hot",
      description: "Recently contacted (last 3 days) and actively progressing through the pipeline. High priority for follow-up."
    }
  }

  // WARM: contacted in last 7 days OR in early active stages with recent contact
  if (
    daysSinceContact !== null &&
    daysSinceContact <= 7 &&
    ["test"].includes(lead.pipeline_stage)
  ) {
    return {
      temperature: "warm",
      description: "Engaged within the past week and showing interest. Good candidate for nurturing and next steps."
    }
  }

  // COLD: no contact OR not contacted in 14+ days OR stuck in new/lost
  if (
    daysSinceContact === null ||
    daysSinceContact > 14 ||
    ["new", "lost"].includes(lead.pipeline_stage)
  ) {
    return {
      temperature: "cold",
      description: "No recent contact (14+ days) or never contacted. Needs re-engagement or may be unresponsive."
    }
  }

  // Default to warm for anything in between
  return {
    temperature: "warm",
    description: "Moderately engaged. Consider scheduling follow-up to maintain momentum."
  }
}

const temperatureConfig = {
  hot: {
    icon: Flame,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    ring: "ring-orange-500",
    ringBg: "ring-orange-500/30"
  },
  warm: {
    icon: Thermometer,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    ring: "ring-amber-500",
    ringBg: "ring-amber-500/30"
  },
  cold: {
    icon: Snowflake,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
    ring: "ring-blue-400",
    ringBg: "ring-blue-400/30"
  }
}

// Document requirements by graduate type (must match PSP wizard / document-rules.ts)
const DOCUMENTS_BY_TYPE: Record<string, { id: string; required: boolean }[]> = {
  gov: [
    { id: "passport", required: true },
    { id: "civil_id", required: true },
    { id: "parent_civil_id", required: true },
    { id: "hs_certificate", required: true },
    { id: "nationality", required: true },
    { id: "puc_receipt", required: true },
    { id: "acceptance_letter", required: true },
  ],
  us: [
    { id: "civil_id", required: true },
    { id: "passport", required: true },
    { id: "nationality", required: true },
    { id: "transcript_moh", required: true },
    { id: "sequence", required: true },
    { id: "equivalency", required: true },
    { id: "puc_receipt", required: true },
    { id: "acceptance_letter", required: true },
  ],
  uk: [
    { id: "civil_id", required: true },
    { id: "gcse", required: true },
    { id: "equivalency", required: true },
    { id: "passport", required: true },
    { id: "nationality", required: true },
    { id: "puc_receipt", required: true },
    { id: "acceptance_letter", required: true },
  ],
  ksa: [
    { id: "civil_id", required: true },
    { id: "shahada", required: true },
    { id: "qiyas", required: true },
    { id: "passport", required: true },
    { id: "nationality", required: true },
    { id: "puc_receipt", required: true },
    { id: "acceptance_letter", required: true },
  ],
  other: [
    { id: "civil_id", required: true },
    { id: "hs_certificate", required: true },
    { id: "equivalency", required: true },
    { id: "passport", required: true },
    { id: "nationality", required: true },
    { id: "puc_receipt", required: true },
    { id: "acceptance_letter", required: true },
  ],
}

// Check if all required documents are uploaded for a lead
function checkAllDocumentsUploaded(leadId: string): boolean {
  // Check all graduate types to find which one has documents
  const graduateTypes = ['gov', 'us', 'uk', 'ksa', 'other']

  for (const graduateType of graduateTypes) {
    const storageKey = `psp-documents-${leadId}-${graduateType}`
    const stored = localStorage.getItem(storageKey)

    if (stored) {
      try {
        const savedDocs = JSON.parse(stored) as { id: string; file?: unknown }[]
        const requiredDocs = DOCUMENTS_BY_TYPE[graduateType]

        // Check if all required documents have files uploaded
        const allUploaded = requiredDocs.every(reqDoc => {
          const savedDoc = savedDocs.find(d => d.id === reqDoc.id)
          return savedDoc?.file !== undefined
        })

        if (allUploaded && requiredDocs.length > 0) {
          return true
        }
      } catch (e) {
        console.error('Failed to parse document status:', e)
      }
    }
  }

  return false
}

export function LeadTable({
  leads,
  loading,
  selectedLeads,
  onSelectLead,
  onSelectAll,
  onLeadClick,
  currentStageFilter,
  fundingTypeFilter
}: LeadTableProps) {
  const { updateLeadStage, updateLead, incrementContactCount } = useLeadMutations()
  const [sortField, setSortField] = useState<SortField>("updated_at")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [editingStage, setEditingStage] = useState<string | null>(null)
  const [editingSchool, setEditingSchool] = useState<string | null>(null)
  const [editingStatus, setEditingStatus] = useState<string | null>(null)
  const [editingSubmissionSubstage, setEditingSubmissionSubstage] = useState<string | null>(null)
  const [editingSubmissionStatus, setEditingSubmissionStatus] = useState<string | null>(null)
  const [bookingLead, setBookingLead] = useState<Lead | null>(null)
  const [, setBookingSimpleMode] = useState(false)
  const [bookingCallbackMode, setBookingCallbackMode] = useState(false)
  const [callbackLead, setCallbackLead] = useState<Lead | null>(null)
  const [callbackFromStage, setCallbackFromStage] = useState<PipelineStage | undefined>(undefined)
  const [documentCompleteLeads, setDocumentCompleteLeads] = useState<Set<string>>(new Set())
  const [, setSfGreenLeads] = useState<Set<string>>(new Set())
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null)
  const [lostDialogLead, setLostDialogLead] = useState<Lead | null>(null)
  const [contactedDialogLead, setContactedDialogLead] = useState<Lead | null>(null)
  const [blockedDialogLead, setBlockedDialogLead] = useState<Lead | null>(null)
  const [withdrawDialogLead, setWithdrawDialogLead] = useState<Lead | null>(null)
  const [pucPaymentLeads, setPucPaymentLeads] = useState<Set<string>>(new Set())
  const [editingDocumentStatus, setEditingDocumentStatus] = useState<string | null>(null)

  // Check if we're viewing submission stage
  const isSubmissionView = currentStageFilter === 'applicant'
  const isPucSrjView = fundingTypeFilter === 'puc'

  // Function to refresh document completion status
  const refreshDocumentStatus = React.useCallback(() => {
    const submissionLeads = leads.filter(
      lead => lead.pipeline_stage === 'applicant' || lead.pipeline_stage === 'application'
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

    const supabase = createClient()
    const sfLeadIds = sfLeads.map(l => l.id)

    const { data: students } = await supabase
      .from('students')
      .select('lead_id, amount_paid, sf_enrolled_stage, sf_declaration_submitted, sf_passport_submitted, sf_civil_id_submitted, sf_payment_receipt_submitted, sf_official_transcript_submitted, transfer_type')
      .in('lead_id', sfLeadIds)

    if (!students || students.length === 0) {
      setSfGreenLeads(new Set())
      return
    }

    const greenIds = new Set<string>()
    for (const student of students) {
      if (!student.lead_id) continue

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

    setSfGreenLeads(greenIds)
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
    const supabase = createClient()
    const pucLeadIds = pucLeads.map(l => l.id)
    const { data: transactions } = await supabase
      .from('payment_transactions')
      .select('lead_id')
      .in('lead_id', pucLeadIds)
      .eq('status', 'completed')
      .eq('notes', 'PSP Fee Payment')
    if (transactions) {
      setPucPaymentLeads(new Set(transactions.map(t => t.lead_id)))
    }
  }, [leads, isPucSrjView])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- triggers data fetch on mount
    refreshPucPaymentStatus()
  }, [refreshPucPaymentStatus])

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

  const sortedLeads = [...leads].sort((a, b) => {
    let comparison = 0
    switch (sortField) {
      case "name":
        comparison = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
        break
      case "updated_at":
        const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0
        const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0
        comparison = aTime - bTime
        break
      case "pipeline_stage":
        const stageOrder = PIPELINE_STAGES.map(s => s.value)
        comparison = stageOrder.indexOf(a.pipeline_stage) - stageOrder.indexOf(b.pipeline_stage)
        break
      case "source":
        comparison = a.source.localeCompare(b.source)
        break
      case "school":
        comparison = (a.school || "").localeCompare(b.school || "")
        break
    }
    return sortDirection === "asc" ? comparison : -comparison
  })

  const handleStageChange = async (leadId: string, newStage: PipelineStage) => {
    // Intercept "lost" stage change - show dialog to pick reasons
    if (newStage === 'lost') {
      const lead = leads.find(l => l.id === leadId)
      if (lead) {
        setLostDialogLead(lead)
      }
      return
    }

    // Intercept "withdraw" stage change - show dialog to pick withdrawal reason
    if (newStage === 'withdraw') {
      const lead = leads.find(l => l.id === leadId)
      if (lead) {
        setWithdrawDialogLead(lead)
      }
      return
    }

    // Intercept "contacted" stage change - require status selection
    if (newStage === 'contacted') {
      const lead = leads.find(l => l.id === leadId)
      if (lead) {
        setContactedDialogLead(lead)
      }
      return
    }

    // Optimistic update - immediately show the new value
    // If changing to 'new' stage, also clear the status
    const shouldClearStatus = newStage === 'new'
    if (shouldClearStatus) {
      setPendingUpdates(prev => ({
        ...prev,
        [leadId]: { ...prev[leadId], pipeline_stage: newStage, status: undefined as unknown as LeadStatus }
      }))
    } else {
      setPendingUpdates(prev => ({ ...prev, [leadId]: { ...prev[leadId], pipeline_stage: newStage } }))
    }
    setEditingStage(leadId)

    // If changing to a stage with no status, update both stage and clear status
    let result
    if (shouldClearStatus) {
      result = await updateLead(leadId, { pipeline_stage: newStage, status: undefined as unknown as LeadStatus })
    } else {
      result = await updateLeadStage(leadId, newStage)
    }

    setEditingStage(null)
    // Clear pending update after API call (whether success or failure)
    // On success, the real-time subscription will update with actual data
    // On failure, we revert by clearing the pending update
    if (result.error) {
      setPendingUpdates(prev => {
        const updated = { ...prev }
        if (updated[leadId]) {
          delete updated[leadId].pipeline_stage
          if (shouldClearStatus) {
            delete updated[leadId].status
          }
          if (Object.keys(updated[leadId]).length === 0) {
            delete updated[leadId]
          }
        }
        return updated
      })
    }
  }

  const handleLostConfirm = async (reasonId: string, notes?: string) => {
    if (!lostDialogLead) return

    const leadId = lostDialogLead.id
    // Optimistic update
    setPendingUpdates(prev => ({ ...prev, [leadId]: { ...prev[leadId], pipeline_stage: 'lost' as PipelineStage } }))
    setEditingStage(leadId)

    const result = await updateLeadStage(leadId, 'lost' as PipelineStage, reasonId, notes)

    setEditingStage(null)
    setLostDialogLead(null)
    if (result.error) {
      setPendingUpdates(prev => {
        const updated = { ...prev }
        if (updated[leadId]) {
          delete updated[leadId].pipeline_stage
          if (Object.keys(updated[leadId]).length === 0) {
            delete updated[leadId]
          }
        }
        return updated
      })
    }
  }

  const handleContactedConfirm = async (status: LeadStatus) => {
    if (!contactedDialogLead) return

    const leadId = contactedDialogLead.id
    // Optimistic update - set both stage and status
    setPendingUpdates(prev => ({
      ...prev,
      [leadId]: { ...prev[leadId], pipeline_stage: 'contacted' as PipelineStage, status }
    }))
    setEditingStage(leadId)

    const result = await updateLead(leadId, { pipeline_stage: 'contacted' as PipelineStage, status })

    setEditingStage(null)
    setContactedDialogLead(null)
    if (result.error) {
      setPendingUpdates(prev => {
        const updated = { ...prev }
        if (updated[leadId]) {
          delete updated[leadId].pipeline_stage
          delete updated[leadId].status
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
    // Optimistic update
    setPendingUpdates(prev => ({ ...prev, [leadId]: { ...prev[leadId], pipeline_stage: 'withdraw' as PipelineStage } }))
    setEditingStage(leadId)

    const result = await updateLeadStage(leadId, 'withdraw' as PipelineStage, undefined, undefined, reason, notes)

    setEditingStage(null)
    setWithdrawDialogLead(null)
    if (result.error) {
      setPendingUpdates(prev => {
        const updated = { ...prev }
        if (updated[leadId]) {
          delete updated[leadId].pipeline_stage
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
    setPendingUpdates(prev => ({ ...prev, [leadId]: { ...prev[leadId], school: newSchool as Lead['school'] } }))
    setEditingSchool(leadId)

    const result = await updateLead(leadId, { school: newSchool as Lead['school'] })

    setEditingSchool(null)
    if (result.error) {
      setPendingUpdates(prev => {
        const updated = { ...prev }
        if (updated[leadId]) {
          delete updated[leadId].school
          if (Object.keys(updated[leadId]).length === 0) {
            delete updated[leadId]
          }
        }
        return updated
      })
    }
  }

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    // Optimistic update - increment contact_count on every status change
    const lead = leads.find(l => l.id === leadId)
    const currentCount = lead ? (getEffectiveValue(leadId, 'contact_count', lead.contact_count) || 0) : 0
    setPendingUpdates(prev => ({
      ...prev,
      [leadId]: {
        ...prev[leadId],
        status: newStatus,
        ...(lead ? { contact_count: currentCount + 1 } : {}),
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
    }
  }

  const handleSubmissionSubstageChange = async (leadId: string, newSubstage: SubmissionSubstage) => {
    // Optimistic update
    setPendingUpdates(prev => ({ ...prev, [leadId]: { ...prev[leadId], submission_substage: newSubstage } }))
    setEditingSubmissionSubstage(leadId)

    const result = await updateLead(leadId, { submission_substage: newSubstage })

    setEditingSubmissionSubstage(null)
    if (result.error) {
      setPendingUpdates(prev => {
        const updated = { ...prev }
        if (updated[leadId]) {
          delete updated[leadId].submission_substage
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
    setPendingUpdates(prev => ({ ...prev, [leadId]: { ...prev[leadId], submission_status: newStatus } }))
    setEditingSubmissionStatus(leadId)

    const result = await updateLead(leadId, { submission_status: newStatus })

    setEditingSubmissionStatus(null)
    if (result.error) {
      setPendingUpdates(prev => {
        const updated = { ...prev }
        if (updated[leadId]) {
          delete updated[leadId].submission_status
          if (Object.keys(updated[leadId]).length === 0) {
            delete updated[leadId]
          }
        }
        return updated
      })
    }
  }

  const handleDocumentStatusOverride = async (leadId: string, value: string) => {
    const overrideValue = value === 'auto' ? null : value as PUCDocumentStatus
    setPendingUpdates(prev => ({ ...prev, [leadId]: { ...prev[leadId], puc_document_status_override: overrideValue } }))
    setEditingDocumentStatus(leadId)

    const result = await updateLead(leadId, { puc_document_status_override: overrideValue } as Partial<Lead>)

    setEditingDocumentStatus(null)
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
    <Card className="overflow-hidden border-[var(--border)] flex-1 flex flex-col min-h-0 h-full" elevated>
      <div className="overflow-auto flex-1 min-h-0 h-full">
        <table className="w-full h-full">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-sunken)]">
              <th className="p-4 text-left w-12">
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === leads.length && leads.length > 0}
                    onChange={onSelectAll}
                    className="w-4 h-4 rounded-md border-2 border-[var(--border)] bg-[var(--bg-surface)] text-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-muted)] focus:ring-offset-0 cursor-pointer transition-all hover:border-[var(--primary)]"
                  />
                </div>
              </th>
              <th className="p-4 text-left">
                <button
                  onClick={() => handleSort("name")}
                  className="flex items-center text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors group"
                >
                  Lead
                  <span className="group-hover:scale-110 transition-transform">{getSortIcon("name")}</span>
                </button>
              </th>
              <th className="p-4 text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Contact
                </span>
              </th>
              {/* Submission-specific columns */}
              {isSubmissionView ? (
                <>
                  <th className="p-4 text-left">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Stage
                    </span>
                  </th>
                  {!isPucSrjView && (
                    <th className="p-4 text-left">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Substage
                      </span>
                    </th>
                  )}
                  <th className="p-4 text-left">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      {isPucSrjView ? "Document Status" : "Status"}
                    </span>
                  </th>
                  <th className="p-4 text-left">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Agent
                    </span>
                  </th>
                </>
              ) : (
                <>
                  <th className="p-4 text-left">
                    <button
                      onClick={() => handleSort("pipeline_stage")}
                      className="flex items-center text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors group"
                    >
                      Stage
                      <span className="group-hover:scale-110 transition-transform">{getSortIcon("pipeline_stage")}</span>
                    </button>
                  </th>
                  <th className="p-4 text-left">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Status
                    </span>
                  </th>
                  <th className="p-4 text-left">
                    <button
                      onClick={() => handleSort("school")}
                      className="flex items-center text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors group"
                    >
                      School
                      <span className="group-hover:scale-110 transition-transform">{getSortIcon("school")}</span>
                    </button>
                  </th>
                  <th className="p-4 text-left">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Expected GPA
                    </span>
                  </th>
                  <th className="p-4 text-left">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Actual GPA
                    </span>
                  </th>
                </>
              )}
              <th className="p-4 text-left">
                <button
                  onClick={() => handleSort("updated_at")}
                  className="flex items-center text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors group"
                >
                  Last Updated
                  <span className="group-hover:scale-110 transition-transform">{getSortIcon("updated_at")}</span>
                </button>
              </th>
              <th className="p-4 text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Actions
                </span>
              </th>
              <th className="p-2 text-center w-8">
                <span className="sr-only">Ready Status</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedLeads.map((lead, index) => {
              const isSelected = selectedLeads.includes(lead.id)

              // Determine row variant for substage/status tag coloring
              // Check submission substages (application stage)
              const effectiveSubstage = getEffectiveValue(lead.id, 'submission_substage', lead.submission_substage)
              const isInSubmissionStage = lead.pipeline_stage === 'applicant'
              const isSubmissionLost = isInSubmissionStage && effectiveSubstage === 'lost'
              const isSubmissionSubmitted = isInSubmissionStage && effectiveSubstage === 'submissions'

              const rowVariant: RowVariant = lead.pipeline_stage === 'lost' || isSubmissionLost
                ? 'lost'
                : lead.ministry_blocked
                  ? 'blocked'
                  : isSubmissionSubmitted || documentCompleteLeads.has(lead.id)
                    ? 'documents-complete'
                    : isInSubmissionStage
                      ? 'submission'
                      : 'default'

              return (
                <motion.tr
                  key={lead.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.015 }}
                  onClick={() => isSubmissionView && onLeadClick?.(lead)}
                  className={cn(
                    "border-b border-[var(--border)] transition-all duration-150 group/row bg-white dark:bg-[var(--bg-surface)]",
                    isSubmissionView && "cursor-pointer",
                    isSelected
                      ? "border-l-2 border-l-[var(--primary)]"
                      : "hover:bg-[var(--bg-hover)] border-l-2 border-l-transparent hover:border-l-[var(--border-emphasis)]"
                  )}
                >
                  <td className="p-4">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectLead(lead.id)}
                        className="w-4 h-4 rounded-md border-2 border-[var(--border)] bg-[var(--bg-surface)] text-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-muted)] focus:ring-offset-0 cursor-pointer transition-all hover:border-[var(--primary)]"
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    {(() => {
                      const { temperature, description } = getLeadTemperature(lead)
                      const config = temperatureConfig[temperature]
                      const Icon = config.icon
                      const tempLabel = temperature === "hot" ? "Hot" : temperature === "warm" ? "Warm" : "Cold"
                      return (
                        <Link href={`/leads/${lead.id}${currentStageFilter && currentStageFilter !== "all" ? `?stage=${currentStageFilter}` : ""}`} className="flex items-center gap-3 group" onClick={isSubmissionView ? (e: React.MouseEvent) => e.preventDefault() : undefined}>
                          <SimpleTooltip
                            content={
                              <div className="max-w-[250px]">
                                <div className="flex items-center gap-2 mb-1">
                                  <Icon className={cn("w-4 h-4 flex-shrink-0", config.color)} />
                                  <span className="font-semibold">{tempLabel} Lead</span>
                                </div>
                                <p className="text-xs text-[var(--text-muted)] whitespace-normal break-words">{description}</p>
                              </div>
                            }
                            side="right"
                          >
                            {(() => {
                              const effectiveCount = getEffectiveValue(lead.id, 'contact_count', lead.contact_count) || 0
                              return (
                                <div className={cn(
                                  "relative cursor-help flex items-center justify-center w-8 h-8 rounded-full ring-[3px] transition-all font-bold text-xs",
                                  config.ring,
                                  "group-hover:ring-4",
                                  effectiveCount > 0
                                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                                    : "bg-[var(--bg-sunken)] text-[var(--text-muted)]"
                                )}>
                                  {effectiveCount}
                                </div>
                              )
                            })()}
                          </SimpleTooltip>
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors truncate">
                              {lead.first_name} {lead.last_name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Badge
                                variant={lead.funding_type === "puc" ? "solid-primary" : "secondary"}
                                size="xs"
                                shape="pill"
                              >
                                {lead.funding_type === "puc" ? "PUC" : "SF"}
                              </Badge>
                              {lead.is_kuwaiti && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent-muted)] text-[var(--accent)] font-medium">KW</span>
                              )}
                              {lead.ministry_blocked && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 font-medium">
                                  Blocked
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      )
                    })()}
                  </td>
                  <td className="p-4">
                    <div className="space-y-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigator.clipboard.writeText(lead.phone)
                          setCopiedPhone(lead.phone)
                          setTimeout(() => setCopiedPhone(null), 1500)
                        }}
                        className="flex items-center gap-2 text-sm text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors group cursor-pointer"
                      >
                        <div className="w-6 h-6 rounded-lg bg-[var(--bg-sunken)] flex items-center justify-center group-hover:bg-[var(--primary-muted)] transition-colors">
                          {copiedPhone === lead.phone ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Phone className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--primary)]" />
                          )}
                        </div>
                        <span className="font-medium whitespace-nowrap">
                          {copiedPhone === lead.phone ? "Copied!" : formatKuwaitPhone(lead.phone)}
                        </span>
                      </button>
                      {lead.phone_secondary && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigator.clipboard.writeText(lead.phone_secondary!)
                            setCopiedPhone(lead.phone_secondary!)
                            setTimeout(() => setCopiedPhone(null), 1500)
                          }}
                          className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors group cursor-pointer"
                        >
                          <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                            {copiedPhone === lead.phone_secondary ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Phone className="w-3 h-3 text-blue-500" />
                            )}
                          </div>
                          <span className="font-medium whitespace-nowrap">
                            {copiedPhone === lead.phone_secondary ? "Copied!" : formatKuwaitPhone(lead.phone_secondary)}
                          </span>
                        </button>
                      )}
                      {lead.email && (
                        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                          <div className="w-6 h-6 rounded-lg bg-[var(--bg-sunken)] flex items-center justify-center">
                            <Mail className="w-3 h-3" />
                          </div>
                          <span className="truncate max-w-[120px]">{lead.email}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  {/* Submission-specific columns */}
                  {isSubmissionView ? (
                    <>
                      {/* Stage column */}
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        {isPucSrjView ? (
                          <InlineTagSelect
                            value={getEffectiveValue(lead.id, 'submission_substage', lead.submission_substage) || 'documents'}
                            options={SUBMISSION_SUBSTAGES.map((substage) => ({
                              value: substage.value,
                              label: substage.label,
                              color: substage.value === 'lost' ? 'lost' : substage.value === 'submissions' ? 'application' : 'new',
                            }))}
                            onChange={(value) => handleSubmissionSubstageChange(lead.id, value as SubmissionSubstage)}
                            disabled={editingSubmissionSubstage === lead.id}
                            loading={editingSubmissionSubstage === lead.id}
                          />
                        ) : (() => {
                          const currentStage = getEffectiveValue(lead.id, 'pipeline_stage', lead.pipeline_stage) as PipelineStage
                          const isStageLocked = LOCKED_STAGES.includes(currentStage)
                          const stageInfo = PIPELINE_STAGES.find(s => s.value === currentStage)

                          if (isStageLocked && stageInfo) {
                            return (
                              <SimpleTooltip content="This stage is locked and cannot be changed">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
                                  <Lock className="w-3 h-3 text-[var(--text-muted)]" />
                                  <span className="text-xs font-medium text-[var(--text-secondary)]">{stageInfo.label}</span>
                                </div>
                              </SimpleTooltip>
                            )
                          }

                          return (
                            <InlineTagSelect
                              value={currentStage}
                              options={PIPELINE_STAGES.map((stage) => ({
                                value: stage.value,
                                label: stage.label,
                                color: stage.value,
                              }))}
                              onChange={(value) => handleStageChange(lead.id, value as PipelineStage)}
                              disabled={editingStage === lead.id}
                              loading={editingStage === lead.id}
                            />
                          )
                        })()}
                      </td>
                      {/* Substage column - hidden for PUC SRJ view */}
                      {!isPucSrjView && (
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <InlineTagSelect
                            value={getEffectiveValue(lead.id, 'submission_substage', lead.submission_substage) || ''}
                            options={SUBMISSION_SUBSTAGES.map((substage) => ({
                              value: substage.value,
                              label: substage.label,
                              color: "gray",
                            }))}
                            onChange={(value) => handleSubmissionSubstageChange(lead.id, value as SubmissionSubstage)}
                            disabled={editingSubmissionSubstage === lead.id}
                            loading={editingSubmissionSubstage === lead.id}
                          />
                        </td>
                      )}
                      {/* Status / Document Status column */}
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        {isPucSrjView ? (
                          (() => {
                            const sub = getEffectiveValue(lead.id, 'submission_substage', lead.submission_substage) as SubmissionSubstage | null
                            const allDocsComplete = documentCompleteLeads.has(lead.id)
                            const paymentComplete = pucPaymentLeads.has(lead.id)
                            const isBlocked = !!lead.submission_blocked_reason
                            const computedStatus = computePUCDocumentStatus(sub, allDocsComplete, paymentComplete, isBlocked)
                            const override = getEffectiveValue(lead.id, 'puc_document_status_override', lead.puc_document_status_override) as PUCDocumentStatus | null | undefined
                            const status = override || computedStatus

                            const docStatusColorMap: Record<string, string> = {
                              red: 'red', amber: 'warning', green: 'green', blue: 'blue', orange: 'orange'
                            }
                            const docStatusOptions = [
                              { value: 'auto', label: computedStatus ? `Auto (${PUC_DOCUMENT_STATUSES.find(s => s.value === computedStatus)?.label || computedStatus})` : 'Auto', color: 'gray' },
                              ...PUC_DOCUMENT_STATUSES.map(s => ({ value: s.value, label: s.label, color: docStatusColorMap[s.color] || s.color }))
                            ]

                            return (
                              <InlineTagSelect
                                value={override ? override : (status || 'auto')}
                                options={docStatusOptions}
                                onChange={(value) => handleDocumentStatusOverride(lead.id, value)}
                                disabled={editingDocumentStatus === lead.id}
                                loading={editingDocumentStatus === lead.id}
                                rowVariant={rowVariant}
                              />
                            )
                          })()
                        ) : (
                          <InlineTagSelect
                            value={getEffectiveValue(lead.id, 'submission_status', lead.submission_status) || ''}
                            options={SUBMISSION_STATUSES.map((status) => ({
                              value: status.value,
                              label: status.label,
                              color: "gray",
                            }))}
                            onChange={(value) => handleSubmissionStatusChange(lead.id, value as SubmissionStatus)}
                            disabled={editingSubmissionStatus === lead.id}
                            loading={editingSubmissionStatus === lead.id}
                            rowVariant={rowVariant}
                          />
                        )}
                      </td>
                      {/* Agent column */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {lead.assigned_agent ? (
                            <>
                              <Avatar size="xs">
                                <AvatarImage src={lead.assigned_agent.avatar_url} />
                                <AvatarFallback className="text-[10px] bg-[var(--primary-muted)] text-[var(--primary)]">
                                  {getInitials(lead.assigned_agent.full_name || '')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-[var(--text-secondary)] truncate max-w-[100px]">
                                {lead.assigned_agent.full_name}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-[var(--text-muted)]">—</span>
                          )}
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4">
                        {(() => {
                          const currentStage = getEffectiveValue(lead.id, 'pipeline_stage', lead.pipeline_stage) as PipelineStage
                          const isStageLocked = LOCKED_STAGES.includes(currentStage)
                          const stageInfo = PIPELINE_STAGES.find(s => s.value === currentStage)

                          if (isStageLocked && stageInfo) {
                            return (
                              <SimpleTooltip content="This stage is locked and cannot be changed">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
                                  <Lock className="w-3 h-3 text-[var(--text-muted)]" />
                                  <span className="text-xs font-medium text-[var(--text-secondary)]">{stageInfo.label}</span>
                                </div>
                              </SimpleTooltip>
                            )
                          }

                          return (
                            <InlineTagSelect
                              value={currentStage}
                              options={PIPELINE_STAGES.map((stage) => ({
                                value: stage.value,
                                label: stage.label,
                                color: stage.value,
                              }))}
                              onChange={(value) => handleStageChange(lead.id, value as PipelineStage)}
                              disabled={editingStage === lead.id}
                              loading={editingStage === lead.id}
                            />
                          )
                        })()}
                      </td>
                      <td className="p-4">
                        {(() => {
                          const effectiveStage = getEffectiveValue(lead.id, 'pipeline_stage', lead.pipeline_stage)

                          // Filter statuses based on stage
                          const STAGE_STATUSES: Record<PipelineStage, LeadStatus[] | 'all' | 'none'> = {
                            new: 'none',
                            contacted: ['no_answer', 'switched_off', 'interested', 'not_interested', 'high_gpa', 'low_gpa', 'wrong_number', 'already_done', 'will_see', 'potential'],
                            visit: ['no_answer', 'cant_reach', 'interested', 'not_interested'],
                            test: ['online', 'on_campus'],
                            application: 'none',
                            lost: 'all',
                            applicant: ['no_answer', 'cant_reach', 'informed', 'travelling', 'might_withdraw'],
                            enrolled: 'none',
                            withdraw: 'all',
                          }
                          const stageConfig = effectiveStage ? STAGE_STATUSES[effectiveStage as PipelineStage] : 'all'
                          const isStatusDisabled = stageConfig === 'none'
                          const availableStatuses = stageConfig === 'none'
                            ? []
                            : stageConfig === 'all'
                            ? LEAD_STATUSES.filter(s => !APPLICANT_ONLY_STATUSES.includes(s.value))
                            : LEAD_STATUSES.filter(s => (stageConfig as LeadStatus[]).includes(s.value))

                          return isStatusDisabled ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)]">
                              <span className="text-xs">—</span>
                            </div>
                          ) : (
                            <InlineTagSelect
                              value={getEffectiveValue(lead.id, 'status', lead.status) || ''}
                              options={availableStatuses.map((status) => ({
                                value: status.value,
                                label: status.label,
                                color: "gray",
                              }))}
                              onChange={(value) => handleStatusChange(lead.id, value as LeadStatus)}
                              disabled={editingStatus === lead.id}
                              loading={editingStatus === lead.id}
                            />
                          )
                        })()}
                      </td>
                      <td className="p-4">
                        <InlineTagSelect
                          value={getEffectiveValue(lead.id, 'school', lead.school) || ""}
                          options={SCHOOLS.map((school) => ({
                            value: school.value,
                            label: school.label,
                            color: "gray",
                          }))}
                          onChange={(value) => handleSchoolChange(lead.id, value)}
                          disabled={editingSchool === lead.id}
                          loading={editingSchool === lead.id}
                        />
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-[var(--text-secondary)]">
                          {lead.expected_gpa ? `${lead.expected_gpa}%` : "—"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-[var(--text-secondary)]">
                          {lead.actual_gpa ? `${lead.actual_gpa}%` : "—"}
                        </span>
                      </td>
                    </>
                  )}
                  <td className="p-4">
                    {lead.updated_at ? (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                        <span className="text-sm text-[var(--text-secondary)] font-medium">
                          {getRelativeTime(lead.updated_at)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
                        <span className="text-sm text-[var(--text-muted)] font-medium">
                          —
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="hover:bg-[var(--accent-muted)] hover:text-[var(--accent)]"
                        onClick={() => {
                          setCallbackFromStage(lead.pipeline_stage)
                          setCallbackLead(lead)
                        }}
                        title="Schedule callback"
                      >
                        <PhoneForwarded className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="hover:bg-[var(--success-bg)] hover:text-[var(--success)]"
                        onClick={() => {
                          setBookingSimpleMode(false)
                          setBookingCallbackMode(false)
                          setBookingLead(lead)
                        }}
                        title="Book appointment"
                      >
                        <Calendar className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                  {/* Document completion indicator */}
                  <td className="p-2">
                    <SimpleTooltip
                      content={documentCompleteLeads.has(lead.id) ? "All documents uploaded - Ready to submit" : "Documents pending"}
                    >
                      <div className="flex items-center justify-center">
                        <div
                          className={cn(
                            "w-2.5 h-2.5 rounded-full transition-colors",
                            documentCompleteLeads.has(lead.id)
                              ? "bg-emerald-500"
                              : "bg-gray-300 dark:bg-gray-600"
                          )}
                        />
                      </div>
                    </SimpleTooltip>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between p-4 border-t border-[var(--border)] bg-[var(--bg-sunken)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
            <span className="text-2xl font-bold text-[var(--primary)]">{leads.length}</span>
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">leads</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled className="rounded-lg">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <div className="px-3 py-1.5 rounded-lg bg-[var(--primary-muted)] text-[var(--primary)] text-sm font-medium">
            Page 1
          </div>
          <Button variant="outline" size="sm" disabled className="rounded-lg">
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </Card>

    {/* Appointment Booking Popup */}
    <AppointmentBooking
      isOpen={!!bookingLead}
      onClose={() => {
        setBookingLead(null)
        setBookingSimpleMode(false)
        setBookingCallbackMode(false)
      }}
      onSuccess={() => {
        setBookingLead(null)
        setBookingSimpleMode(false)
        setBookingCallbackMode(false)
      }}
      preselectedLead={bookingLead || undefined}
      singleFormMode={true}
      callbackMode={bookingCallbackMode}
    />

    {/* Callback Scheduler Popup */}
    <CallbackScheduler
      isOpen={!!callbackLead}
      onClose={() => {
        setCallbackLead(null)
        setCallbackFromStage(undefined)
      }}
      onSuccess={() => {
        if (callbackLead) {
          incrementContactCount(callbackLead.id)
        }
        setCallbackLead(null)
        setCallbackFromStage(undefined)
      }}
      lead={callbackLead}
      fromStage={callbackFromStage}
    />

    {/* Mark Lost Dialog */}
    <MarkLostDialog
      open={!!lostDialogLead}
      onOpenChange={(open) => {
        if (!open) setLostDialogLead(null)
      }}
      leadName={lostDialogLead ? `${lostDialogLead.first_name} ${lostDialogLead.last_name}` : ''}
      onConfirm={handleLostConfirm}
    />

    {/* Contacted Status Required Dialog */}
    <ContactedStatusDialog
      open={!!contactedDialogLead}
      onOpenChange={(open) => {
        if (!open) setContactedDialogLead(null)
      }}
      leadName={contactedDialogLead ? `${contactedDialogLead.first_name} ${contactedDialogLead.last_name}` : ''}
      onConfirm={handleContactedConfirm}
    />

    {/* Withdraw Reason Dialog */}
    <WithdrawReasonDialog
      open={!!withdrawDialogLead}
      onOpenChange={(open) => {
        if (!open) setWithdrawDialogLead(null)
      }}
      leadName={withdrawDialogLead ? `${withdrawDialogLead.first_name} ${withdrawDialogLead.last_name}` : ''}
      onConfirm={handleWithdrawConfirm}
    />

    {/* Blocked Reason Dialog (PUC SRJ) */}
    <BlockedReasonDialog
      open={!!blockedDialogLead}
      onOpenChange={(open) => {
        if (!open) setBlockedDialogLead(null)
      }}
      leadName={blockedDialogLead ? `${blockedDialogLead.first_name} ${blockedDialogLead.last_name}` : ''}
      onConfirm={handleBlockedConfirm}
    />

    </>
  )
}

// Bulk actions bar component
interface BulkActionsProps {
  selectedCount: number
  onAssign: () => void
  onBook: () => void
  onDelete: () => void
  onClear: () => void
  onMOEFetch?: () => void
}

export function BulkActionsBar({ selectedCount, onAssign, onBook, onDelete, onClear, onMOEFetch }: BulkActionsProps) {
  if (selectedCount === 0) return null

  return (
    <motion.div
      initial={{ y: 100, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 100, opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:left-[calc(50%+130px)] z-40"
    >
      <div className="flex items-center gap-4 px-5 py-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] shadow-md">
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
