"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Clock,
  Phone,
  CheckCircle,
  PhoneMissed,
  PhoneOff,
  Car,
  ChevronRight,
  Loader2,
  AlertTriangle,
  XCircle,
  PhoneCall,
  Eye,
} from "lucide-react"
import type { Appointment } from "@/types"
import { APPOINTMENT_TYPES } from "@/types"
import { useAppointmentMutations } from "@/lib/hooks/use-appointments"
import { createClient } from "@/lib/supabase/client"

interface NoUpdatedAppointmentsProps {
  appointments: Appointment[]
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
  onAppointmentClick?: (appointment: Appointment) => void
}

const STATUS_ACTIONS: Array<{ value: string; label: string; icon: React.ElementType; color: string; isLeadAction?: boolean }> = [
  { value: "confirmed", label: "Confirmed", icon: CheckCircle, color: "bg-[var(--success)] hover:bg-[var(--success)]/90" },
  { value: "on_the_way", label: "On The Way", icon: Car, color: "bg-[var(--info)] hover:bg-[var(--info)]/90" },
  { value: "postponed", label: "Postponed", icon: Calendar, color: "bg-[var(--primary)] hover:bg-[var(--primary)]/90" },
  { value: "no_answer", label: "No Answer", icon: PhoneMissed, color: "bg-[var(--warning)] hover:bg-[var(--warning)]/90" },
  { value: "cant_reach", label: "Can't Reach", icon: PhoneOff, color: "bg-[var(--error)] hover:bg-[var(--error)]/90" },
  { value: "will_see", label: "Will See", icon: Eye, color: "bg-[var(--info)] hover:bg-[var(--info)]/90" },
  { value: "not_interested", label: "Canceled", icon: XCircle, color: "bg-red-500 hover:bg-red-500/90", isLeadAction: true },
  { value: "callback", label: "Callback", icon: PhoneCall, color: "bg-[var(--accent)] hover:bg-[var(--accent)]/90", isLeadAction: true },
]

export function NoUpdatedAppointments({
  appointments,
  isOpen,
  onClose,
  onUpdate,
  onAppointmentClick,
}: NoUpdatedAppointmentsProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [cancelAppointment, setCancelAppointment] = useState<Appointment | null>(null)
  const [cancelNotes, setCancelNotes] = useState("")
  const [postponeTarget, setPostponeTarget] = useState<Appointment | null>(null)
  const [postponeDate, setPostponeDate] = useState("")
  const [postponeTime, setPostponeTime] = useState("")

  const {
    markNA,
    markCantReach,
    markOnTheWay,
    confirmAppointment,
    postponeAppointment,
  } = useAppointmentMutations()

  const handleQuickAction = async (appointment: Appointment, action: string) => {
    setLoadingId(appointment.id)
    setLoadingAction(action)

    try {
      const supabase = createClient()

      switch (action) {
        case "confirmed":
          await confirmAppointment(appointment.id)
          break
        case "on_the_way":
          await markOnTheWay(appointment.id)
          break
        case "postponed":
          // Open postpone popup to let user pick date/time
          setPostponeTarget(appointment)
          setPostponeDate("")
          setPostponeTime(appointment.scheduled_time?.slice(0, 5) || "")
          setLoadingId(null)
          setLoadingAction(null)
          return
        case "no_answer":
          await markNA(appointment.id)
          break
        case "cant_reach":
          await markCantReach(appointment.id)
          break
        case "not_interested":
          // Open cancel popup instead of direct action
          setCancelAppointment(appointment)
          setLoadingId(null)
          setLoadingAction(null)
          return
        case "callback":
          // Mark all leads as Callback
          const cbLeadIds = appointment.appointment_leads?.map(al => al.lead_id) ||
            (appointment.lead_id ? [appointment.lead_id] : [])
          for (const lid of cbLeadIds) {
            await supabase
              .from("leads")
              .update({ status: "callback", contact_status: "callback" })
              .eq("id", lid)
          }
          break
      }
      onUpdate?.()
    } catch (error) {
      console.error("Error updating appointment:", error)
    } finally {
      setLoadingId(null)
      setLoadingAction(null)
    }
  }

  const handleCancelConfirm = async () => {
    if (!cancelAppointment) return
    const cancelLeadIds = cancelAppointment.appointment_leads?.map(al => al.lead_id) ||
      (cancelAppointment.lead_id ? [cancelAppointment.lead_id] : [])
    if (cancelLeadIds.length === 0) return
    setLoadingId(cancelAppointment.id)
    setLoadingAction("not_interested")
    try {
      const supabase = createClient()
      for (const lid of cancelLeadIds) {
        await supabase
          .from("leads")
          .update({ status: "not_interested", notes: cancelNotes || undefined })
          .eq("id", lid)
      }
      onUpdate?.()
    } catch (error) {
      console.error("Error canceling:", error)
    } finally {
      setLoadingId(null)
      setLoadingAction(null)
      setCancelAppointment(null)
      setCancelNotes("")
    }
  }

  const handlePostponeConfirm = async () => {
    if (!postponeTarget || !postponeDate || !postponeTime) return
    setLoadingId(postponeTarget.id)
    setLoadingAction("postponed")
    try {
      await postponeAppointment(postponeTarget.id, postponeDate, postponeTime)
      onUpdate?.()
    } catch (error) {
      console.error("Error postponing:", error)
    } finally {
      setLoadingId(null)
      setLoadingAction(null)
      setPostponeTarget(null)
      setPostponeDate("")
      setPostponeTime("")
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return "Today"
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday"

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "new_appointment": return "bg-[#445eb7]"
      case "puc_documents": return "bg-[#5a71c4]"
      case "puc_application": return "bg-[#7084d1]"
      case "retest": return "bg-[#8a9cde]"
      case "sf_appointment": return "bg-[#212e7f]"
      default: return "bg-[#212e7f]"
    }
  }

  // Group appointments by date
  const groupedAppointments = appointments.reduce((groups, apt) => {
    const date = apt.scheduled_date
    if (!groups[date]) groups[date] = []
    groups[date].push(apt)
    return groups
  }, {} as Record<string, Appointment[]>)

  // Sort dates (most recent first)
  const sortedDates = Object.keys(groupedAppointments).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  )

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-[var(--border)]">
          <SheetTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[var(--warning)]/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-[var(--warning)]" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                Appointments Need Update
              </p>
              <p className="text-sm font-normal text-[var(--text-muted)]">
                {appointments.length} appointment{appointments.length !== 1 ? "s" : ""} past due
              </p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="py-4 space-y-6">
          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-[var(--success)]/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-[var(--success)]" />
              </div>
              <p className="text-lg font-medium text-[var(--text-primary)]">All caught up!</p>
              <p className="text-sm text-[var(--text-muted)]">No appointments need updates</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {sortedDates.map((date) => (
                <motion.div
                  key={date}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
                    <span className="text-sm font-medium text-[var(--text-secondary)]">
                      {formatDate(date)}
                    </span>
                    <Badge variant="secondary" size="sm">
                      {groupedAppointments[date].length}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {groupedAppointments[date].map((apt, index) => {
                      const typeInfo = APPOINTMENT_TYPES.find(t => apt.appointment_type.includes(t.value))
                      const aptLeads = apt.appointment_leads?.map(al => al.lead).filter(Boolean) || []
                      const personName = aptLeads.length > 0
                        ? aptLeads.length === 1
                          ? `${aptLeads[0]!.first_name} ${aptLeads[0]!.last_name}`
                          : `${aptLeads[0]!.first_name} ${aptLeads[0]!.last_name} +${aptLeads.length - 1}`
                        : apt.lead
                        ? `${apt.lead.first_name} ${apt.lead.last_name}`
                        : apt.student
                        ? `${apt.student.first_name} ${apt.student.last_name}`
                        : "Unknown"
                      const personPhone = aptLeads[0]?.phone || apt.lead?.phone || ""
                      const isLoading = loadingId === apt.id

                      return (
                        <motion.div
                          key={apt.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -100, height: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-sunken)]",
                            isLoading && "opacity-50"
                          )}
                        >
                          {/* Header */}
                          <div
                            className="flex items-start justify-between mb-3 cursor-pointer group"
                            onClick={() => !isLoading && onAppointmentClick?.(apt)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium",
                                getTypeColor(apt.appointment_type?.[0] || "new_appointment")
                              )}>
                                {apt.scheduled_time?.slice(0, 2)}
                              </div>
                              <div>
                                <p className="font-medium text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                                  {personName}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                                  <Clock className="w-3 h-3" />
                                  <span>{apt.scheduled_time?.slice(0, 5)}</span>
                                  <span className="text-[var(--border)]">|</span>
                                  <span>{typeInfo?.label || apt.appointment_type.join(", ")}</span>
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
                          </div>

                          {/* Contact */}
                          {personPhone && (
                            <a
                              href={`tel:${personPhone}`}
                              className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors mb-3"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              {personPhone}
                            </a>
                          )}

                          {/* Quick Actions */}
                          <div className="flex flex-wrap gap-2">
                            {STATUS_ACTIONS
                              .filter((action) => {
                                // Only show lead actions (Not Interested, Callback) if appointment has a lead
                                if (action.isLeadAction) {
                                  return (apt.appointment_leads?.length || 0) > 0 || !!apt.lead_id
                                }
                                return true
                              })
                              .map((action) => {
                              const Icon = action.icon
                              const isActionLoading = isLoading && loadingAction === action.value

                              return (
                                <Button
                                  key={action.value}
                                  size="sm"
                                  disabled={isLoading}
                                  className={cn(
                                    "text-white text-xs h-8",
                                    action.color
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleQuickAction(apt, action.value)
                                  }}
                                >
                                  {isActionLoading ? (
                                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                  ) : (
                                    <Icon className="w-3.5 h-3.5 mr-1.5" />
                                  )}
                                  {action.label}
                                </Button>
                              )
                            })}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </SheetContent>

      {/* Cancel Notes Dialog */}
      <Dialog open={!!cancelAppointment} onOpenChange={() => { setCancelAppointment(null); setCancelNotes("") }}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <XCircle className="w-5 h-5" />
              Cancel — Add Notes
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <textarea
              value={cancelNotes}
              onChange={(e) => setCancelNotes(e.target.value)}
              placeholder="Enter cancellation reason or notes..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-red-500/30 min-h-[100px] resize-none"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setCancelAppointment(null); setCancelNotes("") }}
                className="rounded-lg"
              >
                Back
              </Button>
              <Button
                size="sm"
                onClick={handleCancelConfirm}
                disabled={loadingId === cancelAppointment?.id}
                className="rounded-lg bg-red-500 hover:bg-red-600 text-white"
              >
                {loadingId === cancelAppointment?.id ? "Saving..." : "Confirm Cancel"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Postpone Reschedule Dialog */}
      <Dialog open={!!postponeTarget} onOpenChange={() => { setPostponeTarget(null); setPostponeDate(""); setPostponeTime("") }}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--primary)]">
              <Calendar className="w-5 h-5" />
              Postpone — Reschedule
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-[var(--text-muted)]">
              Pick a new date and time for this appointment.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">New Date</label>
                <input
                  type="date"
                  value={postponeDate}
                  onChange={(e) => setPostponeDate(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">New Time</label>
                <input
                  type="time"
                  value={postponeTime}
                  onChange={(e) => setPostponeTime(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setPostponeTarget(null); setPostponeDate(""); setPostponeTime("") }}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handlePostponeConfirm}
                disabled={!postponeDate || !postponeTime || loadingId === postponeTarget?.id}
                className="rounded-lg bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white"
              >
                {loadingId === postponeTarget?.id ? "Saving..." : "Confirm Postpone"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Sheet>
  )
}
