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
  MessageSquare,
  FileText,
  User,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Copy,
  Check,
  MessageCircle,
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
  GraduationCap,
  Building,
  CreditCard,
  CalendarDays,
  UserCircle,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  ArrowRightLeft,
  CircleDot,
  Ban,
} from "lucide-react"
import { PIPELINE_STAGES, SCHOOLS, LEAD_SOURCES, MAJORS, MINISTRY_BLOCK_REASONS, type PipelineStage, type AppointmentStatus } from "@/types"
import { formatKuwaitPhone, formatCivilId, formatDate, cn } from "@/lib/utils"
import { useLead, useLeadMutations } from "@/lib/hooks/use-leads"
import { useLeadAppointments } from "@/lib/hooks/use-appointments"
import { useUser } from "@/lib/hooks/use-user"
import { useStageSettings } from "@/lib/hooks/use-stage-settings"
import { useLeadShortcuts } from "@/lib/hooks/use-lead-shortcuts"
import { LeadForm } from "@/components/leads/lead-form"
import { StudentInfoForm } from "@/components/leads/student-info-form"
import { MarkLostDialog } from "@/components/leads/mark-lost-dialog"
import { EnrollmentPaymentDialog } from "@/components/leads/enrollment-payment-dialog"
import { SimpleTooltip } from "@/components/ui/tooltip"
import { SMSComposer, SMSHistory } from "@/components/sms"
import { WhatsAppTemplateSelector, WhatsAppHistory } from "@/components/whatsapp"
import { FollowUpReminders } from "@/components/leads/follow-up-reminders"
import { LeadDocuments } from "@/components/leads/lead-documents"
import { CallHistory } from "@/components/leads/call-history"
import { useCallHistory } from "@/lib/hooks/use-calls"
import { useLeadActivities } from "@/lib/hooks/use-activities"

// Simplified stage order for the pipeline
const STAGE_ORDER = ["new", "contacted", "visit", "appointment", "test", "application", "submission", "enrolled", "lost"] as const

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

  const advancedStages = ["visit", "test", "application"]
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

function parseNotes(notesString: string | undefined, pinnedIds: Set<string>): ParsedNote[] {
  if (!notesString) return []

  return notesString.split('\n\n').filter(Boolean).map((note, index) => {
    const match = note.match(/^\[([^\]]+)\]\s*([\s\S]*)$/)
    const timestamp = match ? match[1] : 'Unknown'
    const content = match ? match[2] : note
    const id = `note-${index}-${timestamp.replace(/\s/g, '')}`

    let rawTimestamp: Date | null = null
    if (match) {
      const parsed = new Date(match[1])
      if (!isNaN(parsed.getTime())) {
        rawTimestamp = parsed
      } else {
        const currentYear = new Date().getFullYear()
        const dateStr = `${match[1]}, ${currentYear}`
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
  new: { from: '#6366F1', to: '#8B5CF6', text: 'white' },
  contacted: { from: '#3B82F6', to: '#6366F1', text: 'white' },
  appointment: { from: '#0EA5E9', to: '#3B82F6', text: 'white' },
  visit: { from: '#06B6D4', to: '#0EA5E9', text: 'white' },
  test: { from: '#10B981', to: '#14B8A6', text: 'white' },
  application: { from: '#22C55E', to: '#10B981', text: 'white' },
  submission: { from: '#16A34A', to: '#15803D', text: 'white' },
  enrolled: { from: '#059669', to: '#047857', text: 'white' },
  lost: { from: '#64748B', to: '#475569', text: 'white' },
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const searchParams = useSearchParams()
  const { profile } = useUser()
  const { lead, loading, error, refetch: refetchLead } = useLead(resolvedParams.id)
  const { appointments } = useLeadAppointments(resolvedParams.id)
  const { calls } = useCallHistory(resolvedParams.id)
  const { activities } = useLeadActivities(resolvedParams.id)
  const { updateLeadStage, updateLead, loading: mutationLoading } = useLeadMutations()
  const { activeStages } = useStageSettings()

  // Filter STAGE_ORDER to only include active stages (excluding 'lost' as it's handled separately)
  const activeStageOrder = useMemo(() => {
    if (activeStages.length === 0) return STAGE_ORDER.slice(0, -1) // Remove 'lost' from default
    return STAGE_ORDER.filter(s => s !== 'lost' && activeStages.includes(s as PipelineStage))
  }, [activeStages])

  const [updatingStage, setUpdatingStage] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showMessagingMenu, setShowMessagingMenu] = useState(false)
  const [messagingType, setMessagingType] = useState<'sms' | 'whatsapp' | null>(() => {
    const msgType = searchParams.get('message')
    return msgType === 'sms' || msgType === 'whatsapp' ? msgType : null
  })

  // Get the stage filter from URL params for back navigation
  const stageFromUrl = searchParams.get('stage') as PipelineStage | null
  const backUrl = stageFromUrl ? `/leads?stage=${stageFromUrl}` : '/leads'
  const [newNote, setNewNote] = useState("")
  const [copiedPhone, setCopiedPhone] = useState(false)
  const [showLostDialog, setShowLostDialog] = useState(false)
  const [showEnrollmentDialog, setShowEnrollmentDialog] = useState(false)
  const [noteFilter, setNoteFilter] = useState<NoteType>('all')
  const [pinnedNoteIds, setPinnedNoteIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'calls' | 'activity'>('details')
  const messagingMenuRef = useRef<HTMLDivElement>(null)
  const notesInputRef = useRef<HTMLTextAreaElement>(null)

  useLeadShortcuts({
    lead,
    onToggleMessage: () => setShowMessagingMenu(prev => !prev),
    onEdit: () => setShowEditForm(true),
    onFocusNotes: () => notesInputRef.current?.focus(),
  })

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (messagingMenuRef.current && !messagingMenuRef.current.contains(event.target as Node)) {
        setShowMessagingMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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

  const handleReactivateLead = async () => {
    if (!lead) return

    const completedStages = lead.completed_stages || []
    let lastCompletedStage: PipelineStage = 'new'

    for (let i = STAGE_ORDER.length - 2; i >= 0; i--) {
      const stage = STAGE_ORDER[i]
      if (completedStages.includes(stage as PipelineStage)) {
        lastCompletedStage = stage as PipelineStage
        break
      }
    }

    const result = await updateLead(lead.id, {
      pipeline_stage: lastCompletedStage,
      lost_reason_id: undefined,
      lost_reason_notes: undefined,
    })
    if (!result.error) {
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
    const formattedNote = `[${timestamp}] ${newNote.trim()}`
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] opacity-20" />
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
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-500" />
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
  const sourceInfo = LEAD_SOURCES.find((s) => s.value === lead.source)
  const schoolInfo = SCHOOLS.find((s) => s.value === lead.school)
  const majorInfo = MAJORS.find((m) => m.value === lead.intended_major)
  const currentStageIndex = activeStageOrder.indexOf(lead.pipeline_stage as typeof STAGE_ORDER[number])

  const upcomingAppointments = appointments
    .filter(apt => {
      const aptDate = new Date(`${apt.scheduled_date}T${apt.scheduled_time}`)
      return aptDate >= new Date() && apt.status !== 'cancelled'
    })
    .slice(0, 2)

  const leadHeat = calculateLeadHeat(lead, appointments.length)
  const daysInStage = calculateDaysInStage(lead.updated_at)
  const HeatIcon = LEAD_HEAT_CONFIG[leadHeat].icon

  const parsedNotes = parseNotes(lead.notes, pinnedNoteIds)

  // Convert activities to ParsedNote format
  const activityNotes: ParsedNote[] = activities.map((activity, index) => ({
    id: activity.id,
    timestamp: new Date(activity.created_at).toLocaleString(),
    rawTimestamp: new Date(activity.created_at),
    content: activity.description || activity.title || '',
    type: activity.activity_type as NoteType,
    isPinned: false,
    originalIndex: -1 - index, // Negative to distinguish from notes
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
          { label: stageFromUrl ? PIPELINE_STAGES.find(s => s.value === stageFromUrl)?.label || 'Leads' : "Leads", href: backUrl },
          { label: `${lead.first_name} ${lead.last_name}` },
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
            {stageFromUrl ? `Back to ${PIPELINE_STAGES.find(s => s.value === stageFromUrl)?.label || 'Leads'}` : 'All Leads'}
          </Link>
        </div>

        {/* Hero Section - Premium Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[var(--bg-surface)] via-[var(--bg-surface)] to-[var(--bg-elevated)] border border-[var(--border)]/60 shadow-2xl shadow-black/5"
        >
          {/* Background gradient accent - enhanced */}
          <div
            className="absolute -top-32 -right-32 w-[500px] h-[500px] opacity-[0.07] blur-[100px] pointer-events-none"
            style={{ background: `radial-gradient(circle, ${stageGradient.from}, ${stageGradient.to})` }}
          />
          <div
            className="absolute -bottom-20 -left-20 w-64 h-64 opacity-[0.04] blur-[80px] pointer-events-none"
            style={{ background: `radial-gradient(circle, ${stageGradient.to}, transparent)` }}
          />

          {/* Subtle noise texture overlay */}
          <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />

          <div className="relative p-7 sm:p-8">
            {/* Top Row: Avatar + Info + Actions */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              {/* Large Avatar with Refined Ring */}
              <motion.div
                className="relative"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {/* Outer glow ring */}
                <div
                  className="absolute -inset-1.5 rounded-[1.75rem] opacity-40 blur-md"
                  style={{ background: `linear-gradient(135deg, ${stageGradient.from}, ${stageGradient.to})` }}
                />
                <Avatar className="relative w-[88px] h-[88px] sm:w-[100px] sm:h-[100px] ring-[3px] ring-white/80 dark:ring-white/20 shadow-2xl rounded-[1.5rem]">
                  <AvatarFallback
                    className="text-[1.75rem] sm:text-[2rem] font-semibold text-white tracking-tight rounded-[1.5rem]"
                    style={{ background: `linear-gradient(145deg, ${stageGradient.from}, ${stageGradient.to})` }}
                  >
                    {lead.first_name?.[0]}{lead.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                {/* Heat indicator badge - refined (hide for lost leads) */}
                {lead.pipeline_stage !== 'lost' && (
                  <SimpleTooltip
                    content={`${LEAD_HEAT_CONFIG[leadHeat].label} Lead: ${LEAD_HEAT_CONFIG[leadHeat].description}`}
                    side="right"
                    wrapperClassName="absolute -bottom-1 -right-1"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shadow-xl ring-[3px] ring-white dark:ring-[var(--bg-surface)] cursor-help",
                        leadHeat === 'hot' && "bg-gradient-to-br from-orange-400 via-orange-500 to-red-500",
                        leadHeat === 'warm' && "bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500",
                        leadHeat === 'cold' && "bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600"
                      )}
                    >
                      <HeatIcon className="w-[18px] h-[18px] text-white drop-shadow-sm" />
                    </motion.div>
                  </SimpleTooltip>
                )}
              </motion.div>

              {/* Lead Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <motion.h1
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 }}
                      className="text-[1.75rem] sm:text-[2rem] font-semibold text-[var(--text-primary)] tracking-[-0.02em] leading-tight"
                    >
                      {lead.first_name} {lead.last_name}
                    </motion.h1>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex flex-wrap items-center gap-2.5"
                    >
                      {/* Stage Badge - refined pill */}
                      <span
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold shadow-md tracking-wide"
                        style={{
                          background: `linear-gradient(135deg, ${stageGradient.from}, ${stageGradient.to})`,
                          color: stageGradient.text,
                          boxShadow: `0 4px 14px -2px ${stageGradient.from}40`
                        }}
                      >
                        {lead.pipeline_stage === 'lost' && <XCircle className="w-3.5 h-3.5" />}
                        {stageInfo?.label}
                      </span>
                      {/* Days in stage - subtle indicator */}
                      <span className="flex items-center gap-1.5 text-[13px] text-[var(--text-muted)] font-medium">
                        <Clock className="w-3.5 h-3.5 opacity-60" />
                        {daysInStage === 0 ? 'Today' : `${daysInStage}d in stage`}
                      </span>
                    </motion.div>
                  </div>
                  {/* Edit Button - refined */}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowEditForm(true)}
                      className="w-10 h-10 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-sunken)] shrink-0 transition-all duration-200"
                    >
                      <Edit className="w-[18px] h-[18px]" />
                    </Button>
                  </motion.div>
                </div>

                {/* Quick Info Pills - enhanced */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="flex flex-wrap items-center gap-2 mt-4"
                >
                  {lead.funding_type === "puc" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 dark:from-amber-950/40 dark:to-orange-950/40 dark:text-amber-400 ring-1 ring-amber-200/60 dark:ring-amber-800/40">
                      <Sparkles className="w-3.5 h-3.5" />
                      PUC Scholarship
                    </span>
                  )}
                  {lead.is_kuwaiti && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 dark:from-emerald-950/40 dark:to-teal-950/40 dark:text-emerald-400 ring-1 ring-emerald-200/60 dark:ring-emerald-800/40">
                      <Tag className="w-3.5 h-3.5" />
                      Kuwaiti
                    </span>
                  )}
                  {(schoolInfo?.label || lead.school_name_custom) && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 dark:from-blue-950/40 dark:to-indigo-950/40 dark:text-blue-400 ring-1 ring-blue-200/60 dark:ring-blue-800/40">
                      <Building className="w-3.5 h-3.5" />
                      {schoolInfo?.label || lead.school_name_custom}
                    </span>
                  )}
                  {lead.ministry_blocked && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 dark:from-orange-950/40 dark:to-amber-950/40 dark:text-orange-400 ring-1 ring-orange-200/60 dark:ring-orange-800/40">
                      <Ban className="w-3.5 h-3.5" />
                      Blocked: {lead.ministry_block_reasons?.map(r => MINISTRY_BLOCK_REASONS.find(m => m.value === r)?.label).filter(Boolean).join(', ') || 'Unknown'}
                    </span>
                  )}
                </motion.div>

                {/* Phone Numbers - Premium styling */}
                <div className="flex flex-wrap items-center gap-3 mt-5">
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    onClick={copyPhone}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="group inline-flex items-center gap-3.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-[var(--bg-sunken)] to-[var(--bg-sunken)]/80 hover:from-[var(--bg-hover)] hover:to-[var(--bg-hover)]/80 ring-1 ring-[var(--border)]/50 hover:ring-[var(--border)] transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center ring-1 ring-slate-200/60 dark:ring-slate-700/60">
                      <Phone className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <span className="font-mono text-lg font-semibold text-[var(--text-primary)] tracking-wide">
                      {formatKuwaitPhone(lead.phone)}
                    </span>
                    {copiedPhone ? (
                      <motion.span
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg"
                      >
                        <Check className="w-4 h-4" />
                        <span className="text-xs font-semibold">Copied!</span>
                      </motion.span>
                    ) : (
                      <Copy className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-all duration-200" />
                    )}
                  </motion.button>

                  {lead.phone_secondary && (
                    <motion.a
                      href={`tel:+965${lead.phone_secondary}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[var(--bg-sunken)]/60 hover:bg-[var(--bg-hover)] ring-1 ring-[var(--border)]/40 hover:ring-[var(--border)] transition-all duration-300"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
                        <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Secondary</span>
                        <span className="font-mono text-sm font-medium text-[var(--text-primary)]">
                          {formatKuwaitPhone(lead.phone_secondary)}
                        </span>
                      </div>
                    </motion.a>
                  )}
                </div>
              </div>
            </div>

            {/* Upcoming Appointment Banner - Premium design */}
            {upcomingAppointments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                className="mt-6"
              >
                <Link
                  href={`/calendar?highlight=${upcomingAppointments[0].id}`}
                  className="group relative flex items-center gap-4 px-5 py-4 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.01]"
                >
                  {/* Gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/[0.08] via-cyan-500/[0.06] to-teal-500/[0.08] dark:from-blue-500/[0.12] dark:via-cyan-500/[0.10] dark:to-teal-500/[0.12]" />
                  <div className="absolute inset-0 ring-1 ring-inset ring-blue-500/20 dark:ring-blue-400/20 rounded-2xl" />

                  {/* Calendar icon container */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl blur-lg opacity-40" />
                    <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <CalendarDays className="w-7 h-7 text-white" />
                    </div>
                  </div>

                  <div className="relative flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] capitalize">
                      {upcomingAppointments[0].appointment_type.map(t => t.replace(/_/g, ' ')).join(', ')}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 opacity-60" />
                      {formatDate(upcomingAppointments[0].scheduled_date)} at {upcomingAppointments[0].scheduled_time?.slice(0, 5)}
                    </p>
                  </div>

                  <div className="relative w-10 h-10 rounded-xl bg-white/60 dark:bg-white/10 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-white/20 transition-colors">
                    <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              </motion.div>
            )}

            {/* Action Buttons Row - Premium styling */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="flex items-center gap-3 mt-6"
              ref={messagingMenuRef}
            >
              {/* Primary CTA */}
              {lead.pipeline_stage === 'lost' ? (
                <motion.button
                  onClick={handleReactivateLead}
                  whileHover={{ scale: 1.015, y: -1 }}
                  whileTap={{ scale: 0.985 }}
                  className="flex-1 relative flex items-center justify-center gap-3 px-6 py-4 rounded-2xl overflow-hidden font-semibold text-white shadow-xl transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <RotateCcw className="relative w-5 h-5" />
                  <span className="relative">Reactivate Lead</span>
                </motion.button>
              ) : (
                <Link
                  href={`/voice?call=${lead.phone}&leadId=${lead.id}&name=${encodeURIComponent(`${lead.first_name} ${lead.last_name}`)}`}
                  className="flex-1"
                >
                  <motion.div
                    whileHover={{ scale: 1.015, y: -1 }}
                    whileTap={{ scale: 0.985 }}
                    className="relative flex items-center justify-center gap-3 px-6 py-4 rounded-2xl overflow-hidden font-semibold text-white shadow-xl shadow-emerald-500/25 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                    <div className="absolute inset-0 opacity-0 hover:opacity-100 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 transition-opacity duration-300" />
                    <Phone className="relative w-5 h-5" />
                    <span className="relative tracking-wide">Call Now</span>
                  </motion.div>
                </Link>
              )}

              {/* Message Button - refined */}
              <div className="relative">
                <motion.button
                  onClick={() => setShowMessagingMenu(!showMessagingMenu)}
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300",
                    messagingType
                      ? "bg-gradient-to-br from-[var(--text-primary)] to-[var(--text-primary)]/90 text-white shadow-xl shadow-black/20"
                      : "bg-[var(--bg-surface)] ring-1 ring-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:ring-[var(--border)]/80 shadow-lg shadow-black/5"
                  )}
                >
                  <MessageCircle className="w-5 h-5" />
                </motion.button>

                <AnimatePresence>
                  {showMessagingMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      transition={{ duration: 0.2, type: "spring", stiffness: 400, damping: 25 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 bg-[var(--bg-surface)] rounded-2xl shadow-2xl shadow-black/15 ring-1 ring-[var(--border)]/60 overflow-hidden z-50"
                    >
                      <div className="p-1.5">
                        <button
                          onClick={() => { setMessagingType('sms'); setShowMessagingMenu(false) }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--bg-hover)] transition-colors"
                        >
                          <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="text-sm font-medium text-[var(--text-primary)]">SMS</span>
                        </button>
                        <button
                          onClick={() => { setMessagingType('whatsapp'); setShowMessagingMenu(false) }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--bg-hover)] transition-colors"
                        >
                          <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <span className="text-sm font-medium text-[var(--text-primary)]">WhatsApp</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Calendar Button - refined */}
              <Link href={`/calendar?book=${lead.id}`}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--bg-surface)] ring-1 ring-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:ring-[var(--border)]/80 transition-all duration-300 shadow-lg shadow-black/5"
                >
                  <Calendar className="w-5 h-5" />
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Messaging Section */}
        <AnimatePresence>
          {messagingType === 'sms' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-500" />
                    SMS Templates
                  </h3>
                  <button
                    onClick={() => setMessagingType(null)}
                    className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SMSComposer lead={lead} agent={profile || undefined} onSent={() => {}} />
                  <SMSHistory leadId={lead.id} />
                </div>
              </div>
            </motion.div>
          )}

          {messagingType === 'whatsapp' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-emerald-500" />
                    WhatsApp Templates
                  </h3>
                  <button
                    onClick={() => setMessagingType(null)}
                    className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-[var(--bg-sunken)] rounded-xl p-4">
                    <WhatsAppTemplateSelector lead={lead} agent={profile || undefined} onSent={() => {}} />
                  </div>
                  <WhatsAppHistory leadId={lead.id} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                   `Stage ${currentStageIndex + 1} of ${STAGE_ORDER.length - 1}`}
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
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-[var(--bg-sunken)] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${stageGradient.from}, ${stageGradient.to})` }}
                  initial={false}
                  animate={{
                    width: lead.pipeline_stage === 'lost' ? '0%' : `${((currentStageIndex + 1) / activeStageOrder.length) * 100}%`
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>

              {/* Stage Nodes */}
              <div className="relative flex justify-between">
                {activeStageOrder.map((stage, idx) => {
                  const completedStages = lead.completed_stages || []
                  const isInCompletedStages = completedStages.includes(stage as PipelineStage)
                  const isCurrentStage = lead.pipeline_stage === stage
                  const isPast = idx < currentStageIndex
                  // Show as completed if it's before current stage OR explicitly in completed_stages
                  const isCompleted = isPast || (isInCompletedStages && idx <= currentStageIndex)
                  const stageLabel = PIPELINE_STAGES.find(s => s.value === stage)?.label || stage
                  const colors = STAGE_GRADIENT[stage] || STAGE_GRADIENT.new

                  const isLostLead = lead.pipeline_stage === 'lost'
                  const nextStage = activeStageOrder[idx + 1]
                  const isDropOffPoint = isLostLead && isCompleted && nextStage && nextStage !== 'lost' && !completedStages.includes(nextStage as PipelineStage)

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
        </motion.div>

        {/* Follow-up Reminders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4"
        >
          <FollowUpReminders leadId={lead.id} agentId={profile?.id} />
        </motion.div>

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
              { id: 'calls' as const, label: `Calls (${calls.length})`, icon: Phone },
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
                <LeadDocuments leadId={lead.id} />
              </motion.div>
            )}

            {activeTab === 'calls' && (
              <motion.div
                key="calls"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="p-5"
              >
                <CallHistory leadId={lead.id} />
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
                  {(['all', 'stage_change', 'status_change', 'call', 'meeting', 'follow-up', 'email', 'note'] as NoteType[]).map((type) => (
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
        leadName={`${lead.first_name} ${lead.last_name}`}
        onConfirm={async (reasonId, notes) => {
          await updateLead(lead.id, {
            pipeline_stage: 'lost',
            lost_reason_id: reasonId,
            lost_reason_notes: notes,
          })
          await refetchLead()
        }}
      />

      {/* Enrollment Payment Dialog */}
      <EnrollmentPaymentDialog
        open={showEnrollmentDialog}
        onOpenChange={setShowEnrollmentDialog}
        lead={lead}
        onSuccess={async () => {
          await refetchLead()
        }}
      />

    </div>
  )
}
