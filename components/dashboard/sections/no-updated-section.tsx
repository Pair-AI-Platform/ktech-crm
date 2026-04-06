"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, Calendar, Clock, Users, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { APPOINTMENT_TYPES } from "@/types"
import type { Appointment } from "@/types"
import { cn } from "@/lib/utils"
import { AppointmentDetail } from "@/components/calendar/appointment-detail"
import { NoUpdatedAppointments } from "@/components/calendar/no-updated-appointments"

interface NoUpdatedSectionProps {
  noUpdatedAppointments: Appointment[]
  noUpdatedLoading: boolean
  refetchNoUpdated: () => void
}

function getAppointmentColor(type: string) {
  switch (type) {
    case "new_appointment": return "bg-[var(--primary)]"
    case "puc_documents": return "bg-[var(--accent)]"
    case "puc_application": return "bg-[var(--warning)]"
    case "retest": return "bg-[var(--success)]"
    case "sf_appointment": return "bg-[var(--info)]"
    default: return "bg-[var(--primary)]"
  }
}

function getAppointmentName(apt: Appointment) {
  const leads = apt.appointment_leads?.map(al => al.lead).filter(Boolean) || []
  if (leads.length > 0) {
    if (leads.length === 1) return `${leads[0]!.first_name_ar || leads[0]!.first_name} ${leads[0]!.last_name_ar || leads[0]!.last_name}`
    return `${leads[0]!.first_name_ar || leads[0]!.first_name} ${leads[0]!.last_name_ar || leads[0]!.last_name} +${leads.length - 1}`
  }
  if (apt.lead) return `${apt.lead.first_name_ar || apt.lead.first_name} ${apt.lead.last_name_ar || apt.lead.last_name}`
  return "Unknown"
}

export function NoUpdatedSection({
  noUpdatedAppointments,
  noUpdatedLoading,
  refetchNoUpdated,
}: NoUpdatedSectionProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showNoUpdatedModal, setShowNoUpdatedModal] = useState(false)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <div className="rounded-2xl border-2 border-[var(--warning)]/40 bg-[var(--warning)]/5 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--warning)]/20 bg-[var(--warning)]/10">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[var(--warning)]" />
              <h2 className="text-base font-semibold text-[var(--text-primary)]">No Calendar Update</h2>
              {!noUpdatedLoading && (
                <span className="px-2.5 py-0.5 text-sm font-bold rounded-full bg-[var(--warning)] text-white">
                  {noUpdatedAppointments.length}
                </span>
              )}
            </div>
            <Button
              variant="default"
              size="sm"
              className="bg-[var(--warning)] hover:bg-[var(--warning)]/90 text-white"
              onClick={() => setShowNoUpdatedModal(true)}
              disabled={noUpdatedLoading}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              View All & Update ({noUpdatedLoading ? "..." : noUpdatedAppointments.length})
            </Button>
          </div>

          {noUpdatedLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--warning)]" />
            </div>
          ) : noUpdatedAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-[var(--text-muted)]">
              <CheckCircle2 className="w-8 h-8 text-[var(--success)]" />
              <p className="text-sm">All caught up! No appointments need updating.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
              <AnimatePresence>
                {noUpdatedAppointments.slice(0, 9).map((apt, index) => {
                  const employeeName = apt.assigned_agent_profile?.full_name
                  return (
                    <motion.div
                      key={apt.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => setSelectedAppointment(apt)}
                      className="p-3 rounded-xl border border-[var(--warning)]/30 bg-[var(--bg-card)] hover:border-[var(--warning)] hover:shadow-sm transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={cn(
                            "w-2 h-2 rounded-full flex-shrink-0",
                            getAppointmentColor(apt.appointment_type?.[0] || "new_appointment")
                          )} />
                          <span className="font-medium text-sm text-[var(--text-primary)] group-hover:text-[var(--warning)] transition-colors truncate">
                            {getAppointmentName(apt)}
                          </span>
                        </div>
                        <AlertTriangle className="w-3.5 h-3.5 text-[var(--warning)] flex-shrink-0 ml-2" />
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1 ml-4 truncate">
                        {(apt.appointment_type || []).map(t => APPOINTMENT_TYPES.find(at => at.value === t)?.label).join(", ")}
                      </p>
                      <div className="flex items-center gap-3 mt-2 ml-4 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {apt.scheduled_date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {apt.scheduled_time?.slice(0, 5)}
                        </span>
                      </div>
                      {employeeName && (
                        <div className="flex items-center gap-1 mt-1 ml-4 text-xs text-[var(--text-muted)]">
                          <Users className="w-3 h-3" />
                          {employeeName}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>

      <AppointmentDetail
        appointment={selectedAppointment}
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onUpdate={() => refetchNoUpdated()}
      />

      <NoUpdatedAppointments
        appointments={noUpdatedAppointments}
        isOpen={showNoUpdatedModal}
        onClose={() => setShowNoUpdatedModal(false)}
        onUpdate={() => refetchNoUpdated()}
        onAppointmentClick={(apt) => {
          setShowNoUpdatedModal(false)
          setSelectedAppointment(apt)
        }}
      />
    </>
  )
}
