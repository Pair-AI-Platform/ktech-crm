"use client"

import { useState } from "react"
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
  ThumbsDown,
  PhoneCall
} from "lucide-react"
import type { Appointment } from "@/types"
import { APPOINTMENT_TYPES } from "@/types"
import { useAppointmentMutations, useRescheduleHistory } from "@/lib/hooks/use-appointments"
import { createClient } from "@/lib/supabase/client"

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
}

export function AppointmentDetail({ appointment, isOpen, onClose, onUpdate }: AppointmentDetailProps) {
  const [showPostponedForm, setShowPostponedForm] = useState(false)
  const [postponedDate, setPostponedDate] = useState("")
  const [postponedTime, setPostponedTime] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const {
    markNA,
    markCantReach,
    markOnTheWay,
    confirmAppointment,
    postponeAppointment
  } = useAppointmentMutations()

  // Fetch reschedule history - use empty string if no appointment to satisfy hook rules
  const { reschedules } = useRescheduleHistory(appointment?.id || "")

  if (!appointment) return null

  const typeInfo = APPOINTMENT_TYPES.find(t => appointment.appointment_type.includes(t.value))
  const statusConfig = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.na
  const StatusIcon = statusConfig.icon

  const personName = appointment.lead
    ? `${appointment.lead.first_name} ${appointment.lead.last_name}`
    : appointment.student
    ? `${appointment.student.first_name} ${appointment.student.last_name}`
    : "Unknown"

  const personPhone = appointment.lead?.phone || ""

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

  // Mark lead as Not Interested (NI)
  const handleMarkNI = async () => {
    if (!appointment.lead_id) return
    setIsLoading(true)
    const supabase = createClient()
    await supabase
      .from("leads")
      .update({ status: "not_interested" })
      .eq("id", appointment.lead_id)
    setIsLoading(false)
    onUpdate?.()
    onClose()
  }

  // Mark lead as Callback (CB)
  const handleMarkCB = async () => {
    if (!appointment.lead_id) return
    setIsLoading(true)
    const supabase = createClient()
    await supabase
      .from("leads")
      .update({ status: "callback", contact_status: "callback" })
      .eq("id", appointment.lead_id)
    setIsLoading(false)
    onUpdate?.()
    onClose()
  }
  const handlePostpone = () => handleAction(() =>
    postponeAppointment(appointment.id, postponedDate, postponedTime)
  )

  const getTypeGradient = () => {
    const primaryType = appointment.appointment_type[0]
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
    const primaryType = appointment.appointment_type[0]
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
                {(appointment as any).assigned_agent_profile?.full_name || "Unassigned"}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)]/50">
              <div className="flex items-center gap-2 text-[var(--text-muted)] mb-1.5">
                <User className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Created By</span>
              </div>
              <p className="font-semibold text-[var(--text-primary)]">
                {(appointment as any).created_by_profile?.full_name || "System"}
              </p>
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="p-4 rounded-xl border border-[var(--border)]/50 bg-[var(--bg-sunken)]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Notes</p>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{appointment.notes}</p>
            </div>
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
                  <span className="text-[var(--text-muted)] font-medium">Can't Reach</span>
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
        {isActionable && !showPostponedForm && (
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

              {appointment.status !== "postponed" && (
                <Button
                  variant="outline"
                  onClick={() => setShowPostponedForm(true)}
                  disabled={isLoading}
                  className="rounded-xl border-[var(--primary)]/30 text-[var(--primary)] hover:bg-[var(--primary)]/10"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Postponed
                </Button>
              )}

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
                  Can't Reach
                </Button>
              )}

              {/* Lead Status Actions - Not Interested and Callback */}
              {appointment.lead_id && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleMarkNI}
                    disabled={isLoading}
                    className="rounded-xl border-red-500/30 text-red-500 hover:bg-red-500/10"
                  >
                    <ThumbsDown className="w-5 h-5 mr-2" />
                    Not Interested
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
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
