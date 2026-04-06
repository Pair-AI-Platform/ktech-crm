"use client"

import { useState } from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  PhoneMissed,
  PhoneOff,
  Car,
  Eye,
  XCircle,
  CalendarX,
  Phone,
  UserCircle,
  Loader2,
} from "lucide-react"
import { useLeadAppointments } from "@/lib/hooks/use-appointments"
import { APPOINTMENT_TYPES } from "@/types"
import type { Appointment, AppointmentType, Lead } from "@/types"

interface LeadAppointmentsPopoverProps {
  lead: Lead
  onBookNew: () => void
  onAppointmentClick?: (appointment: Appointment) => void
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  scheduled: { label: "Scheduled", color: "text-[var(--text-muted)]", icon: Clock },
  confirmed: { label: "Confirmed", color: "text-[var(--success)]", icon: CheckCircle2 },
  on_the_way: { label: "On The Way", color: "text-[var(--info)]", icon: Car },
  postponed: { label: "Postponed", color: "text-[var(--primary)]", icon: Calendar },
  no_answer: { label: "No Answer", color: "text-[var(--warning)]", icon: PhoneMissed },
  cant_reach: { label: "Can't Reach", color: "text-[var(--error)]", icon: PhoneOff },
  will_see: { label: "Will See", color: "text-[var(--info)]", icon: Eye },
  completed: { label: "Completed", color: "text-[var(--success)]", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "text-[var(--error)]", icon: XCircle },
}

const TYPE_COLORS: Record<AppointmentType, string> = {
  new_appointment: "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20",
  puc_documents: "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20",
  puc_application: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20",
  retest: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20",
  sf_appointment: "bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/20",
  puc_document_submission: "bg-purple-500/10 text-purple-600 border-purple-500/20",
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function LeadAppointmentsPopover({
  lead,
  onBookNew,
  onAppointmentClick,
}: LeadAppointmentsPopoverProps) {
  const [open, setOpen] = useState(false)
  const { appointments, loading } = useLeadAppointments(lead.id)

  const count = appointments.length

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "group/apt relative inline-flex items-center justify-center rounded-lg transition-all",
            "w-8 h-8 hover:bg-[var(--bg-hover)]",
            open && "bg-[var(--primary-muted)]",
          )}
          title={count > 0 ? `${count} appointment${count !== 1 ? "s" : ""}` : "No appointments"}
        >
          <Calendar className={cn(
            "w-4 h-4 transition-colors",
            count > 0 ? "text-[var(--primary)]" : "text-blue-400/70",
            "group-hover/apt:!text-black"
          )} />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-[var(--primary)] text-white text-[9px] font-bold leading-none shadow-sm">
              {count}
            </span>
          )}
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={8}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "z-50 w-[340px] rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-xl shadow-black/10",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          )}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-sunken)] rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Appointments</p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {lead.first_name_ar || lead.first_name} {lead.last_name_ar || lead.last_name}
                  </p>
                </div>
              </div>
              <Badge variant="outline" size="sm" className="font-mono">
                {count}
              </Badge>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[320px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-[var(--text-muted)] animate-spin" />
              </div>
            ) : count === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--bg-sunken)] flex items-center justify-center mb-3">
                  <CalendarX className="w-6 h-6 text-[var(--text-muted)]" />
                </div>
                <p className="text-sm text-[var(--text-muted)] text-center">
                  No appointments yet
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {[...appointments]
                  .sort((a, b) => {
                    const dateA = `${a.scheduled_date}T${a.scheduled_time || "00:00"}`
                    const dateB = `${b.scheduled_date}T${b.scheduled_time || "00:00"}`
                    return dateB.localeCompare(dateA)
                  })
                  .map((apt) => {
                    const statusConf = STATUS_CONFIG[apt.status] || STATUS_CONFIG.scheduled
                    const StatusIcon = statusConf.icon
                    const primaryType = apt.appointment_type?.[0] || "new_appointment"
                    const typeColor = TYPE_COLORS[primaryType as AppointmentType] || TYPE_COLORS.new_appointment
                    const agentName = apt.assigned_agent_profile?.full_name

                    return (
                      <button
                        key={apt.id}
                        type="button"
                        onClick={() => {
                          onAppointmentClick?.(apt)
                          setOpen(false)
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border border-transparent transition-all",
                          "hover:bg-[var(--bg-hover)] hover:border-[var(--border)] group/apt",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <StatusIcon className={cn("w-3.5 h-3.5 flex-shrink-0", statusConf.color)} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {apt.appointment_type.map((t) => (
                                  <span
                                    key={t}
                                    className={cn(
                                      "text-[10px] font-medium px-1.5 py-0.5 rounded border",
                                      TYPE_COLORS[t] || typeColor
                                    )}
                                  >
                                    {APPOINTMENT_TYPES.find((at) => at.value === t)?.label || t}
                                  </span>
                                ))}
                              </div>
                              <p className={cn("text-[10px] mt-0.5 font-medium", statusConf.color)}>
                                {statusConf.label}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-medium text-[var(--text-primary)]">
                              {formatDate(apt.scheduled_date)}
                            </p>
                            <p className="text-[10px] font-mono text-[var(--text-muted)]">
                              {apt.scheduled_time?.slice(0, 5)}
                            </p>
                          </div>
                        </div>
                        {agentName && (
                          <div className="flex items-center gap-1 mt-1.5 ml-5">
                            <UserCircle className="w-3 h-3 text-[var(--text-muted)]" />
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {agentName}
                            </span>
                          </div>
                        )}
                      </button>
                    )
                  })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2.5 border-t border-[var(--border)] bg-[var(--bg-sunken)]/50 rounded-b-xl">
            <Button
              size="sm"
              className="w-full rounded-lg h-8 text-xs"
              onClick={() => {
                setOpen(false)
                onBookNew()
              }}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Book New Appointment
            </Button>
          </div>

          <PopoverPrimitive.Arrow className="fill-[var(--bg-surface)]" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
