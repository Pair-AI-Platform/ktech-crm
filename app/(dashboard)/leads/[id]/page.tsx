"use client"

import { useState, use, useRef, useEffect, useMemo } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Header } from "@/components/layout/header"
import { getLeadDisplayName, getLeadShortDisplayName } from "@/lib/lead-utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/input"
import {
  ArrowLeft,
  Phone,
  Calendar,
  Edit,
  FileText,
  User,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Check,
  ChevronDown,
  Flame,
  Bell,
  Tag,
  Activity,
  Filter,
  Mail,
  X,
  RotateCcw,
  CalendarDays,
  UserCircle,
  ArrowUpRight,
  ArrowRightLeft,
  CircleDot,
  ClipboardList,
  StickyNote,
  Send,
  Star,
  GraduationCap,
  PhoneForwarded,
  RefreshCw,
} from "lucide-react"
import { PIPELINE_STAGES, MINISTRY_BLOCK_REASONS, ORIENTATION_STATUSES, LEAD_STATUSES, APPLICANT_ONLY_STATUSES, type PipelineStage, type OrientationStatus, type Lead, type LeadStatus } from "@/types"
import { formatDate, cn, getInitials } from "@/lib/utils"
import { useLead, useLeadMutations } from "@/lib/hooks/use-leads"
import { useLeadAppointments, useAppointmentMutations } from "@/lib/hooks/use-appointments"
import { useUser } from "@/lib/hooks/use-user"

import { useLeadShortcuts } from "@/lib/hooks/use-lead-shortcuts"
import { StudentInfoForm } from "@/components/leads/student-info-form"
import { SimpleTooltip } from "@/components/ui/tooltip"
import { InlineTagSelect } from "@/components/ui/notion-tag-select"
import { PSPTrackingSection } from "@/components/leads/psp-tracking-section"
import { useLeadActivities } from "@/lib/hooks/use-activities"
import { getDocumentsForGraduateType, type GraduateType } from "@/lib/psp/document-rules"
import { getMissingPucDocumentStageRequirements, type PucDocumentCount } from "@/lib/psp/document-stage-requirements"
import { checkStageTransition } from "@/lib/lead-stage-guards"
import { GPA_SELF_FUNDED_THRESHOLD } from "@/lib/config/constants"

const LeadForm = dynamic(
  () => import("@/components/leads/lead-form").then(m => m.LeadForm),
  { ssr: false }
)
const MarkLostDialog = dynamic(
  () => import("@/components/leads/mark-lost-dialog").then(m => m.MarkLostDialog),
  { ssr: false }
)
const EnrollmentPaymentDialog = dynamic(
  () => import("@/components/leads/enrollment-payment-dialog").then(m => m.EnrollmentPaymentDialog),
  { ssr: false }
)
const FileFeePaymentDialog = dynamic(
  () => import("@/components/leads/file-fee-payment-dialog").then(m => m.FileFeePaymentDialog),
  { ssr: false }
)
const SFDownPaymentCard = dynamic(
  () => import("@/components/leads/sf-down-payment-card").then(m => m.SFDownPaymentCard),
  { ssr: false }
)
const CallbackScheduler = dynamic(
  () => import("@/components/leads/callback-scheduler").then(m => m.CallbackScheduler),
  { ssr: false }
)
const SendRSVPDialog = dynamic(
  () => import("@/components/leads/send-rsvp-dialog").then(m => m.SendRSVPDialog),
  { ssr: false }
)
const LeadDocuments = dynamic(
  () => import("@/components/leads/lead-documents").then(m => m.LeadDocuments),
  { ssr: false }
)
const SFDocumentManager = dynamic(
  () => import("@/components/leads/sf-document-manager").then(m => m.SFDocumentManager),
  { ssr: false }
)
const PUCDocumentUpload = dynamic(
  () => import("@/components/leads/puc-document-upload").then(m => m.PUCDocumentUpload),
  { ssr: false }
)
const PSPSubmissionWizard = dynamic(
  () => import("@/components/leads/psp-submission-wizard").then(m => m.PSPSubmissionWizard),
  { ssr: false }
)
const SendPspSelfServiceDialog = dynamic(
  () => import("@/components/leads/send-psp-self-service-dialog").then(m => m.SendPspSelfServiceDialog),
  { ssr: false }
)
const FileStageRequirementsDialog = dynamic(
  () => import("@/components/leads/file-stage-requirements-dialog").then(m => m.FileStageRequirementsDialog),
  { ssr: false }
)

// Simplified stage order for the pipeline
const STAGE_ORDER = ["new", "contacted", "visit", "test", "application", "puc_document_submission", "puc_application_submission", "applicant", "enrolled", "withdraw", "lost"] as const
const PUC_ONLY_STAGE_VALUES = new Set<PipelineStage>(["puc_document_submission", "puc_application_submission"])


// Note types for activity feed
type NoteType = string

// Filter categories group related activity types for the filter pills
type FilterCategory = 'all' | 'stage' | 'status' | 'payment' | 'communication' | 'enrollment' | 'system' | 'note' | 'sources'

const FILTER_CATEGORIES: { key: FilterCategory; label: string; icon: typeof Phone; color: string; types: string[] }[] = [
  { key: 'all', label: 'All', icon: FileText, color: 'text-slate-500', types: [] },
  { key: 'stage', label: 'Stage', icon: ArrowRightLeft, color: 'text-indigo-500', types: ['stage_change', 'funding_type_change', 'funding_change', 'doc_status_change'] },
  { key: 'status', label: 'Status', icon: CircleDot, color: 'text-rose-500', types: ['status_change'] },
  { key: 'payment', label: 'Payment', icon: CheckCircle2, color: 'text-green-500', types: ['payment_received', 'payment_failed', 'payment_link_created', 'payment_link_sent', 'psp_payment_received', 'psp_payment_failed', 'psp_fee_link_created', 'psp_fee_link_sent', 'psp_receipt_sent', 'puc_fee_paid', 'puc_fee_link_created', 'puc_fee_link_sent'] },
  { key: 'communication', label: 'Communication', icon: Send, color: 'text-blue-500', types: ['call', 'meeting', 'follow-up', 'email', 'whatsapp_sent', 'ai_transfer'] },
  { key: 'enrollment', label: 'Enrollment', icon: GraduationCap, color: 'text-purple-500', types: ['puc_enrollment', 'enrollment_failed', 'gpa_override', 'gpa_update', 'moe_gpa_fetch', 'lms_sync', 'lms_sync_failed'] },
  { key: 'system', label: 'System', icon: RefreshCw, color: 'text-cyan-500', types: ['lead_created', 'campaign_created', 'campaign_updated', 'campaign_deleted'] },
  { key: 'sources', label: 'Sources', icon: Tag, color: 'text-orange-500', types: ['source_change', 'lead_source_change'] },
  { key: 'note', label: 'Note', icon: StickyNote, color: 'text-amber-500', types: ['note'] },
]

interface ParsedNote {
  id: string
  timestamp: string
  rawTimestamp: Date | null
  content: string
  type: NoteType
  isPinned: boolean
  originalIndex: number
  createdByName?: string
}

const NOTE_TYPE_CONFIG: Record<string, { label: string; icon: typeof Phone; color: string }> = {
  all: { label: "All", icon: FileText, color: "text-slate-500" },
  call: { label: "Call", icon: Phone, color: "text-emerald-500" },
  meeting: { label: "Meeting", icon: Calendar, color: "text-blue-500" },
  'follow-up': { label: "Follow-up", icon: Bell, color: "text-amber-500" },
  email: { label: "Email", icon: Mail, color: "text-purple-500" },
  note: { label: "Note", icon: StickyNote, color: "text-slate-500" },
  stage_change: { label: "Stage Change", icon: ArrowRightLeft, color: "text-indigo-500" },
  status_change: { label: "Status Change", icon: CircleDot, color: "text-rose-500" },
  funding_type_change: { label: "Funding Change", icon: ArrowRightLeft, color: "text-indigo-500" },
  funding_change: { label: "Funding Change", icon: ArrowRightLeft, color: "text-indigo-500" },
  doc_status_change: { label: "Doc Status", icon: ClipboardList, color: "text-indigo-500" },
  gpa_override: { label: "GPA Override", icon: Edit, color: "text-purple-500" },
  gpa_update: { label: "GPA Update", icon: GraduationCap, color: "text-purple-500" },
  moe_gpa_fetch: { label: "MOE GPA", icon: GraduationCap, color: "text-purple-500" },
  payment_received: { label: "Payment Received", icon: CheckCircle2, color: "text-green-500" },
  payment_failed: { label: "Payment Failed", icon: XCircle, color: "text-red-500" },
  payment_link_created: { label: "Payment Link", icon: Send, color: "text-green-500" },
  payment_link_sent: { label: "Link Sent", icon: Send, color: "text-green-500" },
  psp_payment_received: { label: "PSP Payment", icon: CheckCircle2, color: "text-green-500" },
  psp_payment_failed: { label: "PSP Failed", icon: XCircle, color: "text-red-500" },
  psp_fee_link_created: { label: "PSP Fee Link", icon: Send, color: "text-green-500" },
  psp_fee_link_sent: { label: "PSP Fee Sent", icon: Send, color: "text-green-500" },
  psp_receipt_sent: { label: "PSP Receipt", icon: Send, color: "text-green-500" },
  puc_enrollment: { label: "PUC Enrollment", icon: GraduationCap, color: "text-purple-500" },
  puc_fee_paid: { label: "PUC Fee Paid", icon: CheckCircle2, color: "text-green-500" },
  puc_fee_link_created: { label: "PUC Fee Link", icon: Send, color: "text-green-500" },
  puc_fee_link_sent: { label: "PUC Fee Sent", icon: Send, color: "text-green-500" },
  enrollment_failed: { label: "Enrollment Failed", icon: XCircle, color: "text-red-500" },
  whatsapp_sent: { label: "WhatsApp Sent", icon: Send, color: "text-blue-500" },
  ai_transfer: { label: "AI Transfer", icon: PhoneForwarded, color: "text-cyan-500" },
  lms_sync: { label: "LMS Sync", icon: RefreshCw, color: "text-cyan-500" },
  lms_sync_failed: { label: "LMS Sync Failed", icon: XCircle, color: "text-red-500" },
  campaign_created: { label: "Campaign Created", icon: Star, color: "text-cyan-500" },
  campaign_updated: { label: "Campaign Updated", icon: RefreshCw, color: "text-cyan-500" },
  campaign_deleted: { label: "Campaign Deleted", icon: XCircle, color: "text-cyan-500" },
  lead_created: { label: "Lead Created", icon: User, color: "text-cyan-500" },
  source_change: { label: "Source Change", icon: Tag, color: "text-orange-500" },
  lead_source_change: { label: "Source Change", icon: Tag, color: "text-orange-500" },
}

function detectNoteType(content: string): NoteType {
  const lower = content.toLowerCase()
  if (lower.includes('[call]') || lower.includes('call') || lower.includes('phone') || lower.includes('spoke')) return 'call'
  if (lower.includes('[meeting]') || lower.includes('meeting') || lower.includes('visit') || lower.includes('met with')) return 'meeting'
  if (lower.includes('[follow-up]') || lower.includes('follow') || lower.includes('reminder') || lower.includes('check back')) return 'follow-up'
  if (lower.includes('[email]') || lower.includes('email') || lower.includes('sent mail') || lower.includes('emailed')) return 'email'
  return 'note'
}

function parseNotes(notesString: string | undefined, pinnedIds: Set<string>, fallbackAgentName?: string): ParsedNote[] {
  if (!notesString) return []

  return notesString.split('\n\n').filter(Boolean).map((note, index) => {
    const match = note.match(/^\[([^\]]+)\]\s*([\s\S]*)$/)
    const bracketContent = match ? match[1] : 'Unknown'
    const content = match ? match[2] : note

    // Parse agent name from "timestamp | AgentName" format
    let timestamp = bracketContent
    let createdByName: string | undefined
    const pipeIndex = bracketContent.indexOf('|')
    if (pipeIndex !== -1) {
      timestamp = bracketContent.slice(0, pipeIndex).trim()
      createdByName = bracketContent.slice(pipeIndex + 1).trim()
    }

    const id = `note-${index}-${bracketContent.replace(/\s/g, '')}`

    let rawTimestamp: Date | null = null
    if (match) {
      const parsed = new Date(timestamp)
      if (!isNaN(parsed.getTime())) {
        rawTimestamp = parsed
      } else {
        const currentYear = new Date().getFullYear()
        const dateStr = `${timestamp}, ${currentYear}`
        const parsed2 = new Date(dateStr)
        if (!isNaN(parsed2.getTime())) {
          rawTimestamp = parsed2
        }
      }
    }

    return {
      id,
      timestamp,
      rawTimestamp,
      content,
      type: detectNoteType(content),
      isPinned: pinnedIds.has(id),
      originalIndex: index,
      createdByName: createdByName || fallbackAgentName,
    }
  })
}

function groupNotesByDate(notes: ParsedNote[]): { label: string; notes: ParsedNote[] }[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const thisWeekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000)
  const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000)

  const groups: { label: string; notes: ParsedNote[] }[] = [
    { label: 'Pinned', notes: [] },
    { label: 'Today', notes: [] },
    { label: 'Yesterday', notes: [] },
    { label: 'This Week', notes: [] },
    { label: 'Last Week', notes: [] },
    { label: 'Older', notes: [] },
  ]

  const pinnedNotes = notes.filter(n => n.isPinned)
  const unpinnedNotes = notes.filter(n => !n.isPinned)

  groups[0].notes = pinnedNotes

  unpinnedNotes.forEach(note => {
    if (!note.rawTimestamp) {
      groups[5].notes.push(note)
      return
    }

    const noteDate = new Date(note.rawTimestamp.getFullYear(), note.rawTimestamp.getMonth(), note.rawTimestamp.getDate())

    if (noteDate.getTime() === today.getTime()) {
      groups[1].notes.push(note)
    } else if (noteDate.getTime() === yesterday.getTime()) {
      groups[2].notes.push(note)
    } else if (noteDate >= thisWeekStart) {
      groups[3].notes.push(note)
    } else if (noteDate >= lastWeekStart) {
      groups[4].notes.push(note)
    } else {
      groups[5].notes.push(note)
    }
  })

  return groups.filter(g => g.notes.length > 0)
}

function StickFigureAvatar({ gender }: { gender?: string | null }) {
  const isFemale = gender?.toLowerCase() === 'female'

  return (
    <svg
      viewBox="0 0 80 80"
      className="h-12 w-12"
      fill="none"
      aria-hidden="true"
    >
      {isFemale ? (
        <>
          <path d="M27 28c0-10 6.5-18 13-18s13 8 13 18" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="40" cy="27" r="10" stroke="currentColor" strokeWidth="4.5" />
          <path d="M23 64c0-13 7.5-21 17-21s17 8 17 21" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M30 45c4 3.5 16 3.5 20 0" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="40" cy="24" r="11" stroke="currentColor" strokeWidth="4.5" />
          <path d="M24 63c0-12 7-20 16-20s16 8 16 20" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M31 45c5 4 13 4 18 0" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}

// Stage gradient colors
const STAGE_GRADIENT: Record<string, { from: string; to: string; text: string }> = {
  new: { from: 'var(--primary)', to: 'var(--primary)', text: 'white' },
  contacted: { from: 'var(--primary)', to: 'var(--primary)', text: 'white' },
  appointment: { from: 'var(--accent, var(--primary))', to: 'var(--accent, var(--primary))', text: 'white' },
  visit: { from: 'var(--accent, var(--primary))', to: 'var(--accent, var(--primary))', text: 'white' },
  test: { from: 'var(--success)', to: 'var(--success)', text: 'white' },
  application: { from: 'var(--success)', to: 'var(--success)', text: 'white' },
  applicant: { from: 'var(--success)', to: 'var(--success)', text: 'white' },
  enrolled: { from: 'var(--success)', to: 'var(--success)', text: 'white' },
  lost: { from: 'var(--text-muted)', to: 'var(--text-muted)', text: 'white' },
  // PUC stages
  ktech_application: { from: 'var(--primary)', to: 'var(--primary)', text: 'white' },
  paci_verification: { from: 'var(--primary)', to: 'var(--primary)', text: 'white' },
  puc_submission: { from: 'var(--success)', to: 'var(--success)', text: 'white' },
  puc_decision: { from: 'var(--success)', to: 'var(--success)', text: 'white' },
}

function getLowGpaValue(lead: Lead): number | null {
  const gpaValues = [
    lead.actual_gpa,
    lead.gpa_grade_10,
    lead.gpa_grade_11,
    lead.gpa_grade_12_expected,
  ]

  return gpaValues.find((gpa): gpa is number => gpa !== undefined && gpa !== null && gpa < GPA_SELF_FUNDED_THRESHOLD) ?? null
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const searchParams = useSearchParams()
  const { profile, isAdmin } = useUser()
  const { lead, loading, error, refetch: refetchLead } = useLead(resolvedParams.id)
  const { appointments } = useLeadAppointments(resolvedParams.id)
  const { activities } = useLeadActivities(resolvedParams.id)
  const { updateLeadStage, updateLead, loading: mutationLoading } = useLeadMutations()
  // Show all pipeline stages in the stepper (excluding 'lost' and 'withdraw' as they're handled separately)
  const activeStageOrder = useMemo(() => {
    return STAGE_ORDER.filter(s => {
      if (s === 'lost' || s === 'withdraw') return false
      // Hide PUC stages for self-funded leads
      if (lead?.funding_type === 'self_funded' && (s === 'puc_document_submission' || s === 'puc_application_submission')) return false
      return true
    })
  }, [lead?.funding_type])

  const [updatingStage, setUpdatingStage] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingOrientationStatus, setEditingOrientationStatus] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const statusDropdownRef = useRef<HTMLDivElement>(null)
  const autoSelfFundedLeadIdsRef = useRef<Set<string>>(new Set())

  // Get the stage filter from URL params for back navigation
  const stageFromUrl = searchParams.get('stage') as PipelineStage | null
  const fromPage = searchParams.get('from')
  const backUrl = fromPage === 'sf_srj' ? '/puc?tab=self_fund'
    : fromPage === 'puc' ? '/puc?tab=puc'
    : fromPage === 'self_fund' ? '/puc?tab=self_fund'
    : stageFromUrl ? `/leads?stage=${stageFromUrl}` : '/leads'
  const backLabel = fromPage === 'sf_srj' ? 'Self Funded'
    : fromPage === 'puc' ? 'PUC'
    : fromPage === 'self_fund' ? 'Self Fund'
    : stageFromUrl ? PIPELINE_STAGES.find(s => s.value === stageFromUrl)?.label || 'Leads' : null
  const [newNote, setNewNote] = useState("")
  const [showLostDialog, setShowLostDialog] = useState(false)
  const [showReactivateMenu, setShowReactivateMenu] = useState(false)
  const reactivateMenuRef = useRef<HTMLDivElement>(null)
  const [showEnrollmentDialog, setShowEnrollmentDialog] = useState(false)
  const [showFileFeeDialog, setShowFileFeeDialog] = useState(false)
  const [fileRequirementsMissingFields, setFileRequirementsMissingFields] = useState<string[]>([])
  const [noteFilter, setNoteFilter] = useState<FilterCategory>('all')
  const [pinnedNoteIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'activity'>('details')
  const [showPSPWizard, setShowPSPWizard] = useState(false)
  const [showPSPSelfService, setShowPSPSelfService] = useState(false)
  const [showRSVPDialog, setShowRSVPDialog] = useState(false)
  const [showCallbackScheduler, setShowCallbackScheduler] = useState(false)
  const [rescheduleAppointmentId, setRescheduleAppointmentId] = useState<string | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [rescheduleTime, setRescheduleTime] = useState("")
  const [rescheduling, setRescheduling] = useState(false)

  useEffect(() => {
    if (!lead || lead.funding_type !== "puc" || autoSelfFundedLeadIdsRef.current.has(lead.id)) return

    const lowGpa = getLowGpaValue(lead)
    if (lowGpa === null) return

    autoSelfFundedLeadIdsRef.current.add(lead.id)
    const updates: Partial<Lead> = { funding_type: "self_funded" }
    if (PUC_ONLY_STAGE_VALUES.has(lead.pipeline_stage)) {
      updates.pipeline_stage = "application"
    }

    updateLead(lead.id, updates).then((result) => {
      if (result.error) {
        autoSelfFundedLeadIdsRef.current.delete(lead.id)
        return
      }
      refetchLead()
    })
  }, [lead, updateLead, refetchLead])
  const { updateAppointment } = useAppointmentMutations()
  const notesInputRef = useRef<HTMLTextAreaElement>(null)

  useLeadShortcuts({
    lead,
    onEdit: () => setShowEditForm(true),
    onFocusNotes: () => notesInputRef.current?.focus(),
  })

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (reactivateMenuRef.current && !reactivateMenuRef.current.contains(event.target as Node)) {
        setShowReactivateMenu(false)
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleOrientationStatusChange = async (newStatus: OrientationStatus | '') => {
    if (!lead) return
    setEditingOrientationStatus(true)
    await updateLead(lead.id, { orientation_status: newStatus || undefined } as Partial<typeof lead>)
    await refetchLead()
    setEditingOrientationStatus(false)
  }

  // Stage-to-status mapping
  const STAGE_STATUSES: Record<PipelineStage, LeadStatus[] | 'none'> = {
    new: 'none',
    contacted: ['no_answer', 'switched_off', 'interested', 'not_interested', 'high_gpa', 'wrong_number', 'will_see', 'pay_later'],
    visit: ['no_answer', 'cant_reach', 'interested', 'not_interested', 'pay_later'],
    test: ['online', 'on_campus'],
    application: ['no_answer', 'switched_off', 'interested', 'not_interested', 'high_gpa', 'wrong_number', 'will_see', 'pay_later'],
    lost: ['not_interested', 'wrong_number', 'competitor', 'cant_reach', 'rude'],
    applicant: ['no_answer', 'cant_reach', 'informed', 'travelling', 'might_withdraw', 'pay_later'],
    enrolled: 'none',
    withdraw: ['might_withdraw', 'not_interested', 'competitor'],
    puc_document_submission: ['no_answer', 'cant_reach', 'interested', 'not_interested', 'will_see'],
    puc_application_submission: ['applied', 'changed_preferences', 'blocked_ku', 'blocked_paaet', 'blocked_abroad', 'blocked_aasu', 'blocked_paci', 'blocked_puc', 'blocked_other'],
  }

  const availableStatuses = useMemo(() => {
    if (!lead) return []
    const stageConfig = STAGE_STATUSES[lead.pipeline_stage]
    if (stageConfig === 'none') return []
    const isSelfFunded = lead.funding_type === 'self_funded'
    const statuses = LEAD_STATUSES.filter(s => (stageConfig as LeadStatus[]).includes(s.value))
    return statuses.filter(s => s.value !== 'pay_later' || isSelfFunded)
  }, [lead?.pipeline_stage, lead?.funding_type])

  // Check if current status belongs to this stage's statuses
  const isStatusValidForStage = useMemo(() => {
    if (!lead?.status) return true
    return availableStatuses.some(s => s.value === lead.status)
  }, [lead?.status, availableStatuses])

  const handleStatusChange = async (newStatus: LeadStatus | '') => {
    if (!lead) return
    setUpdatingStatus(true)
    await updateLead(lead.id, { status: newStatus || null } as Partial<typeof lead>)
    await refetchLead()
    setUpdatingStatus(false)
    setShowStatusDropdown(false)
  }

  // Only the assigned agent or admin can change the stage
  const canChangeStage = isAdmin || (profile && lead?.assigned_to === profile.id)

  const getPucDocumentCountForLead = async (targetLead: Lead): Promise<PucDocumentCount | undefined> => {
    const rawGraduateType = targetLead.education_type?.toUpperCase()
    if (!rawGraduateType) return undefined

    const graduateType = rawGraduateType as GraduateType
    const requiredIds = getDocumentsForGraduateType(graduateType, {
      isTransfer: targetLead.is_transfer_student,
      isSpecialNeeds: targetLead.is_special_needs,
      isDiplomatic: targetLead.is_diplomatic,
    })
      .filter(doc => doc.required)
      .map(doc => doc.id)

    if (requiredIds.length === 0) {
      return { uploaded: 0, required: 0 }
    }

    try {
      const response = await fetch(`/api/psp/documents?lead_id=${targetLead.id}&graduate_type=${graduateType}`)
      if (!response.ok) {
        return { uploaded: 0, required: requiredIds.length }
      }
      const data = await response.json().catch(() => ({})) as { documents?: Array<{ document_type?: string | null }> }
      const uploadedTypes = new Set(
        (data.documents ?? [])
          .map(doc => doc.document_type)
          .filter((documentType): documentType is string => !!documentType)
      )
      return {
        uploaded: requiredIds.filter(id => uploadedTypes.has(id)).length,
        required: requiredIds.length,
      }
    } catch {
      return { uploaded: 0, required: requiredIds.length }
    }
  }

  const handleStageClick = async (stage: string) => {
    console.log('[Stage Click] Clicked stage:', stage, 'Current stage:', lead?.pipeline_stage)

    if (!lead || updatingStage || lead.pipeline_stage === 'lost' || !canChangeStage) {
      console.log('[Stage Click] Early return - lead:', !!lead, 'updating:', updatingStage, 'isLost:', lead?.pipeline_stage === 'lost', 'canChange:', canChangeStage)
      return
    }

    if (stage === lead.pipeline_stage) {
      console.log('[Stage Click] Same stage, skipping')
      return
    }

    // Intercept "application" (File) stage - require complete info and file fee first
    if (stage === 'application' && lead.pipeline_stage !== 'application') {
      const guard = checkStageTransition({ lead, newStage: "application" })
      if (guard.kind === "file_requirements") {
        setFileRequirementsMissingFields(guard.missingFields)
        return
      }
      if (guard.kind === "file_fee") {
        console.log('[Stage Click] Intercepting file stage click - showing file fee dialog')
        setShowFileFeeDialog(true)
        return
      }
    }

    if (stage === 'puc_document_submission' && lead.pipeline_stage === 'application' && lead.funding_type === 'puc') {
      const documentCount = await getPucDocumentCountForLead(lead)
      const missingFields = getMissingPucDocumentStageRequirements(lead, documentCount)
      if (missingFields.length > 0) {
        window.alert(`Complete ${missingFields.join(", ")} before moving this lead to Documents.`)
        setShowPSPWizard(true)
        return
      }
    }

    // Intercept "enrolled" stage - require payment first
    if (stage === 'enrolled' && lead.pipeline_stage === 'application') {
      console.log('[Stage Click] Intercepting enrolled click - showing payment dialog')
      setShowEnrollmentDialog(true)
      return
    }

    // Intercept SF lead clicking "applicant" from "application" - require down payment via inline wizard
    if (stage === 'applicant' && lead.pipeline_stage === 'application' && lead.funding_type === 'self_funded') {
      // The SF Wizard is already visible inline — scroll to it
      const wizardEl = document.querySelector('[data-sf-wizard]')
      if (wizardEl) wizardEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    // Prevent stages before 'application' from jumping past 'application'
    const applicationIndex = STAGE_ORDER.indexOf('application')
    const currentIndex = STAGE_ORDER.indexOf(lead.pipeline_stage as typeof STAGE_ORDER[number])
    const targetIndex = STAGE_ORDER.indexOf(stage as typeof STAGE_ORDER[number])

    if (currentIndex < applicationIndex && targetIndex > applicationIndex) {
      console.log('[Stage Click] Cannot skip application stage - must go through application first')
      return
    }

    setUpdatingStage(true)
    try {
      const stageIndex = STAGE_ORDER.indexOf(stage as typeof STAGE_ORDER[number])
      const currentIndex = STAGE_ORDER.indexOf(lead.pipeline_stage as typeof STAGE_ORDER[number])
      console.log('[Stage Click] Moving from index', currentIndex, 'to', stageIndex)

      if (stageIndex > currentIndex) {
        const stagesToComplete: PipelineStage[] = []
        for (let i = currentIndex; i <= stageIndex; i++) {
          const s = STAGE_ORDER[i]
          if (s !== 'lost') {
            stagesToComplete.push(s as PipelineStage)
          }
        }
        const existingCompleted = lead.completed_stages || []
        const newCompletedStages = [...new Set([...existingCompleted, ...stagesToComplete])]
        console.log('[Stage Click] Completing stages:', newCompletedStages)

        const result = await updateLead(lead.id, {
          pipeline_stage: stage as PipelineStage,
          completed_stages: newCompletedStages,
          last_contacted_at: new Date().toISOString(),
        })
        console.log('[Stage Click] Update result:', result)
      } else {
        // Moving backward - only keep completed stages up to the new stage
        const existingCompleted = lead.completed_stages || []
        const newCompletedStages = existingCompleted.filter(s => {
          const sIndex = STAGE_ORDER.indexOf(s)
          return sIndex <= stageIndex
        })
        console.log('[Stage Click] Moving backward, keeping stages:', newCompletedStages)

        const result = await updateLead(lead.id, {
          pipeline_stage: stage as PipelineStage,
          completed_stages: newCompletedStages,
          last_contacted_at: new Date().toISOString(),
        })
        console.log('[Stage Click] Update result:', result)
      }

      await refetchLead()
      console.log('[Stage Click] Refetch complete')
    } catch (error) {
      console.error("Error updating stage:", error)
    } finally {
      setUpdatingStage(false)
    }
  }


  const handleMarkLost = () => {
    setShowLostDialog(true)
  }

  // Allowed stages for reactivating a lost lead
  const LOST_LEAD_REACTIVATE_STAGES: { value: PipelineStage; label: string }[] = [
    { value: 'application', label: 'File' },
    { value: 'contacted', label: 'Contacted' },
  ]

  const handleReactivateLead = async (targetStage?: PipelineStage) => {
    if (!lead) return

    // Use provided target stage, or fall back to last completed stage
    let reactivateToStage: PipelineStage = targetStage || 'contacted'

    if (!targetStage) {
      const completedStages = lead.completed_stages || []
      for (let i = STAGE_ORDER.length - 2; i >= 0; i--) {
        const stage = STAGE_ORDER[i]
        if (completedStages.includes(stage as PipelineStage)) {
          reactivateToStage = stage as PipelineStage
          break
        }
      }
    }

    if (reactivateToStage === 'application') {
      const guard = checkStageTransition({ lead, newStage: "application" })
      if (guard.kind === "file_requirements") {
        setFileRequirementsMissingFields(guard.missingFields)
        return
      }
      if (guard.kind === "file_fee") {
        setShowFileFeeDialog(true)
        return
      }
    }

    const result = await updateLead(lead.id, {
      pipeline_stage: reactivateToStage,
      lost_reason_id: null,
      lost_reason_notes: null,
      lost_at_stage: null,
    })
    if (!result.error) {
      setShowReactivateMenu(false)
      await refetchLead()
    }
  }

  const handleAddNote = async () => {
    if (!lead || !newNote.trim()) return

    const timestamp = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    const agentName = profile?.full_name
    const formattedNote = agentName
      ? `[${timestamp} | ${agentName}] ${newNote.trim()}`
      : `[${timestamp}] ${newNote.trim()}`
    const updatedNotes = lead.notes
      ? `${formattedNote}\n\n${lead.notes}`
      : formattedNote

    await updateLead(lead.id, { notes: updatedNotes })
    await refetchLead()
    setNewNote("")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)]">
        <Header user={profile} title="" breadcrumbs={[{ label: "Leads", href: "/leads" }, { label: "Loading..." }]} hideSearch />
        <div className="flex items-center justify-center h-[60vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-xl bg-[var(--primary)] opacity-20" />
              <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[var(--text-muted)] text-sm">Loading lead details...</p>
          </motion.div>
        </div>
      </div>
    )
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)]">
        <Header user={profile} title="" breadcrumbs={[{ label: "Leads", href: "/leads" }, { label: "Not Found" }]} hideSearch />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center h-[60vh] gap-4"
        >
          <div className="w-20 h-20 rounded-xl bg-[var(--error-bg)] flex items-center justify-center">
            <XCircle className="w-10 h-10 text-[var(--error)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Lead Not Found</h2>
          <p className="text-[var(--text-secondary)] text-sm text-center max-w-sm">
            This lead doesn&apos;t exist or you don&apos;t have permission to view it.
          </p>
          <Link href="/leads">
            <Button variant="outline" className="gap-2 mt-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Leads
            </Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  const stageInfo = PIPELINE_STAGES.find((s) => s.value === lead.pipeline_stage)
  const currentStageIndex = activeStageOrder.indexOf(lead.pipeline_stage as (typeof activeStageOrder)[number])

  const upcomingAppointments = appointments
    .filter(apt => {
      const aptDate = new Date(`${apt.scheduled_date}T${apt.scheduled_time}`)
      return aptDate >= new Date() && apt.status !== 'cancelled'
    })
    .slice(0, 2)

  const parsedNotes = parseNotes(lead.notes, pinnedNoteIds, lead.assigned_agent?.full_name)

  // Convert activities to ParsedNote format
  const activityNotes: ParsedNote[] = activities.map((activity, index) => ({
    id: activity.id,
    timestamp: new Date(activity.created_at).toLocaleString(),
    rawTimestamp: new Date(activity.created_at),
    content: activity.description || activity.title || '',
    type: activity.activity_type as NoteType,
    isPinned: false,
    originalIndex: -1 - index, // Negative to distinguish from notes
    createdByName: activity.created_by_profile?.full_name,
  }))

  // Combine notes and activities, then sort by date
  const allNotes = [...parsedNotes, ...activityNotes].sort((a, b) => {
    if (!a.rawTimestamp && !b.rawTimestamp) return 0
    if (!a.rawTimestamp) return 1
    if (!b.rawTimestamp) return -1
    return b.rawTimestamp.getTime() - a.rawTimestamp.getTime()
  })

  const filteredNotes = noteFilter === 'all'
    ? allNotes
    : allNotes.filter(n => {
        const category = FILTER_CATEGORIES.find(c => c.key === noteFilter)
        return category ? category.types.includes(n.type) : false
      })
  const groupedNotes = groupNotesByDate(filteredNotes)

  const stageGradient = STAGE_GRADIENT[lead.pipeline_stage] || STAGE_GRADIENT.new


  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Header
        user={profile}
        title=""
        breadcrumbs={[
          { label: backLabel || "Leads", href: backUrl },
          { label: getLeadDisplayName(lead) },
        ]}
        hideSearch
      />

      <motion.div
        className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 pb-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Back Link */}
        <div className="pt-2 pb-3">
          <Link
            href={backUrl}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            {backLabel ? `Back to ${backLabel}` : 'All Leads'}
          </Link>
        </div>

        {/* Profile header — compact single row */}
        <motion.div
          data-lead-header-version="clean-profile-v3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className={cn(
            "relative overflow-hidden rounded-lg border bg-[var(--bg-surface)]",
            lead.priority === 'critical'
              ? "border-red-500/40 shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)]"
              : "border-[var(--border)]"
          )}
          style={{ boxShadow: lead.priority !== 'critical' ? 'var(--shadow-card)' : undefined }}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <motion.div
              className="shrink-0"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div
                data-lead-avatar-version="profile-bust-v6"
                role="img"
                aria-label={`${lead.gender?.toLowerCase() === 'female' ? 'Female' : lead.gender?.toLowerCase() === 'male' ? 'Male' : 'Lead'} profile`}
                className={cn(
                  "relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border shadow-sm",
                  lead.gender?.toLowerCase() === 'female'
                    ? "border-fuchsia-100 bg-fuchsia-50 text-fuchsia-600 dark:border-fuchsia-900/40 dark:bg-fuchsia-950/25 dark:text-fuchsia-300"
                    : "border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/40 dark:bg-blue-950/25 dark:text-blue-300"
                )}
              >
                <StickFigureAvatar gender={lead.gender} />
              </div>
            </motion.div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h1 className="text-lg font-semibold leading-tight text-[var(--text-primary)] sm:text-xl" dir="auto" title={getLeadDisplayName(lead)}>
                  {getLeadShortDisplayName(lead)}
                </h1>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    background: stageGradient.from,
                    color: stageGradient.text,
                  }}
                >
                  {lead.pipeline_stage === 'lost' && <XCircle className="w-3 h-3" />}
                  {stageInfo?.label}
                </span>
                {lead.priority === 'critical' && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600 ring-1 ring-red-500/20 dark:text-red-400">
                    <Flame className="w-3 h-3" />
                    Critical
                  </span>
                )}
                {lead.priority === 'important' && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400">
                    <Star className="w-3 h-3" />
                    Important
                  </span>
                )}
              </div>
            </div>

            <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="shrink-0">
              <Button
                variant="outline"
                onClick={() => setShowEditForm(true)}
                className="h-8 gap-1.5 rounded-lg border-[var(--border)] px-2.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] hover:text-[var(--text-primary)]"
              >
                <Edit className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            </motion.div>
          </div>
        </motion.div>


        {/* Pipeline Progress - Visual Stepper */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-surface)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg shadow-sm"
                style={{ background: `linear-gradient(135deg, ${stageGradient.from}, ${stageGradient.to})` }}
              >
                {updatingStage ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : lead.pipeline_stage === 'lost' ? (
                  <XCircle className="h-4 w-4 text-white" />
                ) : (
                  <span className="text-sm font-bold text-white">{currentStageIndex + 1}</span>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{stageInfo?.label}</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {lead.pipeline_stage === 'lost' ? 'Lead lost' :
                   `Stage ${currentStageIndex + 1} of ${activeStageOrder.length}`}
                </p>
              </div>
            </div>
            {lead.pipeline_stage !== 'lost' && canChangeStage && (
              <button
                onClick={handleMarkLost}
                className="text-xs text-[var(--text-muted)] hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                Mark Lost
              </button>
            )}
          </div>

          {/* Pipeline Steps */}
          <div className="px-4 py-4">
            <div className="relative">
              {/* Progress Line — spans center-to-center of first and last circles */}
              <div className="absolute left-4 right-4 top-4 h-0.5 overflow-hidden rounded-full bg-[var(--bg-sunken)]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${stageGradient.from}, ${stageGradient.to})` }}
                  initial={false}
                  animate={{
                    width: lead.pipeline_stage === 'lost' ? '0%' : `${(currentStageIndex / (activeStageOrder.length - 1)) * 100}%`
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>

              {/* Stage Nodes */}
              <div className="relative flex justify-between">
                {activeStageOrder.map((stage, idx) => {
                  const isCurrentStage = lead.pipeline_stage === stage
                  const isPast = idx < currentStageIndex
                  const isCompleted = (() => {
                    const completedStages = lead.completed_stages || []
                    const isInCompletedStages = completedStages.includes(stage as PipelineStage)
                    return isPast || (isInCompletedStages && idx <= currentStageIndex)
                  })()
                  const stageLabel = PIPELINE_STAGES.find(s => s.value === stage)?.label || stage
                  const colors = isCurrentStage
                    ? STAGE_GRADIENT[stage] || STAGE_GRADIENT.new
                    : isCompleted
                      ? stageGradient // Completed stages match progress line color
                      : STAGE_GRADIENT[stage] || STAGE_GRADIENT.new

                  const isLostLead = lead.pipeline_stage === 'lost'
                  const nextStage = activeStageOrder[idx + 1]
                  const completedStagesArr = lead.completed_stages || []
                  const isDropOffPoint = isLostLead && isCompleted && nextStage && (nextStage as string) !== 'lost' && !completedStagesArr.includes(nextStage as PipelineStage)

                  return (
                    <SimpleTooltip
                      key={stage}
                      content={!canChangeStage ? 'Only the assigned agent can change the stage' : isDropOffPoint ? `Dropped off after ${stageLabel}` : isCompleted ? `✓ ${stageLabel} completed` : isCurrentStage ? 'Current stage' : 'Click to advance'}
                      side="top"
                    >
                      <motion.button
                        onClick={() => handleStageClick(stage)}
                        disabled={updatingStage || lead.pipeline_stage === 'lost' || !canChangeStage}
                        className="relative flex flex-col items-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                        whileHover={{ scale: (updatingStage || !canChangeStage) ? 1 : 1.1 }}
                        whileTap={{ scale: (updatingStage || !canChangeStage) ? 1 : 0.95 }}
                      >
                        {/* Node Circle */}
                        <div
                          className={cn(
                            "relative flex h-8 w-8 items-center justify-center rounded-full transition-all",
                            isCompleted || isCurrentStage
                              ? "shadow-lg"
                              : "bg-[var(--bg-sunken)] border-2 border-[var(--border)]"
                          )}
                          style={{
                            background: isCompleted || isCurrentStage
                              ? `linear-gradient(135deg, ${colors.from}, ${colors.to})`
                              : undefined
                          }}
                        >
                          {isCompleted ? (
                            <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                          ) : isCurrentStage ? (
                            <motion.div
                              className="h-2.5 w-2.5 rounded-full bg-white"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          ) : (
                            <span className="text-[10px] font-medium text-[var(--text-muted)]">{idx + 1}</span>
                          )}

                          {/* Drop-off indicator */}
                          {isDropOffPoint && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shadow-sm">
                              <X className="w-3 h-3 text-white" strokeWidth={3} />
                            </div>
                          )}
                        </div>

                        {/* Stage Label */}
                        <span
                          className={cn(
                              "mt-1.5 whitespace-nowrap text-[9px] font-medium transition-colors",
                            isCompleted || isCurrentStage
                              ? "text-[var(--text-primary)]"
                              : "text-[var(--text-muted)]"
                          )}
                        >
                          {stageLabel}
                        </span>
                      </motion.button>
                    </SimpleTooltip>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Status selector — linked to stage */}
          {availableStatuses.length > 0 && (
            <div className="border-t border-[var(--border)] px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[var(--text-muted)] shrink-0">Status</span>
                <div className="flex flex-wrap items-center gap-1.5" ref={statusDropdownRef}>
                  {/* Clear / no-status option */}
                  <button
                    onClick={() => handleStatusChange('')}
                    disabled={updatingStatus}
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all duration-200",
                      !lead.status || !isStatusValidForStage
                        ? "bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)] shadow-sm"
                        : "border-transparent text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]"
                    )}
                  >
                    <X className="w-3 h-3" />
                    None
                  </button>
                  {availableStatuses.map((status) => {
                    const isActive = isStatusValidForStage && lead.status === status.value
                    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
                      success: { bg: 'var(--success-muted)', text: 'var(--success)', border: 'var(--success)' },
                      warning: { bg: 'var(--warning-muted)', text: 'var(--warning)', border: 'var(--warning)' },
                      destructive: { bg: 'var(--error-muted)', text: 'var(--error)', border: 'var(--error)' },
                      accent: { bg: 'var(--accent-muted, var(--primary-muted))', text: 'var(--accent, var(--primary))', border: 'var(--accent, var(--primary))' },
                      secondary: { bg: 'var(--bg-elevated)', text: 'var(--text-secondary)', border: 'var(--border)' },
                    }
                    const colors = colorMap[status.color] || colorMap.secondary
                    return (
                      <button
                        key={status.value}
                        onClick={() => handleStatusChange(isActive ? '' : status.value)}
                        disabled={updatingStatus}
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all duration-200",
                          isActive
                            ? "shadow-sm"
                            : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                        )}
                        style={isActive ? {
                          background: colors.bg,
                          color: colors.text,
                          borderColor: `color-mix(in srgb, ${colors.border} 30%, transparent)`,
                        } : undefined}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: colors.text }}
                        />
                        {status.label}
                      </button>
                    )
                  })}
                  {updatingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--text-muted)] ml-1" />}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Main grid: tab content + sidebar */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">

        {/* LEFT: Tabbed Content Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="order-2 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] lg:order-1"
        >
          {/* Tab Headers */}
          <div className="flex border-b border-[var(--border)]">
            {[
              { id: 'details' as const, label: 'Details', icon: User },
              { id: 'documents' as const, label: 'Documents', icon: FileText },
              { id: 'activity' as const, label: `Activity (${allNotes.length})`, icon: Activity },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="p-4"
              >
                <StudentInfoForm
                  lead={lead}
                  onSuccess={() => {
                    refetchLead()
                  }}
                />
              </motion.div>
            )}

            {activeTab === 'documents' && (
              <motion.div
                key="documents"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="p-4"
              >
                {lead.funding_type === 'self_funded' ? (
                  <SFDocumentManager lead={lead} onUpdate={() => refetchLead()} />
                ) : lead.funding_type === 'puc' ? (
                  <PUCDocumentUpload leadId={lead.id} lead={lead} onLeadUpdate={() => refetchLead()} />
                ) : (
                  <LeadDocuments
                    leadId={lead.id}
                    lead={lead}
                    onDocumentToggle={async (key, value) => {
                      await updateLead(lead.id, { [key]: value } as Partial<typeof lead>)
                      await refetchLead()
                    }}
                    onLeadUpdate={() => refetchLead()}
                  />
                )}
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="p-4"
              >
                {/* Filter Pills */}
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                  <Filter className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  {FILTER_CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setNoteFilter(cat.key)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors inline-flex items-center gap-1.5",
                        noteFilter === cat.key
                          ? "bg-[var(--primary)] text-white"
                          : "bg-[var(--bg-sunken)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                      )}
                    >
                      <cat.icon className="w-3 h-3" />
                      {cat.label}
                    </button>
                  ))}
                  <span className="text-xs text-[var(--text-muted)] ml-auto shrink-0">
                    {filteredNotes.length} of {allNotes.length}
                  </span>
                </div>

                {/* Activity Timeline */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {groupedNotes.map((group) => (
                    <div key={group.label}>
                      <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                        {group.label}
                      </p>
                      <div className="space-y-2">
                        {group.notes.map((note) => {
                          const config = NOTE_TYPE_CONFIG[note.type] || NOTE_TYPE_CONFIG.note
                          const NoteIcon = config.icon
                          return (
                            <motion.div
                              key={note.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-sunken)] hover:bg-[var(--bg-hover)] transition-colors"
                            >
                              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", `bg-${config.color.split('-')[1]}-500/10`)}>
                                <NoteIcon className={cn("w-4 h-4", config.color)} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded", `bg-${config.color.split('-')[1]}-500/10`, config.color)}>
                                    {config.label}
                                  </span>
                                  <span className="text-xs text-[var(--text-muted)]">{note.timestamp}</span>
                                  {note.createdByName && (
                                    <>
                                      <span className="text-xs text-[var(--text-muted)]">·</span>
                                      <span className="inline-flex items-center gap-1 text-xs text-[var(--text-primary)] font-bold">
                                        <UserCircle className="w-3 h-3" />
                                        {note.createdByName}
                                      </span>
                                    </>
                                  )}
                                </div>
                                <p className="text-sm text-[var(--text-primary)]">{note.content}</p>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  ))}

                  {filteredNotes.length === 0 && (
                    <div className="text-center py-8">
                      <Activity className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
                      <p className="text-sm text-[var(--text-muted)]">No activity yet</p>
                    </div>
                  )}
                </div>

                {/* Add Note */}
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <div className="flex items-end gap-2">
                    <Textarea
                      ref={notesInputRef}
                      placeholder="Add a note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="flex-1 min-h-[80px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          handleAddNote()
                        }
                      }}
                    />
                    <Button
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || mutationLoading}
                      className="shrink-0"
                    >
                      {mutationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}


          </AnimatePresence>
        </motion.div>

        {/* RIGHT: Sidebar — actions, SF down payment, appointments */}
        <aside className="order-1 space-y-3 lg:order-2">

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Quick Actions
            </h3>
            <div className="space-y-1.5">
              {/* Reactivate dropdown for lost leads */}
              {lead.pipeline_stage === 'lost' && canChangeStage && (
                <div className="relative" ref={reactivateMenuRef}>
                  <motion.button
                    onClick={() => setShowReactivateMenu(!showReactivateMenu)}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[var(--text-primary)] px-3 text-xs font-semibold text-[var(--text-inverse)] shadow-sm transition-all hover:opacity-90"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reactivate To</span>
                    <ChevronDown className={cn("w-3 h-3 transition-transform", showReactivateMenu && "rotate-180")} />
                  </motion.button>
                  <AnimatePresence>
                    {showReactivateMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] rounded-md shadow-lg ring-1 ring-[var(--border)] overflow-hidden z-50"
                      >
                        <div className="p-1">
                          {LOST_LEAD_REACTIVATE_STAGES.map((stage) => (
                            <button
                              key={stage.value}
                              onClick={() => handleReactivateLead(stage.value)}
                              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-sm hover:bg-[var(--bg-hover)] transition-colors"
                            >
                              <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ background: STAGE_GRADIENT[stage.value].from }}
                              />
                              <span className="text-xs font-medium text-[var(--text-primary)]">{stage.label}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Book Appointment */}
              <Link href={`/calendar?book=${lead.id}`}>
                <motion.div
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex h-9 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-sunken)] px-3 text-xs font-semibold text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--info)]/35 hover:bg-[var(--info-bg)] hover:text-[var(--info)]"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book Appointment</span>
                </motion.div>
              </Link>

              {/* Schedule Callback */}
              <motion.div
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCallbackScheduler(true)}
                className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-sunken)] px-3 text-xs font-semibold text-[var(--text-secondary)] transition-all duration-200 hover:border-amber-300/60 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/20"
              >
                <PhoneForwarded className="w-3.5 h-3.5" />
                <span>Schedule Callback</span>
              </motion.div>

              {/* PSP buttons - only PUC */}
              {lead.funding_type !== 'self_funded' && (
                <>
                  <motion.div
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowPSPWizard(true)}
                    className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-sunken)] px-3 text-xs font-semibold text-[var(--text-secondary)] transition-all duration-200 hover:border-purple-300/60 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/20"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>PSP Submission</span>
                  </motion.div>
                  <motion.div
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowPSPSelfService(true)}
                    className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-sunken)] px-3 text-xs font-semibold text-[var(--text-secondary)] transition-all duration-200 hover:border-purple-300/60 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send PSP Link</span>
                  </motion.div>
                </>
              )}

              {/* RSVP — only applicants */}
              {lead.pipeline_stage === 'applicant' && (
                <motion.div
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowRSVPDialog(true)}
                  className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-sunken)] px-3 text-xs font-semibold text-[var(--text-secondary)] transition-all duration-200 hover:border-emerald-300/60 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send RSVP</span>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* SF Down Payment Card */}
          {lead.funding_type === 'self_funded' && (lead.pipeline_stage === 'application' || lead.pipeline_stage === 'applicant') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <SFDownPaymentCard
                lead={lead}
                onSuccess={() => refetchLead()}
              />
            </motion.div>
          )}

          {/* Upcoming Appointments */}
          {upcomingAppointments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Upcoming
              </h3>
              <div className="space-y-2">
                {upcomingAppointments.map((apt) => (
                  <div key={apt.id}>
                    <div
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-2 rounded-md ring-1 transition-all duration-200",
                        apt.is_callback
                          ? "bg-amber-50 ring-amber-200/50 dark:bg-amber-950/20 dark:ring-amber-800/30"
                          : "bg-[var(--info-bg)] ring-[var(--info)]/15"
                      )}
                    >
                      <Link
                        href={`/calendar?highlight=${apt.id}`}
                        className="flex items-center gap-2.5 flex-1 min-w-0 group"
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-md flex items-center justify-center shadow-sm shrink-0",
                          apt.is_callback ? "bg-amber-500" : "bg-[var(--info)]"
                        )}>
                          {apt.is_callback ? (
                            <PhoneForwarded className="w-4 h-4 text-white" />
                          ) : (
                            <CalendarDays className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[var(--text-primary)] capitalize truncate">
                            {apt.is_callback ? "Callback" : apt.appointment_type.map(t => t.replace(/_/g, ' ')).join(', ')}
                          </p>
                          <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 opacity-50" />
                            {formatDate(apt.scheduled_date)} · {apt.scheduled_time?.slice(0, 5)}
                          </p>
                        </div>
                      </Link>
                      {apt.is_callback && (
                        <SimpleTooltip content="Reschedule" side="top">
                          <button
                            onClick={() => {
                              const inOneHour = new Date()
                              inOneHour.setHours(inOneHour.getHours() + 1)
                              const mins = inOneHour.getMinutes()
                              const roundedMins = mins < 15 ? "00" : mins < 45 ? "30" : "00"
                              const roundedHrs = mins >= 45 ? inOneHour.getHours() + 1 : inOneHour.getHours()
                              let timeStr = `${String(roundedHrs).padStart(2, "0")}:${roundedMins}`
                              if (timeStr < "08:00") timeStr = "08:00"
                              else if (timeStr > "21:30") timeStr = "21:30"
                              setRescheduleDate(inOneHour.toISOString().split("T")[0])
                              setRescheduleTime(timeStr)
                              setRescheduleAppointmentId(apt.id)
                            }}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors shrink-0"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </SimpleTooltip>
                      )}
                    </div>

                    {/* Inline reschedule */}
                    <AnimatePresence>
                      {rescheduleAppointmentId === apt.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 p-3 rounded-md bg-[var(--bg-surface)] ring-1 ring-amber-200 dark:ring-amber-800/40 space-y-2.5">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                              <RefreshCw className="w-3.5 h-3.5" />
                              Reschedule
                            </div>
                            <div className="space-y-2">
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Date</label>
                                <input
                                  type="date"
                                  value={rescheduleDate}
                                  onChange={(e) => setRescheduleDate(e.target.value)}
                                  className="w-full h-8 px-2 text-xs rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Time</label>
                                <select
                                  value={rescheduleTime}
                                  onChange={(e) => setRescheduleTime(e.target.value)}
                                  className="w-full h-8 px-2 text-xs rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                                >
                                  {["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30","21:00","21:30"].map(t => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setRescheduleAppointmentId(null)}
                                className="px-2.5 py-1 text-[11px] font-medium rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                disabled={!rescheduleDate || !rescheduleTime || rescheduling}
                                onClick={async () => {
                                  setRescheduling(true)
                                  try {
                                    await updateAppointment(apt.id, {
                                      scheduled_date: rescheduleDate,
                                      scheduled_time: rescheduleTime,
                                      status: "scheduled",
                                    })
                                    if (lead) {
                                      await updateLead(lead.id, { callback_date: rescheduleDate })
                                    }
                                    setRescheduleAppointmentId(null)
                                    refetchLead()
                                  } catch (err) {
                                    console.error("Reschedule failed:", err)
                                  } finally {
                                    setRescheduling(false)
                                  }
                                }}
                                className={cn(
                                  "px-3 py-1 text-[11px] font-semibold rounded-md transition-colors",
                                  "bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                              >
                                {rescheduling ? (
                                  <span className="flex items-center gap-1">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Saving
                                  </span>
                                ) : (
                                  "Reschedule"
                                )}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </aside>

        </div>

      </motion.div>

      {/* Edit Form Modal */}
      <AnimatePresence>
        {showEditForm && (
          <LeadForm
            lead={lead}
            onClose={() => setShowEditForm(false)}
            onSuccess={() => {
              setShowEditForm(false)
              refetchLead()
            }}
          />
        )}
      </AnimatePresence>

      {/* Mark Lost Dialog */}
      {showLostDialog && (
        <MarkLostDialog
          open={showLostDialog}
          onOpenChange={setShowLostDialog}
          leadName={getLeadDisplayName(lead)}
          onConfirm={async (reasonId, notes) => {
            await updateLeadStage(lead.id, 'lost', reasonId, notes)
            await refetchLead()
          }}
        />
      )}

      {fileRequirementsMissingFields.length > 0 && (
        <FileStageRequirementsDialog
          open={fileRequirementsMissingFields.length > 0}
          onOpenChange={(open) => {
            if (!open) setFileRequirementsMissingFields([])
          }}
          lead={lead}
          missingFields={fileRequirementsMissingFields}
          onFillRequiredFields={() => {
            setFileRequirementsMissingFields([])
            if (lead.funding_type === "self_funded") {
              setShowEditForm(true)
            } else {
              setShowPSPWizard(true)
            }
          }}
        />
      )}

      {/* File Fee Payment Dialog */}
      {showFileFeeDialog && (
        <FileFeePaymentDialog
          open={showFileFeeDialog}
          onOpenChange={setShowFileFeeDialog}
          lead={lead}
          onSuccess={async () => {
            await refetchLead()
          }}
        />
      )}

      {/* Enrollment Payment Dialog */}
      {showEnrollmentDialog && (
        <EnrollmentPaymentDialog
          open={showEnrollmentDialog}
          onOpenChange={setShowEnrollmentDialog}
          lead={lead}
          mode="enrollment"
          onSuccess={async () => {
            await refetchLead()
          }}
        />
      )}

      {/* PSP Submission Wizard - only for PUC-funded leads */}
      {lead.funding_type !== 'self_funded' && showPSPWizard && (
        <PSPSubmissionWizard
          isOpen={showPSPWizard}
          onClose={() => setShowPSPWizard(false)}
          lead={lead}
          onSuccess={() => {
            setShowPSPWizard(false)
            refetchLead()
          }}
        />
      )}

      {/* PSP self-service link dialog */}
      {lead.funding_type !== 'self_funded' && showPSPSelfService && (
        <SendPspSelfServiceDialog
          isOpen={showPSPSelfService}
          onClose={() => setShowPSPSelfService(false)}
          lead={lead}
        />
      )}

      {/* Send RSVP Dialog */}
      {showRSVPDialog && (
        <SendRSVPDialog
          isOpen={showRSVPDialog}
          onClose={() => setShowRSVPDialog(false)}
          selectedLeads={[lead]}
          onSuccess={() => refetchLead()}
        />
      )}

      {/* Callback Scheduler */}
      {showCallbackScheduler && (
        <CallbackScheduler
          isOpen={showCallbackScheduler}
          onClose={() => setShowCallbackScheduler(false)}
          lead={lead}
          onUpdateLead={async (id, updates) => {
            await updateLead(id, updates)
          }}
          onSuccess={() => refetchLead()}
        />
      )}

    </div>
  )
}
