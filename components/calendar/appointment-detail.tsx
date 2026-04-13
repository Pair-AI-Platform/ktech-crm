"use client"

import { useState, useEffect, startTransition } from "react"
import { getLeadDisplayName } from "@/lib/lead-utils"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Calendar,
  Clock,
  Phone,
  CheckCircle2,
  MessageSquare,
  PhoneMissed,
  PhoneOff,
  Car,
  User,
  UserCheck,
  XCircle,
  PhoneCall,
  Eye,
  Trash2,
  Pencil,
  Check,
  StickyNote
} from "lucide-react"
import type { Appointment, PipelineStage, LeadStatus } from "@/types"
import { APPOINTMENT_TYPES, PIPELINE_STAGES, LEAD_STATUSES, APPLICANT_ONLY_STATUSES } from "@/types"
import { stageColors } from "@/lib/utils"
import { useAppointmentMutations, useRescheduleHistory } from "@/lib/hooks/use-appointments"
import { useLeadMutations } from "@/lib/hooks/use-leads"
import { useAgents } from "@/lib/hooks/use-user"
import { createClient } from "@/lib/supabase/client"
import { MarkLostDialog } from "@/components/leads/mark-lost-dialog"
import { AppointmentBooking } from "@/components/calendar/appointment-booking"
import { CallbackScheduler } from "@/components/leads/callback-scheduler"

interface AppointmentDetailProps {
  appointment: Appointment | null
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

type StatusConfig = { label: string; color: string; icon: typeof CheckCircle2 }
const ALL_STATUS_CONFIG: Record<string, StatusConfig> = {
  scheduled: {
    label: "Scheduled",
    color: "bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/30",
    icon: Calendar
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30",
    icon: CheckCircle2
  },
  on_the_way: {
    label: "On The Way",
    color: "bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/30",
    icon: Car
  },
  postponed: {
    label: "Postponed",
    color: "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30",
    icon: Calendar
  },
  cancelled: {
    label: "Canceled",
    color: "bg-red-500/10 text-red-500 border-red-500/30",
    icon: XCircle
  },
  no_answer: {
    label: "No Answer",
    color: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30",
    icon: PhoneMissed
  },
  cant_reach: {
    label: "Can't Reach",
    color: "bg-[var(--error)]/10 text-[var(--error)] border-[var(--error)]/30",
    icon: PhoneOff
  },
  will_see: {
    label: "Will See",
    color: "bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/30",
    icon: Eye
  },
}

// Statuses shown for regular appointments
const APPOINTMENT_STATUS_KEYS = ["scheduled", "confirmed", "on_the_way", "postponed", "cancelled"]
// Statuses shown for callbacks
const CALLBACK_STATUS_KEYS = ["scheduled", "confirmed", "no_answer", "cant_reach", "postponed", "will_see", "cancelled"]

export function AppointmentDetail({ appointment, isOpen, onClose, onUpdate }: AppointmentDetailProps) {
  const [showPostponedForm, setShowPostponedForm] = useState(false)
  const [postponedDate, setPostponedDate] = useState("")
  const [postponedTime, setPostponedTime] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showCancelForm, setShowCancelForm] = useState(false)
  const [cancelNotes, setCancelNotes] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [stageLoading, setStageLoading] = useState(false)
  const [localStageOverride, setLocalStageOverride] = useState<PipelineStage | null>(null)
  const [localStatusOverride, setLocalStatusOverride] = useState<string | null>(null)
  const [localTimestamps, setLocalTimestamps] = useState<Record<string, string>>({})
  const [stageChangeLog, setStageChangeLog] = useState<{ stage: string; label: string; at: string }[]>([])
  const [showLostDialog, setShowLostDialog] = useState(false)
  const [localLeadStatusOverride, setLocalLeadStatusOverride] = useState<LeadStatus | null>(null)
  const [leadStatusLoading, setLeadStatusLoading] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState("")
  const [savedNotes, setSavedNotes] = useState("")
  const [notesSaving, setNotesSaving] = useState(false)
  const [showBooking, setShowBooking] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [showCallbackScheduler, setShowCallbackScheduler] = useState(false)

  const {
    markNA,
    markCantReach,
    markOnTheWay,
    markWillSee,
    confirmAppointment,
    cancelAppointment,
    postponeAppointment,
    deleteAppointment,
    updateAppointment
  } = useAppointmentMutations()

  // Fetch reschedule history - use empty string if no appointment to satisfy hook rules
  const { reschedules } = useRescheduleHistory(appointment?.id || "")
  const { agents } = useAgents()
  const agentMap = new Map(agents.map(a => [a.id, a.full_name]))
  const { updateLeadStage } = useLeadMutations()

  // Reset local state when appointment changes
  useEffect(() => {
    startTransition(() => {
      setLocalStageOverride(null)
      setLocalStatusOverride(null)
      setLocalTimestamps({})
      setStageChangeLog([])
      setLocalLeadStatusOverride(null)
      setEditingNotes(false)
      setNotesValue(appointment?.notes || "")
      setSavedNotes(appointment?.notes || "")
    })
  }, [appointment?.id, appointment?.notes])

  if (!appointment) return null

  const statusConfig = ALL_STATUS_CONFIG[appointment.status] || ALL_STATUS_CONFIG.scheduled
  const StatusIcon = statusConfig.icon

  // Derive leads list from junction table with legacy fallback
  const appointmentLeads = appointment.appointment_leads?.map(al => al.lead).filter(Boolean) ||
    (appointment.lead ? [appointment.lead] : [])
  const hasLeads = appointmentLeads.length > 0

  const personName = hasLeads
    ? appointmentLeads.length === 1
      ? getLeadDisplayName(appointmentLeads[0]!)
      : `${getLeadDisplayName(appointmentLeads[0]!)} +${appointmentLeads.length - 1}`
    : appointment.student
    ? `${appointment.student.first_name} ${appointment.student.last_name}`
    : "Unknown"

  const personPhone = appointmentLeads[0]?.phone || ""

  // Get all lead IDs for bulk operations
  const allLeadIds = appointment.appointment_leads?.map(al => al.lead_id) ||
    (appointment.lead_id ? [appointment.lead_id] : [])

  // Update contact_status for all linked leads
  const updateLeadContactStatus = async (status: string) => {
    if (allLeadIds.length === 0) return
    const supabase = createClient()
    for (const lid of allLeadIds) {
      await supabase.from("leads").update({ contact_status: status }).eq("id", lid)
    }
  }

  const handleAction = async (action: () => Promise<unknown>, closeAfter = false) => {
    setIsLoading(true)
    setActionError(null)
    const result = await action() as { data?: unknown; error?: string | null } | undefined
    setIsLoading(false)
    if (result?.error) {
      setActionError(typeof result.error === 'string' ? result.error : 'Failed to update appointment')
      return
    }
    onUpdate?.()
    if (closeAfter) onClose()
  }

  const handleConfirm = async () => {
    setIsLoading(true)
    setActionError(null)
    const result = await confirmAppointment(appointment.id) as { error?: string | null } | undefined
    setIsLoading(false)
    if (result?.error) { setActionError(typeof result.error === 'string' ? result.error : 'Failed'); return }
    setLocalStatusOverride("confirmed")
    setLocalTimestamps(prev => ({ ...prev, confirmed_at: new Date().toISOString() }))
    await updateLeadContactStatus("interested")
    onUpdate?.()
  }
  const handleMarkNA = async () => {
    setIsLoading(true)
    setActionError(null)
    const result = await markNA(appointment.id) as { error?: string | null } | undefined
    setIsLoading(false)
    if (result?.error) { setActionError(typeof result.error === 'string' ? result.error : 'Failed'); return }
    setLocalStatusOverride("no_answer")
    setLocalTimestamps(prev => ({ ...prev, na_marked_at: new Date().toISOString() }))
    await updateLeadContactStatus("no_answer")
    onUpdate?.()
  }
  const handleMarkCantReach = async () => {
    setIsLoading(true)
    setActionError(null)
    const result = await markCantReach(appointment.id) as { error?: string | null } | undefined
    setIsLoading(false)
    if (result?.error) { setActionError(typeof result.error === 'string' ? result.error : 'Failed'); return }
    setLocalStatusOverride("cant_reach")
    setLocalTimestamps(prev => ({ ...prev, cant_reach_at: new Date().toISOString() }))
    await updateLeadContactStatus("no_answer")
    onUpdate?.()
  }
  const handleMarkOnTheWay = async () => {
    setIsLoading(true)
    setActionError(null)
    const result = await markOnTheWay(appointment.id) as { error?: string | null } | undefined
    setIsLoading(false)
    if (result?.error) { setActionError(typeof result.error === 'string' ? result.error : 'Failed'); return }
    setLocalStatusOverride("on_the_way")
    setLocalTimestamps(prev => ({ ...prev, on_the_way_at: new Date().toISOString() }))
    await updateLeadContactStatus("will_see")
    onUpdate?.()
  }
  const handleMarkWillSee = async () => {
    setIsLoading(true)
    setActionError(null)
    const result = await markWillSee(appointment.id) as { error?: string | null } | undefined
    setIsLoading(false)
    if (result?.error) { setActionError(typeof result.error === 'string' ? result.error : 'Failed'); return }
    setLocalStatusOverride("will_see")
    setLocalTimestamps(prev => ({ ...prev, will_see_at: new Date().toISOString() }))
    await updateLeadContactStatus("will_see")
    onUpdate?.()
    // Open callback scheduler to book a follow-up
    if (hasLeads) {
      setShowCallbackScheduler(true)
    }
  }

  const handleSaveNotes = async () => {
    setNotesSaving(true)
    try {
      const result = await updateAppointment(appointment.id, { notes: notesValue.trim() || null } as Partial<Appointment>)
      if (result?.error) {
        setActionError(typeof result.error === 'string' ? result.error : 'Failed to save notes')
        return
      }
      const trimmed = notesValue.trim()
      setNotesValue(trimmed)
      setSavedNotes(trimmed)
      setEditingNotes(false)
      onUpdate?.()
    } catch {
      setActionError('Failed to save notes')
    } finally {
      setNotesSaving(false)
    }
  }

  // Mark all leads as Canceled with notes + cancel the appointment
  const handleMarkCanceled = async () => {
    if (allLeadIds.length === 0) return
    setIsLoading(true)
    const supabase = createClient()
    for (const lid of allLeadIds) {
      await supabase
        .from("leads")
        .update({ contact_status: "not_interested", notes: cancelNotes || undefined })
        .eq("id", lid)
    }
    // Also cancel the appointment itself
    await cancelAppointment(appointment.id, cancelNotes || undefined)
    setIsLoading(false)
    setShowCancelForm(false)
    setCancelNotes("")
    setLocalStatusOverride("cancelled")
    setLocalTimestamps(prev => ({ ...prev, cancelled_at: new Date().toISOString() }))
    onUpdate?.()
    onClose()
  }

  // Mark all leads as Callback (CB) and open callback scheduler
  const handleMarkCB = async () => {
    if (allLeadIds.length === 0) return
    setIsLoading(true)
    setActionError(null)
    const result = await postponeAppointment(appointment.id, appointment.scheduled_date, appointment.scheduled_time || "") as { error?: string | null } | undefined
    if (result?.error) {
      setIsLoading(false)
      setActionError(typeof result.error === 'string' ? result.error : 'Failed')
      return
    }
    const supabase = createClient()
    for (const lid of allLeadIds) {
      await supabase
        .from("leads")
        .update({ contact_status: "callback" })
        .eq("id", lid)
    }
    setIsLoading(false)
    setLocalStatusOverride("postponed")
    onUpdate?.()
    // Open callback scheduler to book a follow-up
    if (hasLeads) {
      setShowCallbackScheduler(true)
    }
  }
  // Change lead pipeline stage for all leads + auto-confirm appointment
  const handleChangeStage = async (stage: PipelineStage, lostReasonId?: string, lostReasonNotes?: string) => {
    if (allLeadIds.length === 0) return
    // Intercept "lost" stage to show the reason dialog
    if (stage === "lost" && !lostReasonId) {
      setShowLostDialog(true)
      return
    }
    setStageLoading(true)
    setLocalStageOverride(stage)
    const stageLabel = PIPELINE_STAGES.find(s => s.value === stage)?.label || stage
    setStageChangeLog(prev => [...prev, { stage, label: stageLabel, at: new Date().toISOString() }])
    // Use updateLeadStage to trigger activity logging, notifications, and automation rules
    for (const lid of allLeadIds) {
      await updateLeadStage(lid, stage, lostReasonId, lostReasonNotes)
    }
    setStageLoading(false)
    onUpdate?.()
  }

  // Lead status color mapping
  const LEAD_STATUS_COLORS: Record<string, string> = {
    warning: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30",
    success: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30",
    destructive: "bg-red-500/10 text-red-500 border-red-500/30",
    secondary: "bg-[var(--text-secondary)]/10 text-[var(--text-secondary)] border-[var(--text-secondary)]/30",
    accent: "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30",
  }

  // Filter statuses based on current pipeline stage
  const currentStageForStatus = localStageOverride || appointmentLeads[0]?.pipeline_stage
  const STAGE_STATUSES: Record<PipelineStage, LeadStatus[] | 'all' | 'none'> = {
    new: 'none',
    contacted: ['no_answer', 'switched_off', 'interested', 'not_interested', 'high_gpa', 'wrong_number', 'will_see'],
    visit: ['no_answer', 'cant_reach', 'interested', 'not_interested'],
    test: ['online', 'on_campus'],
    application: 'none',
    lost: 'all',
    applicant: ['no_answer', 'cant_reach', 'informed', 'travelling', 'might_withdraw'],
    enrolled: 'none',
    withdraw: 'all',
    puc_document_submission: 'none',
    puc_application_submission: 'none',
  }
  const stageConfig = currentStageForStatus ? STAGE_STATUSES[currentStageForStatus as PipelineStage] : 'all'
  const currentLeadStatusValue = appointmentLeads[0]?.status as LeadStatus | undefined
  const availableLeadStatuses = (() => {
    let statuses = stageConfig === 'none'
      ? []
      : stageConfig === 'all'
      ? LEAD_STATUSES.filter(s => !APPLICANT_ONLY_STATUSES.includes(s.value))
      : LEAD_STATUSES.filter(s => (stageConfig as LeadStatus[]).includes(s.value))
    // Always include the lead's current status so it shows as pre-selected
    if (currentLeadStatusValue && !statuses.some(s => s.value === currentLeadStatusValue)) {
      const currentStatusDef = LEAD_STATUSES.find(s => s.value === currentLeadStatusValue)
      if (currentStatusDef) statuses = [currentStatusDef, ...statuses]
    }
    return statuses
  })()

  // Change lead status for all leads
  const handleChangeLeadStatus = async (status: LeadStatus) => {
    if (allLeadIds.length === 0) return
    setLeadStatusLoading(true)
    setLocalLeadStatusOverride(status)
    const supabase = createClient()
    for (const lid of allLeadIds) {
      await supabase
        .from("leads")
        .update({ contact_status: status })
        .eq("id", lid)
    }
    setLeadStatusLoading(false)
    onUpdate?.()
  }

  const handlePostpone = async () => {
    await handleAction(() => postponeAppointment(appointment.id, postponedDate, postponedTime), true)
    await updateLeadContactStatus("callback")
  }

  const handleDelete = () => handleAction(() =>
    deleteAppointment(appointment.id), true
  )

  const getTypeGradient = () => {
    const primaryType = appointment.appointment_type?.[0]
    switch (primaryType) {
      case "new_appointment": return "from-[var(--primary)]/15 to-[var(--primary)]/5"
      case "puc_documents": return "from-[var(--accent)]/15 to-[var(--accent)]/5"
      case "puc_application": return "from-[var(--warning)]/15 to-[var(--warning)]/5"
      case "retest": return "from-[var(--success)]/15 to-[var(--success)]/5"
      case "sf_appointment": return "from-[var(--info)]/15 to-[var(--info)]/5"
      default: return "from-[var(--primary)]/15 to-[var(--primary)]/5"
    }
  }

  const getTypeColor = () => {
    const primaryType = appointment.appointment_type?.[0]
    switch (primaryType) {
      case "new_appointment": return "bg-[var(--primary)]"
      case "puc_documents": return "bg-[var(--accent)]"
      case "puc_application": return "bg-[var(--warning)]"
      case "retest": return "bg-[var(--success)]"
      case "sf_appointment": return "bg-[var(--info)]"
      default: return "bg-[var(--primary)]"
    }
  }

  // All appointment statuses are actionable
  const isActionable = true

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden rounded-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={cn(
          "p-6 bg-gradient-to-br border-b border-[var(--border)]",
          getTypeGradient()
        )}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
                  getTypeColor()
                )}>
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex flex-wrap gap-1.5">
                    {appointment.appointment_type.map(type => (
                      <span key={type} className="text-lg font-semibold">
                        {APPOINTMENT_TYPES.find(t => t.value === type)?.label}
                        {appointment.appointment_type.indexOf(type) < appointment.appointment_type.length - 1 && ", "}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-[var(--text-muted)] font-normal mt-0.5">
                    {new Date(appointment.scheduled_date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric"
                    })}
                  </p>
                </div>
              </DialogTitle>
              <Badge className={cn("border rounded-full px-3", statusConfig.color)}>
                <StatusIcon className="w-3 h-3 mr-1.5" />
                {statusConfig.label}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Person Info */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-[var(--bg-sunken)] to-[var(--bg-surface)] border border-[var(--border)]">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 flex items-center justify-center">
              <span className="text-lg font-semibold text-[var(--primary)]">
                {personName.split(" ").map(n => n[0]).join("")}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[var(--text-primary)] truncate">{personName}</p>
              {personPhone && (
                <p className="text-sm text-[var(--text-muted)] flex items-center gap-1.5 mt-1">
                  <Phone className="w-3 h-3" />
                  {personPhone}
                </p>
              )}
            </div>
            <div className="flex gap-1.5">
            </div>
          </div>

          {/* Appointment Type */}
          {appointment.appointment_type?.length > 0 && (
            <div className="p-3.5 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)]/50">
              <div className="flex items-center gap-2 text-[var(--text-muted)] mb-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Appointment Type</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {appointment.appointment_type.map((type) => (
                  <Badge key={type} variant="outline" size="sm" className="font-medium">
                    {APPOINTMENT_TYPES.find(t => t.value === type)?.label || type}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)]/50">
              <div className="flex items-center gap-2 text-[var(--text-muted)] mb-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Time</span>
              </div>
              <p className="font-semibold text-[var(--text-primary)] font-mono">
                {appointment.scheduled_time?.slice(0, 5)}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)]/50">
              <div className="flex items-center gap-2 text-[var(--text-muted)] mb-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Duration</span>
              </div>
              <p className="font-semibold text-[var(--text-primary)]">
                {appointment.duration_minutes} minutes
              </p>
            </div>
          </div>

          {/* Assignment Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)]/50">
              <div className="flex items-center gap-2 text-[var(--text-muted)] mb-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Assigned To</span>
              </div>
              <p className="font-semibold text-[var(--text-primary)]">
                {appointment.assigned_agent_profile?.full_name || "Unassigned"}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)]/50">
              <div className="flex items-center gap-2 text-[var(--text-muted)] mb-1.5">
                <User className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Created By</span>
              </div>
              <p className="font-semibold text-[var(--text-primary)]">
                {appointment.created_by_profile?.full_name || "System"}
              </p>
            </div>
          </div>

          {/* Appointment Status */}
          <div className="p-4 rounded-xl border border-[var(--border)]/50 bg-[var(--bg-sunken)]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">
              {appointment.is_callback ? "Callback Status" : "Appointment Status"}
            </p>
            <div className="flex flex-wrap gap-2">
              {(appointment.is_callback ? CALLBACK_STATUS_KEYS : APPOINTMENT_STATUS_KEYS)
                .map((key) => ({ key, config: ALL_STATUS_CONFIG[key] }))
                .map(({ key, config }) => {
                const Icon = config.icon
                const isActive = (localStatusOverride || appointment.status) === key
                return (
                  <button
                    key={key}
                    onClick={() => {
                      if (key === "postponed") {
                        setShowPostponedForm(true)
                        setShowCancelForm(false)
                      } else if (key === "cancelled") {
                        setShowCancelForm(true)
                        setShowPostponedForm(false)
                      } else if (key === "confirmed") {
                        handleConfirm()
                      } else if (key === "no_answer") {
                        handleMarkNA()
                      } else if (key === "cant_reach") {
                        handleMarkCantReach()
                      } else if (key === "on_the_way") {
                        handleMarkOnTheWay()
                      } else if (key === "will_see") {
                        handleMarkWillSee()
                      }
                    }}
                    disabled={isLoading || isActive}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5",
                      isActive
                        ? cn(config.color, "ring-2 ring-offset-1 ring-current/30 scale-105")
                        : "bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                      isLoading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {config.label}
                  </button>
                )
              })}
            </div>

            {/* Inline Postpone/Reschedule Form */}
            {showPostponedForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 p-4 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5"
              >
                <p className="text-sm font-semibold text-[var(--primary)] mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {appointment.status === "postponed" ? "Reschedule to new date/time" : "Postpone to new date/time"}
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Input
                    type="date"
                    value={postponedDate}
                    onChange={(e) => setPostponedDate(e.target.value)}
                    className="rounded-lg"
                  />
                  <Input
                    type="time"
                    value={postponedTime}
                    onChange={(e) => setPostponedTime(e.target.value)}
                    className="rounded-lg"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPostponedForm(false)}
                    className="rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handlePostpone}
                    disabled={isLoading || !postponedDate || !postponedTime}
                    className="rounded-lg"
                  >
                    {isLoading ? "Saving..." : appointment.status === "postponed" ? "Confirm Reschedule" : "Confirm Postpone"}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Inline Cancel Form */}
            {showCancelForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 p-4 rounded-xl border border-red-500/30 bg-red-500/5"
              >
                <p className="text-sm font-semibold text-red-500 mb-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Cancel — Add Notes
                </p>
                <textarea
                  value={cancelNotes}
                  onChange={(e) => setCancelNotes(e.target.value)}
                  placeholder="Enter cancellation reason or notes..."
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-red-500/30 min-h-[80px] resize-none"
                />
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setShowCancelForm(false); setCancelNotes("") }}
                    className="rounded-lg"
                  >
                    Back
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleMarkCanceled}
                    disabled={isLoading}
                    className="rounded-lg bg-red-500 hover:bg-red-600 text-white"
                  >
                    {isLoading ? "Saving..." : "Confirm Cancel"}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Lead Status */}
          {hasLeads && availableLeadStatuses.length > 0 && (
            <div className="p-4 rounded-xl border border-[var(--border)]/50 bg-[var(--bg-sunken)]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">
                Lead Status {appointmentLeads.length > 1 ? `(${appointmentLeads.length} leads)` : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                {availableLeadStatuses.map((status) => {
                  const currentLeadStatus = localLeadStatusOverride || appointmentLeads[0]?.status
                  const isActive = currentLeadStatus === status.value
                  const colorClass = LEAD_STATUS_COLORS[status.color] || LEAD_STATUS_COLORS.secondary
                  return (
                    <button
                      key={status.value}
                      onClick={() => handleChangeLeadStatus(status.value)}
                      disabled={leadStatusLoading || isActive}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                        isActive
                          ? cn(colorClass, "ring-2 ring-offset-1 ring-current/30 scale-105")
                          : "bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                        leadStatusLoading && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {status.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Lead Pipeline Stage */}
          {hasLeads && (
            <div className="p-4 rounded-xl border border-[var(--border)]/50 bg-[var(--bg-sunken)]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">
                Lead Stage {appointmentLeads.length > 1 ? `(${appointmentLeads.length} leads)` : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                {PIPELINE_STAGES.filter((stage) => stage.value !== 'lost').map((stage) => {
                  const currentStage = localStageOverride || appointmentLeads[0]?.pipeline_stage
                  const isActive = currentStage === stage.value
                  const colors = stageColors[stage.value] || 'bg-gray-100 text-gray-700 border-gray-200'
                  return (
                    <button
                      key={stage.value}
                      onClick={() => handleChangeStage(stage.value)}
                      disabled={stageLoading || isActive}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                        isActive
                          ? cn(colors, "ring-2 ring-offset-1 ring-current/30 scale-105")
                          : "bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                        stageLoading && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {stage.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="p-4 rounded-xl border border-[var(--border)]/50 bg-[var(--bg-sunken)]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1.5">
                <StickyNote className="w-3 h-3" />
                Notes
              </p>
              {!editingNotes ? (
                <button
                  onClick={() => { setNotesValue(appointment.notes || ""); setEditingNotes(true) }}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { setEditingNotes(false); setNotesValue(savedNotes) }}
                    className="text-[var(--text-muted)] hover:text-[var(--error)] transition-colors text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    disabled={notesSaving}
                    className="flex items-center gap-1 text-xs text-[var(--success)] hover:text-[var(--success)] disabled:opacity-50 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {notesSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              )}
            </div>
            {editingNotes ? (
              <textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="Add notes..."
                autoFocus
                rows={3}
                className="w-full text-sm bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--text-secondary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50 resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleSaveNotes()
                  }
                  if (e.key === "Escape") {
                    setEditingNotes(false)
                    setNotesValue(savedNotes)
                  }
                }}
              />
            ) : (
              <p
                className={cn(
                  "text-sm leading-relaxed cursor-pointer rounded-lg p-1 -m-1 hover:bg-[var(--bg-primary)]/50 transition-colors",
                  notesValue ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]/50 italic"
                )}
                onClick={() => setEditingNotes(true)}
              >
                {notesValue || "Click to add notes..."}
              </p>
            )}
          </div>

          {/* Error Banner */}
          {actionError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-3 rounded-xl border border-red-500/30 bg-red-500/5 flex items-center gap-2"
            >
              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-500 flex-1">{actionError}</p>
              <button
                onClick={() => setActionError(null)}
                className="text-xs text-red-400 hover:text-red-500 underline"
              >
                Dismiss
              </button>
            </motion.div>
          )}


          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-4 rounded-xl border border-red-500/30 bg-red-500/5"
            >
              <p className="text-sm font-semibold text-red-500 mb-2 flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Delete Appointment
              </p>
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                Are you sure you want to permanently delete this appointment? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="rounded-lg bg-red-500 hover:bg-red-600 text-white"
                >
                  {isLoading ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Timeline */}
          <div className="pt-4 border-t border-[var(--border)]/50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Timeline</p>
            <div className="space-y-3 relative">
              {/* Timeline line */}
              <div className="absolute left-1 top-2 bottom-2 w-px bg-gradient-to-b from-[var(--border)] via-[var(--border)] to-transparent" />

              {(() => {
                // Collect all timeline events with timestamps and sort chronologically
                const events: { key: string; timestamp: Date; label: string; dotClass: string; agentName?: string; extra?: React.ReactNode }[] = [
                  {
                    key: "created",
                    timestamp: new Date(appointment.created_at),
                    label: "Created",
                    dotClass: "bg-[var(--bg-surface)] border-2 border-[var(--text-muted)]",
                    agentName: appointment.created_by_profile?.full_name || (appointment.created_by ? agentMap.get(appointment.created_by) : undefined) || appointment.assigned_agent_profile?.full_name,
                  },
                ]

                const confirmedAt = localTimestamps.confirmed_at || appointment.confirmed_at
                if (confirmedAt) {
                  events.push({
                    key: "confirmed",
                    timestamp: new Date(confirmedAt),
                    label: "Confirmed",
                    dotClass: "bg-[var(--bg-surface)] border-2 border-[var(--primary)]",
                    agentName: appointment.confirmed_by ? agentMap.get(appointment.confirmed_by) : undefined,
                  })
                }

                const naAt = localTimestamps.na_marked_at || appointment.na_marked_at
                if (naAt) {
                  events.push({
                    key: "na",
                    timestamp: new Date(naAt),
                    label: "No Answer",
                    dotClass: "bg-[var(--warning)]",
                    agentName: appointment.na_marked_by ? agentMap.get(appointment.na_marked_by) : undefined,
                  })
                }

                const cantReachAt = localTimestamps.cant_reach_at || appointment.cant_reach_at
                if (cantReachAt) {
                  events.push({
                    key: "cant_reach",
                    timestamp: new Date(cantReachAt),
                    label: "Can't Reach",
                    dotClass: "bg-[var(--error)]",
                    agentName: appointment.cant_reach_by ? agentMap.get(appointment.cant_reach_by) : undefined,
                  })
                }

                const onTheWayAt = localTimestamps.on_the_way_at || appointment.on_the_way_at
                if (onTheWayAt) {
                  events.push({
                    key: "on_the_way",
                    timestamp: new Date(onTheWayAt),
                    label: "On The Way",
                    dotClass: "bg-[var(--info)]",
                    agentName: appointment.on_the_way_marked_by ? agentMap.get(appointment.on_the_way_marked_by) : undefined,
                  })
                }

                const willSeeAt = localTimestamps.will_see_at || appointment.will_see_at
                if (willSeeAt) {
                  events.push({
                    key: "will_see",
                    timestamp: new Date(willSeeAt),
                    label: "Will See",
                    dotClass: "bg-[var(--info)]",
                    agentName: appointment.will_see_marked_by ? agentMap.get(appointment.will_see_marked_by) : undefined,
                  })
                }

                const cancelledAt = localTimestamps.cancelled_at || appointment.cancelled_at
                if (cancelledAt) {
                  events.push({
                    key: "cancelled",
                    timestamp: new Date(cancelledAt),
                    label: "Cancelled",
                    dotClass: "bg-red-500",
                    agentName: appointment.cancelled_by ? agentMap.get(appointment.cancelled_by) : undefined,
                  })
                }

                reschedules.forEach((reschedule, index) => {
                  events.push({
                    key: `reschedule-${reschedule.id}`,
                    timestamp: new Date(reschedule.rescheduledAt),
                    label: `Rescheduled #${index + 1}`,
                    dotClass: "bg-[var(--primary)]",
                    extra: (
                      <div className="ml-5 pl-3 text-xs text-[var(--text-secondary)]">
                        <span className="line-through opacity-60">
                          {new Date(reschedule.oldDate).toLocaleDateString()} {reschedule.oldTime?.slice(0, 5)}
                        </span>
                        <span className="mx-2">→</span>
                        <span className="text-[var(--primary)] font-medium">
                          {new Date(reschedule.newDate).toLocaleDateString()} {reschedule.newTime?.slice(0, 5)}
                        </span>
                      </div>
                    ),
                  })
                })

                if (appointment.status === "postponed" && reschedules.length === 0) {
                  events.push({
                    key: "postponed",
                    timestamp: new Date(appointment.updated_at),
                    label: "Postponed",
                    dotClass: "bg-[var(--primary)]",
                  })
                }

                // Stage changes made from this dialog session
                stageChangeLog.forEach((change, idx) => {
                  events.push({
                    key: `stage-change-${idx}`,
                    timestamp: new Date(change.at),
                    label: `Stage → ${change.label}`,
                    dotClass: "bg-[var(--accent)]",
                  })
                })

                // Sort by timestamp ascending (oldest first)
                events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

                return events.map((event) =>
                  event.extra ? (
                    <div key={event.key} className="flex flex-col gap-1 text-sm relative">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${event.dotClass} z-10`} />
                        <span className="text-[var(--text-muted)] font-medium">{event.label}</span>
                        {event.agentName && (
                          <span className="text-[10px] text-[var(--text-secondary)] bg-[var(--bg-sunken)] px-1.5 py-0.5 rounded-full">
                            {event.agentName}
                          </span>
                        )}
                        <span className="text-xs text-[var(--text-secondary)] ml-auto font-mono">
                          {event.timestamp.toLocaleString()}
                        </span>
                      </div>
                      {event.extra}
                    </div>
                  ) : (
                    <div key={event.key} className="flex items-center gap-3 text-sm relative">
                      <div className={`w-2.5 h-2.5 rounded-full ${event.dotClass} z-10`} />
                      <span className="text-[var(--text-muted)] font-medium">{event.label}</span>
                      {event.agentName && (
                        <span className="text-[10px] text-[var(--text-secondary)] bg-[var(--bg-sunken)] px-1.5 py-0.5 rounded-full">
                          {event.agentName}
                        </span>
                      )}
                      <span className="text-xs text-[var(--text-secondary)] ml-auto font-mono">
                        {event.timestamp.toLocaleString()}
                      </span>
                    </div>
                  )
                )
              })()}
            </div>
          </div>
        </div>

        {/* Footer Actions - Callback: Book Appointment */}
        {isActionable && appointment.is_callback && !showDeleteConfirm && hasLeads && (
          <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-sunken)]/30">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowBooking(true)}
                className="rounded-xl border-[var(--success)]/30 text-[var(--success)] hover:bg-[var(--success)]/10"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Book Appointment
              </Button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        {isActionable && !appointment.is_callback && !showDeleteConfirm && (
          <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-sunken)]/30">
            <div className="flex flex-wrap items-center gap-2">
              {/* Lead Status Actions - Callback */}
              {hasLeads && (
                <Button
                  variant="outline"
                  onClick={handleMarkCB}
                  disabled={isLoading}
                  className="rounded-xl border-[var(--accent)]/30 text-[var(--accent)] hover:bg-[var(--accent)]/10"
                >
                  <PhoneCall className="w-5 h-5 mr-2" />
                  Callback
                </Button>
              )}

              {/* Delete Button */}
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
                className="rounded-xl border-red-500/30 text-red-500 hover:bg-red-500/10 ml-auto"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Book Appointment from Callback */}
      {hasLeads && (
        <AppointmentBooking
          isOpen={showBooking}
          onClose={() => setShowBooking(false)}
          onSuccess={() => {
            setShowBooking(false)
            onUpdate?.()
          }}
          preselectedLead={appointmentLeads[0]}
          singleFormMode
        />
      )}

      {/* Lost Reason Dialog */}
      <MarkLostDialog
        open={showLostDialog}
        onOpenChange={setShowLostDialog}
        leadName={personName}
        onConfirm={async (reasonId, notes) => {
          await handleChangeStage("lost", reasonId, notes)
        }}
      />

      {/* Callback Scheduler — opened after "Will See" */}
      {hasLeads && (
        <CallbackScheduler
          isOpen={showCallbackScheduler}
          onClose={() => setShowCallbackScheduler(false)}
          onSuccess={() => {
            setShowCallbackScheduler(false)
            onUpdate?.()
          }}
          lead={appointmentLeads[0]!}
          fromStage={appointmentLeads[0]?.pipeline_stage as PipelineStage | undefined}
        />
      )}
    </Dialog>
  )
}
