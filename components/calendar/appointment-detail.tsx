"use client"

import { useState, useEffect, startTransition } from "react"
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
import { createClient } from "@/lib/supabase/client"
import { MarkLostDialog } from "@/components/leads/mark-lost-dialog"

interface AppointmentDetailProps {
  appointment: Appointment | null
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

const STATUS_CONFIG: Record<string, {
  label: string
  color: string
  icon: typeof CheckCircle2
}> = {
  scheduled: {
    label: "Scheduled",
    color: "bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/30",
    icon: Calendar
  },
  no_answer: {
    label: "No Answer",
    color: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30",
    icon: PhoneMissed
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
  cancelled: {
    label: "Canceled",
    color: "bg-red-500/10 text-red-500 border-red-500/30",
    icon: XCircle
  },
}

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
  const [, setLocalStatusOverride] = useState<string | null>(null)
  const [showLostDialog, setShowLostDialog] = useState(false)
  const [localLeadStatusOverride, setLocalLeadStatusOverride] = useState<LeadStatus | null>(null)
  const [leadStatusLoading, setLeadStatusLoading] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState("")
  const [notesSaving, setNotesSaving] = useState(false)

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

  // Reset local state when appointment changes
  useEffect(() => {
    startTransition(() => {
      setLocalStageOverride(null)
      setLocalStatusOverride(null)
      setLocalLeadStatusOverride(null)
      setEditingNotes(false)
      setNotesValue(appointment?.notes || "")
    })
  }, [appointment?.id, appointment?.notes])

  if (!appointment) return null

  const statusConfig = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.scheduled
  const StatusIcon = statusConfig.icon

  // Derive leads list from junction table with legacy fallback
  const appointmentLeads = appointment.appointment_leads?.map(al => al.lead).filter(Boolean) ||
    (appointment.lead ? [appointment.lead] : [])
  const hasLeads = appointmentLeads.length > 0

  const personName = hasLeads
    ? appointmentLeads.length === 1
      ? `${appointmentLeads[0]!.first_name} ${appointmentLeads[0]!.last_name}`
      : `${appointmentLeads[0]!.first_name} ${appointmentLeads[0]!.last_name} +${appointmentLeads.length - 1}`
    : appointment.student
    ? `${appointment.student.first_name} ${appointment.student.last_name}`
    : "Unknown"

  const personPhone = appointmentLeads[0]?.phone || ""

  // Get all lead IDs for bulk operations
  const allLeadIds = appointment.appointment_leads?.map(al => al.lead_id) ||
    (appointment.lead_id ? [appointment.lead_id] : [])

  const handleAction = async (action: () => Promise<unknown>) => {
    setIsLoading(true)
    await action()
    setIsLoading(false)
    onUpdate?.()
    onClose()
  }

  const handleConfirm = () => handleAction(() => confirmAppointment(appointment.id))
  const handleMarkNA = () => handleAction(() => markNA(appointment.id))
  const handleMarkCantReach = () => handleAction(() => markCantReach(appointment.id))
  const handleMarkOnTheWay = () => handleAction(() => markOnTheWay(appointment.id))
  const handleMarkWillSee = () => handleAction(() => markWillSee(appointment.id))

  const handleSaveNotes = async () => {
    setNotesSaving(true)
    await updateAppointment(appointment.id, { notes: notesValue.trim() || null } as Partial<Appointment>)
    setNotesSaving(false)
    setEditingNotes(false)
    onUpdate?.()
  }

  // Mark all leads as Canceled with notes + cancel the appointment
  const handleMarkCanceled = async () => {
    if (allLeadIds.length === 0) return
    setIsLoading(true)
    const supabase = createClient()
    for (const lid of allLeadIds) {
      await supabase
        .from("leads")
        .update({ status: "not_interested", notes: cancelNotes || undefined })
        .eq("id", lid)
    }
    // Also cancel the appointment itself
    await cancelAppointment(appointment.id, cancelNotes || undefined)
    setIsLoading(false)
    setShowCancelForm(false)
    setCancelNotes("")
    onUpdate?.()
    onClose()
  }

  // Mark all leads as Callback (CB)
  const handleMarkCB = async () => {
    if (allLeadIds.length === 0) return
    setIsLoading(true)
    const supabase = createClient()
    for (const lid of allLeadIds) {
      await supabase
        .from("leads")
        .update({ status: "callback", contact_status: "callback" })
        .eq("id", lid)
    }
    setIsLoading(false)
    onUpdate?.()
    onClose()
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
    const supabase = createClient()
    for (const lid of allLeadIds) {
      const updates: Record<string, unknown> = { pipeline_stage: stage }
      if (stage === "lost" && lostReasonId) {
        updates.lost_reason_id = lostReasonId
        if (lostReasonNotes) updates.lost_reason_notes = lostReasonNotes
      }
      await supabase
        .from("leads")
        .update(updates)
        .eq("id", lid)
    }
    // Auto-confirm the appointment if not already confirmed
    if (appointment.status !== "confirmed") {
      await confirmAppointment(appointment.id)
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
    contacted: ['no_answer', 'switched_off', 'interested', 'not_interested', 'high_gpa', 'low_gpa', 'wrong_number', 'already_done', 'will_see', 'potential'],
    visit: ['no_answer', 'cant_reach', 'interested', 'not_interested'],
    test: ['online', 'on_campus'],
    application: 'none',
    lost: 'all',
    applicant: ['no_answer', 'cant_reach', 'informed', 'travelling', 'might_withdraw'],
    enrolled: 'none',
    withdraw: 'all',
  }
  const stageConfig = currentStageForStatus ? STAGE_STATUSES[currentStageForStatus as PipelineStage] : 'all'
  const availableLeadStatuses = stageConfig === 'none'
    ? []
    : stageConfig === 'all'
    ? LEAD_STATUSES.filter(s => !APPLICANT_ONLY_STATUSES.includes(s.value))
    : LEAD_STATUSES.filter(s => (stageConfig as LeadStatus[]).includes(s.value))

  // Change lead status for all leads
  const handleChangeLeadStatus = async (status: LeadStatus) => {
    if (allLeadIds.length === 0) return
    setLeadStatusLoading(true)
    setLocalLeadStatusOverride(status)
    const supabase = createClient()
    for (const lid of allLeadIds) {
      await supabase
        .from("leads")
        .update({ status })
        .eq("id", lid)
    }
    setLeadStatusLoading(false)
    onUpdate?.()
  }

  const handlePostpone = () => handleAction(() =>
    postponeAppointment(appointment.id, postponedDate, postponedTime)
  )

  const handleDelete = () => handleAction(() =>
    deleteAppointment(appointment.id)
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
              {personPhone && (
                <>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-9 w-9 rounded-xl hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
                    onClick={() => window.open(`tel:${personPhone}`)}
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-9 w-9 rounded-xl hover:bg-[var(--success)]/10 hover:text-[var(--success)]"
                    onClick={() => window.open(`https://wa.me/965${personPhone}`)}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

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
                {PIPELINE_STAGES.map((stage) => {
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
                    onClick={() => { setEditingNotes(false); setNotesValue(appointment.notes || "") }}
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
                    setNotesValue(appointment.notes || "")
                  }
                }}
              />
            ) : (
              <p
                className={cn(
                  "text-sm leading-relaxed cursor-pointer rounded-lg p-1 -m-1 hover:bg-[var(--bg-primary)]/50 transition-colors",
                  appointment.notes ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]/50 italic"
                )}
                onClick={() => { setNotesValue(appointment.notes || ""); setEditingNotes(true) }}
              >
                {appointment.notes || "Click to add notes..."}
              </p>
            )}
          </div>

          {/* Cancel Form */}
          {showCancelForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-4 rounded-xl border border-red-500/30 bg-red-500/5"
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

          {/* Postponed Form */}
          {showPostponedForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-4 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5"
            >
              <p className="text-sm font-semibold text-[var(--primary)] mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Postpone to new date/time
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
                  {isLoading ? "Saving..." : "Confirm Postpone"}
                </Button>
              </div>
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

              <div className="flex items-center gap-3 text-sm relative">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--bg-surface)] border-2 border-[var(--text-muted)] z-10" />
                <span className="text-[var(--text-muted)] font-medium">Created</span>
                <span className="text-xs text-[var(--text-secondary)] ml-auto font-mono">
                  {new Date(appointment.created_at).toLocaleString()}
                </span>
              </div>

              {appointment.confirmed_at && (
                <div className="flex items-center gap-3 text-sm relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--bg-surface)] border-2 border-[var(--primary)] z-10" />
                  <span className="text-[var(--text-muted)] font-medium">Confirmed</span>
                  <span className="text-xs text-[var(--text-secondary)] ml-auto font-mono">
                    {new Date(appointment.confirmed_at).toLocaleString()}
                  </span>
                </div>
              )}

              {appointment.na_marked_at && (
                <div className="flex items-center gap-3 text-sm relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--warning)] z-10" />
                  <span className="text-[var(--text-muted)] font-medium">NA (No Answer)</span>
                  <span className="text-xs text-[var(--text-secondary)] ml-auto font-mono">
                    {new Date(appointment.na_marked_at).toLocaleString()}
                  </span>
                </div>
              )}

              {appointment.cant_reach_at && (
                <div className="flex items-center gap-3 text-sm relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--error)] z-10" />
                  <span className="text-[var(--text-muted)] font-medium">Can&apos;t Reach</span>
                  <span className="text-xs text-[var(--text-secondary)] ml-auto font-mono">
                    {new Date(appointment.cant_reach_at).toLocaleString()}
                  </span>
                </div>
              )}

              {appointment.on_the_way_at && (
                <div className="flex items-center gap-3 text-sm relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--info)] z-10" />
                  <span className="text-[var(--text-muted)] font-medium">On The Way</span>
                  <span className="text-xs text-[var(--text-secondary)] ml-auto font-mono">
                    {new Date(appointment.on_the_way_at).toLocaleString()}
                  </span>
                </div>
              )}

              {/* All Reschedules */}
              {reschedules.map((reschedule, index) => (
                <div key={reschedule.id} className="flex flex-col gap-1 text-sm relative">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] z-10" />
                    <span className="text-[var(--text-muted)] font-medium">
                      Rescheduled #{index + 1}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)] ml-auto font-mono">
                      {new Date(reschedule.rescheduledAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="ml-5 pl-3 text-xs text-[var(--text-secondary)]">
                    <span className="line-through opacity-60">
                      {new Date(reschedule.oldDate).toLocaleDateString()} {reschedule.oldTime?.slice(0, 5)}
                    </span>
                    <span className="mx-2">→</span>
                    <span className="text-[var(--primary)] font-medium">
                      {new Date(reschedule.newDate).toLocaleDateString()} {reschedule.newTime?.slice(0, 5)}
                    </span>
                  </div>
                </div>
              ))}

              {/* Current postponed status (if no reschedule history but status is postponed) */}
              {appointment.status === "postponed" && reschedules.length === 0 && (
                <div className="flex items-center gap-3 text-sm relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] z-10" />
                  <span className="text-[var(--text-muted)] font-medium">Postponed</span>
                  <span className="text-xs text-[var(--text-secondary)] ml-auto font-mono">
                    {new Date(appointment.updated_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions - Status Action Buttons */}
        {isActionable && !showPostponedForm && !showCancelForm && !showDeleteConfirm && (
          <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-sunken)]/30">
            {/* Status Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {appointment.status !== "confirmed" && (
                <Button
                  variant="outline"
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="rounded-xl border-[var(--success)]/30 text-[var(--success)] hover:bg-[var(--success)]/10"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Confirmed
                </Button>
              )}

              {appointment.status !== "on_the_way" && (
                <Button
                  variant="outline"
                  onClick={handleMarkOnTheWay}
                  disabled={isLoading}
                  className="rounded-xl border-[var(--info)]/30 text-[var(--info)] hover:bg-[var(--info)]/10"
                >
                  <Car className="w-5 h-5 mr-2" />
                  OTW
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => setShowPostponedForm(true)}
                disabled={isLoading}
                className="rounded-xl border-[var(--primary)]/30 text-[var(--primary)] hover:bg-[var(--primary)]/10"
              >
                <Calendar className="w-5 h-5 mr-2" />
                {appointment.status === "postponed" ? "Reschedule" : "Postponed"}
              </Button>

              {appointment.status !== "no_answer" && (
                <Button
                  variant="outline"
                  onClick={handleMarkNA}
                  disabled={isLoading}
                  className="rounded-xl border-[var(--warning)]/30 text-[var(--warning)] hover:bg-[var(--warning)]/10"
                >
                  <PhoneMissed className="w-5 h-5 mr-2" />
                  No Answer
                </Button>
              )}

              {appointment.status !== "cant_reach" && (
                <Button
                  variant="outline"
                  onClick={handleMarkCantReach}
                  disabled={isLoading}
                  className="rounded-xl border-[var(--error)]/30 text-[var(--error)] hover:bg-[var(--error)]/10"
                >
                  <PhoneOff className="w-5 h-5 mr-2" />
                  Can&apos;t Reach
                </Button>
              )}

              {appointment.status !== "will_see" && (
                <Button
                  variant="outline"
                  onClick={handleMarkWillSee}
                  disabled={isLoading}
                  className="rounded-xl border-[var(--info)]/30 text-[var(--info)] hover:bg-[var(--info)]/10"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Will See
                </Button>
              )}

              {/* Lead Status Actions - Canceled and Callback */}
              {hasLeads && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelForm(true)}
                    disabled={isLoading}
                    className="rounded-xl border-red-500/30 text-red-500 hover:bg-red-500/10"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Canceled
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleMarkCB}
                    disabled={isLoading}
                    className="rounded-xl border-[var(--accent)]/30 text-[var(--accent)] hover:bg-[var(--accent)]/10"
                  >
                    <PhoneCall className="w-5 h-5 mr-2" />
                    Callback
                  </Button>
                </>
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

      {/* Lost Reason Dialog */}
      <MarkLostDialog
        open={showLostDialog}
        onOpenChange={setShowLostDialog}
        leadName={personName}
        onConfirm={async (reasonId, notes) => {
          await handleChangeStage("lost", reasonId, notes)
        }}
      />
    </Dialog>
  )
}
