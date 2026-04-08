"use client"

import { useState, use, useRef, useEffect, useMemo } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  Copy,
  Check,
  ChevronDown,
  Flame,
  Zap,
  Snowflake,
  Bell,
  Tag,
  Activity,
  Filter,
  Mail,
  X,
  RotateCcw,
  Building,
  CalendarDays,
  UserCircle,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  ArrowRightLeft,
  CircleDot,
  Ban,
  ClipboardList,
  StickyNote,
  Send,
  Star,
  Shield,
  GraduationCap,
  PhoneForwarded,
  RefreshCw,
} from "lucide-react"
import { PIPELINE_STAGES, SCHOOLS, MINISTRY_BLOCK_REASONS, ORIENTATION_STATUSES, LEAD_STATUSES, APPLICANT_ONLY_STATUSES, MAJORS, type PipelineStage, type OrientationStatus, type Lead, type LeadStatus } from "@/types"
import { formatKuwaitPhone, formatDate, cn, getInitials } from "@/lib/utils"
import { useLead, useLeadMutations } from "@/lib/hooks/use-leads"
import { useLeadAppointments, useAppointmentMutations } from "@/lib/hooks/use-appointments"
import { useUser } from "@/lib/hooks/use-user"

import { useLeadShortcuts } from "@/lib/hooks/use-lead-shortcuts"
import { LeadForm } from "@/components/leads/lead-form"
import { StudentInfoForm } from "@/components/leads/student-info-form"
import { MarkLostDialog } from "@/components/leads/mark-lost-dialog"
import { EnrollmentPaymentDialog } from "@/components/leads/enrollment-payment-dialog"
import { SFDownPaymentCard } from "@/components/leads/sf-down-payment-card"
import { SimpleTooltip } from "@/components/ui/tooltip"
import { InlineTagSelect } from "@/components/ui/notion-tag-select"
import { FollowUpReminders } from "@/components/leads/follow-up-reminders"
import { CallbackScheduler } from "@/components/leads/callback-scheduler"
import { SendRSVPDialog } from "@/components/leads/send-rsvp-dialog"
import { LeadDocuments } from "@/components/leads/lead-documents"
import { SFDocumentManager } from "@/components/leads/sf-document-manager"
import { PUCDocumentUpload } from "@/components/leads/puc-document-upload"
import { PSPTrackingSection } from "@/components/leads/psp-tracking-section"
import { PSPSubmissionWizard } from "@/components/leads/psp-submission-wizard"
import { useLeadActivities } from "@/lib/hooks/use-activities"
import { useSemesters } from "@/lib/hooks/use-semesters"
import { useCycles } from "@/lib/hooks/use-cycles"

// Simplified stage order for the pipeline
const STAGE_ORDER = ["new", "contacted", "visit", "test", "application", "puc_document_submission", "puc_application_submission", "applicant", "enrolled", "withdraw", "lost"] as const


// Lead Heat Configuration
type LeadHeat = "hot" | "warm" | "cold"
const LEAD_HEAT_CONFIG: Record<LeadHeat, { label: string; icon: typeof Flame; color: string; description: string }> = {
  hot: { label: "Hot", icon: Flame, color: "text-orange-500", description: "Recently contacted, has appointments, or in advanced stages" },
  warm: { label: "Warm", icon: Zap, color: "text-amber-500", description: "Moderate engagement - follow up soon" },
  cold: { label: "Cold", icon: Snowflake, color: "text-slate-400", description: "No recent contact - needs attention" },
}

// Calculate lead heat based on engagement
function calculateLeadHeat(lead: { last_contacted_at?: string; pipeline_stage: string; created_at: string }, appointmentCount: number): LeadHeat {
  const now = new Date()
  const lastContact = lead.last_contacted_at ? new Date(lead.last_contacted_at) : null
  const daysSinceContact = lastContact ? Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24)) : Infinity

  const advancedStages = ["test", "application"]
  if (daysSinceContact <= 3 || appointmentCount > 0 || advancedStages.includes(lead.pipeline_stage)) {
    return "hot"
  }

  const daysSinceCreated = Math.floor((now.getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24))
  if (daysSinceContact > 14 || (lead.pipeline_stage === "new" && daysSinceCreated > 7)) {
    return "cold"
  }

  return "warm"
}

// Calculate days in current stage
function calculateDaysInStage(updatedAt: string): number {
  const now = new Date()
  const updated = new Date(updatedAt)
  return Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24))
}

// Note types for activity feed
type NoteType = 'all' | 'call' | 'meeting' | 'follow-up' | 'email' | 'note' | 'stage_change' | 'status_change'

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

const NOTE_TYPE_CONFIG: Record<NoteType, { label: string; icon: typeof Phone; color: string }> = {
  all: { label: "All", icon: FileText, color: "text-slate-500" },
  call: { label: "Call", icon: Phone, color: "text-emerald-500" },
  meeting: { label: "Meeting", icon: Calendar, color: "text-blue-500" },
  'follow-up': { label: "Follow-up", icon: Bell, color: "text-amber-500" },
  email: { label: "Email", icon: Mail, color: "text-purple-500" },
  note: { label: "Note", icon: FileText, color: "text-slate-500" },
  stage_change: { label: "Stage", icon: ArrowRightLeft, color: "text-indigo-500" },
  status_change: { label: "Status", icon: CircleDot, color: "text-rose-500" },
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

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const searchParams = useSearchParams()
  const { profile, isAdmin } = useUser()
  const { lead, loading, error, refetch: refetchLead } = useLead(resolvedParams.id)
  const { appointments } = useLeadAppointments(resolvedParams.id)
  const { activities } = useLeadActivities(resolvedParams.id)
  const { updateLeadStage, updateLead, loading: mutationLoading } = useLeadMutations()
  const { semesters } = useSemesters()
  const { cycles } = useCycles()
  const [showCycleSelector, setShowCycleSelector] = useState(false)
  // Show all pipeline stages in the stepper (excluding 'lost' and 'withdraw' as they're handled separately)
  const activeStageOrder = useMemo(() => {
    return STAGE_ORDER.filter(s => s !== 'lost' && s !== 'withdraw')
  }, [])

  const [updatingStage, setUpdatingStage] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingOrientationStatus, setEditingOrientationStatus] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false)
  const [updatingPriority, setUpdatingPriority] = useState(false)
  const statusDropdownRef = useRef<HTMLDivElement>(null)
  const priorityDropdownRef = useRef<HTMLDivElement>(null)

  // Get the stage filter from URL params for back navigation
  const stageFromUrl = searchParams.get('stage') as PipelineStage | null
  const fromPage = searchParams.get('from')
  const backUrl = fromPage === 'sf_srj' ? '/puc-srj?tab=sf_srj'
    : fromPage === 'puc' ? '/puc-srj?tab=puc'
    : fromPage === 'self_fund' ? '/puc-srj?tab=self_fund'
    : stageFromUrl ? `/leads?stage=${stageFromUrl}` : '/leads'
  const backLabel = fromPage === 'sf_srj' ? 'Self Funded'
    : fromPage === 'puc' ? 'PUC'
    : fromPage === 'self_fund' ? 'Self Fund'
    : stageFromUrl ? PIPELINE_STAGES.find(s => s.value === stageFromUrl)?.label || 'Leads' : null
  const [newNote, setNewNote] = useState("")
  const [copiedPhone, setCopiedPhone] = useState(false)
  const [showLostDialog, setShowLostDialog] = useState(false)
  const [showReactivateMenu, setShowReactivateMenu] = useState(false)
  const reactivateMenuRef = useRef<HTMLDivElement>(null)
  const [showEnrollmentDialog, setShowEnrollmentDialog] = useState(false)
  const [noteFilter, setNoteFilter] = useState<NoteType>('all')
  const [pinnedNoteIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'activity'>('details')
  const [showPSPWizard, setShowPSPWizard] = useState(false)
  const [showRSVPDialog, setShowRSVPDialog] = useState(false)
  const [showCallbackScheduler, setShowCallbackScheduler] = useState(false)
  const [rescheduleAppointmentId, setRescheduleAppointmentId] = useState<string | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [rescheduleTime, setRescheduleTime] = useState("")
  const [rescheduling, setRescheduling] = useState(false)
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
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target as Node)) {
        setShowPriorityDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Handle priority change (admin only)
  const handlePriorityChange = async (newPriority: 'normal' | 'important' | 'critical') => {
    if (!lead || !profile) return
    setUpdatingPriority(true)
    setShowPriorityDropdown(false)
    await updateLead(lead.id, {
      priority: newPriority,
      priority_set_by: profile.id,
      priority_set_at: new Date().toISOString(),
    })
    await refetchLead()
    setUpdatingPriority(false)
  }

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

  const copyPhone = () => {
    if (lead?.phone) {
      navigator.clipboard.writeText(lead.phone)
      setCopiedPhone(true)
      setTimeout(() => setCopiedPhone(false), 2000)
    }
  }

  const handleStageClick = async (stage: string) => {
    console.log('[Stage Click] Clicked stage:', stage, 'Current stage:', lead?.pipeline_stage)

    if (!lead || updatingStage || lead.pipeline_stage === 'lost') {
      console.log('[Stage Click] Early return - lead:', !!lead, 'updating:', updatingStage, 'isLost:', lead?.pipeline_stage === 'lost')
      return
    }

    if (stage === lead.pipeline_stage) {
      console.log('[Stage Click] Same stage, skipping')
      return
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
  const schoolInfo = SCHOOLS.find((s) => s.value === lead.school)
  const currentStageIndex = activeStageOrder.indexOf(lead.pipeline_stage as (typeof activeStageOrder)[number])

  const upcomingAppointments = appointments
    .filter(apt => {
      const aptDate = new Date(`${apt.scheduled_date}T${apt.scheduled_time}`)
      return aptDate >= new Date() && apt.status !== 'cancelled'
    })
    .slice(0, 2)

  const leadHeat = calculateLeadHeat(lead, appointments.length)
  const daysInStage = calculateDaysInStage(lead.updated_at)
  const HeatIcon = LEAD_HEAT_CONFIG[leadHeat].icon

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
    : allNotes.filter(n => n.type === noteFilter)
  const groupedNotes = groupNotesByDate(filteredNotes)

  const stageGradient = STAGE_GRADIENT[lead.pipeline_stage] || STAGE_GRADIENT.new


  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Header
        user={profile}
        title=""
        breadcrumbs={[
          { label: backLabel || "Leads", href: backUrl },
          { label: `${lead.first_name_ar || lead.first_name} ${lead.last_name_ar || lead.last_name}` },
        ]}
        hideSearch
      />

      <motion.div
        className="w-full px-4 sm:px-6 pb-32"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Back Link */}
        <div className="pt-3 pb-4">
          <Link
            href={backUrl}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            {backLabel ? `Back to ${backLabel}` : 'All Leads'}
          </Link>
        </div>

        {/* Hero Section - Architectural Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className={cn(
            "relative rounded-lg bg-[var(--bg-surface)] border",
            lead.priority === 'critical'
              ? "border-red-500/40 shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)]"
              : "border-[var(--border)]"
          )}
          style={{ boxShadow: lead.priority !== 'critical' ? 'var(--shadow-card)' : undefined }}
        >
          {/* Left accent bar — stage color */}
          <div
            className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg"
            style={{ background: stageGradient.from }}
          />

          <div className="relative pl-7 pr-6 py-6 sm:pl-8 sm:pr-7 sm:py-7">
            {/* Top Row: Avatar + Info + Actions */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              {/* Avatar — compact with heat dot */}
              <motion.div
                className="relative shrink-0"
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Avatar className="relative w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-lg shadow-sm">
                  <AvatarFallback
                    className="text-xl sm:text-2xl font-semibold text-white rounded-lg"
                    style={{ background: stageGradient.from }}
                  >
                    {(lead.first_name_ar || lead.first_name || '').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {/* Heat indicator — small dot */}
                {lead.pipeline_stage !== 'lost' && (
                  <SimpleTooltip
                    content={`${LEAD_HEAT_CONFIG[leadHeat].label}: ${LEAD_HEAT_CONFIG[leadHeat].description}`}
                    side="right"
                    wrapperClassName="absolute -bottom-1 -right-1"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center ring-[2.5px] ring-[var(--bg-surface)] cursor-help",
                        leadHeat === 'hot' && "bg-[var(--error)]",
                        leadHeat === 'warm' && "bg-[var(--warning)]",
                        leadHeat === 'cold' && "bg-[var(--text-muted)]"
                      )}
                    >
                      <HeatIcon className="w-2.5 h-2.5 text-white" />
                    </motion.div>
                  </SimpleTooltip>
                )}
              </motion.div>

              {/* Lead Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {/* Name + inline stage tag */}
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 }}
                      className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5"
                    >
                      <h1 className="text-[1.625rem] sm:text-[1.875rem] font-bold text-[var(--text-primary)] tracking-[-0.025em] leading-none" dir="auto">
                        {lead.first_name_ar || lead.first_name} {lead.last_name_ar || lead.last_name}
                      </h1>
                      {lead.priority === 'critical' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide rounded bg-red-500/15 text-red-600 dark:text-red-400 ring-1 ring-red-500/25 animate-pulse">
                          <Flame className="w-3.5 h-3.5" />
                          CRITICAL
                        </span>
                      )}
                      {lead.priority === 'important' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/25">
                          <Star className="w-3.5 h-3.5" />
                          Important
                        </span>
                      )}
                      {lead.ministry_assigned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/25">
                          <GraduationCap className="w-3.5 h-3.5" />
                          Ministry Assigned
                        </span>
                      )}
                      {/* Admin-only priority toggle */}
                      {isAdmin && (
                        <div className="relative" ref={priorityDropdownRef}>
                          <button
                            onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                            disabled={updatingPriority}
                            className={cn(
                              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors",
                              "hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
                              updatingPriority && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {updatingPriority ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Shield className="w-3 h-3" />
                            )}
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <AnimatePresence>
                            {showPriorityDropdown && (
                              <motion.div
                                initial={{ opacity: 0, y: -4, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute left-0 top-full mt-1 z-50 w-40 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] shadow-lg overflow-hidden"
                              >
                                {([
                                  { value: 'normal' as const, label: 'Normal', icon: null, color: 'text-[var(--text-secondary)]' },
                                  { value: 'important' as const, label: 'Important', icon: Star, color: 'text-amber-500' },
                                  { value: 'critical' as const, label: 'Critical', icon: Flame, color: 'text-red-500' },
                                ]).map((option) => (
                                  <button
                                    key={option.value}
                                    onClick={() => handlePriorityChange(option.value)}
                                    className={cn(
                                      "flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors hover:bg-[var(--bg-muted)]",
                                      lead.priority === option.value ? "bg-[var(--bg-muted)] font-medium" : ""
                                    )}
                                  >
                                    {option.icon ? <option.icon className={cn("w-3.5 h-3.5", option.color)} /> : <span className="w-3.5" />}
                                    <span className={option.color}>{option.label}</span>
                                    {(lead.priority || 'normal') === option.value && (
                                      <Check className="w-3.5 h-3.5 ml-auto text-[var(--primary)]" />
                                    )}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.05em] rounded"
                          style={{
                            background: stageGradient.from,
                            color: stageGradient.text,
                          }}
                        >
                          {lead.pipeline_stage === 'lost' && <XCircle className="w-3 h-3" />}
                          {stageInfo?.label}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                          <Clock className="w-3 h-3" />
                          {daysInStage === 0 ? 'Today' : `${daysInStage}d`}
                        </span>
                      </div>
                    </motion.div>

                    {/* Info pills — flat, semantic colors */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.25 }}
                      className="flex flex-wrap items-center gap-1.5 mt-3"
                    >
                      {lead.funding_type === "puc" && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-[var(--warning-muted)] text-[var(--warning)] ring-1 ring-[var(--warning)]/10">
                          <Sparkles className="w-3 h-3" />
                          PUC
                        </span>
                      )}
                      {lead.is_kuwaiti && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-[var(--success-muted)] text-[var(--success)] ring-1 ring-[var(--success)]/10">
                          <Tag className="w-3 h-3" />
                          Kuwaiti
                        </span>
                      )}
                      {(schoolInfo?.label || lead.school_name_custom) && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-[var(--info-muted)] text-[var(--info)] ring-1 ring-[var(--info)]/10">
                          <Building className="w-3 h-3" />
                          {schoolInfo?.label || lead.school_name_custom}
                        </span>
                      )}
                      {lead.puc_choice && (
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium ring-1",
                          lead.puc_choice === "1"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 ring-emerald-300/30"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 ring-amber-300/30"
                        )}>
                          {lead.puc_choice === "1" ? "1st" : lead.puc_choice === "2" ? "2nd" : lead.puc_choice === "3" ? "3rd" : "4th"} Choice
                          {lead.puc_first_choice_college ? ` — 1st: ${lead.puc_first_choice_college}` : ""}
                        </span>
                      )}
                      {lead.ministry_blocked && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-[var(--error-muted)] text-[var(--error)] ring-1 ring-[var(--error)]/10">
                          <Ban className="w-3 h-3" />
                          Blocked
                        </span>
                      )}
                      {lead.intended_major && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 ring-1 ring-rose-300/30">
                          <GraduationCap className="w-3 h-3" />
                          ktech intended major: {MAJORS.find(m => m.value === lead.intended_major)?.label || lead.intended_major}
                        </span>
                      )}
                      {lead.ministry_accepted_major && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 ring-1 ring-emerald-300/30">
                          <GraduationCap className="w-3 h-3" />
                          ktech actual major: {lead.ministry_accepted_major}
                        </span>
                      )}
                      {/* Cycle selector */}
                      <div className="relative">
                        <button
                          onClick={() => isAdmin && setShowCycleSelector(!showCycleSelector)}
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium ring-1 transition-colors",
                            lead.semester
                              ? "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 ring-violet-300/30"
                              : "bg-[var(--bg-sunken)] text-[var(--text-muted)] ring-[var(--border)]",
                            isAdmin && "cursor-pointer hover:ring-[var(--border-hover)]"
                          )}
                        >
                          <CalendarDays className="w-3 h-3" />
                          {lead.semester?.name || "No Cycle"}
                          {isAdmin && <ChevronDown className="w-2.5 h-2.5 ml-0.5" />}
                        </button>
                        {showCycleSelector && isAdmin && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowCycleSelector(false)} />
                            <div className="absolute top-full left-0 mt-1 z-50 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg shadow-lg py-1 min-w-[180px] max-h-[300px] overflow-y-auto">
                              {cycles.map((cycle) => (
                                <div key={cycle.id}>
                                  <div className="px-3 py-1 text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                                    {cycle.name}
                                    {cycle.is_active && <span className="text-green-500">●</span>}
                                  </div>
                                  {cycle.terms?.map(s => (
                                    <button
                                      key={s.id}
                                      onClick={async () => {
                                        await updateLead(lead.id, { semester_id: s.id })
                                        refetchLead()
                                        setShowCycleSelector(false)
                                      }}
                                      className={cn(
                                        "w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2",
                                        !cycle.is_active && "text-[var(--text-muted)]",
                                        lead.semester_id === s.id && "font-semibold text-[var(--primary)]"
                                      )}
                                    >
                                      {s.name}
                                      {s.is_open && <span className="text-[10px] text-green-500 ml-auto">Open</span>}
                                      {lead.semester_id === s.id && <Check className="w-3 h-3 ml-auto" />}
                                    </button>
                                  ))}
                                </div>
                              ))}
                              {/* Orphan semesters without a cycle */}
                              {semesters.filter(s => !s.cycle_id).length > 0 && (
                                <>
                                  <div className="border-t border-[var(--border)] my-1" />
                                  <div className="px-3 py-1 text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Other</div>
                                  {semesters.filter(s => !s.cycle_id).map(s => (
                                    <button
                                      key={s.id}
                                      onClick={async () => {
                                        await updateLead(lead.id, { semester_id: s.id })
                                        refetchLead()
                                        setShowCycleSelector(false)
                                      }}
                                      className={cn(
                                        "w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 text-[var(--text-muted)]",
                                        lead.semester_id === s.id && "font-semibold text-[var(--primary)]"
                                      )}
                                    >
                                      {s.name}
                                      {lead.semester_id === s.id && <Check className="w-3 h-3 ml-auto" />}
                                    </button>
                                  ))}
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>


                    {/* Phone — clean monospace */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex flex-wrap items-center gap-2.5 mt-4"
                    >
                      <button
                        onClick={copyPhone}
                        className="group inline-flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[var(--bg-sunken)] hover:bg-[var(--bg-hover)] ring-1 ring-transparent hover:ring-[var(--border)] transition-all duration-200"
                      >
                        <Phone className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="font-mono text-sm font-medium text-[var(--text-primary)] tracking-wide">
                          {formatKuwaitPhone(lead.phone)}
                        </span>
                        {copiedPhone ? (
                          <motion.span
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center gap-1 text-[var(--success)]"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-semibold uppercase tracking-wider">Copied</span>
                          </motion.span>
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-60 transition-opacity" />
                        )}
                      </button>

                      {lead.phone_secondary && (
                        <a
                          href={`tel:+965${lead.phone_secondary}`}
                          className="group inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-sunken)]/60 hover:bg-[var(--bg-hover)] ring-1 ring-transparent hover:ring-[var(--border)] transition-all duration-200"
                        >
                          <Phone className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span className="font-mono text-xs font-medium text-[var(--text-secondary)]">
                            {formatKuwaitPhone(lead.phone_secondary)}
                          </span>
                          <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-medium">2nd</span>
                        </a>
                      )}
                    </motion.div>
                  </div>

                  {/* Edit button */}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowEditForm(true)}
                      className="w-9 h-9 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-sunken)] shrink-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Upcoming Appointments */}
            {upcomingAppointments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-5 space-y-2"
              >
                {upcomingAppointments.map((apt) => (
                  <div key={apt.id}>
                    <div
                      className={cn(
                        "flex items-center gap-3.5 px-4 py-3 rounded-lg ring-1 transition-all duration-200",
                        apt.is_callback
                          ? "bg-amber-50 ring-amber-200/50 dark:bg-amber-950/20 dark:ring-amber-800/30"
                          : "bg-[var(--info-bg)] ring-[var(--info)]/15"
                      )}
                    >
                      <Link
                        href={`/calendar?highlight=${apt.id}`}
                        className="flex items-center gap-3.5 flex-1 min-w-0 group"
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center shadow-sm",
                          apt.is_callback ? "bg-amber-500" : "bg-[var(--info)]"
                        )}>
                          {apt.is_callback ? (
                            <PhoneForwarded className="w-5 h-5 text-white" />
                          ) : (
                            <CalendarDays className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] capitalize">
                            {apt.is_callback ? "Callback" : apt.appointment_type.map(t => t.replace(/_/g, ' ')).join(', ')}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3 opacity-50" />
                            {formatDate(apt.scheduled_date)} at {apt.scheduled_time?.slice(0, 5)}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-all" />
                      </Link>
                      {/* Reschedule button for callbacks */}
                      {apt.is_callback && (
                        <SimpleTooltip content="Reschedule callback" side="top">
                          <button
                            onClick={() => {
                              // Default to 1 hour from now
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
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </SimpleTooltip>
                      )}
                    </div>

                    {/* Inline Reschedule Form */}
                    <AnimatePresence>
                      {rescheduleAppointmentId === apt.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 p-4 rounded-lg bg-[var(--bg-surface)] ring-1 ring-amber-200 dark:ring-amber-800/40 space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
                              <RefreshCw className="w-4 h-4" />
                              Reschedule Callback
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Date</label>
                                <input
                                  type="date"
                                  value={rescheduleDate}
                                  onChange={(e) => setRescheduleDate(e.target.value)}
                                  className="w-full h-9 px-3 text-sm rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Time</label>
                                <select
                                  value={rescheduleTime}
                                  onChange={(e) => setRescheduleTime(e.target.value)}
                                  className="w-full h-9 px-3 text-sm rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                                >
                                  {["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30","21:00","21:30"].map(t => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                onClick={() => setRescheduleAppointmentId(null)}
                                className="px-3 py-1.5 text-xs font-medium rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
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
                                  "px-4 py-1.5 text-xs font-semibold rounded-md transition-colors",
                                  "bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                              >
                                {rescheduling ? (
                                  <span className="flex items-center gap-1.5">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Saving...
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
              </motion.div>
            )}

            {/* Action bar — divider separated */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-2 mt-5 pt-5 border-t border-[var(--border-subtle)]"
            >
              {/* Primary CTA */}
              {lead.pipeline_stage === 'lost' ? (
                <div className="relative flex-1" ref={reactivateMenuRef}>
                  <motion.button
                    onClick={() => setShowReactivateMenu(!showReactivateMenu)}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[var(--text-primary)] text-[var(--text-inverse)] font-medium text-sm shadow-sm hover:opacity-90 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reactivate To</span>
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showReactivateMenu && "rotate-180")} />
                  </motion.button>

                  <AnimatePresence>
                    {showReactivateMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-surface)] rounded-lg shadow-lg ring-1 ring-[var(--border)] overflow-hidden z-50"
                      >
                        <div className="p-1">
                          {LOST_LEAD_REACTIVATE_STAGES.map((stage) => (
                            <button
                              key={stage.value}
                              onClick={() => handleReactivateLead(stage.value)}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md hover:bg-[var(--bg-hover)] transition-colors"
                            >
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ background: STAGE_GRADIENT[stage.value].from }}
                              />
                              <span className="text-sm font-medium text-[var(--text-primary)]">{stage.label}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : null}

              {/* Calendar button */}
              <SimpleTooltip content="Book appointment" side="bottom">
                <Link href={`/calendar?book=${lead.id}`}>
                  <motion.div
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center w-11 h-11 rounded-lg bg-[var(--bg-sunken)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] ring-1 ring-[var(--border-subtle)] hover:ring-[var(--border)] transition-all duration-200"
                  >
                    <Calendar className="w-[18px] h-[18px]" />
                  </motion.div>
                </Link>
              </SimpleTooltip>

              {/* Schedule Callback button */}
              <SimpleTooltip content="Schedule callback" side="bottom">
                <motion.div
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCallbackScheduler(true)}
                  className="flex items-center justify-center w-11 h-11 rounded-lg bg-[var(--bg-sunken)] text-[var(--text-secondary)] hover:bg-amber-50 hover:text-amber-600 ring-1 ring-[var(--border-subtle)] hover:ring-amber-200 transition-all duration-200 cursor-pointer"
                >
                  <PhoneForwarded className="w-[18px] h-[18px]" />
                </motion.div>
              </SimpleTooltip>

              {/* RSVP button - only for applicants */}
              {lead.pipeline_stage === 'applicant' && (
                <SimpleTooltip content="Send RSVP link" side="bottom">
                  <motion.div
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowRSVPDialog(true)}
                    className="flex items-center justify-center w-11 h-11 rounded-lg bg-[var(--bg-sunken)] text-[var(--text-secondary)] hover:bg-emerald-50 hover:text-emerald-600 ring-1 ring-[var(--border-subtle)] hover:ring-emerald-200 transition-all duration-200 cursor-pointer"
                  >
                    <Send className="w-[18px] h-[18px]" />
                  </motion.div>
                </SimpleTooltip>
              )}
            </motion.div>
          </div>
        </motion.div>


        {/* Pipeline Progress - Visual Stepper */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-3xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{ background: `linear-gradient(135deg, ${stageGradient.from}, ${stageGradient.to})` }}
              >
                {updatingStage ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : lead.pipeline_stage === 'lost' ? (
                  <XCircle className="w-5 h-5 text-white" />
                ) : (
                  <span className="text-white font-bold">{currentStageIndex + 1}</span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">{stageInfo?.label}</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {lead.pipeline_stage === 'lost' ? 'Lead lost' :
                   `Stage ${currentStageIndex + 1} of ${activeStageOrder.length}`}
                </p>
              </div>
            </div>
            {lead.pipeline_stage !== 'lost' && (
              <button
                onClick={handleMarkLost}
                className="text-xs text-[var(--text-muted)] hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                Mark Lost
              </button>
            )}
          </div>

          {/* Pipeline Steps */}
          <div className="p-5">
            <div className="relative">
              {/* Progress Line — spans center-to-center of first and last circles */}
              <div className="absolute top-5 left-5 right-5 h-1 bg-[var(--bg-sunken)] rounded-full overflow-hidden">
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
                      content={isDropOffPoint ? `Dropped off after ${stageLabel}` : isCompleted ? `✓ ${stageLabel} completed` : isCurrentStage ? 'Current stage' : 'Click to advance'}
                      side="top"
                    >
                      <motion.button
                        onClick={() => handleStageClick(stage)}
                        disabled={updatingStage || lead.pipeline_stage === 'lost'}
                        className="relative flex flex-col items-center cursor-pointer disabled:cursor-not-allowed"
                        whileHover={{ scale: updatingStage ? 1 : 1.1 }}
                        whileTap={{ scale: updatingStage ? 1 : 0.95 }}
                      >
                        {/* Node Circle */}
                        <div
                          className={cn(
                            "relative w-10 h-10 rounded-full flex items-center justify-center transition-all",
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
                            <Check className="w-4 h-4 text-white" strokeWidth={3} />
                          ) : isCurrentStage ? (
                            <motion.div
                              className="w-3 h-3 rounded-full bg-white"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          ) : (
                            <span className="text-xs font-medium text-[var(--text-muted)]">{idx + 1}</span>
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
                            "mt-2 text-[10px] font-medium whitespace-nowrap transition-colors",
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
            <div className="px-5 py-3 border-t border-[var(--border)]">
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

        {/* SF Down Payment Card */}
        {lead.funding_type === 'self_funded' && (lead.pipeline_stage === 'application' || lead.pipeline_stage === 'applicant') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-4"
          >
            <SFDownPaymentCard
              lead={lead}
              onSuccess={() => refetchLead()}
            />
          </motion.div>
        )}

        {/* Tabbed Content Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-3xl overflow-hidden"
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
                  "flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors relative",
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
                className="p-5"
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
                className="p-5"
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
                className="p-5"
              >
                {/* Filter Pills */}
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                  <Filter className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  {(['all', 'stage_change', 'status_change', 'meeting', 'follow-up', 'email', 'note'] as NoteType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setNoteFilter(type)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                        noteFilter === type
                          ? "bg-[var(--primary)] text-white"
                          : "bg-[var(--bg-sunken)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                      )}
                    >
                      {NOTE_TYPE_CONFIG[type].label}
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

        {/* Follow-up Reminders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-4"
        >
          <FollowUpReminders leadId={lead.id} agentId={profile?.id} />
        </motion.div>

        {/* Quick Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-3xl overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <StickyNote className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">Notes</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {parsedNotes.length > 0 ? `${parsedNotes.length} note${parsedNotes.length !== 1 ? 's' : ''}` : 'No notes yet'}
                </p>
              </div>
            </div>
            {parsedNotes.length > 3 && (
              <button
                onClick={() => setActiveTab('activity')}
                className="text-xs text-[var(--primary)] hover:underline font-medium"
              >
                View all
              </button>
            )}
          </div>
          <div className="p-5">
            {/* Add Note Input */}
            <div className="flex items-end gap-2 mb-4">
              <Textarea
                placeholder="Add a quick note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="flex-1 min-h-[60px] resize-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleAddNote()
                  }
                }}
              />
              <Button
                onClick={handleAddNote}
                disabled={!newNote.trim() || mutationLoading}
                size="sm"
                className="shrink-0 h-10 w-10 p-0"
              >
                {mutationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>

            {/* Recent Notes */}
            {parsedNotes.length > 0 ? (
              <div className="space-y-2">
                {parsedNotes.slice(0, 3).map((note) => {
                  const config = NOTE_TYPE_CONFIG[note.type] || NOTE_TYPE_CONFIG.note
                  const NoteIcon = config.icon
                  return (
                    <div
                      key={note.id}
                      className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-sunken)]"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center shrink-0">
                        <NoteIcon className={cn("w-3.5 h-3.5", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] text-[var(--text-muted)]">{note.timestamp}</span>
                          {note.createdByName && (
                            <>
                              <span className="text-[10px] text-[var(--text-muted)]">·</span>
                              <span className="text-[10px] text-[var(--text-primary)] font-medium">{note.createdByName}</span>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-[var(--text-primary)] line-clamp-2">{note.content}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-[var(--text-muted)]">Add your first note above</p>
              </div>
            )}
          </div>
        </motion.div>
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
      <MarkLostDialog
        open={showLostDialog}
        onOpenChange={setShowLostDialog}
        leadName={`${lead.first_name_ar || lead.first_name} ${lead.last_name_ar || lead.last_name}`}
        onConfirm={async (reasonId, notes) => {
          await updateLeadStage(lead.id, 'lost', reasonId, notes)
          await refetchLead()
        }}
      />

      {/* Enrollment Payment Dialog */}
      <EnrollmentPaymentDialog
        open={showEnrollmentDialog}
        onOpenChange={setShowEnrollmentDialog}
        lead={lead}
        mode="enrollment"
        onSuccess={async () => {
          await refetchLead()
        }}
      />

      {/* PSP Submission Wizard */}
      <PSPSubmissionWizard
        isOpen={showPSPWizard}
        onClose={() => setShowPSPWizard(false)}
        lead={lead}
        onSuccess={() => {
          setShowPSPWizard(false)
          refetchLead()
        }}
      />

      {/* Send RSVP Dialog */}
      {lead && (
        <SendRSVPDialog
          isOpen={showRSVPDialog}
          onClose={() => setShowRSVPDialog(false)}
          selectedLeads={[lead]}
          onSuccess={() => refetchLead()}
        />
      )}

      {/* Callback Scheduler */}
      <CallbackScheduler
        isOpen={showCallbackScheduler}
        onClose={() => setShowCallbackScheduler(false)}
        lead={lead}
        onUpdateLead={async (id, updates) => {
          await updateLead(id, updates)
        }}
        onSuccess={() => refetchLead()}
      />

    </div>
  )
}
